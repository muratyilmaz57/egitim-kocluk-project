"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function StudentCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitForm(formData: FormData) {
    setError(null);

    let photoUrl = String(formData.get("defaultAvatar") ?? "/images/avatars/default-boy.svg");
    const avatar = formData.get("avatar");
    if (avatar instanceof File && avatar.size > 0) {
      const uploadData = new FormData();
      uploadData.set("file", avatar);
      const uploadResponse = await fetch("/api/uploads/student-avatar", { method: "POST", body: uploadData });
      const uploadPayload = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok) {
        setError(uploadPayload?.message ?? "Profil görseli yüklenemedi.");
        return;
      }
      photoUrl = uploadPayload.filePath;
    }

    const response = await fetch("/api/students", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fullName: String(formData.get("fullName") ?? ""),
        gradeLevel: String(formData.get("gradeLevel") ?? ""),
        photoUrl,
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
          <span>Varsayılan avatar</span>
          <select name="defaultAvatar" defaultValue="/images/avatars/default-boy.svg">
            <option value="/images/avatars/default-boy.svg">Erkek öğrenci</option>
            <option value="/images/avatars/default-girl.svg">Kız öğrenci</option>
          </select>
        </label>
        <label className="auth-field">
          <span>Profil fotoğrafı (isteğe bağlı)</span>
          <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
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
