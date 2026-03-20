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
import { CreateExamResultDto } from "./dto/create-exam-result.dto";
import { UpdateExamResultDto } from "./dto/update-exam-result.dto";
import { ExamsService } from "./exams.service";

@Controller("exam-results")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @Roles("admin", "coach", "student")
  findAll(
    @CurrentUser() user: AuthUser,
    @Query("studentId") studentId?: string,
  ) {
    return this.examsService.findAll(user, studentId ? Number(studentId) : undefined);
  }

  @Post()
  @Roles("admin", "coach")
  create(@Body() dto: CreateExamResultDto, @CurrentUser() user: AuthUser) {
    return this.examsService.create(dto, user);
  }

  @Patch(":id")
  @Roles("admin", "coach")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateExamResultDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examsService.update(Number(id), dto, user);
  }

  @Delete(":id")
  @Roles("admin", "coach")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.examsService.remove(Number(id), user);
  }
}
