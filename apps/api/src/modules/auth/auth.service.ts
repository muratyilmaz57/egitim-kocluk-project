import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { compareSync, hashSync } from "bcryptjs";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { sign, verify } from "jsonwebtoken";
import * as nodemailer from "nodemailer";
import * as QRCode from "qrcode";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { DisableMfaDto } from "./dto/disable-mfa.dto";
import { LoginDto } from "./dto/login.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { StartMfaSetupDto } from "./dto/start-mfa-setup.dto";
import { VerifyMfaSetupDto } from "./dto/verify-mfa-setup.dto";
import type { AuthUser, MfaMethod } from "./types/auth-user";
import { decryptString, encryptString } from "./utils/crypto";
import { buildOtpAuthUri, generateTotpSecret, verifyTotpCode } from "./utils/totp";

type TokenPayload = {
  sub: string;
  email: string;
  fullName: string;
  role: AuthUser["role"];
  studentProfileId?: string | null;
  coachUserId?: string | null;
  sid?: string | null;
  mfaEnabled?: boolean;
  mfaMethod?: MfaMethod | null;
  challenge?: string | null;
  passwordExpired?: boolean;
  tokenType: "access" | "refresh" | "mfa";
};

type CaptchaPayload = {
  answer: string;
  tokenType: "captcha";
};

type PendingMfaPayload = {
  method: MfaMethod;
  secret?: string;
  code?: string;
  expiresAt: number;
};

const PASSWORD_MAX_AGE_DAYS = 180;
const MFA_CODE_TTL_SECONDS = 300;
const PASSWORD_RESET_TTL_SECONDS = 60 * 30;

@Injectable()
export class AuthService {
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
  ) {
    this.accessTokenTtlSeconds = this.getDurationInSeconds(
      "JWT_ACCESS_EXPIRES_IN_SECONDS",
      60 * 15,
    );
    this.refreshTokenTtlSeconds = this.getDurationInSeconds(
      "JWT_REFRESH_EXPIRES_IN_SECONDS",
      60 * 60 * 24 * 30,
    );
  }

  createCaptcha() {
    const left = randomInt(2, 10);
    const right = randomInt(1, 10);
    const useSubtraction = randomInt(0, 2) === 1;
    const result = useSubtraction ? left + right - right : left + right;
    const question = useSubtraction
      ? `${left + right} - ${right}`
      : `${left} + ${right}`;

    const captchaToken = sign(
      {
        answer: String(result),
        tokenType: "captcha",
      } satisfies CaptchaPayload,
      this.getCaptchaSecret(),
      { expiresIn: "5m" },
    );

    return {
      question,
      captchaToken,
      expiresInSeconds: 300,
    };
  }

  async login(dto: LoginDto) {
    if (dto.mfaToken) {
      return this.loginWithMfa(dto);
    }

    this.assertCaptcha(dto.captchaToken, dto.captchaAnswer);

    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      include: {
        linkedStudent: true,
      },
    });

    if (!user || !compareSync(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const passwordExpired = this.isPasswordExpired(user.passwordChangedAt);
    const authUser = this.serializeAuthUser(user, null, passwordExpired);

    if (user.mfaEnabled) {
      const mfaMethod = this.getMfaMethodForUser(user);
      if (!mfaMethod) {
        throw new UnauthorizedException("MFA is not configured.");
      }

      let challenge: string | null = null;
      let deliveryHint: string | null = null;
      if (mfaMethod === "email") {
        const code = this.generateEmailCode();
        challenge = this.serializePendingMfaPayload({
          method: "email",
          code,
          expiresAt: Date.now() + MFA_CODE_TTL_SECONDS * 1000,
        });
        deliveryHint = await this.sendEmailMfaCode(
          user.email,
          user.fullName,
          code,
          "login",
        );
      }

      return {
        requiresMfa: true,
        mfaMethod,
        deliveryHint,
        mfaToken: this.signMfaToken(authUser, {
          mfaMethod,
          challenge,
        }),
        passwordExpired,
        user: authUser,
      };
    }

    await this.auditLogsService.log({
      actorUserId: user.id,
      subjectUserId: user.id,
      action: "auth.login",
      entityType: "session",
      description: "Kullanici giris yapti.",
      metadata: {
        role: user.role,
      },
    });

    return this.issueSession(authUser, true);
  }

  async refresh(refreshToken: string) {
    const payload = this.verifyToken(refreshToken, "refresh");
    const session = await this.prisma.userSession.findFirst({
      where: {
        id: BigInt(payload.sid ?? "0"),
        userId: BigInt(payload.sub),
      },
      include: {
        user: {
          include: {
            linkedStudent: true,
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() < Date.now() ||
      !compareSync(refreshToken, session.refreshTokenHash)
    ) {
      throw new UnauthorizedException("Invalid or expired refresh token.");
    }

    const authUser = this.serializeAuthUser(
      session.user,
      session.id.toString(),
      this.isPasswordExpired(session.user.passwordChangedAt),
    );
    return this.rotateSession(authUser, session.id, false);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { success: true };
    }

    try {
      const payload = this.verifyToken(refreshToken, "refresh");
      await this.prisma.userSession.update({
        where: {
          id: BigInt(payload.sid ?? "0"),
        },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
        },
      });

      await this.auditLogsService.log({
        actorUserId: payload.sub,
        subjectUserId: payload.sub,
        action: "auth.logout",
        entityType: "session",
        entityId: payload.sid ?? null,
        description: "Kullanici cikis yapti.",
      });
    } catch {
      return { success: true };
    }

    return { success: true };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      return {
        success: true,
        message:
          "Eger bu e-posta ile eslesen bir hesap varsa sifre sifirlama baglantisi gonderildi.",
      };
    }

    const rawToken = this.generatePasswordResetToken();
    const passwordResetExpiresAt = new Date(
      Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000,
    );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetTokenHash: this.hashOneTimeToken(rawToken),
        passwordResetExpiresAt,
      },
    });

    const resetUrl = `${this.getWebBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const deliveryHint = await this.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetUrl,
    );

    await this.auditLogsService.log({
      subjectUserId: user.id,
      action: "auth.password_reset_requested",
      entityType: "user",
      entityId: user.id.toString(),
      description: "Sifre sifirlama baglantisi talep edildi.",
    });

    return {
      success: true,
      message:
        "Eger bu e-posta ile eslesen bir hesap varsa sifre sifirlama baglantisi gonderildi.",
      deliveryHint,
      ...(process.env.NODE_ENV !== "production"
        ? {
            debugResetUrl: resetUrl,
          }
        : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    this.assertPasswordPolicy(dto.newPassword);

    const passwordResetTokenHash = this.hashOneTimeToken(dto.token.trim());
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
      include: {
        linkedStudent: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Reset linki gecersiz veya suresi dolmus.");
    }

    const passwordChangedAt = new Date();
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: hashSync(dto.newPassword, 10),
        passwordChangedAt,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    await this.prisma.userSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    await this.auditLogsService.log({
      subjectUserId: user.id,
      action: "auth.password_reset_completed",
      entityType: "user",
      entityId: user.id.toString(),
      description: "Sifre sifirlama baglantisi ile sifre yenilendi.",
    });

    return {
      success: true,
      message: "Sifren guncellendi. Yeni sifrenle giris yapabilirsin.",
    };
  }

  verifyAccessToken(token: string): AuthUser {
    const payload = this.verifyToken(token, "access");

    return {
      id: payload.sub,
      sessionId: payload.sid ?? null,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      studentProfileId: payload.studentProfileId ?? null,
      coachUserId: payload.coachUserId ?? null,
      mfaEnabled: payload.mfaEnabled ?? false,
      mfaMethod: payload.mfaMethod ?? null,
      passwordExpired: payload.passwordExpired ?? false,
    };
  }

  async getSecurityStatus(actor: AuthUser) {
    const user = await this.requireUser(actor.id);

    return {
      mfaEnabled: user.mfaEnabled,
      mfaMethod: this.getMfaMethodForUser(user),
      hasPendingSetup: Boolean(user.mfaTempSecret),
      pendingMethod: this.getPendingMfaMethod(user.mfaTempSecret),
      passwordChangedAt: user.passwordChangedAt,
      passwordExpiresAt: this.getPasswordExpiresAt(user.passwordChangedAt),
      passwordExpired: this.isPasswordExpired(user.passwordChangedAt),
    };
  }

  async changePassword(actor: AuthUser, dto: ChangePasswordDto) {
    const user = await this.requireUser(actor.id);
    const passwordChangedAt = new Date();

    if (!compareSync(dto.currentPassword, user.passwordHash)) {
      throw new UnauthorizedException("Current password is invalid.");
    }

    this.assertPasswordPolicy(dto.newPassword);

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: hashSync(dto.newPassword, 10),
        passwordChangedAt,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    const authUser = this.serializeAuthUser(user, actor.sessionId ?? null, false);

    await this.auditLogsService.log({
      actorUserId: actor.id,
      subjectUserId: actor.id,
      action: "auth.password_changed",
      entityType: "user",
      entityId: actor.id,
      description: "Kullanici sifresini degistirdi.",
    });

    if (!actor.sessionId) {
      return { success: true, user: authUser };
    }

    return this.rotateSession(authUser, BigInt(actor.sessionId), false);
  }

  async startMfaSetup(actor: AuthUser, dto: StartMfaSetupDto) {
    const user = await this.requireUser(actor.id);
    await this.auditLogsService.log({
      actorUserId: actor.id,
      subjectUserId: actor.id,
      action: "auth.mfa_setup_started",
      entityType: "user",
      entityId: actor.id,
      description: `Kullanici MFA kurulumunu ${dto.method} yontemi ile baslatti.`,
      metadata: {
        method: dto.method,
      },
    });

    if (dto.method === "authenticator") {
      const secret = generateTotpSecret();
      const otpauthUri = buildOtpAuthUri(secret, user.email, "Kocluk Platformu");
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 240,
      });

      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          mfaTempSecret: this.serializePendingMfaPayload({
            method: "authenticator",
            secret,
            expiresAt: Date.now() + MFA_CODE_TTL_SECONDS * 1000,
          }),
        },
      });

      return {
        method: "authenticator" as const,
        secret,
        otpauthUri,
        qrCodeDataUrl,
        expiresInSeconds: MFA_CODE_TTL_SECONDS,
      };
    }

    const code = this.generateEmailCode();
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        mfaTempSecret: this.serializePendingMfaPayload({
          method: "email",
          code,
          expiresAt: Date.now() + MFA_CODE_TTL_SECONDS * 1000,
        }),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      subjectUserId: actor.id,
      action: "auth.mfa_setup_started",
      entityType: "user",
      entityId: actor.id,
      description: "Kullanici e-posta MFA kurulumunu baslatti.",
      metadata: {
        method: "email",
      },
    });

    return {
      method: "email" as const,
      expiresInSeconds: MFA_CODE_TTL_SECONDS,
      deliveryHint: await this.sendEmailMfaCode(
        user.email,
        user.fullName,
        code,
        "setup",
      ),
    };
  }

  async verifyMfaSetup(actor: AuthUser, dto: VerifyMfaSetupDto) {
    const user = await this.requireUser(actor.id);
    if (!user.mfaTempSecret) {
      throw new BadRequestException("No MFA setup is pending.");
    }

    const pendingPayload = this.deserializePendingMfaPayload(user.mfaTempSecret);
    if (!pendingPayload || pendingPayload.expiresAt <= Date.now()) {
      throw new UnauthorizedException("MFA setup expired. Start again.");
    }

    if (pendingPayload.method === "authenticator") {
      if (!pendingPayload.secret || !verifyTotpCode(pendingPayload.secret, dto.code)) {
        throw new UnauthorizedException("Invalid MFA code.");
      }
    } else if (!pendingPayload.code || pendingPayload.code !== dto.code.trim()) {
      throw new UnauthorizedException("Invalid MFA code.");
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        mfaEnabled: true,
        mfaSecret:
          pendingPayload.method === "authenticator"
            ? encryptString(pendingPayload.secret ?? "", this.getEncryptionSecret())
            : null,
        mfaTempSecret: null,
      },
    });

    return {
      success: true,
      method: pendingPayload.method,
    };
  }

  async disableMfa(actor: AuthUser, dto: DisableMfaDto) {
    const user = await this.requireUser(actor.id);
    if (!compareSync(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("Password is invalid.");
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaTempSecret: null,
      },
    });

    const authUser = this.serializeAuthUser(
      {
        ...user,
        mfaEnabled: false,
        mfaSecret: null,
      },
      actor.sessionId ?? null,
      this.isPasswordExpired(user.passwordChangedAt),
    );

    await this.auditLogsService.log({
      actorUserId: actor.id,
      subjectUserId: actor.id,
      action: "auth.mfa_disabled",
      entityType: "user",
      entityId: actor.id,
      description: "Kullanici MFA'yi kapatti.",
    });

    if (!actor.sessionId) {
      return { success: true, user: authUser };
    }

    return this.rotateSession(authUser, BigInt(actor.sessionId), false);
  }

  private async loginWithMfa(dto: LoginDto) {
    if (!dto.mfaCode) {
      throw new UnauthorizedException("MFA code is required.");
    }

    const payload = this.verifyToken(dto.mfaToken ?? "", "mfa");
    const user = await this.prisma.user.findUnique({
      where: {
        id: BigInt(payload.sub),
      },
      include: {
        linkedStudent: true,
      },
    });

    if (!user?.mfaEnabled) {
      throw new UnauthorizedException("MFA is not configured.");
    }

    const mfaMethod = payload.mfaMethod ?? this.getMfaMethodForUser(user);
    if (mfaMethod === "authenticator") {
      if (!user.mfaSecret) {
        throw new UnauthorizedException("Authenticator MFA is not configured.");
      }

      const secret = decryptString(user.mfaSecret, this.getEncryptionSecret());
      if (!verifyTotpCode(secret, dto.mfaCode)) {
        throw new UnauthorizedException("Invalid MFA code.");
      }
    } else {
      const challenge = payload.challenge
        ? this.deserializePendingMfaPayload(payload.challenge)
        : null;
      if (
        !challenge ||
        challenge.method !== "email" ||
        !challenge.code ||
        challenge.expiresAt <= Date.now() ||
        challenge.code !== dto.mfaCode.trim()
      ) {
        throw new UnauthorizedException("Invalid MFA code.");
      }
    }

    const authUser = this.serializeAuthUser(
      user,
      null,
      this.isPasswordExpired(user.passwordChangedAt),
    );

    await this.auditLogsService.log({
      actorUserId: user.id,
      subjectUserId: user.id,
      action: "auth.mfa_login",
      entityType: "session",
      description: `Kullanici ${mfaMethod} MFA ile giris yapti.`,
      metadata: {
        method: mfaMethod,
      },
    });

    return this.issueSession(authUser, true);
  }

  private assertCaptcha(token?: string, answer?: string) {
    if (!token || !answer) {
      throw new BadRequestException("Captcha is required.");
    }

    try {
      const payload = verify(token, this.getCaptchaSecret()) as CaptchaPayload;
      if (payload.tokenType !== "captcha" || payload.answer !== answer.trim()) {
        throw new UnauthorizedException("Invalid captcha.");
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Invalid captcha.");
    }
  }

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: BigInt(userId),
      },
      include: {
        linkedStudent: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User was not found.");
    }

    return user;
  }

  private serializeAuthUser(
    user: {
      id: bigint;
      email: string;
      fullName: string;
      role: AuthUser["role"];
      linkedStudent?: { id: bigint; coachId: bigint } | null;
      mfaEnabled: boolean;
      mfaSecret?: string | null;
    },
    sessionId: string | null,
    passwordExpired: boolean,
  ): AuthUser {
    return {
      id: user.id.toString(),
      sessionId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      studentProfileId: user.linkedStudent?.id.toString() ?? null,
      coachUserId: user.linkedStudent?.coachId.toString() ?? null,
      mfaEnabled: user.mfaEnabled,
      mfaMethod: this.getMfaMethodForUser(user),
      passwordExpired,
    };
  }

  private async issueSession(user: AuthUser, updateLastLoginAt: boolean) {
    const refreshTokenExpiresAt = new Date(
      Date.now() + this.refreshTokenTtlSeconds * 1000,
    );
    const now = new Date();
    const session = await this.prisma.userSession.create({
      data: {
        userId: BigInt(user.id),
        refreshTokenHash: "pending",
        expiresAt: refreshTokenExpiresAt,
        lastUsedAt: now,
      },
    });

    const accessToken = this.signToken(user, "access", session.id.toString());
    const refreshToken = this.signToken(user, "refresh", session.id.toString());

    await this.prisma.userSession.update({
      where: {
        id: session.id,
      },
      data: {
        refreshTokenHash: hashSync(refreshToken, 10),
        expiresAt: refreshTokenExpiresAt,
        lastUsedAt: now,
      },
    });

    await this.prisma.userSession.deleteMany({
      where: {
        userId: BigInt(user.id),
        OR: [
          {
            revokedAt: {
              not: null,
            },
          },
          {
            expiresAt: {
              lt: now,
            },
          },
        ],
      },
    });

    await this.prisma.user.update({
      where: {
        id: BigInt(user.id),
      },
      data: {
        ...(updateLastLoginAt ? { lastLoginAt: now } : {}),
      },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.accessTokenTtlSeconds,
      refreshTokenExpiresIn: this.refreshTokenTtlSeconds,
      user: {
        ...user,
        sessionId: session.id.toString(),
      },
    };
  }

  private async rotateSession(
    user: AuthUser,
    sessionId: bigint,
    updateLastLoginAt: boolean,
  ) {
    const refreshTokenExpiresAt = new Date(
      Date.now() + this.refreshTokenTtlSeconds * 1000,
    );
    const accessToken = this.signToken(user, "access", sessionId.toString());
    const refreshToken = this.signToken(user, "refresh", sessionId.toString());

    await this.prisma.userSession.update({
      where: {
        id: sessionId,
      },
      data: {
        refreshTokenHash: hashSync(refreshToken, 10),
        expiresAt: refreshTokenExpiresAt,
        lastUsedAt: new Date(),
      },
    });

    if (updateLastLoginAt) {
      await this.prisma.user.update({
        where: {
          id: BigInt(user.id),
        },
        data: {
          lastLoginAt: new Date(),
        },
      });
    }

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.accessTokenTtlSeconds,
      refreshTokenExpiresIn: this.refreshTokenTtlSeconds,
      user: {
        ...user,
        sessionId: sessionId.toString(),
      },
    };
  }

  private verifyToken(token: string, expectedType: TokenPayload["tokenType"]) {
    try {
      const payload = verify(
        token,
        expectedType === "refresh"
          ? this.getRefreshSecret()
          : this.getAccessSecret(),
      ) as TokenPayload;

      if (payload.tokenType !== expectedType) {
        throw new UnauthorizedException("Invalid token type.");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Invalid or expired token.");
    }
  }

  private signToken(
    user: AuthUser,
    tokenType: TokenPayload["tokenType"],
    sessionId: string,
  ) {
    return sign(
      {
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        studentProfileId: user.studentProfileId ?? null,
        coachUserId: user.coachUserId ?? null,
        sid: sessionId,
        mfaEnabled: user.mfaEnabled ?? false,
        mfaMethod: user.mfaMethod ?? null,
        passwordExpired: user.passwordExpired ?? false,
        tokenType,
      } satisfies TokenPayload,
      tokenType === "refresh" ? this.getRefreshSecret() : this.getAccessSecret(),
      {
        expiresIn:
          tokenType === "refresh"
            ? this.refreshTokenTtlSeconds
            : this.accessTokenTtlSeconds,
      },
    );
  }

  private signMfaToken(
    user: AuthUser,
    options?: {
      mfaMethod?: MfaMethod | null;
      challenge?: string | null;
    },
  ) {
    return sign(
      {
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        studentProfileId: user.studentProfileId ?? null,
        coachUserId: user.coachUserId ?? null,
        mfaEnabled: user.mfaEnabled ?? false,
        mfaMethod: options?.mfaMethod ?? user.mfaMethod ?? null,
        challenge: options?.challenge ?? null,
        passwordExpired: user.passwordExpired ?? false,
        tokenType: "mfa",
      } satisfies TokenPayload,
      this.getAccessSecret(),
      { expiresIn: "5m" },
    );
  }

  private assertPasswordPolicy(password: string) {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (password.length < 10 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      throw new BadRequestException(
        "Password must be at least 10 characters and include upper, lower, number and special character.",
      );
    }
  }

  private isPasswordExpired(passwordChangedAt: Date) {
    return this.getPasswordExpiresAt(passwordChangedAt).getTime() <= Date.now();
  }

  private getPasswordExpiresAt(passwordChangedAt: Date) {
    return new Date(passwordChangedAt.getTime() + PASSWORD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  }

  private getAccessSecret() {
    return this.configService.get<string>("JWT_ACCESS_SECRET") || "replace-me";
  }

  private getRefreshSecret() {
    return this.configService.get<string>("JWT_REFRESH_SECRET") || "replace-me-refresh";
  }

  private getCaptchaSecret() {
    return this.configService.get<string>("JWT_CAPTCHA_SECRET") || "replace-me-captcha";
  }

  private getEncryptionSecret() {
    return (
      this.configService.get<string>("APP_ENCRYPTION_SECRET") ||
      this.getAccessSecret()
    );
  }

  private getDurationInSeconds(key: string, fallback: number) {
    const configured = Number(this.configService.get<string>(key));
    return Number.isFinite(configured) && configured > 0 ? configured : fallback;
  }

  private generatePasswordResetToken() {
    return randomBytes(32).toString("base64url");
  }

  private hashOneTimeToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private getMfaMethodForUser(user: {
    mfaEnabled: boolean;
    mfaSecret?: string | null;
  }): MfaMethod | null {
    if (!user.mfaEnabled) {
      return null;
    }

    return user.mfaSecret ? "authenticator" : "email";
  }

  private getPendingMfaMethod(encryptedPayload?: string | null): MfaMethod | null {
    const payload = this.deserializePendingMfaPayload(encryptedPayload);
    return payload?.method ?? null;
  }

  private serializePendingMfaPayload(payload: PendingMfaPayload) {
    return encryptString(JSON.stringify(payload), this.getEncryptionSecret());
  }

  private deserializePendingMfaPayload(
    encryptedPayload?: string | null,
  ): PendingMfaPayload | null {
    if (!encryptedPayload) {
      return null;
    }

    try {
      return JSON.parse(
        decryptString(encryptedPayload, this.getEncryptionSecret()),
      ) as PendingMfaPayload;
    } catch {
      return null;
    }
  }

  private generateEmailCode() {
    return String(randomInt(100000, 1000000));
  }

  private async sendEmailMfaCode(
    email: string,
    fullName: string,
    code: string,
    purpose: "login" | "setup",
  ) {
    const smtpHost = this.configService.get<string>("SMTP_HOST");
    const smtpPort = Number(this.configService.get<string>("SMTP_PORT") ?? "587");
    const smtpUser = this.configService.get<string>("SMTP_USER");
    const smtpPass = this.configService.get<string>("SMTP_PASS");
    const smtpFrom =
      this.configService.get<string>("SMTP_FROM") ||
      smtpUser ||
      "noreply@kocluk.local";
    const subject =
      purpose === "login"
        ? "Giris MFA dogrulama kodunuz"
        : "MFA kurulum dogrulama kodunuz";
    const text =
      `Merhaba ${fullName},\n\n` +
      `6 haneli MFA kodunuz: ${code}\n` +
      `Bu kod ${MFA_CODE_TTL_SECONDS / 60} dakika gecerli.\n`;

    if (!smtpHost || !Number.isFinite(smtpPort)) {
      console.info(`[MFA EMAIL:${purpose}] ${email} -> ${code}`);
      return `SMTP ayarli degil. Gelistirme kodu: ${code}`;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth:
        smtpUser && smtpPass
          ? {
              user: smtpUser,
              pass: smtpPass,
            }
          : undefined,
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject,
      text,
      html: `<p>Merhaba ${fullName},</p><p><strong>${code}</strong> MFA kodunuzdur.</p><p>Bu kod ${MFA_CODE_TTL_SECONDS / 60} dakika gecerli.</p>`,
    });

    return `${this.maskEmail(email)} adresine dogrulama kodu gonderildi.`;
  }

  private maskEmail(email: string) {
    const [localPart = "", domain = ""] = email.split("@");
    const maskedLocal =
      localPart.length <= 2
        ? `${localPart.slice(0, 1)}*`
        : `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 1))}`;

    return `${maskedLocal}@${domain}`;
  }

  private async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetUrl: string,
  ) {
    const subject = "Sifre sifirlama baglantiniz";
    const text =
      `Merhaba ${fullName},\n\n` +
      `Sifreni sifirlamak icin baglanti: ${resetUrl}\n` +
      `Bu baglanti ${PASSWORD_RESET_TTL_SECONDS / 60} dakika gecerli.\n`;

    return this.sendMail({
      email,
      fullName,
      subject,
      text,
      html:
        `<p>Merhaba ${fullName},</p>` +
        `<p>Sifreni sifirlamak icin asagidaki baglantiyi kullan:</p>` +
        `<p><a href="${resetUrl}">${resetUrl}</a></p>` +
        `<p>Bu baglanti ${PASSWORD_RESET_TTL_SECONDS / 60} dakika gecerli.</p>`,
      developmentFallback: `SMTP ayarli degil. Gelistirme reset linki: ${resetUrl}`,
    });
  }

  private async sendMail(options: {
    email: string;
    fullName: string;
    subject: string;
    text: string;
    html: string;
    developmentFallback: string;
  }) {
    const smtpHost = this.configService.get<string>("SMTP_HOST");
    const smtpPort = Number(this.configService.get<string>("SMTP_PORT") ?? "587");
    const smtpUser = this.configService.get<string>("SMTP_USER");
    const smtpPass = this.configService.get<string>("SMTP_PASS");
    const smtpFrom =
      this.configService.get<string>("SMTP_FROM") ||
      smtpUser ||
      "noreply@kocluk.local";

    if (!smtpHost || !Number.isFinite(smtpPort)) {
      console.info(
        `[MAIL:${options.subject}] ${options.email} -> ${options.developmentFallback}`,
      );
      return options.developmentFallback;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth:
        smtpUser && smtpPass
          ? {
              user: smtpUser,
              pass: smtpPass,
            }
          : undefined,
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return `${this.maskEmail(options.email)} adresine e-posta gonderildi.`;
  }

  private getWebBaseUrl() {
    return (
      this.configService.get<string>("WEB_BASE_URL") ||
      this.configService.get<string>("NEXT_PUBLIC_APP_URL") ||
      "http://127.0.0.1:3001"
    );
  }
}
