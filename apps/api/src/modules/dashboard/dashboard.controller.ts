import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthUser } from "../auth/types/auth-user";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  @Roles("admin", "coach")
  getSummary(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getSummary(user);
  }

  @Get("activity")
  @Roles("admin", "coach", "student")
  getActivity(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getActivity(user);
  }
}
