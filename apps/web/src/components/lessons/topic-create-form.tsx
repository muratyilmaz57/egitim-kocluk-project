"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LessonRecord } from "@web/lib/api";

type TopicCreateFormProps = {
  lessons: LessonRecord[];
  defaultLessonId?: string | null;
  onSuccessRedirectTo?: string;
};

export function TopicCreateForm({
  lessons,
  defaultLessonId,
  onSuccessRedirectTo,
}: TopicCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitForm(formData: FormData) {
    setError(null);

    const response = await fetch("/api/lessons/topics", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        lessonId: Number(formData.get("lessonId")),
        name: String(formData.get("name") ?? ""),
        gradeLevel: String(formData.get("gradeLevel") ?? "") || undefined,
        difficultyLevel: formData.get("difficultyLevel")
          ? Number(formData.get("difficultyLevel"))
          : undefined,
        estimatedMinutes: formData.get("estimatedMinutes")
          ? Number(formData.get("estimatedMinutes"))
          : undefined,
        description: String(formData.get("description") ?? "") || undefined,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Konu eklenemedi.");
      return;
    }

    startTransition(() => {
      if (onSuccessRedirectTo) {
        router.replace(onSuccessRedirectTo);
        return;
      }
      router.refresh();
    });
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
          <span>Ders</span>
          <select name="lessonId" defaultValue={defaultLessonId ?? lessons[0]?.id}>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field">
          <span>Konu Adi</span>
          <input name="name" placeholder="Problemler" required />
        </label>
        <label className="auth-field">
          <span>Seviye</span>
          <input name="gradeLevel" placeholder="11. sinif" />
        </label>
        <label className="auth-field">
          <span>Zorluk</span>
          <input name="difficultyLevel" type="number" min="1" max="5" placeholder="3" />
        </label>
        <label className="auth-field">
          <span>Tahmini Sure</span>
          <input name="estimatedMinutes" type="number" min="0" placeholder="45" />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Aciklama</span>
          <textarea name="description" rows={4} placeholder="Konu notu veya kapsami" />
        </label>
      </div>
      {error ? <div className="auth-error">{error}</div> : null}
      <div className="task-composer__footer">
        {onSuccessRedirectTo ? (
          <button className="secondary-button" type="button" onClick={() => router.replace(onSuccessRedirectTo)}>
            Iptal
          </button>
        ) : null}
        <button className="primary-button auth-submit" type="submit" disabled={isPending}>
          {isPending ? "Kaydediliyor..." : "Konu Ekle"}
        </button>
      </div>
    </form>
  );
}
