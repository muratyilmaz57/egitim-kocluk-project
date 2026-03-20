import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreatePomodoroSessionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  studentId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  taskId?: number;

  @IsDateString()
  startedAt!: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @IsInt()
  @Min(0)
  durationMinutes!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number;

  @IsIn(["focus", "break"])
  sessionType!: "focus" | "break";

  @IsOptional()
  @IsString()
  @MaxLength(30)
  deviceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
