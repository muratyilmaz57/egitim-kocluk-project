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
import { CreatePomodoroSessionDto } from "./dto/create-pomodoro-session.dto";
import { UpdatePomodoroSessionDto } from "./dto/update-pomodoro-session.dto";

@Injectable()
export class PomodoroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(actor: AuthUser, requestedStudentId?: number) {
    try {
      const studentId =
        actor.role === "student"
          ? actor.studentProfileId
            ? BigInt(actor.studentProfileId)
            : null
          : requestedStudentId
            ? BigInt(requestedStudentId)
            : undefined;

      if (actor.role === "student" && !studentId) {
        throw new ForbiddenException("Student profile is not linked.");
      }

      const sessions = await this.prisma.pomodoroSession.findMany({
        where: {
          ...(studentId ? { studentId } : {}),
          ...(actor.role === "coach"
            ? {
                student: {
                  coachId: BigInt(actor.id),
                },
              }
            : {}),
        },
        include: {
          student: true,
          task: true,
        },
        orderBy: {
          startedAt: "desc",
        },
      });

      return sessions.map((session) => ({
        ...this.serializeSession(session),
      }));
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Pomodoro sessions are unavailable.", {
        cause: error,
      });
    }
  }

  async create(dto: CreatePomodoroSessionDto, actor: AuthUser) {
    try {
      const studentId = await this.resolveWritableStudentId(dto.studentId, actor);
      const taskId = await this.resolveTaskId(dto.taskId, studentId, actor);

      const session = await this.prisma.pomodoroSession.create({
        data: {
          studentId,
          taskId,
          startedAt: new Date(dto.startedAt),
          endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined,
          durationMinutes: dto.durationMinutes,
          breakMinutes: dto.breakMinutes ?? 0,
          sessionType: dto.sessionType,
          deviceType: dto.deviceType,
          notes: dto.notes,
        },
        include: {
          student: true,
          task: true,
        },
      });

      await this.notificationsService.createForUser({
        recipientUserId:
          actor.role === "student" ? session.student.coachId : session.student.userId,
        actorUserId: actor.id,
        studentId: session.student.id,
        type: "pomodoro",
        title: "Yeni pomodoro oturumu kaydedildi",
        body: `${session.durationMinutes} dakikalik odak oturumu eklendi.`,
        href: "/pomodoro",
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: session.student.id,
        subjectUserId:
          actor.role === "student"
            ? session.student.coachId.toString()
            : session.student.userId?.toString(),
        action: "pomodoro.create",
        entityType: "pomodoro_session",
        entityId: session.id.toString(),
        description: `${session.durationMinutes} dakikalik pomodoro oturumu kaydedildi.`,
        metadata: {
          sessionType: session.sessionType,
          breakMinutes: session.breakMinutes,
          taskId: session.taskId?.toString() ?? null,
        },
      });

      return this.serializeSession(session);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException("Pomodoro session could not be created.", {
        cause: error,
      });
    }
  }

  async update(id: number, dto: UpdatePomodoroSessionDto, actor: AuthUser) {
    try {
      const existing = await this.prisma.pomodoroSession.findUnique({
        where: {
          id: BigInt(id),
        },
        include: {
          student: true,
          task: true,
        },
      });

      if (!existing) {
        throw new NotFoundException("Pomodoro session not found.");
      }

      if (actor.role === "coach" && existing.student.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only update sessions for your own students.");
      }

      if (
        actor.role === "student" &&
        (!actor.studentProfileId || existing.studentId.toString() !== actor.studentProfileId)
      ) {
        throw new ForbiddenException("Students can only update their own pomodoro sessions.");
      }

      const taskId =
        dto.taskId !== undefined
          ? await this.resolveTaskId(dto.taskId, existing.studentId, actor)
          : existing.taskId;

      const updated = await this.prisma.pomodoroSession.update({
        where: {
          id: existing.id,
        },
        data: {
          taskId,
          ...(dto.startedAt ? { startedAt: new Date(dto.startedAt) } : {}),
          ...(dto.endedAt !== undefined
            ? { endedAt: dto.endedAt ? new Date(dto.endedAt) : null }
            : {}),
          ...(typeof dto.durationMinutes === "number"
            ? { durationMinutes: dto.durationMinutes }
            : {}),
          ...(typeof dto.breakMinutes === "number" ? { breakMinutes: dto.breakMinutes } : {}),
          ...(dto.sessionType ? { sessionType: dto.sessionType } : {}),
          ...(dto.deviceType !== undefined ? { deviceType: dto.deviceType || null } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
        },
        include: {
          student: true,
          task: true,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: updated.student.id,
        subjectUserId:
          actor.role === "student"
            ? updated.student.coachId.toString()
            : updated.student.userId?.toString(),
        action: "pomodoro.update",
        entityType: "pomodoro_session",
        entityId: updated.id.toString(),
        description: `${updated.durationMinutes} dakikalik pomodoro oturumu guncellendi.`,
        metadata: {
          sessionType: updated.sessionType,
          breakMinutes: updated.breakMinutes,
          taskId: updated.taskId?.toString() ?? null,
        },
      });

      return this.serializeSession(updated);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException("Pomodoro session could not be updated.", {
        cause: error,
      });
    }
  }

  async remove(id: number, actor: AuthUser) {
    try {
      const existing = await this.prisma.pomodoroSession.findUnique({
        where: {
          id: BigInt(id),
        },
        include: {
          student: true,
        },
      });

      if (!existing) {
        throw new NotFoundException("Pomodoro session not found.");
      }

      if (actor.role === "coach" && existing.student.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only delete sessions for your own students.");
      }

      if (
        actor.role === "student" &&
        (!actor.studentProfileId || existing.studentId.toString() !== actor.studentProfileId)
      ) {
        throw new ForbiddenException("Students can only delete their own pomodoro sessions.");
      }

      await this.prisma.pomodoroSession.delete({
        where: {
          id: existing.id,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: existing.student.id,
        subjectUserId:
          actor.role === "student"
            ? existing.student.coachId.toString()
            : existing.student.userId?.toString(),
        action: "pomodoro.delete",
        entityType: "pomodoro_session",
        entityId: existing.id.toString(),
        description: `${existing.durationMinutes} dakikalik pomodoro oturumu silindi.`,
        metadata: {
          sessionType: existing.sessionType,
          breakMinutes: existing.breakMinutes,
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }

      throw new ServiceUnavailableException("Pomodoro session could not be deleted.", {
        cause: error,
      });
    }
  }

  private async resolveWritableStudentId(studentId: number | undefined, actor: AuthUser) {
    if (actor.role === "student") {
      if (!actor.studentProfileId) {
        throw new ForbiddenException("Student profile is not linked.");
      }

      return BigInt(actor.studentProfileId);
    }

    if (!studentId) {
      throw new BadRequestException("studentId is required.");
    }

    const student = await this.prisma.student.findUnique({
      where: {
        id: BigInt(studentId),
      },
    });

    if (!student) {
      throw new BadRequestException("Student not found.");
    }

    if (actor.role === "coach" && student.coachId.toString() !== actor.id) {
      throw new ForbiddenException("You can only create sessions for your own students.");
    }

    return student.id;
  }

  private async resolveTaskId(taskId: number | undefined, studentId: bigint, actor: AuthUser) {
    if (!taskId) {
      return undefined;
    }

    const task = await this.prisma.task.findUnique({
      where: {
        id: BigInt(taskId),
      },
      include: {
        student: true,
      },
    });

    if (!task || task.studentId !== studentId) {
      throw new BadRequestException("Task not found for this student.");
    }

    if (actor.role === "coach" && task.student.coachId.toString() !== actor.id) {
      throw new ForbiddenException("You can only use tasks from your own students.");
    }

    if (
      actor.role === "student" &&
      (!actor.studentProfileId || task.studentId.toString() !== actor.studentProfileId)
    ) {
      throw new ForbiddenException("Students can only use their own tasks.");
    }

    return task.id;
  }

  private serializeSession(session: {
    id: bigint;
    startedAt: Date;
    endedAt: Date | null;
    durationMinutes: number;
    breakMinutes: number;
    sessionType: string;
    deviceType: string | null;
    notes: string | null;
    student: { id: bigint; fullName: string };
    task?: { title: string } | null;
  }) {
    return {
      id: session.id.toString(),
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationMinutes: session.durationMinutes,
      breakMinutes: session.breakMinutes,
      sessionType: session.sessionType,
      deviceType: session.deviceType,
      notes: session.notes,
      student: {
        id: session.student.id.toString(),
        fullName: session.student.fullName,
      },
      taskTitle: session.task?.title ?? null,
    };
  }
}
