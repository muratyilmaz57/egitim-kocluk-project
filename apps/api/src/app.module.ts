import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { AuthModule } from "./modules/auth/auth.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ExamsModule } from "./modules/exams/exams.module";
import { LessonsModule } from "./modules/lessons/lessons.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { NotesModule } from "./modules/notes/notes.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PomodoroModule } from "./modules/pomodoro/pomodoro.module";
import { ResourcesModule } from "./modules/resources/resources.module";
import { StudentsModule } from "./modules/students/students.module";
import { StudyPlansModule } from "./modules/study-plans/study-plans.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(process.cwd(), "../../.env"), resolve(process.cwd(), ".env")],
    }),
    PrismaModule,
    AuditLogsModule,
    AuthModule,
    DashboardModule,
    StudentsModule,
    TasksModule,
    ExamsModule,
    LessonsModule,
    StudyPlansModule,
    PomodoroModule,
    MessagesModule,
    NotificationsModule,
    ResourcesModule,
    NotesModule,
  ],
})
export class AppModule {}
