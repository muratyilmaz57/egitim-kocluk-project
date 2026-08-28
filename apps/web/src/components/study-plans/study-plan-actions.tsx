"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { StudyPlanRecord, StudentSummary } from "@web/lib/api";

type StudyPlanActionsProps = {
  plan: StudyPlanRecord;
  students: StudentSummary[];
};

function toDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function StudyPlanActions({ plan, students }: StudyPlanActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitPatch(formData: FormData) {
    setError(null);
    const response = await fetch(`/api/study-plans/${plan.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        studentId: Number(formData.get("studentId")),
        title: String(formData.get("title") ?? ""),
        planType: String(formData.get("planType") ?? plan.planType),
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? ""),
        status: String(formData.get("status") ?? plan.status),
        totalTargetMinutes: Number(formData.get("totalTargetMinutes") ?? 0),
        notes: String(formData.get("notes") ?? ""),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Plan guncellenemedi.");
      return;
    }

    startTransition(() => {
      setIsOpen(false);
      router.refresh();
    });
  }

  async function removePlan() {
    setError(null);
    const response = await fetch(`/api/study-plans/${plan.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Plan silinemedi.");
      return;
    }

    startTransition(() => {
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button className="secondary-button inline-button" type="button" onClick={() => setIsOpen(true)}>
        Düzenle
      </button>
      {isOpen ? (
      <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby={`plan-edit-title-${plan.id}`}>
      <button className="modal-backdrop plan-edit-backdrop" type="button" aria-label="Kapat" onClick={() => setIsOpen(false)} />
      <div className="modal-card plan-edit-modal">
        <div className="modal-card__header">
          <div>
            <h2 id={`plan-edit-title-${plan.id}`}>Planı düzenle</h2>
            <p>Plan bilgilerini güncelleyin; mevcut görevler korunur.</p>
          </div>
          <button className="modal-card__close" type="button" aria-label="Kapat" onClick={() => setIsOpen(false)}>×</button>
        </div>
        <div className="modal-card__body">
      <form
        className="student-form plan-edit-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submitPatch(new FormData(event.currentTarget));
        }}
      >
        <select name="studentId" defaultValue={plan.student.id}>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName} | {student.gradeLevel}
            </option>
          ))}
        </select>
        <input name="title" defaultValue={plan.title} required />
        <div className="inline-grid inline-grid--2">
          <select name="planType" defaultValue={plan.planType}>
            <option value="weekly">Haftalik</option>
            <option value="daily">Gunluk</option>
          </select>
          <select name="status" defaultValue={plan.status}>
            <option value="draft">Taslak</option>
            <option value="active">Aktif</option>
            <option value="completed">Tamamlandi</option>
            <option value="archived">Arsiv</option>
          </select>
        </div>
        <div className="inline-grid inline-grid--2">
          <input name="startDate" type="date" defaultValue={toDateInputValue(plan.startDate)} />
          <input name="endDate" type="date" defaultValue={toDateInputValue(plan.endDate)} />
        </div>
        <input
          name="totalTargetMinutes"
          type="number"
          min="0"
          defaultValue={plan.totalTargetMinutes}
        />
        <textarea name="notes" rows={3} defaultValue={plan.notes ?? ""} />
        <div className="inline-actions">
          <button className="primary-button inline-button" type="submit" disabled={isPending}>
            Kaydet
          </button>
          <button
            className="danger-button inline-button"
            type="button"
            disabled={isPending}
            onClick={() => void removePlan()}
          >
            Sil
          </button>
        </div>
        {error ? <span className="inline-error">{error}</span> : null}
      </form>
        </div>
      </div>
      </div>
      ) : null}
    </>
  );
}
