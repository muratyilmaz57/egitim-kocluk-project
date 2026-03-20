import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateStudyPlanDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  studentId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsIn(["daily", "weekly"])
  planType?: "daily" | "weekly";

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(["draft", "active", "completed", "archived"])
  status?: "draft" | "active" | "completed" | "archived";

  @IsOptional()
  @IsInt()
  @Min(0)
  totalTargetMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
