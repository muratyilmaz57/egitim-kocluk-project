"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GradeLevelSelect } from "@web/components/ui/grade-level-select";

type LessonCreateFormProps = {
  onSuccessRedirectTo?: string;
  defaultGradeLevel?: string;
};

const COLOR_PRESETS = [
  "#3158d6",
  "#b87938",
  "#6f58d9",
  "#d15c78",
  "#0f766e",
  "#2563eb",
];

export function LessonCreateForm({ onSuccessRedirectTo, defaultGradeLevel = "8. sinif" }: LessonCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState("#3158d6");
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
        gradeLevel: String(formData.get("gradeLevel") ?? ""),
        code: String(formData.get("code") ?? "") || undefined,
        color: color || undefined,
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
          <span>Sınıf</span>
          <GradeLevelSelect defaultValue={defaultGradeLevel} required />
        </label>
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
          <div className="color-picker-field">
            <div className="color-picker-field__row">
              <input
                aria-label="Renk sec"
                className="color-picker-field__swatch"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
              <input
                name="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                placeholder="#3158d6"
              />
            </div>
            <div className="color-palette">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  aria-label={`${preset} rengini sec`}
                  className={`color-palette__chip${color === preset ? " color-palette__chip--active" : ""}`}
                  style={{ background: preset }}
                  type="button"
                  onClick={() => setColor(preset)}
                />
              ))}
            </div>
          </div>
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
