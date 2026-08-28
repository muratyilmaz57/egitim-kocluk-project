import {
  IsDateString,
  IsEmail,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

const GRADE_LEVELS = ["8. sinif", "9. sinif", "10. sinif", "11. sinif", "12. sinif"];

export class CreateStudentDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  coachId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(GRADE_LEVELS)
  @MaxLength(30)
  gradeLevel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  targetExam?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  parentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  parentPhone?: string;

  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @IsDateString()
  enrollmentDate!: string;
}
