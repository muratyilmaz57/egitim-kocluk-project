import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateTopicDto {
  @IsInt()
  @Min(1)
  lessonId!: number;

  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  gradeLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;
}
