import { ResourceType } from "@prisma/client";
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateResourceDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  lessonId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  topicId?: number;

  @IsEnum(ResourceType)
  resourceType!: ResourceType;

  @IsString()
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsString()
  @IsIn(["8. sinif", "9. sinif", "10. sinif", "11. sinif", "12. sinif"])
  targetGradeLevel?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
