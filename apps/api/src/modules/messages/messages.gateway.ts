import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { UnauthorizedException } from "@nestjs/common";
import type { Server, Socket } from "socket.io";
import { AuthService } from "../auth/auth.service";

type LiveMessagePayload = {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  studentId: string | null;
  studentName: string | null;
  sender: {
    id: string;
    fullName: string;
  };
  receiver: {
    id: string;
    fullName: string;
  };
};

@WebSocketGateway({
  namespace: "/messages",
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly authService: AuthService) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = this.resolveAccessToken(client);
      const user = this.authService.verifyAccessToken(token);

      client.data.userId = user.id;
      client.join(this.getUserRoom(user.id));
    } catch (error) {
      client.emit("message:error", {
        message:
          error instanceof UnauthorizedException
            ? error.message
            : "Unauthorized websocket connection.",
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() _client: Socket) {}

  emitMessageCreated(payload: LiveMessagePayload) {
    this.server.to(this.getUserRoom(payload.sender.id)).emit("message:new", payload);
    this.server.to(this.getUserRoom(payload.receiver.id)).emit("message:new", payload);
  }

  emitMessagesRead(payload: { userId: string; studentId: string | null }) {
    this.server.to(this.getUserRoom(payload.userId)).emit("messages:read", payload);
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }

  private resolveAccessToken(client: Socket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === "string" && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      return header.slice(7);
    }

    throw new UnauthorizedException("Missing websocket access token.");
  }
}
