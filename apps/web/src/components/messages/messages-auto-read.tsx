"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

type MessagesAutoReadProps = {
  unreadCount: number;
  studentId?: string | null;
};

export function MessagesAutoRead({ unreadCount, studentId }: MessagesAutoReadProps) {
  const router = useRouter();
  const hasTriggered = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!unreadCount || hasTriggered.current) {
      return;
    }

    hasTriggered.current = true;

    void fetch("/api/messages/read-all", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        studentId: studentId ? Number(studentId) : undefined,
      }),
    }).finally(() => {
      startTransition(() => {
        router.refresh();
      });
    });
  }, [router, startTransition, studentId, unreadCount]);

  return null;
}
