import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { DisableMfaDto } from "./dto/disable-mfa.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { StartMfaSetupDto } from "./dto/start-mfa-setup.dto";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import type { AuthUser } from "./types/auth-user";
import { VerifyMfaSetupDto } from "./dto/verify-mfa-setup.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("captcha")
  captcha() {
    return this.authService.createCaptcha();
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("logout")
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post("password-reset/request")
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post("password-reset/confirm")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Get("security")
  @UseGuards(JwtAuthGuard)
  security(@CurrentUser() user: AuthUser) {
    return this.authService.getSecurityStatus(user);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user, dto);
  }

  @Post("mfa/setup/start")
  @UseGuards(JwtAuthGuard)
  startMfaSetup(@CurrentUser() user: AuthUser, @Body() dto: StartMfaSetupDto) {
    return this.authService.startMfaSetup(user, dto);
  }

  @Post("mfa/setup/verify")
  @UseGuards(JwtAuthGuard)
  verifyMfaSetup(@CurrentUser() user: AuthUser, @Body() dto: VerifyMfaSetupDto) {
    return this.authService.verifyMfaSetup(user, dto);
  }

  @Post("mfa/disable")
  @UseGuards(JwtAuthGuard)
  disableMfa(@CurrentUser() user: AuthUser, @Body() dto: DisableMfaDto) {
    return this.authService.disableMfa(user, dto);
  }
}
