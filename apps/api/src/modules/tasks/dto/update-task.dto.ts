import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { TaskStatus } from "@prisma/client";

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  resourceUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  resourceFilePath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  resourceFileName?: string;

  @IsOptional()
  @IsIn(["study", "question", "video", "exam", "reading"])
  taskType?: "study" | "question" | "video" | "exam" | "reading";

  @IsOptional()
  @IsInt()
  @Min(0)
  targetQuestionCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetMinutes?: number;

  @IsOptional()
  @IsIn(["low", "medium", "high"])
  priority?: "low" | "medium" | "high";

  @IsOptional()
  @IsInt()
  @Min(1)
  lessonId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  topicId?: number;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
