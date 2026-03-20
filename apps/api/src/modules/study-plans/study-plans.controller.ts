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
import { CreateStudyPlanDto } from "./dto/create-study-plan.dto";
import { UpdateStudyPlanDto } from "./dto/update-study-plan.dto";
import { StudyPlansService } from "./study-plans.service";

@Controller("study-plans")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudyPlansController {
  constructor(private readonly studyPlansService: StudyPlansService) {}

  @Get()
  @Roles("admin", "coach", "student")
  findAll(@CurrentUser() user: AuthUser, @Query("studentId") studentId?: string) {
    return this.studyPlansService.findAll(user, studentId ? Number(studentId) : undefined);
  }

  @Post()
  @Roles("admin", "coach")
  create(@Body() dto: CreateStudyPlanDto, @CurrentUser() user: AuthUser) {
    return this.studyPlansService.create(dto, user);
  }

  @Patch(":id")
  @Roles("admin", "coach")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateStudyPlanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.studyPlansService.update(Number(id), dto, user);
  }

  @Delete(":id")
  @Roles("admin", "coach")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.studyPlansService.remove(Number(id), user);
  }
}
