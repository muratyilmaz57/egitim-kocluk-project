"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submit(formData: FormData) {
    setError(null);
    setSuccess(null);

    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setError("Yeni sifre ve tekrar ayni olmali.");
      return;
    }

    const response = await fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token,
        newPassword,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Sifre sifirlanamadi.");
      return;
    }

    setSuccess(payload?.message ?? "Sifren guncellendi.");
    startTransition(() => {
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    });
  }

  return (
    <form
      className="auth-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
    >
      <div className="auth-field">
        <label htmlFor="new-password">Yeni sifre</label>
        <input id="new-password" name="newPassword" type="password" required />
      </div>

      <div className="auth-field">
        <label htmlFor="confirm-password">Yeni sifre tekrar</label>
        <input id="confirm-password" name="confirmPassword" type="password" required />
      </div>

      <div className="auth-hint">
        En az 10 karakter, buyuk harf, kucuk harf, rakam ve ozel karakter zorunlu.
      </div>

      {error ? <div className="auth-error">{error}</div> : null}
      {success ? <div className="settings-success">{success}</div> : null}

      <button className="primary-button auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Sifirlanıyor..." : "Yeni sifreyi kaydet"}
      </button>

      <div className="auth-links">
        <Link href="/login">Giris ekranina don</Link>
      </div>
    </form>
  );
}
