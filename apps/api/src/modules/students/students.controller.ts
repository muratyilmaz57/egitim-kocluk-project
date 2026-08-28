import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthUser } from "../auth/types/auth-user";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentsService } from "./students.service";

@Controller("students")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles("admin", "coach")
  findAll(@CurrentUser() user: AuthUser) {
    return this.studentsService.findAll(user);
  }

  @Get(":id")
  @Roles("admin", "coach", "student")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.studentsService.findOne(Number(id), user);
  }

  @Post()
  @Roles("admin", "coach")
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: AuthUser) {
    return this.studentsService.create(dto, user);
  }

  @Patch(":id")
  @Roles("admin", "coach", "student")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.studentsService.update(Number(id), dto, user);
  }

  @Delete(":id")
  @Roles("admin", "coach")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.studentsService.remove(Number(id), user);
  }
}
