"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TaskRecord } from "@web/lib/api";

type TaskActionsProps = {
  task: TaskRecord;
};

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function TaskActions({ task }: TaskActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitPatch(formData: FormData) {
    setError(null);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        status: String(formData.get("status") ?? task.status),
        progressPercent: Number(formData.get("progressPercent") ?? task.progressPercent),
        dueAt: formData.get("dueAt")
          ? `${String(formData.get("dueAt"))}T00:00:00.000Z`
          : null,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Gorev guncellenemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function markCompleted() {
    setError(null);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        status: "completed",
        progressPercent: 100,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Islem basarisiz.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function removeTask() {
    setError(null);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Islem basarisiz.");
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
        <input name="title" defaultValue={task.title} required />
        <textarea name="description" rows={3} defaultValue={task.description ?? ""} />
        <div className="inline-grid inline-grid--2">
          <select name="status" defaultValue={task.status}>
            <option value="pending">Bekliyor</option>
            <option value="in_progress">Devam ediyor</option>
            <option value="completed">Tamamlandi</option>
            <option value="missed">Gecikti</option>
          </select>
          <input
            name="progressPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={task.progressPercent}
          />
        </div>
        <input name="dueAt" type="date" defaultValue={toDateInputValue(task.dueAt)} />
        <div className="inline-actions">
          <button className="primary-button inline-button" type="submit" disabled={isPending}>
            Kaydet
          </button>
          {task.status !== "completed" ? (
            <button
              className="secondary-button inline-button"
              type="button"
              disabled={isPending}
              onClick={() => void markCompleted()}
            >
              Tamamla
            </button>
          ) : null}
          <button
            className="danger-button inline-button"
            type="button"
            disabled={isPending}
            onClick={() => void removeTask()}
          >
            Sil
          </button>
        </div>
        {error ? <span className="inline-error">{error}</span> : null}
      </form>
    </details>
  );
}
