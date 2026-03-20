import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateTaskDto {
  @IsInt()
  @Min(1)
  studentId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  studyPlanId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  lessonId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  topicId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsIn(["study", "question", "video", "exam", "reading"])
  taskType!: "study" | "question" | "video" | "exam" | "reading";

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetQuestionCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetMinutes?: number;

  @IsIn(["low", "medium", "high"])
  priority!: "low" | "medium" | "high";

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
