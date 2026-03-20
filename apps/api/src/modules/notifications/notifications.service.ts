import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NotificationType } from "@prisma/client";
import * as nodemailer from "nodemailer";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../auth/types/auth-user";
import { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";

const NOTIFICATION_TYPES: NotificationType[] = [
  "task",
  "exam",
  "message",
  "note",
  "plan",
  "pomodoro",
  "resource",
];

type CreateNotificationInput = {
  recipientUserId?: bigint | number | string | null;
  actorUserId?: bigint | number | string | null;
  studentId?: bigint | number | string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  href: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getPreferences(actor: AuthUser) {
    const userId = BigInt(actor.id);
    const existing = await this.prisma.notificationPreference.findMany({
      where: {
        userId,
      },
      orderBy: {
        type: "asc",
      },
    });

    return NOTIFICATION_TYPES.map((type) => {
      const preference = existing.find((item) => item.type === type);
      return {
        type,
        inAppEnabled: preference?.inAppEnabled ?? true,
        emailEnabled: preference?.emailEnabled ?? false,
      };
    });
  }

  async updatePreferences(actor: AuthUser, dto: UpdateNotificationPreferencesDto) {
    const userId = BigInt(actor.id);

    await this.prisma.$transaction(
      dto.preferences.map((preference) =>
        this.prisma.notificationPreference.upsert({
          where: {
            userId_type: {
              userId,
              type: preference.type,
            },
          },
          update: {
            inAppEnabled: preference.inAppEnabled,
            emailEnabled: preference.emailEnabled,
          },
          create: {
            userId,
            type: preference.type,
            inAppEnabled: preference.inAppEnabled,
            emailEnabled: preference.emailEnabled,
          },
        }),
      ),
    );

    return this.getPreferences(actor);
  }

  async findAll(actor: AuthUser, options?: { unread?: boolean; limit?: number }) {
    try {
      const recipientUserId = BigInt(actor.id);
      const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
      const unread = options?.unread ?? false;

      const [items, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: {
            recipientUserId,
            ...(unread ? { isRead: false } : {}),
          },
          include: {
            actorUser: true,
            student: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
        }),
        this.prisma.notification.count({
          where: {
            recipientUserId,
            isRead: false,
          },
        }),
      ]);

      return {
        unreadCount,
        items: items.map((item) => ({
          id: item.id.toString(),
          type: item.type,
          title: item.title,
          body: item.body,
          href: item.href,
          isRead: item.isRead,
          readAt: item.readAt,
          createdAt: item.createdAt,
          actorName: item.actorUser?.fullName ?? null,
          studentName: item.student?.fullName ?? null,
        })),
      };
    } catch (error) {
      throw new ServiceUnavailableException("Notifications are unavailable.", {
        cause: error,
      });
    }
  }

  async markRead(id: number, actor: AuthUser) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: {
          id: BigInt(id),
        },
      });

      if (!notification) {
        throw new NotFoundException("Notification not found.");
      }

      if (notification.recipientUserId.toString() !== actor.id) {
        throw new ForbiddenException("You can only update your own notifications.");
      }

      const updated = await this.prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return {
        id: updated.id.toString(),
        isRead: updated.isRead,
        readAt: updated.readAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Notification could not be updated.", {
        cause: error,
      });
    }
  }

  async markAllRead(actor: AuthUser) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          recipientUserId: BigInt(actor.id),
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return { success: true, updatedCount: result.count };
    } catch (error) {
      throw new ServiceUnavailableException("Notifications could not be updated.", {
        cause: error,
      });
    }
  }

  async createForUser(input: CreateNotificationInput) {
    const recipientUserId = this.normalizeId(input.recipientUserId);
    const actorUserId = this.normalizeId(input.actorUserId);
    const studentId = this.normalizeId(input.studentId);

    if (!recipientUserId) {
      return null;
    }

    if (actorUserId && recipientUserId === actorUserId) {
      return null;
    }

    try {
      const preference = await this.prisma.notificationPreference.findUnique({
        where: {
          userId_type: {
            userId: BigInt(recipientUserId),
            type: input.type,
          },
        },
      });

      const recipientUser = await this.prisma.user.findUnique({
        where: {
          id: BigInt(recipientUserId),
        },
      });

      if (!recipientUser) {
        return null;
      }

      const shouldCreateInApp = preference?.inAppEnabled ?? true;
      const shouldSendEmail = preference?.emailEnabled ?? false;

      const notification = shouldCreateInApp
        ? await this.prisma.notification.create({
            data: {
              recipientUserId: BigInt(recipientUserId),
              actorUserId: actorUserId ? BigInt(actorUserId) : undefined,
              studentId: studentId ? BigInt(studentId) : undefined,
              type: input.type,
              title: input.title,
              body: input.body ?? null,
              href: input.href,
            },
          })
        : null;

      if (shouldSendEmail) {
        await this.sendNotificationEmail({
          recipientEmail: recipientUser.email,
          recipientName: recipientUser.fullName,
          title: input.title,
          body: input.body ?? null,
          href: input.href,
        });
      }

      return notification;
    } catch {
      return null;
    }
  }

  private async sendNotificationEmail(options: {
    recipientEmail: string;
    recipientName: string;
    title: string;
    body: string | null;
    href: string;
  }) {
    const smtpHost = this.configService.get<string>("SMTP_HOST");
    const smtpPort = Number(this.configService.get<string>("SMTP_PORT") ?? "587");
    const smtpUser = this.configService.get<string>("SMTP_USER");
    const smtpPass = this.configService.get<string>("SMTP_PASS");
    const smtpFrom =
      this.configService.get<string>("SMTP_FROM") ||
      smtpUser ||
      "noreply@kocluk.local";
    const webBaseUrl = this.configService.get<string>("WEB_BASE_URL") || "http://127.0.0.1:3001";

    if (!smtpHost || !Number.isFinite(smtpPort)) {
      return;
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

    const absoluteHref = options.href.startsWith("http")
      ? options.href
      : `${webBaseUrl.replace(/\/$/, "")}${options.href}`;

    await transporter.sendMail({
      from: smtpFrom,
      to: options.recipientEmail,
      subject: options.title,
      text:
        `Merhaba ${options.recipientName},\n\n` +
        `${options.title}\n` +
        `${options.body ? `${options.body}\n\n` : ""}` +
        `Detay: ${absoluteHref}\n`,
    });
  }

  private normalizeId(value?: bigint | number | string | null) {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    return value.toString();
  }
}
