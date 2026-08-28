import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const GRADE_LEVELS = ["8. sinif", "9. sinif", "10. sinif", "11. sinif", "12. sinif"];

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @IsOptional()
  @IsString()
  @IsIn(GRADE_LEVELS)
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
