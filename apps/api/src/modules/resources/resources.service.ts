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
import { CreateResourceDto } from "./dto/create-resource.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(actor: AuthUser) {
    try {
      let where:
        | {
            coachId?: bigint;
            OR?: Array<{ targetGradeLevel: string | null }>;
          }
        | undefined;

      if (actor.role === "student") {
        if (!actor.studentProfileId || !actor.coachUserId) {
          throw new ForbiddenException("Student profile is not linked.");
        }

        const student = await this.prisma.student.findUnique({
          where: {
            id: BigInt(actor.studentProfileId),
          },
        });

        if (!student) {
          throw new ForbiddenException("Student profile is not linked.");
        }

        where = {
          coachId: BigInt(actor.coachUserId),
          OR: [{ targetGradeLevel: null }, { targetGradeLevel: student.gradeLevel }],
        };
      } else if (actor.role === "coach") {
        where = {
          coachId: BigInt(actor.id),
        };
      }

      const resources = await this.prisma.resource.findMany({
        where,
        include: {
          lesson: true,
          topic: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return resources.map((resource) => ({
        id: resource.id.toString(),
        title: resource.title,
        description: resource.description,
        resourceType: resource.resourceType,
        url: resource.url,
        filePath: resource.filePath,
        lessonId: resource.lessonId ? resource.lessonId.toString() : null,
        topicId: resource.topicId ? resource.topicId.toString() : null,
        targetGradeLevel: resource.targetGradeLevel,
        lessonName: resource.lesson?.name ?? null,
        topicName: resource.topic?.name ?? null,
        isFeatured: resource.isFeatured,
      }));
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Resources are unavailable.", {
        cause: error,
      });
    }
  }

  async create(dto: CreateResourceDto, actor: AuthUser) {
    try {
      if (dto.lessonId) {
        const lesson = await this.prisma.lesson.findUnique({
          where: {
            id: BigInt(dto.lessonId),
          },
        });

        if (!lesson) {
          throw new BadRequestException("Lesson not found.");
        }

        if (actor.role === "coach" && lesson.coachId.toString() !== actor.id) {
          throw new ForbiddenException("You can only attach resources to your own lessons.");
        }
      }

      const resource = await this.prisma.resource.create({
        data: {
          coachId: BigInt(actor.id),
          lessonId: dto.lessonId ? BigInt(dto.lessonId) : undefined,
          topicId: dto.topicId ? BigInt(dto.topicId) : undefined,
          resourceType: dto.resourceType,
          title: dto.title,
          description: dto.description,
          url: dto.url,
          filePath: dto.filePath,
          targetGradeLevel: dto.targetGradeLevel,
          isFeatured: dto.isFeatured ?? false,
        },
        include: {
          lesson: true,
          topic: true,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        action: "resource.create",
        entityType: "resource",
        entityId: resource.id.toString(),
        description: `${resource.title} kaynagi olusturuldu.`,
        metadata: {
          resourceType: resource.resourceType,
          targetGradeLevel: resource.targetGradeLevel,
          hasFile: Boolean(resource.filePath),
        },
      });

      return {
        id: resource.id.toString(),
        title: resource.title,
        description: resource.description,
        resourceType: resource.resourceType,
        url: resource.url,
        filePath: resource.filePath,
        lessonId: resource.lessonId ? resource.lessonId.toString() : null,
        topicId: resource.topicId ? resource.topicId.toString() : null,
        targetGradeLevel: resource.targetGradeLevel,
        lessonName: resource.lesson?.name ?? null,
        topicName: resource.topic?.name ?? null,
        isFeatured: resource.isFeatured,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Resource could not be created.", {
        cause: error,
      });
    }
  }

  async update(id: number, dto: UpdateResourceDto, actor: AuthUser) {
    try {
      const resource = await this.prisma.resource.findUnique({
        where: {
          id: BigInt(id),
        },
        include: {
          lesson: true,
          topic: true,
        },
      });

      if (!resource) {
        throw new NotFoundException("Resource not found.");
      }

      if (actor.role === "coach" && resource.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only update your own resources.");
      }

      const updated = await this.prisma.resource.update({
        where: {
          id: resource.id,
        },
        data: {
          ...(dto.resourceType ? { resourceType: dto.resourceType } : {}),
          ...(dto.title ? { title: dto.title } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.url !== undefined ? { url: dto.url } : {}),
          ...(dto.filePath !== undefined ? { filePath: dto.filePath || null } : {}),
          ...(dto.targetGradeLevel !== undefined
            ? { targetGradeLevel: dto.targetGradeLevel || null }
            : {}),
          ...(typeof dto.isFeatured === "boolean" ? { isFeatured: dto.isFeatured } : {}),
        },
        include: {
          lesson: true,
          topic: true,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        action: "resource.update",
        entityType: "resource",
        entityId: updated.id.toString(),
        description: `${updated.title} kaynagi guncellendi.`,
        metadata: {
          resourceType: updated.resourceType,
          targetGradeLevel: updated.targetGradeLevel,
          hasFile: Boolean(updated.filePath),
        },
      });

      return {
        id: updated.id.toString(),
        title: updated.title,
        description: updated.description,
        resourceType: updated.resourceType,
        url: updated.url,
        filePath: updated.filePath,
        lessonId: updated.lessonId ? updated.lessonId.toString() : null,
        topicId: updated.topicId ? updated.topicId.toString() : null,
        targetGradeLevel: updated.targetGradeLevel,
        lessonName: updated.lesson?.name ?? null,
        topicName: updated.topic?.name ?? null,
        isFeatured: updated.isFeatured,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Resource could not be updated.", {
        cause: error,
      });
    }
  }

  async remove(id: number, actor: AuthUser) {
    try {
      const resource = await this.prisma.resource.findUnique({
        where: {
          id: BigInt(id),
        },
      });

      if (!resource) {
        throw new NotFoundException("Resource not found.");
      }

      if (actor.role === "coach" && resource.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only delete your own resources.");
      }

      await this.prisma.resource.delete({
        where: {
          id: resource.id,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        action: "resource.delete",
        entityType: "resource",
        entityId: resource.id.toString(),
        description: `${resource.title} kaynagi silindi.`,
        metadata: {
          resourceType: resource.resourceType,
          targetGradeLevel: resource.targetGradeLevel,
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Resource could not be deleted.", {
        cause: error,
      });
    }
  }
}
