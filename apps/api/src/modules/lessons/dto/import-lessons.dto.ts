import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ImportLessonRowDto {
  @IsString()
  @MaxLength(100)
  lessonName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  lessonCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  lessonColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  topicName?: string;

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

export class ImportLessonsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportLessonRowDto)
  rows!: ImportLessonRowDto[];
}
