import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import type { AuthUser } from "../auth/types/auth-user";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(actor: AuthUser, noteType?: string) {
    try {
      const studentId =
        actor.role === "student"
          ? actor.studentProfileId
            ? BigInt(actor.studentProfileId)
            : null
          : undefined;

      if (actor.role === "student" && !studentId) {
        throw new ForbiddenException("Student profile is not linked.");
      }

      const notes = await this.prisma.note.findMany({
        where: {
          ...(studentId ? { studentId } : {}),
          ...(actor.role === "coach" ? { coachId: BigInt(actor.id) } : {}),
          ...(actor.role === "student"
            ? {
                visibility: {
                  in: ["student_visible"],
                },
              }
            : {}),
          ...(noteType ? { noteType: noteType as never } : {}),
        },
        include: {
          student: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return notes.map((note) => ({
        id: note.id.toString(),
        title: note.title,
        content: note.content,
        noteType: note.noteType,
        visibility: note.visibility,
        studentId: note.studentId.toString(),
        rating: note.rating,
        createdAt: note.createdAt,
        studentName: note.student.fullName,
      }));
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Notes are unavailable.", {
        cause: error,
      });
    }
  }

  async create(dto: CreateNoteDto, actor: AuthUser) {
    try {
      const student = await this.prisma.student.findUnique({
        where: {
          id: BigInt(dto.studentId),
        },
      });

      if (!student) {
        throw new BadRequestException("Student not found.");
      }

      if (actor.role === "coach" && student.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only create notes for your own students.");
      }

      const note = await this.prisma.note.create({
        data: {
          studentId: BigInt(dto.studentId),
          coachId: actor.role === "coach" ? BigInt(actor.id) : student.coachId,
          noteType: dto.noteType,
          title: dto.title,
          content: dto.content,
          visibility: dto.visibility,
          rating: dto.rating,
        },
        include: {
          student: true,
        },
      });

      if (note.visibility !== "private") {
        await this.notificationsService.createForUser({
          recipientUserId: student.userId,
          actorUserId: actor.id,
          studentId: student.id,
          type: "note",
          title: "Yeni koç notu eklendi",
          body: note.title,
          href: "/agenda",
        });
      }

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: note.student.id,
        subjectUserId: student.userId?.toString(),
        action: "note.create",
        entityType: "note",
        entityId: note.id.toString(),
        description: `${note.title} notu olusturuldu.`,
        metadata: {
          noteType: note.noteType,
          visibility: note.visibility,
          rating: note.rating,
        },
      });

      return {
        id: note.id.toString(),
        title: note.title,
        content: note.content,
        noteType: note.noteType,
        visibility: note.visibility,
        studentId: note.studentId.toString(),
        rating: note.rating,
        createdAt: note.createdAt,
        studentName: note.student.fullName,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Note could not be created.", {
        cause: error,
      });
    }
  }

  async update(id: number, dto: UpdateNoteDto, actor: AuthUser) {
    try {
      const note = await this.prisma.note.findUnique({
        where: {
          id: BigInt(id),
        },
      });

      if (!note) {
        throw new NotFoundException("Note not found.");
      }

      if (actor.role === "coach" && note.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only update your own notes.");
      }

      const updated = await this.prisma.note.update({
        where: {
          id: note.id,
        },
        data: {
          ...(dto.noteType ? { noteType: dto.noteType } : {}),
          ...(dto.title ? { title: dto.title } : {}),
          ...(dto.content ? { content: dto.content } : {}),
          ...(dto.visibility ? { visibility: dto.visibility } : {}),
          ...(typeof dto.rating === "number" ? { rating: dto.rating } : {}),
        },
        include: {
          student: true,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: updated.student.id,
        subjectUserId: updated.student.userId?.toString(),
        action: "note.update",
        entityType: "note",
        entityId: updated.id.toString(),
        description: `${updated.title} notu guncellendi.`,
        metadata: {
          noteType: updated.noteType,
          visibility: updated.visibility,
          rating: updated.rating,
        },
      });

      return {
        id: updated.id.toString(),
        title: updated.title,
        content: updated.content,
        noteType: updated.noteType,
        visibility: updated.visibility,
        studentId: updated.studentId.toString(),
        rating: updated.rating,
        createdAt: updated.createdAt,
        studentName: updated.student.fullName,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Note could not be updated.", {
        cause: error,
      });
    }
  }

  async remove(id: number, actor: AuthUser) {
    try {
      const note = await this.prisma.note.findUnique({
        where: {
          id: BigInt(id),
        },
      });

      if (!note) {
        throw new NotFoundException("Note not found.");
      }

      if (actor.role === "coach" && note.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only delete your own notes.");
      }

      await this.prisma.note.delete({
        where: {
          id: note.id,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: note.studentId,
        action: "note.delete",
        entityType: "note",
        entityId: note.id.toString(),
        description: `${note.title} notu silindi.`,
        metadata: {
          noteType: note.noteType,
          visibility: note.visibility,
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Note could not be deleted.", {
        cause: error,
      });
    }
  }
}
