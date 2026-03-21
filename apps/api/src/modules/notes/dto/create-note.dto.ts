import { NoteType, NoteVisibility } from "@prisma/client";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateNoteDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  studentId?: number;

  @IsEnum(NoteType)
  noteType!: NoteType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsEnum(NoteVisibility)
  visibility!: NoteVisibility;

  @IsOptional()
  @IsInt()
  @Min(1)
  rating?: number;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  studentTargetIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  parentTargetIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  gradeLevels?: string[];

  @IsOptional()
  @IsBoolean()
  targetEveryone?: boolean;
}
