import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateMessageDto {
  @IsInt()
  @Min(1)
  receiverUserId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  studentId?: number;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
