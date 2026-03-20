"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LessonImportFormProps = {
  onSuccessRedirectTo?: string;
};

export function LessonImportForm({ onSuccessRedirectTo }: LessonImportFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitForm(formData: FormData) {
    setError(null);
    setSummary(null);

    const response = await fetch("/api/lessons/import", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Iceri aktarma basarisiz.");
      return;
    }

    setSummary(
      `${payload?.createdLessons ?? 0} ders ve ${payload?.createdTopics ?? 0} konu eklendi.`,
    );

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
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Excel veya CSV Dosyasi</span>
          <input name="file" type="file" accept=".xlsx,.xls,.csv" required />
        </label>
      </div>
      <div className="settings-hint">
        Beklenen kolonlar: <code>ders</code>, <code>kod</code>, <code>renk</code>, <code>konu</code>,{" "}
        <code>sinif</code>, <code>zorluk</code>, <code>dakika</code>, <code>aciklama</code>
      </div>
      {error ? <div className="auth-error">{error}</div> : null}
      {summary ? <div className="settings-success">{summary}</div> : null}
      <div className="task-composer__footer">
        {onSuccessRedirectTo ? (
          <button className="secondary-button" type="button" onClick={() => router.replace(onSuccessRedirectTo)}>
            Iptal
          </button>
        ) : null}
        <button className="primary-button auth-submit" type="submit" disabled={isPending}>
          {isPending ? "Aktariliyor..." : "Excel'den Aktar"}
        </button>
      </div>
    </form>
  );
}
