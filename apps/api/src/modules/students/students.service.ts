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
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(actor: AuthUser) {
    try {
      const students = await this.prisma.student.findMany({
        where:
          actor.role === "coach"
            ? {
                coachId: BigInt(actor.id),
              }
            : undefined,
        include: {
          tasks: {
            where: {
              status: {
                in: ["pending", "in_progress", "completed"],
              },
            },
          },
          examResults: {
            orderBy: {
              examDate: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });

      return students.map((student) => this.toStudentSummary(student));
    } catch (error) {
      throw new ServiceUnavailableException(
        "Student data is unavailable until the database connection is configured.",
        { cause: error },
      );
    }
  }

  async findOne(id: number, actor: AuthUser) {
    try {
      const studentId = BigInt(id);
      const student = await this.prisma.student.findUnique({
        where: {
          id: studentId,
        },
        include: {
          tasks: {
            include: {
              lesson: true,
              topic: true,
            },
            orderBy: [
              { status: "asc" },
              { dueAt: "asc" },
            ],
            take: 5,
          },
          notes: {
            orderBy: {
              createdAt: "desc",
            },
            take: 3,
          },
          examResults: {
            orderBy: {
              examDate: "desc",
            },
            take: 6,
          },
        },
      });

      if (!student) {
        throw new NotFoundException(`Student ${id} was not found.`);
      }

      if (actor.role === "coach" && student.coachId.toString() !== actor.id) {
        throw new ForbiddenException("Coaches can only access their own students.");
      }

      if (actor.role === "student" && student.userId?.toString() !== actor.id) {
        throw new ForbiddenException("Students can only access their own profile.");
      }

      const [focusAggregate, unreadMessageCount, taskAggregate] = await Promise.all([
        this.prisma.pomodoroSession.aggregate({
          _sum: {
            durationMinutes: true,
          },
          where: {
            studentId,
            sessionType: "focus",
          },
        }),
        this.prisma.message.count({
          where: {
            studentId,
            isRead: false,
          },
        }),
        this.prisma.task.aggregate({
          _count: {
            id: true,
          },
          _sum: {
            progressPercent: true,
          },
          where: {
            studentId,
            status: {
              in: ["pending", "in_progress", "completed"],
            },
          },
        }),
      ]);

      const examTrend = student.examResults.map((exam) => ({
        id: exam.id.toString(),
        examName: exam.examName,
        examDate: exam.examDate,
        totalNet: Number(exam.totalNet),
      }));
      const latestExam = student.examResults[0];
      const weakTopics = Array.isArray(latestExam?.incorrectTopics)
        ? latestExam.incorrectTopics.map((topic, index) => ({
            id: `${latestExam.id.toString()}-${index}`,
            topicName: String(topic),
            priority: index === 0 ? 1 : 2,
          }))
        : [];
      const taskCount = taskAggregate._count.id;
      const completionPercent =
        taskCount > 0
          ? Math.round((taskAggregate._sum.progressPercent ?? 0) / taskCount)
          : 0;

      return {
        ...this.toStudentSummary(student),
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        schoolName: student.schoolName,
        enrollmentDate: student.enrollmentDate,
        stats: {
          completionPercent,
          totalFocusMinutes: focusAggregate._sum.durationMinutes ?? 0,
          latestExamNet: latestExam ? Number(latestExam.totalNet) : 0,
          missingTopicCount: weakTopics.length,
          unreadMessageCount,
        },
        tasks: student.tasks.map((task) => ({
          id: task.id.toString(),
          title: task.title,
          lessonName: task.lesson?.name ?? null,
          topicName: task.topic?.name ?? null,
          progressPercent: task.progressPercent,
          status: task.status,
          targetMinutes: task.targetMinutes,
          targetQuestionCount: task.targetQuestionCount,
        })),
        notes: student.notes.map((note) => ({
          id: note.id.toString(),
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
        })),
        examTrend,
        weakTopics,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        "Student profile is unavailable until the database connection is configured.",
        { cause: error },
      );
    }
  }

  async create(dto: CreateStudentDto, actor: AuthUser) {
    try {
      const coachId =
        actor.role === "coach"
          ? BigInt(actor.id)
          : dto.coachId
            ? BigInt(dto.coachId)
            : null;

      if (!coachId) {
        throw new BadRequestException("coachId is required when an admin creates a student.");
      }

      const created = await this.prisma.student.create({
        data: {
          coachId,
          studentCode: this.generateStudentCode(dto.fullName),
          fullName: dto.fullName,
          gradeLevel: dto.gradeLevel,
          targetExam: dto.targetExam,
          parentName: dto.parentName,
          parentPhone: dto.parentPhone,
          parentEmail: dto.parentEmail,
          enrollmentDate: new Date(dto.enrollmentDate),
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: created.id,
        action: "student.create",
        entityType: "student",
        entityId: created.id.toString(),
        description: `${created.fullName} ogrencisi olusturuldu.`,
        metadata: {
          gradeLevel: created.gradeLevel,
          targetExam: created.targetExam,
        },
      });

      return this.toStudentSummary(created);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        "Student could not be created until the database connection is configured.",
        { cause: error },
      );
    }
  }

  async update(id: number, dto: UpdateStudentDto, actor: AuthUser) {
    try {
      const student = await this.prisma.student.findUnique({
        where: {
          id: BigInt(id),
        },
      });

      if (!student) {
        throw new NotFoundException(`Student ${id} was not found.`);
      }

      if (actor.role === "coach" && student.coachId.toString() !== actor.id) {
        throw new ForbiddenException("Coaches can only update their own students.");
      }

      const updated = await this.prisma.student.update({
        where: {
          id: student.id,
        },
        data: {
          ...(dto.fullName ? { fullName: dto.fullName } : {}),
          ...(dto.gradeLevel ? { gradeLevel: dto.gradeLevel } : {}),
          ...(dto.schoolName !== undefined ? { schoolName: dto.schoolName || null } : {}),
          ...(dto.targetExam !== undefined ? { targetExam: dto.targetExam || null } : {}),
          ...(dto.parentName !== undefined ? { parentName: dto.parentName || null } : {}),
          ...(dto.parentPhone !== undefined ? { parentPhone: dto.parentPhone || null } : {}),
          ...(dto.parentEmail !== undefined ? { parentEmail: dto.parentEmail || null } : {}),
          ...(dto.enrollmentDate ? { enrollmentDate: new Date(dto.enrollmentDate) } : {}),
          ...(dto.status ? { status: dto.status } : {}),
        },
        include: {
          tasks: {
            where: {
              status: {
                in: ["pending", "in_progress", "completed"],
              },
            },
          },
          examResults: {
            orderBy: {
              examDate: "desc",
            },
            take: 1,
          },
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: updated.id,
        subjectUserId: updated.userId?.toString(),
        action: "student.update",
        entityType: "student",
        entityId: updated.id.toString(),
        description: `${updated.fullName} ogrencisi guncellendi.`,
        metadata: {
          status: updated.status,
          gradeLevel: updated.gradeLevel,
        },
      });

      return this.toStudentSummary(updated);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Student could not be updated.", {
        cause: error,
      });
    }
  }

  async remove(id: number, actor: AuthUser) {
    try {
      const student = await this.prisma.student.findUnique({
        where: {
          id: BigInt(id),
        },
      });

      if (!student) {
        throw new NotFoundException(`Student ${id} was not found.`);
      }

      if (actor.role === "coach" && student.coachId.toString() !== actor.id) {
        throw new ForbiddenException("Coaches can only delete their own students.");
      }

      await this.prisma.student.delete({
        where: {
          id: student.id,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: student.id,
        subjectUserId: student.userId?.toString(),
        action: "student.delete",
        entityType: "student",
        entityId: student.id.toString(),
        description: `${student.fullName} ogrencisi silindi.`,
        metadata: {
          gradeLevel: student.gradeLevel,
          status: student.status,
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Student could not be deleted.", {
        cause: error,
      });
    }
  }

  private toStudentSummary(student: {
    id: bigint;
    userId?: bigint | null;
    fullName: string;
    gradeLevel: string;
    parentName?: string | null;
    targetExam: string | null;
    status: string;
    tasks?: Array<{ progressPercent: number }>;
    examResults?: Array<{ totalNet: unknown }>;
  }) {
    const activeTasks = student.tasks ?? [];
    const overallProgress =
      activeTasks.length > 0
        ? Math.round(
            activeTasks.reduce((sum, task) => sum + task.progressPercent, 0) /
              activeTasks.length,
          )
        : 0;

    return {
      id: student.id.toString(),
      userId: student.userId ? student.userId.toString() : null,
      fullName: student.fullName,
      gradeLevel: student.gradeLevel,
      parentName: student.parentName ?? null,
      targetExam: student.targetExam,
      status: student.status,
      overallProgress,
      latestExamNet:
        student.examResults && student.examResults[0]
          ? Number(student.examResults[0].totalNet)
          : null,
    };
  }

  private generateStudentCode(fullName: string) {
    const normalized = fullName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

    return `${normalized || "STD"}-${Date.now().toString().slice(-6)}`;
  }
}
