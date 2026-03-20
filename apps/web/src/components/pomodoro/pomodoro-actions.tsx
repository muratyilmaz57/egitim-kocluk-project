"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PomodoroRecord } from "@web/lib/api";

type PomodoroActionsProps = {
  session: PomodoroRecord;
};

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function PomodoroActions({ session }: PomodoroActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitPatch(formData: FormData) {
    setError(null);
    const response = await fetch(`/api/pomodoro-sessions/${session.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        startedAt: new Date(String(formData.get("startedAt") ?? "")).toISOString(),
        endedAt: formData.get("endedAt")
          ? new Date(String(formData.get("endedAt"))).toISOString()
          : null,
        durationMinutes: Number(formData.get("durationMinutes") ?? session.durationMinutes),
        breakMinutes: Number(formData.get("breakMinutes") ?? session.breakMinutes),
        sessionType: String(formData.get("sessionType") ?? session.sessionType),
        deviceType: String(formData.get("deviceType") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Pomodoro oturumu guncellenemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function removeSession() {
    setError(null);
    const response = await fetch(`/api/pomodoro-sessions/${session.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Pomodoro oturumu silinemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <details className="inline-editor">
      <summary className="secondary-button inline-button">Duzenle</summary>
      <form
        className="inline-editor__form"
        onSubmit={(event) => {
          event.preventDefault();
          void submitPatch(new FormData(event.currentTarget));
        }}
      >
        <div className="inline-grid inline-grid--2">
          <input
            name="startedAt"
            type="datetime-local"
            defaultValue={toDateTimeLocal(session.startedAt)}
          />
          <input
            name="endedAt"
            type="datetime-local"
            defaultValue={session.endedAt ? toDateTimeLocal(session.endedAt) : ""}
          />
        </div>
        <div className="inline-grid inline-grid--2">
          <input
            name="durationMinutes"
            type="number"
            min="0"
            defaultValue={session.durationMinutes}
          />
          <input
            name="breakMinutes"
            type="number"
            min="0"
            defaultValue={session.breakMinutes}
          />
        </div>
        <div className="inline-grid inline-grid--2">
          <select name="sessionType" defaultValue={session.sessionType}>
            <option value="focus">Odak</option>
            <option value="break">Mola</option>
          </select>
          <input name="deviceType" defaultValue={session.deviceType ?? ""} placeholder="web" />
        </div>
        <textarea name="notes" rows={3} defaultValue={session.notes ?? ""} />
        <div className="inline-actions">
          <button className="primary-button inline-button" type="submit" disabled={isPending}>
            Kaydet
          </button>
          <button
            className="danger-button inline-button"
            type="button"
            disabled={isPending}
            onClick={() => void removeSession()}
          >
            Sil
          </button>
        </div>
        {error ? <span className="inline-error">{error}</span> : null}
      </form>
    </details>
  );
}
