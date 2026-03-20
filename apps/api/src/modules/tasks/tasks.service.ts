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
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(actor: AuthUser, studentId?: number) {
    try {
      const resolvedStudentId =
        actor.role === "student"
          ? actor.studentProfileId
            ? BigInt(actor.studentProfileId)
            : null
          : studentId
            ? BigInt(studentId)
            : undefined;

      if (actor.role === "student" && !resolvedStudentId) {
        throw new ForbiddenException("Student profile is not linked.");
      }

      const tasks = await this.prisma.task.findMany({
        where: {
          studentId: resolvedStudentId ?? undefined,
          ...(actor.role === "coach"
            ? { coachId: BigInt(actor.id) }
            : {}),
        },
        include: {
          student: true,
          lesson: true,
          topic: true,
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      });

      return tasks.map((task) => ({
        id: task.id.toString(),
        title: task.title,
        taskType: task.taskType,
        description: task.description,
        targetQuestionCount: task.targetQuestionCount,
        targetMinutes: task.targetMinutes,
        priority: task.priority,
        status: task.status,
        progressPercent: task.progressPercent,
        dueAt: task.dueAt,
        student: {
          id: task.student.id.toString(),
          fullName: task.student.fullName,
          gradeLevel: task.student.gradeLevel,
        },
        lessonName: task.lesson?.name ?? null,
        topicName: task.topic?.name ?? null,
      }));
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Task data is unavailable.", {
        cause: error,
      });
    }
  }

  async create(dto: CreateTaskDto, actor: AuthUser) {
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
        throw new ForbiddenException("You can only create tasks for your own students.");
      }

      const task = await this.prisma.task.create({
        data: {
          studentId: BigInt(dto.studentId),
          coachId: actor.role === "coach" ? BigInt(actor.id) : student.coachId,
          studyPlanId: dto.studyPlanId ? BigInt(dto.studyPlanId) : undefined,
          lessonId: dto.lessonId ? BigInt(dto.lessonId) : undefined,
          topicId: dto.topicId ? BigInt(dto.topicId) : undefined,
          title: dto.title,
          taskType: dto.taskType,
          description: dto.description,
          targetQuestionCount: dto.targetQuestionCount ?? 0,
          targetMinutes: dto.targetMinutes ?? 0,
          priority: dto.priority,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        },
        include: {
          student: true,
          lesson: true,
          topic: true,
        },
      });

      await this.notificationsService.createForUser({
        recipientUserId: student.userId,
        actorUserId: actor.id,
        studentId: student.id,
        type: "task",
        title: "Yeni gorev atandi",
        body: `${task.title} gorevi eklendi.`,
        href: "/tasks",
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: task.student.id,
        subjectUserId: task.student.userId?.toString(),
        action: "task.create",
        entityType: "task",
        entityId: task.id.toString(),
        description: `${task.title} gorevi olusturuldu.`,
        metadata: {
          taskType: task.taskType,
          status: task.status,
          dueAt: task.dueAt?.toISOString() ?? null,
        },
      });

      return {
        id: task.id.toString(),
        title: task.title,
        taskType: task.taskType,
        status: task.status,
        progressPercent: task.progressPercent,
        dueAt: task.dueAt,
        student: {
          id: task.student.id.toString(),
          fullName: task.student.fullName,
        },
        lessonName: task.lesson?.name ?? null,
        topicName: task.topic?.name ?? null,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Task could not be created.", {
        cause: error,
      });
    }
  }

  async update(id: number, dto: UpdateTaskDto, actor: AuthUser) {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          id: BigInt(id),
        },
        include: {
          student: true,
        },
      });

      if (!task) {
        throw new NotFoundException("Task not found.");
      }

      if (actor.role === "coach" && task.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only update your own tasks.");
      }

      const updated = await this.prisma.task.update({
        where: {
          id: task.id,
        },
        data: {
          ...(dto.title ? { title: dto.title } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.status ? { status: dto.status } : {}),
          ...(typeof dto.progressPercent === "number"
            ? { progressPercent: dto.progressPercent }
            : {}),
          ...(dto.dueAt !== undefined ? { dueAt: dto.dueAt ? new Date(dto.dueAt) : null } : {}),
          ...(dto.status === "completed"
            ? { completedAt: new Date(), progressPercent: 100 }
            : dto.status === "pending" || dto.status === "in_progress"
              ? { completedAt: null }
              : {}),
        },
        include: {
          student: true,
          lesson: true,
          topic: true,
        },
      });

      await this.notificationsService.createForUser({
        recipientUserId: updated.student.userId,
        actorUserId: actor.id,
        studentId: updated.student.id,
        type: "task",
        title: dto.status === "completed" ? "Gorev tamamlandi" : "Gorev guncellendi",
        body:
          dto.status === "completed"
            ? `${updated.title} gorevi tamamlandi olarak isaretlendi.`
            : `${updated.title} gorevinde degisiklik yapildi.`,
        href: "/tasks",
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: updated.student.id,
        subjectUserId: updated.student.userId?.toString(),
        action: "task.update",
        entityType: "task",
        entityId: updated.id.toString(),
        description: `${updated.title} gorevi guncellendi.`,
        metadata: {
          status: updated.status,
          progressPercent: updated.progressPercent,
          dueAt: updated.dueAt?.toISOString() ?? null,
        },
      });

      return {
        id: updated.id.toString(),
        title: updated.title,
        taskType: updated.taskType,
        status: updated.status,
        progressPercent: updated.progressPercent,
        dueAt: updated.dueAt,
        student: {
          id: updated.student.id.toString(),
          fullName: updated.student.fullName,
        },
        lessonName: updated.lesson?.name ?? null,
        topicName: updated.topic?.name ?? null,
      };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }

      throw new ServiceUnavailableException("Task could not be updated.", {
        cause: error,
      });
    }
  }

  async remove(id: number, actor: AuthUser) {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          id: BigInt(id),
        },
      });

      if (!task) {
        throw new NotFoundException("Task not found.");
      }

      if (actor.role === "coach" && task.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only delete your own tasks.");
      }

      await this.prisma.task.delete({
        where: {
          id: task.id,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: task.studentId,
        action: "task.delete",
        entityType: "task",
        entityId: task.id.toString(),
        description: `${task.title} gorevi silindi.`,
        metadata: {
          status: task.status,
          taskType: task.taskType,
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }

      throw new ServiceUnavailableException("Task could not be deleted.", {
        cause: error,
      });
    }
  }
}
