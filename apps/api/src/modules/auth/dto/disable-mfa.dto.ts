import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class DisableMfaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}
