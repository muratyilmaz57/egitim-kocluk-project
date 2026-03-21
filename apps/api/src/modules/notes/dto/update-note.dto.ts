import { NoteType, NoteVisibility } from "@prisma/client";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateNoteDto {
  @IsOptional()
  @IsEnum(NoteType)
  noteType?: NoteType;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(NoteVisibility)
  visibility?: NoteVisibility;

  @IsOptional()
  @IsInt()
  @Min(1)
  rating?: number;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
