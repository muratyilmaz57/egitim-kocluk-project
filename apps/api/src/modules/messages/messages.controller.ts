import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthUser } from "../auth/types/auth-user";
import { CreateMessageDto } from "./dto/create-message.dto";
import { MessagesService } from "./messages.service";

@Controller("messages")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Roles("admin", "coach", "student")
  findAll(@CurrentUser() user: AuthUser, @Query("studentId") studentId?: string) {
    return this.messagesService.findAll(user, studentId ? Number(studentId) : undefined);
  }

  @Post()
  @Roles("admin", "coach", "student")
  create(@Body() dto: CreateMessageDto, @CurrentUser() user: AuthUser) {
    return this.messagesService.create(dto, user);
  }

  @Post("read-all")
  @Roles("admin", "coach", "student")
  markAllRead(@CurrentUser() user: AuthUser, @Body() body?: { studentId?: number }) {
    return this.messagesService.markAllRead(user, body?.studentId);
  }
}
