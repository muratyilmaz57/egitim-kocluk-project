import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class UpdatePomodoroSessionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  taskId?: number;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number;

  @IsOptional()
  @IsIn(["focus", "break"])
  sessionType?: "focus" | "break";

  @IsOptional()
  @IsString()
  @MaxLength(30)
  deviceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
