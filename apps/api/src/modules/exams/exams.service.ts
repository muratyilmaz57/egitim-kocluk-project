import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import type { AuthUser } from "../auth/types/auth-user";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateExamResultDto } from "./dto/create-exam-result.dto";
import { UpdateExamResultDto } from "./dto/update-exam-result.dto";

@Injectable()
export class ExamsService {
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

      const exams = await this.prisma.examResult.findMany({
        where: {
          studentId: resolvedStudentId ?? undefined,
          ...(actor.role === "coach"
            ? { coachId: BigInt(actor.id) }
            : {}),
        },
        include: {
          student: true,
        },
        orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
      });

      return exams.map((exam) => ({
        id: exam.id.toString(),
        examName: exam.examName,
        examType: exam.examType,
        examDate: exam.examDate,
        totalNet: Number(exam.totalNet),
        score: exam.score ? Number(exam.score) : null,
        correctCount: exam.correctCount,
        wrongCount: exam.wrongCount,
        blankCount: exam.blankCount,
        rankInGroup: exam.rankInGroup,
        notes: exam.notes,
        student: {
          id: exam.student.id.toString(),
          fullName: exam.student.fullName,
          gradeLevel: exam.student.gradeLevel,
        },
      }));
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Exam results are unavailable.", {
        cause: error,
      });
    }
  }

  async create(dto: CreateExamResultDto, actor: AuthUser) {
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
        throw new ForbiddenException("You can only create exam results for your own students.");
      }

      const exam = await this.prisma.examResult.create({
        data: {
          studentId: BigInt(dto.studentId),
          coachId: actor.role === "coach" ? BigInt(actor.id) : student.coachId,
          examName: dto.examName,
          examType: dto.examType,
          examDate: new Date(dto.examDate),
          durationMinutes: dto.durationMinutes,
          correctCount: dto.correctCount,
          wrongCount: dto.wrongCount,
          blankCount: dto.blankCount,
          totalNet: dto.totalNet,
          score: dto.score,
          rankInGroup: dto.rankInGroup,
          lessonBreakdown: dto.lessonBreakdown as Prisma.InputJsonValue | undefined,
          incorrectTopics: dto.incorrectTopics as Prisma.InputJsonValue | undefined,
          notes: dto.notes,
        },
      });

      await this.notificationsService.createForUser({
        recipientUserId: student.userId,
        actorUserId: actor.id,
        studentId: student.id,
        type: "exam",
        title: "Yeni deneme sonucu eklendi",
        body: `${exam.examName} icin ${Number(exam.totalNet)} net kaydedildi.`,
        href: "/exams",
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: student.id,
        subjectUserId: student.userId?.toString(),
        action: "exam.create",
        entityType: "exam_result",
        entityId: exam.id.toString(),
        description: `${exam.examName} deneme sonucu kaydedildi.`,
        metadata: {
          examType: exam.examType,
          totalNet: Number(exam.totalNet),
          examDate: exam.examDate.toISOString(),
        },
      });

      return {
        id: exam.id.toString(),
        examName: exam.examName,
        examType: exam.examType,
        examDate: exam.examDate,
        totalNet: Number(exam.totalNet),
        score: exam.score ? Number(exam.score) : null,
        student: {
          id: student.id.toString(),
          fullName: student.fullName,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Exam result could not be created.", {
        cause: error,
      });
    }
  }

  async update(id: number, dto: UpdateExamResultDto, actor: AuthUser) {
    try {
      const exam = await this.prisma.examResult.findUnique({
        where: {
          id: BigInt(id),
        },
        include: {
          student: true,
        },
      });

      if (!exam) {
        throw new NotFoundException("Exam result not found.");
      }

      if (actor.role === "coach" && exam.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only update your own exam results.");
      }

      const updated = await this.prisma.examResult.update({
        where: {
          id: exam.id,
        },
        data: {
          ...(dto.examName ? { examName: dto.examName } : {}),
          ...(dto.examType ? { examType: dto.examType } : {}),
          ...(dto.examDate ? { examDate: new Date(dto.examDate) } : {}),
          ...(typeof dto.correctCount === "number" ? { correctCount: dto.correctCount } : {}),
          ...(typeof dto.wrongCount === "number" ? { wrongCount: dto.wrongCount } : {}),
          ...(typeof dto.blankCount === "number" ? { blankCount: dto.blankCount } : {}),
          ...(typeof dto.totalNet === "number" ? { totalNet: dto.totalNet } : {}),
          ...(typeof dto.score === "number" ? { score: dto.score } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
        },
        include: {
          student: true,
        },
      });

      await this.notificationsService.createForUser({
        recipientUserId: updated.student.userId,
        actorUserId: actor.id,
        studentId: updated.student.id,
        type: "exam",
        title: "Deneme sonucu guncellendi",
        body: `${updated.examName} sonucu revize edildi.`,
        href: "/exams",
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: updated.student.id,
        subjectUserId: updated.student.userId?.toString(),
        action: "exam.update",
        entityType: "exam_result",
        entityId: updated.id.toString(),
        description: `${updated.examName} deneme sonucu guncellendi.`,
        metadata: {
          examType: updated.examType,
          totalNet: Number(updated.totalNet),
          score: updated.score ? Number(updated.score) : null,
        },
      });

      return {
        id: updated.id.toString(),
        examName: updated.examName,
        examType: updated.examType,
        examDate: updated.examDate,
        totalNet: Number(updated.totalNet),
        score: updated.score ? Number(updated.score) : null,
        correctCount: updated.correctCount,
        wrongCount: updated.wrongCount,
        blankCount: updated.blankCount,
        notes: updated.notes,
        student: {
          id: updated.student.id.toString(),
          fullName: updated.student.fullName,
        },
      };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }

      throw new ServiceUnavailableException("Exam result could not be updated.", {
        cause: error,
      });
    }
  }

  async remove(id: number, actor: AuthUser) {
    try {
      const exam = await this.prisma.examResult.findUnique({
        where: {
          id: BigInt(id),
        },
      });

      if (!exam) {
        throw new NotFoundException("Exam result not found.");
      }

      if (actor.role === "coach" && exam.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only delete your own exam results.");
      }

      await this.prisma.examResult.delete({
        where: {
          id: exam.id,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: exam.studentId,
        action: "exam.delete",
        entityType: "exam_result",
        entityId: exam.id.toString(),
        description: `${exam.examName} deneme sonucu silindi.`,
        metadata: {
          examType: exam.examType,
          totalNet: Number(exam.totalNet),
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }

      throw new ServiceUnavailableException("Exam result could not be deleted.", {
        cause: error,
      });
    }
  }
}
