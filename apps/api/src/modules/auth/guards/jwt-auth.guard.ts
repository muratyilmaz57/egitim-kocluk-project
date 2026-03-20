import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined>; user?: unknown }>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    request.user = this.authService.verifyAccessToken(token);
    return true;
  }

  private extractBearerToken(header?: string) {
    if (!header) {
      return null;
    }

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}
