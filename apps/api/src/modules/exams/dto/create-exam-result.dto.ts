import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateExamResultDto {
  @IsInt()
  @Min(1)
  studentId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  examName!: string;

  @IsIn(["LGS", "TYT", "AYT", "school", "mock"])
  examType!: "LGS" | "TYT" | "AYT" | "school" | "mock";

  @IsDateString()
  examDate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsInt()
  @Min(0)
  correctCount!: number;

  @IsInt()
  @Min(0)
  wrongCount!: number;

  @IsInt()
  @Min(0)
  blankCount!: number;

  @IsNumber()
  totalNet!: number;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rankInGroup?: number;

  @IsOptional()
  lessonBreakdown?: Record<string, unknown>;

  @IsOptional()
  incorrectTopics?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
