"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type NotificationPreferenceRecord = {
  type: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

type NotificationPreferencesFormProps = {
  preferences: NotificationPreferenceRecord[];
};

function getTypeLabel(type: string) {
  switch (type) {
    case "task":
      return "Gorev";
    case "exam":
      return "Deneme";
    case "message":
      return "Mesaj";
    case "note":
      return "Not";
    case "plan":
      return "Plan";
    case "pomodoro":
      return "Pomodoro";
    case "resource":
      return "Kaynak";
    default:
      return type;
  }
}

export function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const router = useRouter();
  const [rows, setRows] = useState(preferences);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateRow(index: number, field: "inAppEnabled" | "emailEnabled", value: boolean) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  }

  async function savePreferences() {
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        preferences: rows,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Bildirim ayarlari kaydedilemedi.");
      return;
    }

    setRows(payload);
    setSuccess("Bildirim tercihleri guncellendi.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="preferences-grid">
      {rows.map((row, index) => (
        <div className="preference-row" key={row.type}>
          <div>
            <strong>{getTypeLabel(row.type)}</strong>
            <p>
              {row.type === "message"
                ? "Canli sohbet ve yeni mesaj uyarilari."
                : `${getTypeLabel(row.type)} akisi icin bildirim kanallari.`}
            </p>
          </div>
          <label className="toggle-row">
            <span>Uygulama ici</span>
            <input
              checked={row.inAppEnabled}
              onChange={(event) => updateRow(index, "inAppEnabled", event.target.checked)}
              type="checkbox"
            />
          </label>
          <label className="toggle-row">
            <span>E-posta</span>
            <input
              checked={row.emailEnabled}
              onChange={(event) => updateRow(index, "emailEnabled", event.target.checked)}
              type="checkbox"
            />
          </label>
        </div>
      ))}

      <div className="settings-hint">
        E-posta kanali tercihleri kaydedilir. SMTP ve genel bildirim e-posta akisi sonraki asamada bu alanlari kullanir.
      </div>

      {error ? <div className="auth-error">{error}</div> : null}
      {success ? <div className="settings-success">{success}</div> : null}

      <button
        className="primary-button"
        disabled={isPending}
        onClick={() => {
          startTransition(() => {
            void savePreferences();
          });
        }}
        type="button"
      >
        {isPending ? "Kaydediliyor..." : "Tercihleri kaydet"}
      </button>
    </div>
  );
}
