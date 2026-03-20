"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { StudentSummary } from "@web/lib/api";

type NoteCreateFormProps = {
  students: StudentSummary[];
  defaultStudentId?: string | null;
};

export function NoteCreateForm({ students, defaultStudentId = null }: NoteCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitForm(formData: FormData) {
    setError(null);
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        studentId: Number(formData.get("studentId")),
        noteType: String(formData.get("noteType") ?? "meeting"),
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        visibility: String(formData.get("visibility") ?? "private"),
        rating: formData.get("rating") ? Number(formData.get("rating")) : undefined,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Not kaydedilemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  if (!students.length) {
    return null;
  }

  return (
    <form
      className="student-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm(new FormData(event.currentTarget));
      }}
    >
      <div className="student-form__grid">
        <label className="auth-field">
          <span>Ogrenci</span>
          <select name="studentId" defaultValue={defaultStudentId ?? students[0]?.id}>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field">
          <span>Not Tipi</span>
          <select name="noteType" defaultValue="meeting">
            <option value="meeting">Gorusme</option>
            <option value="reminder">Hatirlatici</option>
            <option value="weekly_report">Haftalik rapor</option>
            <option value="motivation">Motivasyon</option>
            <option value="coach_comment">Koç yorumu</option>
          </select>
        </label>
        <label className="auth-field">
          <span>Gorunurluk</span>
          <select name="visibility" defaultValue="private">
            <option value="private">Sadece koç</option>
            <option value="student_visible">Ogrenci gorur</option>
            <option value="parent_visible">Veli gorur</option>
          </select>
        </label>
        <label className="auth-field">
          <span>Puan</span>
          <input name="rating" type="number" min="1" max="10" placeholder="8" />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Baslik</span>
          <input name="title" required placeholder="Haftalik degerlendirme" />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Icerik</span>
          <textarea name="content" rows={4} required placeholder="Gorusme notu veya aksiyon maddeleri" />
        </label>
      </div>
      {error ? <div className="auth-error">{error}</div> : null}
      <button className="primary-button auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Not ekle"}
      </button>
    </form>
  );
}
