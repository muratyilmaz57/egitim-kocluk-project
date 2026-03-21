"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NoteRecord } from "@web/lib/api";

type NoteActionsProps = {
  note: NoteRecord;
};

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function NoteActions({ note }: NoteActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitPatch(formData: FormData) {
    setError(null);
    const response = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        noteType: String(formData.get("noteType") ?? note.noteType),
        visibility: String(formData.get("visibility") ?? note.visibility),
        rating: formData.get("rating") ? Number(formData.get("rating")) : undefined,
        scheduledFor: String(formData.get("scheduledFor") ?? ""),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Not guncellenemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function removeNote() {
    setError(null);
    const response = await fetch(`/api/notes/${note.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Not silinemedi.");
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
        <input name="title" defaultValue={note.title} required />
        <textarea name="content" defaultValue={note.content} rows={3} required />
        <select name="noteType" defaultValue={note.noteType}>
          <option value="meeting">Gorusme</option>
          <option value="reminder">Hatirlatici</option>
          <option value="weekly_report">Haftalik rapor</option>
          <option value="motivation">Motivasyon</option>
          <option value="coach_comment">Koç yorumu</option>
        </select>
        <select name="visibility" defaultValue={note.visibility}>
          <option value="private">Sadece koç</option>
          <option value="student_visible">Ogrenci gorur</option>
          <option value="parent_visible">Veli gorur</option>
        </select>
        <input
          name="scheduledFor"
          type="date"
          defaultValue={toDateInputValue(note.scheduledFor)}
          required
        />
        <input name="rating" type="number" min="1" max="10" defaultValue={note.rating ?? ""} />
        <div className="inline-actions">
          <button className="primary-button inline-button" type="submit" disabled={isPending}>
            Kaydet
          </button>
          <button
            className="danger-button inline-button"
            type="button"
            disabled={isPending}
            onClick={() => void removeNote()}
          >
            Sil
          </button>
        </div>
        {error ? <span className="inline-error">{error}</span> : null}
      </form>
    </details>
  );
}
