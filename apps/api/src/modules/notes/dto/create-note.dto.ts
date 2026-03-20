import { NoteType, NoteVisibility } from "@prisma/client";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateNoteDto {
  @IsInt()
  @Min(1)
  studentId!: number;

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
}
