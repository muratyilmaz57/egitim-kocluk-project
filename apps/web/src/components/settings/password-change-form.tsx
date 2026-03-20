"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type PasswordChangeFormProps = {
  forced?: boolean;
};

export function PasswordChangeForm({ forced = false }: PasswordChangeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submit(formData: FormData) {
    setError(null);
    setSuccess(null);

    const nextPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (nextPassword !== confirmPassword) {
      setError("Yeni sifre ve tekrar ayni olmali.");
      return;
    }

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        currentPassword: String(formData.get("currentPassword") ?? ""),
        newPassword: nextPassword,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Sifre guncellenemedi.");
      return;
    }

    setSuccess("Sifre guncellendi.");
    startTransition(() => {
      router.replace("/settings/security");
      router.refresh();
    });
  }

  return (
    <form
      className="inline-editor__form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
    >
      {forced ? (
        <div className="auth-error">
          Sifre guvenlik politikasi geregi en fazla 6 ay kullanilabilir. Devam etmek icin once yeni sifre belirle.
        </div>
      ) : null}
      <input name="currentPassword" type="password" placeholder="Mevcut sifre" required />
      <input name="newPassword" type="password" placeholder="Yeni sifre" required />
      <input name="confirmPassword" type="password" placeholder="Yeni sifre tekrar" required />
      <div className="settings-hint">
        En az 10 karakter, buyuk harf, kucuk harf, rakam ve ozel karakter zorunlu.
      </div>
      <div className="inline-actions">
        <button className="primary-button inline-button" type="submit" disabled={isPending}>
          Sifreyi guncelle
        </button>
      </div>
      {error ? <span className="inline-error">{error}</span> : null}
      {success ? <span className="settings-success">{success}</span> : null}
    </form>
  );
}
