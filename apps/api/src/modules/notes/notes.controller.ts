import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthUser } from "../auth/types/auth-user";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { NotesService } from "./notes.service";

@Controller("notes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @Roles("admin", "coach", "student")
  findAll(@CurrentUser() user: AuthUser, @Query("noteType") noteType?: string) {
    return this.notesService.findAll(user, noteType);
  }

  @Post()
  @Roles("admin", "coach")
  create(@Body() dto: CreateNoteDto, @CurrentUser() user: AuthUser) {
    return this.notesService.create(dto, user);
  }

  @Patch(":id")
  @Roles("admin", "coach")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notesService.update(Number(id), dto, user);
  }

  @Delete(":id")
  @Roles("admin", "coach")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.notesService.remove(Number(id), user);
  }
}
