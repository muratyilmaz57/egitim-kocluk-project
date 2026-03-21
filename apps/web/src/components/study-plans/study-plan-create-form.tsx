"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { StudentSummary } from "@web/lib/api";

type StudyPlanCreateFormProps = {
  students: StudentSummary[];
  defaultStudentId?: string | null;
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
  onSuccessRedirectTo?: string;
};

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function StudyPlanCreateForm({
  students,
  defaultStudentId,
  defaultStartDate,
  defaultEndDate,
  onSuccessRedirectTo,
}: StudyPlanCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submit(formData: FormData) {
    setError(null);
    const response = await fetch("/api/study-plans", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        studentId: Number(formData.get("studentId")),
        title: String(formData.get("title") ?? ""),
        planType: String(formData.get("planType") ?? "weekly"),
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? ""),
        status: String(formData.get("status") ?? "draft"),
        totalTargetMinutes: Number(formData.get("totalTargetMinutes") ?? 0),
        notes: String(formData.get("notes") ?? ""),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Plan olusturulamadi.");
      return;
    }

    startTransition(() => {
      if (onSuccessRedirectTo) {
        router.replace(onSuccessRedirectTo);
        return;
      }

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
      <select name="studentId" defaultValue={defaultStudentId ?? students[0]?.id ?? ""} required>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.fullName} | {student.gradeLevel}
          </option>
        ))}
      </select>
      <input name="title" required placeholder="17-23 Mart haftalik plan" autoFocus />
      <div className="inline-grid inline-grid--2">
        <select name="planType" defaultValue="weekly">
          <option value="weekly">Haftalik</option>
          <option value="daily">Gunluk</option>
        </select>
        <select name="status" defaultValue="draft">
          <option value="draft">Taslak</option>
          <option value="active">Aktif</option>
          <option value="completed">Tamamlandi</option>
          <option value="archived">Arsiv</option>
        </select>
      </div>
      <div className="inline-grid inline-grid--2">
        <input name="startDate" type="date" defaultValue={toDateInputValue(defaultStartDate)} required />
        <input name="endDate" type="date" defaultValue={toDateInputValue(defaultEndDate)} required />
      </div>
      <input name="totalTargetMinutes" type="number" min="0" defaultValue="240" />
      <textarea name="notes" rows={3} placeholder="Plan notlari ve oncelikler" />
      <div className="inline-actions">
        <button className="primary-button inline-button" type="submit" disabled={isPending}>
          Plan kaydet
        </button>
      </div>
      {error ? <span className="inline-error">{error}</span> : null}
    </form>
  );
}
