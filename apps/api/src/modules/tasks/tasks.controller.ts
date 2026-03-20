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
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TasksService } from "./tasks.service";

@Controller("tasks")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Roles("admin", "coach", "student")
  findAll(
    @CurrentUser() user: AuthUser,
    @Query("studentId") studentId?: string,
  ) {
    return this.tasksService.findAll(user, studentId ? Number(studentId) : undefined);
  }

  @Post()
  @Roles("admin", "coach")
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasksService.create(dto, user);
  }

  @Patch(":id")
  @Roles("admin", "coach")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.update(Number(id), dto, user);
  }

  @Delete(":id")
  @Roles("admin", "coach")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.tasksService.remove(Number(id), user);
  }
}
