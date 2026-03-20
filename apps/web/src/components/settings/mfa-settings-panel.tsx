"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SecurityPayload } from "@web/lib/api";

type MfaSettingsPanelProps = {
  security: SecurityPayload | null;
};

type SetupPayload = {
  method: "authenticator" | "email";
  secret?: string;
  otpauthUri?: string;
  qrCodeDataUrl?: string;
  deliveryHint?: string | null;
  expiresInSeconds?: number;
};

export function MfaSettingsPanel({ security }: MfaSettingsPanelProps) {
  const router = useRouter();
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function startSetup(method: "authenticator" | "email") {
    setError(null);
    setSuccess(null);
    const response = await fetch("/api/auth/mfa/setup/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ method }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "MFA kurulumu baslatilamadi.");
      return;
    }
    setSetup(payload);
  }

  async function verifySetup(formData: FormData) {
    setError(null);
    setSuccess(null);
    const response = await fetch("/api/auth/mfa/setup/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        code: String(formData.get("code") ?? ""),
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "MFA etkinlestirilemedi.");
      return;
    }
    setSetup(null);
    setSuccess("MFA etkinlestirildi.");
    startTransition(() => {
      router.refresh();
    });
  }

  async function disableMfa(formData: FormData) {
    setError(null);
    setSuccess(null);
    const response = await fetch("/api/auth/mfa/disable", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        password: String(formData.get("password") ?? ""),
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "MFA kapatilamadi.");
      return;
    }
    setSuccess("MFA kapatildi.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="settings-stack">
      <div className="settings-hint">
        MFA zorunlu degil. Etkinlestirirsen login sonrasi 6 haneli kod istenir.
      </div>
      {!security?.mfaEnabled ? (
        <>
          {!setup ? (
            <div className="settings-methods">
              <button className="primary-button inline-button" type="button" onClick={() => void startSetup("authenticator")}>
                Authenticator uygulamasi
              </button>
              <button className="secondary-button inline-button" type="button" onClick={() => void startSetup("email")}>
                E-posta kodu
              </button>
            </div>
          ) : (
            <form
              className="inline-editor__form"
              onSubmit={(event) => {
                event.preventDefault();
                void verifySetup(new FormData(event.currentTarget));
              }}
            >
              {setup.method === "authenticator" ? (
                <>
                  {setup.qrCodeDataUrl ? (
                    <div className="settings-qr">
                      <img src={setup.qrCodeDataUrl} alt="Authenticator QR" />
                    </div>
                  ) : null}
                  <div className="settings-secret">
                    <strong>Gizli anahtar</strong>
                    <code>{setup.secret}</code>
                  </div>
                  <div className="settings-secret">
                    <strong>OTP URI</strong>
                    <code>{setup.otpauthUri}</code>
                  </div>
                </>
              ) : (
                <div className="settings-secret">
                  <strong>E-posta MFA</strong>
                  <code>{setup.deliveryHint ?? "Dogrulama kodu e-posta adresine gonderildi."}</code>
                </div>
              )}
              <input
                name="code"
                placeholder={
                  setup.method === "email"
                    ? "E-posta ile gelen kod"
                    : "Authenticator kodu"
                }
                required
              />
              <div className="inline-actions">
                <button className="primary-button inline-button" type="submit" disabled={isPending}>
                  MFA etkinlestir
                </button>
                <button
                  className="secondary-button inline-button"
                  type="button"
                  onClick={() => setSetup(null)}
                >
                  Vazgec
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <form
          className="inline-editor__form"
          onSubmit={(event) => {
            event.preventDefault();
            void disableMfa(new FormData(event.currentTarget));
          }}
        >
          <div className="settings-success">
            MFA etkin. Yontem: {security.mfaMethod === "email" ? "E-posta kodu" : "Authenticator"}
          </div>
          <input name="password" type="password" placeholder="MFA kapatmak icin sifreni gir" required />
          <div className="inline-actions">
            <button className="danger-button inline-button" type="submit" disabled={isPending}>
              MFA kapat
            </button>
          </div>
        </form>
      )}
      {error ? <span className="inline-error">{error}</span> : null}
      {success ? <span className="settings-success">{success}</span> : null}
    </div>
  );
}
