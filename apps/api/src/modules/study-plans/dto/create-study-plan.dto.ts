import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateStudyPlanDto {
  @IsInt()
  @Min(1)
  studentId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsIn(["daily", "weekly"])
  planType!: "daily" | "weekly";

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

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
