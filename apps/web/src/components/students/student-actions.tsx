"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { StudentDetail } from "@web/lib/api";
import { GradeLevelSelect } from "@web/components/ui/grade-level-select";

type StudentActionsProps = {
  student: StudentDetail;
};

function toDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function StudentActions({ student }: StudentActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitPatch(formData: FormData) {
    setError(null);
    const response = await fetch(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fullName: String(formData.get("fullName") ?? ""),
        gradeLevel: String(formData.get("gradeLevel") ?? ""),
        schoolName: String(formData.get("schoolName") ?? ""),
        targetExam: String(formData.get("targetExam") ?? ""),
        parentName: String(formData.get("parentName") ?? ""),
        parentPhone: String(formData.get("parentPhone") ?? ""),
        parentEmail: String(formData.get("parentEmail") ?? ""),
        enrollmentDate: String(formData.get("enrollmentDate") ?? ""),
        status: String(formData.get("status") ?? student.status),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Ogrenci guncellenemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function removeStudent() {
    setError(null);
    const response = await fetch(`/api/students/${student.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Ogrenci silinemedi.");
      return;
    }

    startTransition(() => {
      router.push("/students");
      router.refresh();
    });
  }

  return (
    <details className="inline-editor">
      <summary className="secondary-button inline-button">Ogrenciyi duzenle</summary>
      <form
        className="inline-editor__form"
        onSubmit={(event) => {
          event.preventDefault();
          void submitPatch(new FormData(event.currentTarget));
        }}
      >
        <input name="fullName" defaultValue={student.fullName} required />
        <div className="inline-grid inline-grid--2">
          <GradeLevelSelect defaultValue={student.gradeLevel} required />
          <input name="targetExam" defaultValue={student.targetExam ?? ""} />
        </div>
        <input name="schoolName" defaultValue={student.schoolName ?? ""} placeholder="Okul adi" />
        <div className="inline-grid inline-grid--2">
          <input name="parentName" defaultValue={student.parentName ?? ""} placeholder="Veli adi" />
          <input
            name="parentPhone"
            defaultValue={student.parentPhone ?? ""}
            placeholder="0555..."
          />
        </div>
        <div className="inline-grid inline-grid--2">
          <input
            name="parentEmail"
            type="email"
            defaultValue={student.parentEmail ?? ""}
            placeholder="veli@example.com"
          />
          <input
            name="enrollmentDate"
            type="date"
            defaultValue={toDateInputValue(student.enrollmentDate)}
          />
        </div>
        <select name="status" defaultValue={student.status}>
          <option value="active">Aktif</option>
          <option value="paused">Duraklatildi</option>
          <option value="graduated">Mezun</option>
        </select>
        <div className="inline-actions">
          <button className="primary-button inline-button" type="submit" disabled={isPending}>
            Kaydet
          </button>
          <button
            className="danger-button inline-button"
            type="button"
            disabled={isPending}
            onClick={() => void removeStudent()}
          >
            Sil
          </button>
        </div>
        {error ? <span className="inline-error">{error}</span> : null}
      </form>
    </details>
  );
}
