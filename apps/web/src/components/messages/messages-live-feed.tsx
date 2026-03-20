"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { MessageRecord, SessionUser } from "@web/lib/api";
import { formatDateTime } from "@web/lib/format";

type MessagesLiveFeedProps = {
  currentUser: SessionUser;
  initialMessages: MessageRecord[];
};

function sortMessages(messages: MessageRecord[]) {
  return [...messages].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function upsertMessage(messages: MessageRecord[], nextMessage: MessageRecord) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex === -1) {
    return sortMessages([nextMessage, ...messages]);
  }

  const draft = [...messages];
  draft[existingIndex] = nextMessage;
  return sortMessages(draft);
}

export function MessagesLiveFeed({
  currentUser,
  initialMessages,
}: MessagesLiveFeedProps) {
  const [messages, setMessages] = useState<MessageRecord[]>(() => sortMessages(initialMessages));
  const [status, setStatus] = useState<"connecting" | "connected" | "offline">("connecting");

  useEffect(() => {
    let isMounted = true;
    let socket: ReturnType<typeof io> | null = null;

    async function connect() {
      try {
        const response = await fetch("/api/session/socket-token", {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.accessToken || !payload?.socketUrl) {
          if (isMounted) {
            setStatus("offline");
          }
          return;
        }

        socket = io(`${payload.socketUrl}/messages`, {
          transports: ["websocket"],
          auth: {
            token: payload.accessToken,
          },
        });

        socket.on("connect", () => {
          if (isMounted) {
            setStatus("connected");
          }
        });

        socket.on("disconnect", () => {
          if (isMounted) {
            setStatus("offline");
          }
        });

        socket.on("message:new", (message: MessageRecord) => {
          setMessages((currentMessages) => upsertMessage(currentMessages, message));
        });

        socket.on("messages:read", (payload: { userId: string; studentId: string | null }) => {
          setMessages((currentMessages) =>
            currentMessages.map((message) => {
              if (message.receiver.id !== payload.userId) {
                return message;
              }

              if (payload.studentId && message.studentId !== payload.studentId) {
                return message;
              }

              return {
                ...message,
                isRead: true,
              };
            }),
          );
        });
      } catch {
        if (isMounted) {
          setStatus("offline");
        }
      }
    }

    void connect();

    return () => {
      isMounted = false;
      socket?.disconnect();
    };
  }, []);

  return (
    <div className="list">
      <div className="live-indicator">
        <span
          className={`live-indicator__dot live-indicator__dot--${status}`}
        />
        <span>
          {status === "connected"
            ? "Canli baglanti acik"
            : status === "connecting"
              ? "Canli baglanti kuruluyor"
              : "Canli baglanti yok"}
        </span>
      </div>
      {messages.length ? (
        messages.map((message) => (
          <div className="list-item" key={message.id}>
            <div className="list-item__meta">
              <strong>
                {message.sender.fullName} → {message.receiver.fullName}
              </strong>
              <span>
                {message.studentName ?? "Genel"} | {message.content}
              </span>
            </div>
            <div className="message-list__side">
              <span className={message.isRead ? "badge badge--success" : "badge badge--warning"}>
                {message.isRead && message.receiver.id === currentUser.id ? "Okundu" : "Yeni"}
              </span>
              <span className="message-list__date">{formatDateTime(message.createdAt)}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="list-item">
          <div className="list-item__meta">
            <strong>Mesaj yok</strong>
            <span>Yeni mesajlar burada listelenecek.</span>
          </div>
        </div>
      )}
    </div>
  );
}
