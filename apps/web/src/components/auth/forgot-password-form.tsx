"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugLink, setDebugLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setDebugLink(null);

    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: String(formData.get("email") ?? "").trim(),
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Sifre sifirlama istegi olusturulamadi.");
      return;
    }

    startTransition(() => {
      setSuccess(
        payload?.message ??
          "Eger hesap varsa sifre sifirlama baglantisi gonderildi.",
      );
      setDebugLink(payload?.debugResetUrl ?? null);
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
        <label htmlFor="forgot-email">E-posta</label>
        <input id="forgot-email" name="email" type="email" required />
      </div>

      {error ? <div className="auth-error">{error}</div> : null}
      {success ? <div className="settings-success">{success}</div> : null}
      {debugLink ? (
        <div className="settings-secret">
          <strong>Gelistirme baglantisi</strong>
          <code>{debugLink}</code>
        </div>
      ) : null}

      <button className="primary-button auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Gonderiliyor..." : "Sifirlama baglantisi gonder"}
      </button>

      <div className="auth-links">
        <Link href="/login">Giris ekranina don</Link>
      </div>
    </form>
  );
}
