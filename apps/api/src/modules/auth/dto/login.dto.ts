import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class LoginDto {
  @IsOptional()
  @IsString()
  captchaToken?: string;

  @IsOptional()
  @IsString()
  captchaAnswer?: string;

  @ValidateIf((object) => !object.mfaToken)
  @IsEmail()
  email!: string;

  @ValidateIf((object) => !object.mfaToken)
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  mfaToken?: string;

  @ValidateIf((object) => Boolean(object.mfaToken))
  @IsString()
  @Length(6, 6)
  mfaCode?: string;
}
