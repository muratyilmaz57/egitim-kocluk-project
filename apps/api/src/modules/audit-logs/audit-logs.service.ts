import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../auth/types/auth-user";

type AuditLogInput = {
  actorUserId?: string | bigint | null;
  subjectUserId?: string | bigint | null;
  studentId?: string | bigint | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Prisma.InputJsonValue | null;
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: this.toBigInt(input.actorUserId),
          subjectUserId: this.toBigInt(input.subjectUserId),
          studentId: this.toBigInt(input.studentId),
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          description: input.description,
          metadata: input.metadata ?? undefined,
        },
      });
    } catch (error) {
      console.warn("Audit log write failed", error);
    }
  }

  async findForActor(actor: AuthUser, limit = 25) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const actorId = BigInt(actor.id);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { actorUserId: actorId },
          { subjectUserId: actorId },
        ],
      },
      include: {
        actorUser: true,
        subjectUser: true,
        student: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: safeLimit,
    });

    return logs.map((log) => ({
      id: log.id.toString(),
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      description: log.description,
      metadata: log.metadata,
      createdAt: log.createdAt,
      actorName: log.actorUser?.fullName ?? null,
      subjectName: log.subjectUser?.fullName ?? null,
      studentName: log.student?.fullName ?? null,
    }));
  }

  private toBigInt(value?: string | bigint | null) {
    if (value === undefined || value === null) {
      return undefined;
    }

    return typeof value === "bigint" ? value : BigInt(value);
  }
}
