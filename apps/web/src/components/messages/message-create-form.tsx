"use client";

import { useState } from "react";
import type { StudentSummary } from "@web/lib/api";

type MessageCreateFormProps = {
  students: StudentSummary[];
  receiverUserId: string | null;
  defaultStudentId?: string | null;
};

export function MessageCreateForm({
  students,
  receiverUserId,
  defaultStudentId = null,
}: MessageCreateFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function submitForm(form: HTMLFormElement) {
    setIsPending(true);
    setError(null);
    setSuccess(null);
    const formData = new FormData(form);
    const selectedStudentId =
      String(formData.get("studentId") ?? defaultStudentId ?? "").trim() || null;
    const selectedStudent = students.find((student) => student.id === selectedStudentId);
    const resolvedReceiverUserId = selectedStudent?.userId ?? receiverUserId;

    if (!resolvedReceiverUserId || !selectedStudentId) {
      setError("Mesaj hedefi bulunamadi.");
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          receiverUserId: Number(resolvedReceiverUserId),
          studentId: Number(selectedStudentId),
          content: String(formData.get("content") ?? ""),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.message ?? "Mesaj gonderilemedi.");
        return;
      }

      form.reset();
      setSuccess("Mesaj gonderildi. Canli listede gorunur.");
    } finally {
      setIsPending(false);
    }
  }

  if (!receiverUserId && students.length === 0) {
    return null;
  }

  return (
    <form
      className="student-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm(event.currentTarget);
      }}
    >
      <div className="student-form__grid">
        {students.length ? (
          <label className="auth-field">
            <span>Ogrenci</span>
            <select name="studentId" defaultValue={defaultStudentId ?? students[0]?.id}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input name="studentId" type="hidden" value={defaultStudentId ?? ""} />
        )}
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Mesaj</span>
          <textarea name="content" rows={4} placeholder="Mesajinizi yazin" required />
        </label>
      </div>

      {error ? <div className="auth-error">{error}</div> : null}
      {success ? <div className="settings-success">{success}</div> : null}

      <button className="primary-button auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Gonderiliyor..." : "Mesaj gonder"}
      </button>
    </form>
  );
}
