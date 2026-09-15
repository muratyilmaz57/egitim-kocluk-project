import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(150)
  fullName?: string;

  @IsOptional() @IsEmail() @MaxLength(191)
  email?: string;

  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(255)
  avatarUrl?: string;
}
