"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { StudentSummary } from "@web/lib/api";

type TaskCreateFormProps = {
  students: StudentSummary[];
  defaultStudentId?: string | null;
  defaultDueAt?: string | null;
};

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TaskCreateForm({
  students,
  defaultStudentId,
  defaultDueAt,
}: TaskCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitForm(formData: FormData) {
    setError(null);

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        studentId: Number(formData.get("studentId")),
        title: String(formData.get("title") ?? ""),
        taskType: String(formData.get("taskType") ?? "study"),
        description: String(formData.get("description") ?? ""),
        targetQuestionCount: Number(formData.get("targetQuestionCount") || 0),
        targetMinutes: Number(formData.get("targetMinutes") || 0),
        priority: String(formData.get("priority") ?? "medium"),
        dueAt: formData.get("dueAt")
          ? new Date(String(formData.get("dueAt"))).toISOString()
          : undefined,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Gorev olusturulamadi.");
      return;
    }

    startTransition(() => {
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
          <span>Ogrenci</span>
          <select name="studentId" defaultValue={defaultStudentId ?? students[0]?.id}>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field">
          <span>Gorev Basligi</span>
          <input name="title" placeholder="Problemler 40 soru" required />
        </label>
        <label className="auth-field">
          <span>Gorev Tipi</span>
          <select name="taskType" defaultValue="study">
            <option value="study">Calisma</option>
            <option value="question">Soru</option>
            <option value="video">Video</option>
            <option value="exam">Deneme</option>
            <option value="reading">Okuma</option>
          </select>
        </label>
        <label className="auth-field">
          <span>Oncelik</span>
          <select name="priority" defaultValue="medium">
            <option value="low">Dusuk</option>
            <option value="medium">Orta</option>
            <option value="high">Yuksek</option>
          </select>
        </label>
        <label className="auth-field">
          <span>Hedef Soru</span>
          <input name="targetQuestionCount" type="number" min="0" defaultValue="0" />
        </label>
        <label className="auth-field">
          <span>Hedef Dakika</span>
          <input name="targetMinutes" type="number" min="0" defaultValue="45" />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Son Tarih</span>
          <input name="dueAt" type="datetime-local" defaultValue={toDateTimeLocalValue(defaultDueAt)} />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Aciklama</span>
          <textarea name="description" rows={4} placeholder="Kisa gorev aciklamasi" />
        </label>
      </div>

      {error ? <div className="auth-error">{error}</div> : null}

      <button className="primary-button auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Gorev olustur"}
      </button>
    </form>
  );
}
