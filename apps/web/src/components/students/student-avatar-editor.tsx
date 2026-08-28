"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { StudentDetail } from "@web/lib/api";
import { StudentAvatar } from "./student-avatar";

export function StudentAvatarEditor({ student }: { student: StudentDetail }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function save(photoUrl: string) {
    const response = await fetch(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ photoUrl }),
    });
    if (!response.ok) throw new Error("Profil görseli kaydedilemedi.");
    startTransition(() => router.refresh());
  }

  async function submit(formData: FormData) {
    setError(null);
    try {
      const file = formData.get("avatar");
      if (!(file instanceof File) || !file.size) throw new Error("Bir görsel seçin.");
      const uploadData = new FormData();
      uploadData.set("file", file);
      const uploadResponse = await fetch("/api/uploads/student-avatar", { method: "POST", body: uploadData });
      const payload = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok) throw new Error(payload?.message ?? "Görsel yüklenemedi.");
      await save(payload.filePath);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Görsel yüklenemedi.");
    }
  }

  return (
    <div className="avatar-editor">
      <StudentAvatar name={student.fullName} photoUrl={student.photoUrl} size="lg" />
      <div className="avatar-editor__body">
        <strong>Profil fotoğrafı</strong>
        <span>JPG, PNG veya WebP · en fazla 3 MB</span>
        <form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget)); }}>
          <input aria-label="Profil fotoğrafı seç" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required />
          <button className="primary-button inline-button" disabled={isPending} type="submit">Yükle</button>
        </form>
        <div className="avatar-editor__defaults" aria-label="Varsayılan profil görselleri">
          <button type="button" onClick={() => void save("/images/avatars/default-boy.svg")}>Erkek avatar</button>
          <button type="button" onClick={() => void save("/images/avatars/default-girl.svg")}>Kız avatar</button>
        </div>
        {error ? <span className="inline-error" role="alert">{error}</span> : null}
      </div>
    </div>
  );
}
