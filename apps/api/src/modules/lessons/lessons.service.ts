import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import type { AuthUser } from "../auth/types/auth-user";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { ImportLessonsDto } from "./dto/import-lessons.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(actor: AuthUser) {
    try {
      const lessons = await this.prisma.lesson.findMany({
        where:
          actor.role === "coach"
            ? { coachId: BigInt(actor.id) }
            : actor.role === "student" && actor.coachUserId
              ? { coachId: BigInt(actor.coachUserId) }
              : undefined,
        include: {
          topics: {
            where: {
              isActive: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          sortOrder: "asc",
        },
      });

      return lessons.map((lesson) => ({
        id: lesson.id.toString(),
        name: lesson.name,
        code: lesson.code,
        gradeLevel: lesson.gradeLevel,
        color: lesson.color,
        topicCount: lesson.topics.length,
        topics: lesson.topics.map((topic) => ({
          id: topic.id.toString(),
          name: topic.name,
          gradeLevel: topic.gradeLevel,
          difficultyLevel: topic.difficultyLevel,
          estimatedMinutes: topic.estimatedMinutes,
        })),
      }));
    } catch (error) {
      throw new ServiceUnavailableException("Lessons are unavailable.", {
        cause: error,
      });
    }
  }

  async createLesson(dto: CreateLessonDto, actor: AuthUser) {
    try {
      const coachId = BigInt(actor.id);
      const code = await this.ensureUniqueCode(dto.code ?? dto.name, undefined);

      const lesson = await this.prisma.lesson.create({
        data: {
          coachId,
          name: dto.name.trim(),
          code,
          gradeLevel: dto.gradeLevel,
          color: dto.color?.trim() || null,
          icon: dto.icon?.trim() || null,
          sortOrder: dto.sortOrder ?? 0,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        action: "lesson.create",
        entityType: "lesson",
        entityId: lesson.id.toString(),
        description: `${lesson.name} dersi olusturuldu.`,
        metadata: {
          code: lesson.code,
          color: lesson.color,
        },
      });

      return {
        id: lesson.id.toString(),
        name: lesson.name,
        code: lesson.code,
        gradeLevel: lesson.gradeLevel,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Lesson could not be created.", {
        cause: error,
      });
    }
  }

  async createTopic(dto: CreateTopicDto, actor: AuthUser) {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: BigInt(dto.lessonId) },
      });

      if (!lesson) {
        throw new BadRequestException("Lesson not found.");
      }

      if (actor.role === "coach" && lesson.coachId.toString() !== actor.id) {
        throw new ForbiddenException("You can only add topics to your own lessons.");
      }

      const existing = await this.prisma.topic.findFirst({
        where: {
          lessonId: lesson.id,
          name: dto.name.trim(),
        },
      });

      if (existing) {
        throw new BadRequestException("This topic already exists for the selected lesson.");
      }

      const topic = await this.prisma.topic.create({
        data: {
          lessonId: lesson.id,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          gradeLevel: dto.gradeLevel?.trim() || null,
          difficultyLevel: dto.difficultyLevel ?? null,
          estimatedMinutes: dto.estimatedMinutes ?? null,
        },
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        action: "topic.create",
        entityType: "topic",
        entityId: topic.id.toString(),
        description: `${topic.name} konusu eklendi.`,
        metadata: {
          lessonId: lesson.id.toString(),
          lessonName: lesson.name,
        },
      });

      return {
        id: topic.id.toString(),
        lessonId: lesson.id.toString(),
        name: topic.name,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Topic could not be created.", {
        cause: error,
      });
    }
  }

  async updateLesson(id: number, dto: UpdateLessonDto, actor: AuthUser) {
    try {
      const lesson = await this.prisma.lesson.findUnique({ where: { id: BigInt(id) } });
      if (!lesson) throw new NotFoundException("Ders bulunamadı.");
      if (actor.role === "coach" && lesson.coachId.toString() !== actor.id) {
        throw new ForbiddenException("Yalnızca kendi derslerinizi düzenleyebilirsiniz.");
      }

      const updated = await this.prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.code !== undefined ? { code: await this.ensureUniqueCode(dto.code, lesson.id) } : {}),
          ...(dto.gradeLevel !== undefined ? { gradeLevel: dto.gradeLevel } : {}),
          ...(dto.color !== undefined ? { color: dto.color.trim() || null } : {}),
        },
      });

      await this.auditLogsService.log({ actorUserId: actor.id, action: "lesson.update", entityType: "lesson", entityId: lesson.id.toString(), description: `${updated.name} dersi güncellendi.` });
      return { id: updated.id.toString(), name: updated.name, code: updated.code, gradeLevel: updated.gradeLevel, color: updated.color };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException("Ders güncellenemedi.", { cause: error });
    }
  }

  async removeLesson(id: number, actor: AuthUser) {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: BigInt(id) },
        include: { _count: { select: { topics: true, tasks: true, resources: true } } },
      });
      if (!lesson) throw new NotFoundException("Ders bulunamadı.");
      if (actor.role === "coach" && lesson.coachId.toString() !== actor.id) {
        throw new ForbiddenException("Yalnızca kendi derslerinizi silebilirsiniz.");
      }
      const relatedCount = lesson._count.topics + lesson._count.tasks + lesson._count.resources;
      if (relatedCount > 0) {
        throw new BadRequestException("Bu derse bağlı konu, görev veya kaynaklar var. Veri kaybını önlemek için önce bağlı kayıtları kaldırın.");
      }
      await this.prisma.lesson.delete({ where: { id: lesson.id } });
      await this.auditLogsService.log({ actorUserId: actor.id, action: "lesson.delete", entityType: "lesson", entityId: lesson.id.toString(), description: `${lesson.name} dersi silindi.` });
      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException("Ders silinemedi.", { cause: error });
    }
  }

  async importRows(dto: ImportLessonsDto, actor: AuthUser) {
    try {
      if (!dto.rows.length) {
        throw new BadRequestException("Import file is empty.");
      }

      const coachId = BigInt(actor.id);
      let createdLessons = 0;
      let createdTopics = 0;

      for (const row of dto.rows) {
        const lessonName = row.lessonName?.trim();
        if (!lessonName) {
          continue;
        }

        let lesson = await this.prisma.lesson.findFirst({
          where: {
            coachId,
            OR: [
              { name: lessonName },
              ...(row.lessonCode?.trim()
                ? [{ code: row.lessonCode.trim() }]
                : []),
            ],
          },
        });

        if (!lesson) {
          lesson = await this.prisma.lesson.create({
            data: {
              coachId,
              name: lessonName,
