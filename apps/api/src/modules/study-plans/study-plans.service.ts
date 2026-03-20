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
import { CreateStudyPlanDto } from "./dto/create-study-plan.dto";
import { UpdateStudyPlanDto } from "./dto/update-study-plan.dto";

@Injectable()
export class StudyPlansService {
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

      const plans = await this.prisma.studyPlan.findMany({
        where: {
          ...(actor.role === "coach" ? { coachId: BigInt(actor.id) } : {}),
          ...(studentId ? { studentId } : {}),
        },
        include: {
          student: true,
          tasks: true,
        },
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      });

      return plans.map((plan) => ({
        id: plan.id.toString(),
        title: plan.title,
        planType: plan.planType,
        status: plan.status,
        startDate: plan.startDate,
        endDate: plan.endDate,
        totalTargetMinutes: plan.totalTargetMinutes,
        notes: plan.notes,
        student: {
          id: plan.student.id.toString(),
          fullName: plan.student.fullName,
        },
        taskCount: plan.tasks.length,
      }));
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Study plans are unavailable.", {
        cause: error,
      });
    }
  }

  async create(dto: CreateStudyPlanDto, actor: AuthUser) {
    try {
      this.assertDateRange(dto.startDate, dto.endDate);
      const student = await this.prisma.student.findUnique({
        where: {
          id: BigInt(dto.studentId),
        },
      });

      if (!student) {
        throw new BadRequestException("Student not found.");
      }

      if (actor.role === "coach" && student.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only create plans for your own students.");
      }

      const plan = await this.prisma.studyPlan.create({
        data: {
          studentId: BigInt(dto.studentId),
          coachId: actor.role === "coach" ? BigInt(actor.id) : student.coachId,
          title: dto.title,
          planType: dto.planType,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          status: dto.status ?? "draft",
          totalTargetMinutes: dto.totalTargetMinutes ?? 0,
          notes: dto.notes,
        },
        include: {
          student: true,
          tasks: true,
        },
      });

      await this.notificationsService.createForUser({
        recipientUserId: student.userId,
        actorUserId: actor.id,
        studentId: student.id,
        type: "plan",
        title: "Yeni calisma plani hazir",
        body: `${plan.title} plani eklendi.`,
        href: "/plans",
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: student.id,
        subjectUserId: student.userId?.toString(),
        action: "study_plan.create",
        entityType: "study_plan",
        entityId: plan.id.toString(),
        description: `${plan.title} calisma plani olusturuldu.`,
        metadata: {
          planType: plan.planType,
          status: plan.status,
          startDate: plan.startDate.toISOString(),
          endDate: plan.endDate.toISOString(),
        },
      });

      return this.serializePlan(plan);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException("Study plan could not be created.", {
        cause: error,
      });
    }
  }

  async update(id: number, dto: UpdateStudyPlanDto, actor: AuthUser) {
    try {
      const existing = await this.prisma.studyPlan.findUnique({
        where: {
          id: BigInt(id),
        },
        include: {
          student: true,
          tasks: true,
        },
      });

      if (!existing) {
        throw new NotFoundException("Study plan not found.");
      }

      if (actor.role === "coach" && existing.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only update your own study plans.");
      }

      let studentId = existing.studentId;
      let coachId = existing.coachId;
      if (dto.studentId) {
        const student = await this.prisma.student.findUnique({
          where: {
            id: BigInt(dto.studentId),
          },
        });

        if (!student) {
          throw new BadRequestException("Student not found.");
        }

        if (actor.role === "coach" && student.coachId.toString() !== actor.id) {
          throw new ForbiddenException("You can only assign plans to your own students.");
        }

        studentId = student.id;
        coachId = actor.role === "coach" ? BigInt(actor.id) : student.coachId;
      }

      const nextStartDate = dto.startDate ?? existing.startDate.toISOString();
      const nextEndDate = dto.endDate ?? existing.endDate.toISOString();
      this.assertDateRange(nextStartDate, nextEndDate);

      const updated = await this.prisma.studyPlan.update({
        where: {
          id: existing.id,
        },
        data: {
          studentId,
          coachId,
          ...(dto.title ? { title: dto.title } : {}),
          ...(dto.planType ? { planType: dto.planType } : {}),
          ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
          ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
          ...(dto.status ? { status: dto.status } : {}),
          ...(typeof dto.totalTargetMinutes === "number"
            ? { totalTargetMinutes: dto.totalTargetMinutes }
            : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
        },
        include: {
          student: true,
          tasks: true,
        },
      });

      await this.notificationsService.createForUser({
        recipientUserId: updated.student.userId,
        actorUserId: actor.id,
        studentId: updated.student.id,
        type: "plan",
        title: "Calisma plani guncellendi",
        body: `${updated.title} plani guncellendi.`,
        href: "/plans",
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: updated.student.id,
        subjectUserId: updated.student.userId?.toString(),
        action: "study_plan.update",
        entityType: "study_plan",
        entityId: updated.id.toString(),
        description: `${updated.title} calisma plani guncellendi.`,
        metadata: {
          planType: updated.planType,
          status: updated.status,
          totalTargetMinutes: updated.totalTargetMinutes,
        },
      });

      return this.serializePlan(updated);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException("Study plan could not be updated.", {
        cause: error,
      });
    }
  }

  async remove(id: number, actor: AuthUser) {
    try {
      const existing = await this.prisma.studyPlan.findUnique({
        where: {
          id: BigInt(id),
        },
      });

      if (!existing) {
        throw new NotFoundException("Study plan not found.");
      }

      if (actor.role === "coach" && existing.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only delete your own study plans.");
      }

      await this.prisma.studyPlan.delete({
        where: {
          id: existing.id,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        studentId: existing.studentId,
        action: "study_plan.delete",
        entityType: "study_plan",
        entityId: existing.id.toString(),
        description: `${existing.title} calisma plani silindi.`,
        metadata: {
          status: existing.status,
          planType: existing.planType,
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }

      throw new ServiceUnavailableException("Study plan could not be deleted.", {
        cause: error,
      });
    }
  }

  private serializePlan(plan: {
    id: bigint;
    title: string;
    planType: string;
    status: string;
    startDate: Date;
    endDate: Date;
    totalTargetMinutes: number;
    notes: string | null;
    student: { id: bigint; fullName: string };
    tasks: Array<unknown>;
  }) {
    return {
      id: plan.id.toString(),
      title: plan.title,
      planType: plan.planType,
      status: plan.status,
      startDate: plan.startDate,
      endDate: plan.endDate,
      totalTargetMinutes: plan.totalTargetMinutes,
      notes: plan.notes,
      student: {
        id: plan.student.id.toString(),
        fullName: plan.student.fullName,
      },
      taskCount: plan.tasks.length,
    };
  }

  private assertDateRange(startDate: string, endDate: string) {
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      throw new BadRequestException("startDate must be before endDate.");
    }
  }
}
