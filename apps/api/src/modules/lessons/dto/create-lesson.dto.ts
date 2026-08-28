import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

const GRADE_LEVELS = ["8. sinif", "9. sinif", "10. sinif", "11. sinif", "12. sinif"];

export class CreateLessonDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsIn(GRADE_LEVELS)
  gradeLevel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
