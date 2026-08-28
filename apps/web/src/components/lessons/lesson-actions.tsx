"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GradeLevelSelect } from "@web/components/ui/grade-level-select";
import type { LessonRecord } from "@web/lib/api";

export function LessonActions({ lesson }: { lesson: LessonRecord }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function updateLesson(formData: FormData) {
    setError(null);
    const response = await fetch(`/api/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        code: String(formData.get("code") ?? ""),
        gradeLevel: String(formData.get("gradeLevel") ?? ""),
        color: String(formData.get("color") ?? ""),
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Ders güncellenemedi.");
      return;
    }
    startTransition(() => { setIsOpen(false); router.refresh(); });
  }

  async function removeLesson() {
    if (!window.confirm(`“${lesson.name}” dersini silmek istediğinize emin misiniz?`)) return;
    setError(null);
    const response = await fetch(`/api/lessons/${lesson.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Ders silinemedi.");
      return;
    }
    startTransition(() => { setIsOpen(false); router.refresh(); });
  }

  return (
    <>
      <button className="secondary-button inline-button" type="button" onClick={() => setIsOpen(true)}>Düzenle</button>
      {isOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby={`lesson-edit-${lesson.id}`}>
          <button className="modal-backdrop lesson-edit-backdrop" type="button" aria-label="Kapat" onClick={() => setIsOpen(false)} />
          <div className="modal-card lesson-edit-modal">
            <div className="modal-card__header">
              <div><h2 id={`lesson-edit-${lesson.id}`}>Dersi düzenle</h2><p>Ders kartındaki sınıf, ad, kod ve renk bilgilerini güncelleyin.</p></div>
              <button className="modal-card__close" type="button" aria-label="Kapat" onClick={() => setIsOpen(false)}>×</button>
            </div>
            <div className="modal-card__body">
              <form className="student-form lesson-edit-form" onSubmit={(event) => { event.preventDefault(); void updateLesson(new FormData(event.currentTarget)); }}>
                <label className="auth-field"><span>Sınıf</span><GradeLevelSelect defaultValue={lesson.gradeLevel ?? "8. sinif"} required /></label>
                <label className="auth-field"><span>Ders adı</span><input name="name" defaultValue={lesson.name} required /></label>
                <label className="auth-field"><span>Ders kodu</span><input name="code" defaultValue={lesson.code} required /></label>
                <label className="auth-field"><span>Renk</span><input name="color" type="color" defaultValue={lesson.color ?? "#3158d6"} /></label>
                {error ? <div className="auth-error">{error}</div> : null}
                <div className="inline-actions">
                  <button className="primary-button" type="submit" disabled={isPending}>Kaydet</button>
                  <button className="danger-button" type="button" disabled={isPending} onClick={() => void removeLesson()}>Dersi sil</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
