import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import type { AuthUser } from "../auth/types/auth-user";
import { NotificationsService } from "../notifications/notifications.service";
import { MessagesGateway } from "./messages.gateway";
import { CreateMessageDto } from "./dto/create-message.dto";

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly messagesGateway: MessagesGateway,
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

      const messages = await this.prisma.message.findMany({
        where: {
          ...(studentId ? { studentId } : {}),
          OR: [
            { senderUserId: BigInt(actor.id) },
            { receiverUserId: BigInt(actor.id) },
          ],
        },
        include: {
          student: true,
          sender: true,
          receiver: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return messages.map((message) => ({
        id: message.id.toString(),
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
        studentId: message.studentId ? message.studentId.toString() : null,
        studentName: message.student?.fullName ?? null,
        sender: {
          id: message.sender.id.toString(),
          fullName: message.sender.fullName,
        },
        receiver: {
          id: message.receiver.id.toString(),
          fullName: message.receiver.fullName,
        },
      }));
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Messages are unavailable.", {
        cause: error,
      });
    }
  }

  async create(dto: CreateMessageDto, actor: AuthUser) {
    try {
      const receiver = await this.prisma.user.findUnique({
        where: {
          id: BigInt(dto.receiverUserId),
        },
      });

      if (!receiver) {
        throw new BadRequestException("Receiver not found.");
      }

      if (dto.studentId) {
        const student = await this.prisma.student.findUnique({
          where: { id: BigInt(dto.studentId) },
          include: {
            user: true,
            coach: true,
          },
        });

        if (!student) {
          throw new BadRequestException("Student not found.");
        }

        if (
          actor.role === "student" &&
          student.userId?.toString() !== actor.id
        ) {
          throw new ForbiddenException("Students can only message within their own profile.");
        }

        if (
          actor.role === "coach" &&
          student.coachId.toString() !== actor.id
        ) {
          throw new ForbiddenException("You can only message your own students.");
        }

        if (
          actor.role === "coach" &&
          student.userId &&
          student.userId.toString() !== dto.receiverUserId.toString()
        ) {
          throw new ForbiddenException("Coach messages must target the selected student.");
        }

        if (
          actor.role === "student" &&
          student.coachId.toString() !== dto.receiverUserId.toString()
        ) {
          throw new ForbiddenException("Students can only message their own coach.");
        }
      }

      const message = await this.prisma.message.create({
        data: {
          senderUserId: BigInt(actor.id),
          receiverUserId: BigInt(dto.receiverUserId),
          studentId: dto.studentId ? BigInt(dto.studentId) : undefined,
          messageType: "text",
          content: dto.content,
        },
        include: {
          student: true,
          sender: true,
          receiver: true,
        },
      });

      await this.notificationsService.createForUser({
        recipientUserId: dto.receiverUserId,
        actorUserId: actor.id,
        studentId: dto.studentId ?? null,
        type: "message",
        title: "Yeni mesaj var",
        body: dto.content.slice(0, 120),
        href: "/messages",
      });

      await this.auditLogsService.log({
        actorUserId: actor.id,
        subjectUserId: String(dto.receiverUserId),
        studentId: dto.studentId ? String(dto.studentId) : null,
        action: "message.create",
        entityType: "message",
        entityId: message.id.toString(),
        description: "Yeni mesaj gonderildi.",
        metadata: {
          length: dto.content.length,
          preview: dto.content.slice(0, 80),
        },
      });

      const serializedMessage = {
        id: message.id.toString(),
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
        studentId: message.studentId ? message.studentId.toString() : null,
        studentName: message.student?.fullName ?? null,
        sender: {
          id: message.sender.id.toString(),
          fullName: message.sender.fullName,
        },
        receiver: {
          id: message.receiver.id.toString(),
          fullName: message.receiver.fullName,
        },
      };

      this.messagesGateway.emitMessageCreated(serializedMessage);

      return serializedMessage;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Message could not be created.", {
        cause: error,
      });
    }
  }

  async markAllRead(actor: AuthUser, requestedStudentId?: number) {
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

      const result = await this.prisma.message.updateMany({
        where: {
          receiverUserId: BigInt(actor.id),
          isRead: false,
          ...(studentId ? { studentId } : {}),
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      if (result.count > 0) {
        this.messagesGateway.emitMessagesRead({
          userId: actor.id,
          studentId: studentId?.toString() ?? null,
        });
      }

      return {
        success: true,
        updatedCount: result.count,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ServiceUnavailableException("Messages could not be updated.", {
        cause: error,
      });
    }
  }
}
