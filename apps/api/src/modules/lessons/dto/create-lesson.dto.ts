import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateLessonDto {
  @IsString()
  @MaxLength(100)
  name!: string;

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
