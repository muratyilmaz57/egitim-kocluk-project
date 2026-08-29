import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../auth/types/auth-user";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(actor: AuthUser) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const trendStart = new Date(startOfDay);
    trendStart.setDate(trendStart.getDate() - 6);
    const coachFilter =
      actor.role === "coach"
        ? {
            coachId: BigInt(actor.id),
          }
        : undefined;

    try {
      const [
        totalStudents,
        totalLessons,
        completedTasksToday,
        unreadMessages,
        dailyStudyAggregate,
        activeTaskAggregate,
        todayTasks,
        studentTaskCounts,
        recentMessages,
        weeklyFocusSessions,
        taskStatusBreakdown,
        latestExams,
      ] = await Promise.all([
        this.prisma.student.count({
          where: coachFilter,
        }),
        this.prisma.lesson.count({
          where: {
            isActive: true,
            ...(coachFilter ?? {}),
          },
        }),
        this.prisma.task.count({
          where: {
            ...(coachFilter ?? {}),
            status: "completed",
            completedAt: {
              gte: startOfDay,
            },
          },
        }),
        this.prisma.message.count({
          where: {
            ...(actor.role === "coach"
              ? {
                  receiverUserId: BigInt(actor.id),
                }
              : {}),
            isRead: false,
          },
        }),
        this.prisma.pomodoroSession.aggregate({
          _sum: {
            durationMinutes: true,
          },
          where: {
            startedAt: {
              gte: startOfDay,
            },
            sessionType: "focus",
            ...(actor.role === "coach"
              ? {
                  student: {
                    coachId: BigInt(actor.id),
                  },
                }
              : {}),
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
            ...(coachFilter ?? {}),
            status: {
              in: ["pending", "in_progress", "completed"],
            },
          },
        }),
        this.prisma.task.findMany({
          where: {
            ...(coachFilter ?? {}),
            dueAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          include: {
            student: true,
          },
          orderBy: [
            { status: "asc" },
            { dueAt: "asc" },
          ],
          take: 5,
        }),
        this.prisma.student.findMany({
          where: coachFilter,
          include: {
            tasks: {
              where: {
                status: {
                  in: ["pending", "in_progress"],
                },
              },
            },
          },
          take: 5,
        }),
        this.prisma.message.findMany({
          where:
            actor.role === "coach"
              ? {
                  OR: [
                    { senderUserId: BigInt(actor.id) },
                    { receiverUserId: BigInt(actor.id) },
                  ],
                }
              : undefined,
          include: {
            student: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
        }),
        this.prisma.pomodoroSession.findMany({
          where: {
            startedAt: {
              gte: trendStart,
            },
            sessionType: "focus",
            ...(actor.role === "coach"
              ? {
                  student: {
                    coachId: BigInt(actor.id),
                  },
                }
              : {}),
          },
          select: {
            startedAt: true,
            durationMinutes: true,
          },
        }),
        this.prisma.task.groupBy({
          by: ["status"],
          _count: {
            status: true,
          },
          where: {
            ...(coachFilter ?? {}),
          },
        }),
        this.prisma.examResult.findMany({
          where:
            actor.role === "coach"
              ? {
                  coachId: BigInt(actor.id),
                }
              : undefined,
          select: {
            id: true,
            examName: true,
            examDate: true,
            totalNet: true,
            student: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: [{ examDate: "asc" }, { createdAt: "asc" }],
          take: 6,
        }),
      ]);

      const taskCount = activeTaskAggregate._count.id;
      const progressSum = activeTaskAggregate._sum.progressPercent ?? 0;
      const overallCompletionPercent =
        taskCount > 0 ? Math.round(progressSum / taskCount) : 0;
      const focusTrend = Array.from({ length: 7 }, (_, offset) => {
        const day = new Date(trendStart);
        day.setDate(trendStart.getDate() + offset);
        const dayKey = day.toISOString().slice(0, 10);
        const minutes = weeklyFocusSessions
          .filter((session) => session.startedAt.toISOString().slice(0, 10) === dayKey)
          .reduce((sum, session) => sum + session.durationMinutes, 0);

        return {
          date: dayKey,
          label: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(day),
          minutes,
        };
      });
      const taskStatusMeta = {
        pending: { label: "Bekliyor", tone: "warning" },
        in_progress: { label: "Devam", tone: "success" },
        completed: { label: "Tamamlandi", tone: "success" },
        missed: { label: "Gecikti", tone: "danger" },
      } as const;
      const statusBreakdown = taskStatusBreakdown.map((item) => ({
        status: item.status,
        label: taskStatusMeta[item.status].label,
        tone: taskStatusMeta[item.status].tone,
        count: item._count.status,
      }));
      const examTrend = latestExams.map((exam) => ({
        id: exam.id.toString(),
        label: new Intl.DateTimeFormat("tr-TR", {
          day: "2-digit",
          month: "2-digit",
        }).format(exam.examDate),
        examName: exam.examName,
        studentName: exam.student.fullName,
        totalNet: Number(exam.totalNet),
      }));

      return {
        summary: {
          totalStudents,
          totalLessons,
          completedTasksToday,
          dailyStudyMinutes: dailyStudyAggregate._sum.durationMinutes ?? 0,
          unreadMessages,
          overallCompletionPercent,
          upcomingMeetings: 0,
        },
        todayTasks: todayTasks.map((task) => ({
          id: task.id.toString(),
          title: task.title,
          meta: `${task.student.fullName} | ${task.targetMinutes || task.targetQuestionCount || 0} ${
            task.targetMinutes ? "dk" : "hedef"
          }`,
          status: task.status,
          progressPercent: task.progressPercent,
          dueAt: task.dueAt,
        })),
        riskStudents: studentTaskCounts
          .map((student) => {
            const openTasks = student.tasks.length;
            const avgProgress =
              openTasks > 0
                ? Math.round(
                    student.tasks.reduce((sum, task) => sum + task.progressPercent, 0) /
                      openTasks,
                  )
                : 100;

            return {
              id: student.id.toString(),
              fullName: student.fullName,
              gradeLevel: student.gradeLevel,
              openTasks,
              avgProgress,
            };
          })
          .sort((a, b) => a.avgProgress - b.avgProgress || b.openTasks - a.openTasks)
          .slice(0, 3),
        recentMessages: recentMessages.map((message) => ({
          id: message.id.toString(),
          content: message.content,
          isRead: message.isRead,
          studentName: message.student?.fullName ?? "Genel sohbet",
          createdAt: message.createdAt,
        })),
        focusTrend,
        taskStatusBreakdown: statusBreakdown,
        examTrend,
      };
    } catch {
      return {
        summary: {
          totalStudents: 0,
          totalLessons: 0,
          completedTasksToday: 0,
          dailyStudyMinutes: 0,
          unreadMessages: 0,
          overallCompletionPercent: 0,
          upcomingMeetings: 0,
        },
        todayTasks: [],
        riskStudents: [],
        recentMessages: [],
        focusTrend: [],
        taskStatusBreakdown: [],
        examTrend: [],
        dataSource: "database_unavailable",
      };
    }
  }

  async getActivity(actor: AuthUser) {
    const coachId = actor.role === "coach" ? BigInt(actor.id) : undefined;
    const studentId =
      actor.role === "student" && actor.studentProfileId
        ? BigInt(actor.studentProfileId)
        : undefined;

    const studentWhere =
      actor.role === "student"
        ? { id: studentId }
        : coachId
          ? { coachId }
          : undefined;

    try {
      const [tasks, exams, messages, notes, studyPlans, pomodoros] = await Promise.all([
        this.prisma.task.findMany({
          where: {
            ...(studentId ? { studentId } : {}),
            ...(coachId ? { coachId } : {}),
          },
          include: {
            student: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 12,
        }),
        this.prisma.examResult.findMany({
          where: {
            ...(studentId ? { studentId } : {}),
            ...(coachId ? { coachId } : {}),
          },
          include: {
            student: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        }),
        this.prisma.message.findMany({
          where:
            actor.role === "student"
              ? {
                  studentId,
                }
              : actor.role === "coach"
                ? {
                    OR: [
                      { senderUserId: BigInt(actor.id) },
                      { receiverUserId: BigInt(actor.id) },
                    ],
                  }
                : undefined,
          include: {
            student: true,
            sender: true,
            receiver: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 12,
        }),
        this.prisma.note.findMany({
          where: {
            ...(studentId ? { studentId } : {}),
            ...(coachId ? { coachId } : {}),
            ...(actor.role === "student" ? { visibility: "student_visible" } : {}),
          },
          include: {
            student: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        }),
        this.prisma.studyPlan.findMany({
          where: {
            ...(studentId ? { studentId } : {}),
            ...(coachId ? { coachId } : {}),
          },
          include: {
            student: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 10,
        }),
        this.prisma.pomodoroSession.findMany({
          where: {
            ...(studentId ? { studentId } : {}),
            ...(coachId
              ? {
                  student: {
                    coachId,
                  },
                }
              : {}),
          },
          include: {
            student: true,
          },
          orderBy: {
            startedAt: "desc",
          },
          take: 12,
        }),
      ]);

      const items = [
        ...tasks.map((task) => ({
          id: `task-${task.id.toString()}`,
          type: "task",
          occurredAt: task.updatedAt,
          title:
            task.status === "completed"
              ? "Gorev tamamlandi"
              : "Gorev guncellendi",
          description: `${task.student.fullName} | ${task.title}`,
          tone:
            task.status === "completed"
              ? "success"
              : task.status === "in_progress"
                ? "warning"
                : "neutral",
          href:
            actor.role === "student"
              ? `/students/${task.student.id.toString()}/tasks`
              : `/students/${task.student.id.toString()}/tasks`,
          studentName: task.student.fullName,
        })),
        ...exams.map((exam) => ({
          id: `exam-${exam.id.toString()}`,
          type: "exam",
          occurredAt: exam.createdAt,
          title: "Deneme sonucu eklendi",
          description: `${exam.student.fullName} | ${exam.examName} | ${Number(exam.totalNet)} net`,
          tone: "success",
          href: `/students/${exam.student.id.toString()}/exams`,
          studentName: exam.student.fullName,
        })),
        ...messages.map((message) => ({
          id: `message-${message.id.toString()}`,
          type: "message",
          occurredAt: message.createdAt,
          title: message.isRead ? "Mesaj kaydi" : "Yeni mesaj",
          description: `${message.sender.fullName} → ${message.receiver.fullName} | ${message.content}`,
          tone: message.isRead ? "neutral" : "warning",
          href: message.studentId
            ? `/students/${message.studentId.toString()}/messages`
            : "/messages",
          studentName: message.student?.fullName ?? "Genel",
        })),
        ...notes.map((note) => ({
          id: `note-${note.id.toString()}`,
          type: "note",
          occurredAt: note.createdAt,
          title: "Koç notu eklendi",
          description: `${note.student?.fullName ?? "Koç takvimi"} | ${note.title}`,
          tone: "neutral",
          href: "/agenda",
          studentName: note.student?.fullName ?? "Koç takvimi",
        })),
        ...studyPlans.map((plan) => ({
          id: `plan-${plan.id.toString()}`,
          type: "plan",
          occurredAt: plan.updatedAt,
          title: "Calisma plani guncellendi",
          description: `${plan.student.fullName} | ${plan.title}`,
          tone: plan.status === "completed" ? "success" : "warning",
          href: `/students/${plan.student.id.toString()}/plans`,
          studentName: plan.student.fullName,
        })),
        ...pomodoros.map((session) => ({
          id: `pomodoro-${session.id.toString()}`,
          type: "pomodoro",
          occurredAt: session.startedAt,
          title: "Pomodoro oturumu kaydedildi",
          description: `${session.student.fullName} | ${session.durationMinutes} dk odak`,
          tone: "success",
          href: `/students/${session.student.id.toString()}/pomodoro`,
          studentName: session.student.fullName,
        })),
      ]
        .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
        .slice(0, 30);

      const counts = items.reduce<Record<string, number>>((acc, item) => {
        acc[item.type] = (acc[item.type] ?? 0) + 1;
        return acc;
      }, {});

      const studentCount =
        actor.role === "student"
          ? studentId
            ? 1
            : 0
          : await this.prisma.student.count({
              where: studentWhere,
            });

      return {
        items: items.map((item) => ({
          ...item,
          occurredAt: item.occurredAt,
        })),
        summary: {
          totalItems: items.length,
          trackedStudents: studentCount,
          unreadMessages: counts.message ?? 0,
          completedTasks: counts.task ?? 0,
        },
      };
    } catch {
      return {
        items: [],
        summary: {
          totalItems: 0,
          trackedStudents: 0,
          unreadMessages: 0,
          completedTasks: 0,
        },
      };
    }
  }
}
