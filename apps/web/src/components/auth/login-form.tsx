"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type CaptchaPayload = {
  question: string;
  captchaToken: string;
  expiresInSeconds: number;
};

type LoginMfaPayload = {
  mfaMethod?: "authenticator" | "email" | null;
  deliveryHint?: string | null;
  mfaToken?: string | null;
};

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<CaptchaPayload | null>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaMethod, setMfaMethod] = useState<"authenticator" | "email" | null>(null);
  const [deliveryHint, setDeliveryHint] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void refreshCaptcha();
  }, []);

  async function refreshCaptcha() {
    const response = await fetch("/api/session/captcha", {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.captchaToken) {
      setCaptcha(payload);
    }
  }

  async function submitForm(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const captchaAnswer = String(formData.get("captchaAnswer") ?? "").trim();
    const mfaCode = String(formData.get("mfaCode") ?? "").trim();
    const body = mfaRequired
      ? {
          mfaToken,
          mfaCode,
        }
      : {
          email,
          password,
          captchaToken: captcha?.captchaToken,
          captchaAnswer,
        };

    const response = await fetch("/api/session/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.requiresMfa && payload?.mfaToken) {
      const mfaPayload = payload as LoginMfaPayload;
      setMfaToken(mfaPayload.mfaToken ?? null);
      setMfaMethod(mfaPayload.mfaMethod ?? null);
      setDeliveryHint(mfaPayload.deliveryHint ?? null);
      setMfaRequired(true);
      setError(null);
      return;
    }

    if (!response.ok) {
      setError(payload?.message ?? "Giris basarisiz.");
      await refreshCaptcha();
      return;
    }

    const destination =
      payload?.user?.passwordExpired
        ? "/settings/security?force=1"
        : payload?.user?.role === "student" && payload?.user?.studentProfileId
          ? `/students/${payload.user.studentProfileId}`
          : "/dashboard";

    startTransition(() => {
      router.replace(destination);
      router.refresh();
    });
  }

  return (
    <form
      className="auth-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm(new FormData(event.currentTarget));
      }}
    >
      <div className="auth-field">
        <label htmlFor="email">E-posta</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue="coach@kocluk.local"
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="password">Sifre</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue="Demo1234!"
          required
        />
      </div>

      {!mfaRequired ? (
        <div className="auth-field">
          <label htmlFor="captchaAnswer">
            Captcha: {captcha?.question ?? "yukleniyor..."}
          </label>
          <input id="captchaAnswer" name="captchaAnswer" inputMode="numeric" autoComplete="off" required />
        </div>
      ) : (
        <div className="auth-field">
          <label htmlFor="mfaCode">MFA kodu</label>
          <input
            id="mfaCode"
            name="mfaCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 haneli kod"
            required
          />
        </div>
      )}

      {error ? <div className="auth-error" role="alert">{error}</div> : null}

      {mfaRequired ? (
        <div className="auth-hint">
          {mfaMethod === "email"
            ? "E-posta adresine gonderilen 6 haneli kodu gir."
            : "Authenticator uygulamandaki 6 haneli kodu gir."}
          {deliveryHint ? ` ${deliveryHint}` : ""}
        </div>
      ) : (
        <button className="secondary-button inline-button" type="button" onClick={() => void refreshCaptcha()}>
          Captcha yenile
        </button>
      )}

      <button className="primary-button auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Giris yapiliyor..." : mfaRequired ? "MFA dogrula" : "Giris yap"}
      </button>

      {!mfaRequired ? (
        <div className="auth-links">
          <Link href="/forgot-password">Sifremi unuttum</Link>
        </div>
      ) : null}
    </form>
  );
}
