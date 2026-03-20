import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PomodoroController } from "./pomodoro.controller";
import { PomodoroService } from "./pomodoro.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [PomodoroController],
  providers: [PomodoroService],
})
export class PomodoroModule {}
