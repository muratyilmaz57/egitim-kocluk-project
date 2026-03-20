import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../auth/types/auth-user";

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
