import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { NoteTargetType } from "@prisma/client";
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
      const actorStudent =
        actor.role === "student" && studentId
          ? await this.prisma.student.findUnique({
              where: { id: studentId },
              select: { gradeLevel: true },
            })
          : null;

      if (actor.role === "student" && !studentId) {
        throw new ForbiddenException("Student profile is not linked.");
      }

      const notes = await this.prisma.note.findMany({
        where: {
          ...(actor.role === "coach" ? { coachId: BigInt(actor.id) } : {}),
          ...(actor.role === "student"
            ? {
                visibility: {
                  in: ["student_visible"],
                },
                OR: [
                  ...(studentId ? [{ studentId }] : []),
                  ...(studentId
                    ? [{ targets: { some: { targetType: NoteTargetType.student, studentId } } }]
                    : []),
                  ...(actorStudent?.gradeLevel
                    ? [
                        {
                          targets: {
                            some: {
                              targetType: NoteTargetType.grade,
                              gradeLevel: actorStudent.gradeLevel,
                            },
                          },
                        },
                      ]
                    : []),
                  {
                    targets: {
                      some: {
                        targetType: NoteTargetType.everyone,
                      },
                    },
                  },
                ],
              }
            : {}),
          ...(noteType ? { noteType: noteType as never } : {}),
        },
        include: {
          student: true,
          targets: {
            include: {
              student: true,
            },
          },
        },
        orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }],
      });

      return notes.map((note) => this.serializeNote(note));
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
      const audience = await this.resolveAudience(dto, actor);

      const note = await this.prisma.note.create({
        data: {
          studentId: audience.anchorStudent.id,
          coachId: actor.role === "coach" ? BigInt(actor.id) : audience.anchorStudent.coachId,
          noteType: dto.noteType,
          title: dto.title,
          content: dto.content,
          visibility: dto.visibility,
          rating: dto.rating,
          scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
          targets: audience.targets.length
            ? {
                create: audience.targets,
              }
            : undefined,
        },
        include: {
          student: true,
          targets: {
            include: {
              student: true,
            },
          },
        },
      });

      if (note.visibility !== "private") {
        for (const recipientUserId of audience.notificationUserIds) {
          await this.notificationsService.createForUser({
            recipientUserId,
            actorUserId: actor.id,
            studentId: note.student.id,
            type: "note",
            title: "Yeni koç notu eklendi",
            body: note.title,
            href: "/agenda",
          });
        }
      }

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: note.student.id,
        subjectUserId: audience.anchorStudent.userId?.toString(),
        action: "note.create",
        entityType: "note",
        entityId: note.id.toString(),
        description: `${note.title} notu olusturuldu.`,
        metadata: {
          noteType: note.noteType,
          visibility: note.visibility,
          rating: note.rating,
          tags: this.formatTargetLabels(note.targets),
        },
      });

      return this.serializeNote(note);
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
          ...(dto.scheduledFor !== undefined
            ? { scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null }
            : {}),
        },
        include: {
          student: true,
          targets: {
            include: {
              student: true,
            },
          },
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
          tags: this.formatTargetLabels(updated.targets),
        },
      });

      return this.serializeNote(updated);
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

  private async resolveAudience(dto: CreateNoteDto, actor: AuthUser) {
    const selectedStudentIds = [
      ...(dto.studentId ? [dto.studentId] : []),
      ...(dto.studentTargetIds ?? []),
      ...(dto.parentTargetIds ?? []),
    ];

    const uniqueStudentIds = [...new Set(selectedStudentIds)];
    const where =
      actor.role === "coach"
        ? {
            coachId: BigInt(actor.id),
          }
        : undefined;

    const students = await this.prisma.student.findMany({
      where: {
        ...where,
        ...(uniqueStudentIds.length
          ? {
              id: {
                in: uniqueStudentIds.map((id) => BigInt(id)),
              },
            }
          : {}),
      },
      select: {
        id: true,
        userId: true,
        fullName: true,
        gradeLevel: true,
        parentName: true,
        coachId: true,
      },
    });

    const studentMap = new Map(students.map((student) => [student.id.toString(), student]));
    if (uniqueStudentIds.length && students.length !== uniqueStudentIds.length) {
      throw new BadRequestException("Etiketlenen ogrenciler bulunamadi.");
    }

    let gradeStudents: Array<{
      id: bigint;
      userId: bigint | null;
      fullName: string;
      gradeLevel: string;
      parentName: string | null;
      coachId: bigint;
    }> = [];
    if ((dto.gradeLevels?.length ?? 0) > 0 || dto.targetEveryone) {
      gradeStudents = await this.prisma.student.findMany({
        where: {
          ...where,
          ...(dto.targetEveryone
            ? {}
            : {
                gradeLevel: {
                  in: dto.gradeLevels,
                },
              }),
        },
        select: {
          id: true,
          userId: true,
          fullName: true,
          gradeLevel: true,
          parentName: true,
          coachId: true,
        },
      });
    }

    const anchorStudent =
      (dto.studentId ? studentMap.get(String(dto.studentId)) : undefined) ??
      (dto.studentTargetIds?.[0] ? studentMap.get(String(dto.studentTargetIds[0])) : undefined) ??
      (dto.parentTargetIds?.[0] ? studentMap.get(String(dto.parentTargetIds[0])) : undefined) ??
      gradeStudents[0];

    if (!anchorStudent) {
      throw new BadRequestException("En az bir ogrenci, sinif veya @everyone secmelisin.");
    }

    const targets: Array<{
      targetType: NoteTargetType;
      studentId?: bigint;
      gradeLevel?: string;
    }> = [];

    const pushUniqueTarget = (target: {
      targetType: NoteTargetType;
      studentId?: bigint;
      gradeLevel?: string;
    }) => {
      const exists = targets.some(
        (item) =>
          item.targetType === target.targetType &&
          item.studentId?.toString() === target.studentId?.toString() &&
          item.gradeLevel === target.gradeLevel,
      );
      if (!exists) {
        targets.push(target);
      }
    };

    for (const studentId of new Set(dto.studentTargetIds ?? [])) {
      pushUniqueTarget({
        targetType: NoteTargetType.student,
        studentId: BigInt(studentId),
      });
    }

    for (const studentId of new Set(dto.parentTargetIds ?? [])) {
      pushUniqueTarget({
        targetType: NoteTargetType.parent,
        studentId: BigInt(studentId),
      });
    }

    for (const gradeLevel of new Set(dto.gradeLevels ?? [])) {
      pushUniqueTarget({
        targetType: NoteTargetType.grade,
        gradeLevel,
      });
    }

    if (dto.targetEveryone) {
      pushUniqueTarget({
        targetType: NoteTargetType.everyone,
      });
    }

    if (!targets.length) {
      pushUniqueTarget({
        targetType: NoteTargetType.student,
        studentId: anchorStudent.id,
      });
    }

    const notificationUserIds = new Set<string>();
    for (const student of students) {
      if (student.userId) {
        notificationUserIds.add(student.userId.toString());
      }
    }
    for (const student of gradeStudents) {
      if (student.userId) {
        notificationUserIds.add(student.userId.toString());
      }
    }

    return {
      anchorStudent,
      targets,
      notificationUserIds,
    };
  }

  private formatTargetLabels(targets: Array<any>) {
    const labels: string[] = [];
    for (const target of targets) {
      if (target.targetType === NoteTargetType.everyone) {
        labels.push("@everyone");
      } else if (target.targetType === NoteTargetType.grade && target.gradeLevel) {
        labels.push(`@${target.gradeLevel}`);
      } else if (target.targetType === NoteTargetType.student && target.student) {
        labels.push(`@${target.student.fullName}`);
      } else if (target.targetType === NoteTargetType.parent && target.student) {
        labels.push(`@${target.student.parentName ?? `${target.student.fullName} velisi`}`);
      }
    }

    return labels;
  }

  private serializeNote(note: any) {
    return {
      id: note.id.toString(),
      title: note.title,
      content: note.content,
      noteType: note.noteType,
      visibility: note.visibility,
      studentId: note.studentId.toString(),
      rating: note.rating,
      scheduledFor: note.scheduledFor,
      createdAt: note.createdAt,
      studentName: note.student.fullName,
      tags: this.formatTargetLabels(note.targets ?? []),
    };
  }
}
