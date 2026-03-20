import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  schoolName?: string;

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

  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @IsOptional()
  @IsIn(["active", "paused", "graduated"])
  status?: "active" | "paused" | "graduated";
}
