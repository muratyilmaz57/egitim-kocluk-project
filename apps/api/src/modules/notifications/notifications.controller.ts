import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthUser } from "../auth/types/auth-user";
import { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles("admin", "coach", "student")
  findAll(
    @CurrentUser() user: AuthUser,
    @Query("unread") unread?: string,
    @Query("limit") limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.notificationsService.findAll(user, {
      unread: unread === "true",
      limit: parsedLimit !== undefined && Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
  }

  @Get("preferences")
  @Roles("admin", "coach", "student")
  getPreferences(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getPreferences(user);
  }

  @Patch("preferences")
  @Roles("admin", "coach", "student")
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user, dto);
  }

  @Patch(":id/read")
  @Roles("admin", "coach", "student")
  markRead(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.markRead(Number(id), user);
  }

  @Post("read-all")
  @Roles("admin", "coach", "student")
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user);
  }
}
