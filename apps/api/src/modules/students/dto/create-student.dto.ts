import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

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
  @MaxLength(30)
  gradeLevel!: string;

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
