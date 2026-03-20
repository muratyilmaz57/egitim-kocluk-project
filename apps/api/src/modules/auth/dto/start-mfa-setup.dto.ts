import { IsIn, IsString } from "class-validator";

export class StartMfaSetupDto {
  @IsString()
  @IsIn(["authenticator", "email"])
  method!: "authenticator" | "email";
}
