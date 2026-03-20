import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthUser } from "../auth/types/auth-user";
import { CreatePomodoroSessionDto } from "./dto/create-pomodoro-session.dto";
import { UpdatePomodoroSessionDto } from "./dto/update-pomodoro-session.dto";
import { PomodoroService } from "./pomodoro.service";

@Controller("pomodoro-sessions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PomodoroController {
  constructor(private readonly pomodoroService: PomodoroService) {}

  @Get()
  @Roles("admin", "coach", "student")
  findAll(@CurrentUser() user: AuthUser, @Query("studentId") studentId?: string) {
    return this.pomodoroService.findAll(user, studentId ? Number(studentId) : undefined);
  }

  @Post()
  @Roles("admin", "coach", "student")
  create(@Body() dto: CreatePomodoroSessionDto, @CurrentUser() user: AuthUser) {
    return this.pomodoroService.create(dto, user);
  }

  @Patch(":id")
  @Roles("admin", "coach", "student")
  update(
    @Param("id") id: string,
    @Body() dto: UpdatePomodoroSessionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pomodoroService.update(Number(id), dto, user);
  }

  @Delete(":id")
  @Roles("admin", "coach", "student")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.pomodoroService.remove(Number(id), user);
  }
}
