import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthUser } from "../auth/types/auth-user";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { ImportLessonsDto } from "./dto/import-lessons.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { LessonsService } from "./lessons.service";

@Controller("lessons")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @Roles("admin", "coach", "student")
  findAll(@CurrentUser() user: AuthUser) {
    return this.lessonsService.findAll(user);
  }

  @Post()
  @Roles("admin", "coach")
  create(@Body() dto: CreateLessonDto, @CurrentUser() user: AuthUser) {
    return this.lessonsService.createLesson(dto, user);
  }

  @Patch(":id")
  @Roles("admin", "coach")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateLessonDto, @CurrentUser() user: AuthUser) {
    return this.lessonsService.updateLesson(id, dto, user);
  }

  @Delete(":id")
  @Roles("admin", "coach")
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.lessonsService.removeLesson(id, user);
  }

  @Post("topics")
  @Roles("admin", "coach")
  createTopic(@Body() dto: CreateTopicDto, @CurrentUser() user: AuthUser) {
    return this.lessonsService.createTopic(dto, user);
  }

  @Post("import")
  @Roles("admin", "coach")
  importRows(@Body() dto: ImportLessonsDto, @CurrentUser() user: AuthUser) {
    return this.lessonsService.importRows(dto, user);
  }
}
