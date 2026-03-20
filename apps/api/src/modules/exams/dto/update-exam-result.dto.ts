import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { ExamType } from "@prisma/client";

export class UpdateExamResultDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  examName?: string;

  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @IsOptional()
  @IsDateString()
  examDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  correctCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  wrongCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  blankCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalNet?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
