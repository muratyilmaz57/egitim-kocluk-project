"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NotificationPayload } from "@web/lib/api";

type NotificationMenuProps = {
  notifications: NotificationPayload | null;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotificationMenu({ notifications }: NotificationMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const items = notifications?.items ?? [];
  const unreadCount = notifications?.unreadCount ?? 0;

  async function markRead(id: string) {
    setError(null);
    const response = await fetch(`/api/notifications/${id}/read`, {
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

  async function markAllRead() {
    setError(null);
    const response = await fetch("/api/notifications/read-all", {
      method: "POST",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Bildirimler guncellenemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="notification-menu">
      <button
        className="chip-button chip-button--with-badge"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        Bildirimler
        {unreadCount ? <span className="chip-button__badge">{unreadCount}</span> : null}
      </button>
      {isOpen ? (
        <div className="notification-panel">
          <div className="notification-panel__header">
            <div>
              <strong>Bildirim merkezi</strong>
              <span>{unreadCount} okunmamis</span>
            </div>
            <div className="notification-panel__actions">
              <Link className="secondary-button inline-button" href="/notifications">
                Tumu
              </Link>
              {unreadCount ? (
                <button
                  className="secondary-button inline-button"
                  type="button"
                  disabled={isPending}
                  onClick={() => void markAllRead()}
                >
                  Okundu yap
                </button>
              ) : null}
            </div>
          </div>

          <div className="notification-panel__list">
            {items.length ? (
              items.map((item) => (
                <div className={`notification-item${item.isRead ? "" : " notification-item--unread"}`} key={item.id}>
                  <div className="notification-item__meta">
                    <strong>{item.title}</strong>
                    <span>
                      {item.studentName ?? item.actorName ?? "Sistem"} | {formatTimestamp(item.createdAt)}
                    </span>
                    {item.body ? <span>{item.body}</span> : null}
                  </div>
                  <div className="notification-item__actions">
                    <Link className="secondary-button inline-button" href={item.href}>
                      Ac
                    </Link>
                    {!item.isRead ? (
                      <button
                        className="secondary-button inline-button"
                        type="button"
                        disabled={isPending}
                        onClick={() => void markRead(item.id)}
                      >
                        Okundu
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="notification-item">
                <div className="notification-item__meta">
                  <strong>Bildirim yok</strong>
                  <span>Yeni operasyon olaylari burada listelenecek.</span>
                </div>
              </div>
            )}
          </div>

          {error ? <span className="inline-error">{error}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
