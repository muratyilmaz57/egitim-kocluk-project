"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LessonCreateFormProps = {
  onSuccessRedirectTo?: string;
};

export function LessonCreateForm({ onSuccessRedirectTo }: LessonCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitForm(formData: FormData) {
    setError(null);

    const response = await fetch("/api/lessons", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        code: String(formData.get("code") ?? "") || undefined,
        color: String(formData.get("color") ?? "") || undefined,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Ders eklenemedi.");
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
          <span>Ders Adi</span>
          <input name="name" placeholder="TYT Matematik" required />
        </label>
        <label className="auth-field">
          <span>Ders Kodu</span>
          <input name="code" placeholder="TYT_MAT" />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Renk</span>
          <input name="color" placeholder="#3158d6" />
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
          {isPending ? "Kaydediliyor..." : "Ders Ekle"}
        </button>
      </div>
    </form>
  );
}
