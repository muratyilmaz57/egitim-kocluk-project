import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthUser } from "../auth/types/auth-user";

@Controller("audit-logs")
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query("limit") limit?: string,
  ) {
    return this.auditLogsService.findForActor(
      user,
      limit ? Number(limit) : undefined,
    );
  }
}
