import { ResourceType } from "@prisma/client";
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateResourceDto {
  @IsOptional()
  @IsEnum(ResourceType)
  resourceType?: ResourceType;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

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
  @IsIn(["", "8. sinif", "9. sinif", "10. sinif", "11. sinif", "12. sinif"])
  targetGradeLevel?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
