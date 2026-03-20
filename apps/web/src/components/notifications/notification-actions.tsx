"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NotificationRecord } from "@web/lib/api";

type NotificationActionsProps = {
  notification: NotificationRecord;
};

export function NotificationActions({ notification }: NotificationActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function markRead() {
    setError(null);
    const response = await fetch(`/api/notifications/${notification.id}/read`, {
      method: "POST",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Bildirim guncellenemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="list-item__aside">
      <Link className="secondary-button inline-button" href={notification.href}>
        Ac
      </Link>
      {!notification.isRead ? (
        <button
          className="secondary-button inline-button"
          type="button"
          disabled={isPending}
          onClick={() => void markRead()}
        >
          Okundu
        </button>
      ) : null}
      {error ? <span className="inline-error">{error}</span> : null}
    </div>
  );
}
