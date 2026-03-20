"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function StudentCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitForm(formData: FormData) {
    setError(null);

    const response = await fetch("/api/students", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fullName: String(formData.get("fullName") ?? ""),
        gradeLevel: String(formData.get("gradeLevel") ?? ""),
        targetExam: String(formData.get("targetExam") ?? ""),
        parentName: String(formData.get("parentName") ?? ""),
        parentPhone: String(formData.get("parentPhone") ?? ""),
        parentEmail: String(formData.get("parentEmail") ?? ""),
        enrollmentDate: String(formData.get("enrollmentDate") ?? ""),
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Ogrenci olusturulamadi.");
      return;
    }

    startTransition(() => {
      router.replace(`/students/${payload.id}`);
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
          <span>Ad Soyad</span>
          <input name="fullName" placeholder="Ogrenci adi" required />
        </label>
        <label className="auth-field">
          <span>Sinif</span>
          <input name="gradeLevel" placeholder="8. sinif" required />
        </label>
        <label className="auth-field">
          <span>Hedef Sinav</span>
          <input name="targetExam" placeholder="LGS" />
        </label>
        <label className="auth-field">
          <span>Kayit Tarihi</span>
          <input name="enrollmentDate" type="date" required />
        </label>
        <label className="auth-field">
          <span>Veli Adi</span>
          <input name="parentName" placeholder="Veli adi" />
        </label>
        <label className="auth-field">
          <span>Veli Telefonu</span>
          <input name="parentPhone" placeholder="0555..." />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Veli E-posta</span>
          <input name="parentEmail" type="email" placeholder="veli@example.com" />
        </label>
      </div>

      {error ? <div className="auth-error">{error}</div> : null}

      <button className="primary-button auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Ogrenciyi olustur"}
      </button>
    </form>
  );
}
