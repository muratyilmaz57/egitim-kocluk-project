import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    const columns = await this.$queryRawUnsafe<Array<{ IS_NULLABLE: string }>>(
      "SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notes' AND COLUMN_NAME = 'student_id' LIMIT 1",
    );
    if (columns[0]?.IS_NULLABLE === "NO") {
      await this.$executeRawUnsafe(
        "ALTER TABLE `notes` MODIFY `student_id` BIGINT UNSIGNED NULL",
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
