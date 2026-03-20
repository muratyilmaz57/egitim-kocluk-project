import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { StudyPlansController } from "./study-plans.controller";
import { StudyPlansService } from "./study-plans.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [StudyPlansController],
  providers: [StudyPlansService],
})
export class StudyPlansModule {}
