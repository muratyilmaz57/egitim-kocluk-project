"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { StudentSummary } from "@web/lib/api";

type NoteCreateFormProps = {
  students: StudentSummary[];
  defaultStudentId?: string | null;
  onSuccessRedirectTo?: string;
};

function localDateTimeValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset() + 30);
  return date.toISOString().slice(0, 16);
}

export function NoteCreateForm({ students, defaultStudentId, onSuccessRedirectTo }: NoteCreateFormProps) {
  const router = useRouter();
  const [entryType, setEntryType] = useState<"conversation" | "meeting">("conversation");
  const [participantType, setParticipantType] = useState<"student" | "parent">("student");
  const [studentId, setStudentId] = useState(defaultStudentId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitForm(formData: FormData) {
    if (entryType === "conversation" && !studentId) {
      setError("Görüşme için öğrenci veya veli seçin.");
      return;
    }
    setError(null);
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        noteType: entryType === "conversation" ? "meeting" : "reminder",
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        visibility: "private",
        scheduledFor: new Date(String(formData.get("scheduledFor"))).toISOString(),
        studentTargetIds: entryType === "conversation" && participantType === "student" ? [Number(studentId)] : [],
        parentTargetIds: entryType === "conversation" && participantType === "parent" ? [Number(studentId)] : [],
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Takvim kaydı oluşturulamadı.");
      return;
    }
    startTransition(() => onSuccessRedirectTo ? router.replace(onSuccessRedirectTo) : router.refresh());
  }

  return (
    <form className="agenda-entry-form" onSubmit={(event) => {
      event.preventDefault();
      void submitForm(new FormData(event.currentTarget));
    }}>
      <fieldset className="agenda-entry-type">
        <legend>Kayıt türü</legend>
        <button className={entryType === "conversation" ? "is-active" : ""} type="button" onClick={() => setEntryType("conversation")}>
          <strong>Görüşme</strong><span>Öğrenci veya veli görüşmesi</span>
        </button>
        <button className={entryType === "meeting" ? "is-active" : ""} type="button" onClick={() => setEntryType("meeting")}>
          <strong>Toplantı</strong><span>Koçun kişisel toplantısı</span>
        </button>
      </fieldset>

      {entryType === "conversation" ? (
        <div className="agenda-participant-row">
          <label className="auth-field">
            <span>Görüşülecek kişi</span>
            <select value={participantType} onChange={(event) => setParticipantType(event.target.value as "student" | "parent")}>
              <option value="student">Öğrenci</option>
              <option value="parent">Veli</option>
            </select>
          </label>
          <label className="auth-field">
            <span>{participantType === "parent" ? "Velisiyle görüşülecek öğrenci" : "Öğrenci"}</span>
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)} required>
              <option value="">Seçin</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.fullName} · {student.gradeLevel}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      <div className="agenda-participant-row">
        <label className="auth-field">
          <span>Başlık</span>
          <input name="title" required autoFocus placeholder={entryType === "conversation" ? "Aylık değerlendirme" : "Ekip toplantısı"} />
        </label>
        <label className="auth-field">
          <span>Tarih ve saat</span>
          <input name="scheduledFor" type="datetime-local" required defaultValue={localDateTimeValue()} />
        </label>
      </div>
      <label className="auth-field">
        <span>Not</span>
        <textarea name="content" rows={3} required placeholder="Gündem veya kısa görüşme notu" />
      </label>
      {error ? <div className="auth-error">{error}</div> : null}
      <div className="agenda-entry-form__footer">
        <span>Kayıt yalnızca koç takviminde görünür.</span>
        <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Kaydediliyor..." : "Takvime ekle"}</button>
      </div>
    </form>
  );
}
