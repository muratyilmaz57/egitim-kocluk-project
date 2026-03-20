"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ExamRecord } from "@web/lib/api";

type ExamActionsProps = {
  exam: ExamRecord;
};

function toDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function ExamActions({ exam }: ExamActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitPatch(formData: FormData) {
    setError(null);
    const response = await fetch(`/api/exam-results/${exam.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        examName: String(formData.get("examName") ?? ""),
        examType: String(formData.get("examType") ?? exam.examType),
        examDate: String(formData.get("examDate") ?? ""),
        correctCount: Number(formData.get("correctCount") ?? exam.correctCount),
        wrongCount: Number(formData.get("wrongCount") ?? exam.wrongCount),
        blankCount: Number(formData.get("blankCount") ?? exam.blankCount),
        totalNet: Number(formData.get("totalNet") ?? exam.totalNet),
        score: formData.get("score") ? Number(formData.get("score")) : undefined,
        notes: String(formData.get("notes") ?? ""),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Deneme guncellenemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function deleteExam() {
    setError(null);
    const response = await fetch(`/api/exam-results/${exam.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Silme islemi basarisiz.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <details className="inline-editor">
      <summary className="secondary-button inline-button">Duzenle</summary>
      <form
        className="inline-editor__form"
        onSubmit={(event) => {
          event.preventDefault();
          void submitPatch(new FormData(event.currentTarget));
        }}
      >
        <input name="examName" defaultValue={exam.examName} required />
        <div className="inline-grid inline-grid--2">
          <select name="examType" defaultValue={exam.examType}>
            <option value="mock">Genel Deneme</option>
            <option value="LGS">LGS</option>
            <option value="TYT">TYT</option>
            <option value="AYT">AYT</option>
            <option value="school">Okul</option>
          </select>
          <input name="examDate" type="date" defaultValue={toDateInputValue(exam.examDate)} />
        </div>
        <div className="inline-grid inline-grid--2">
          <input name="correctCount" type="number" min="0" defaultValue={exam.correctCount} />
          <input name="wrongCount" type="number" min="0" defaultValue={exam.wrongCount} />
        </div>
        <div className="inline-grid inline-grid--2">
          <input name="blankCount" type="number" min="0" defaultValue={exam.blankCount} />
          <input name="totalNet" type="number" min="0" step="0.25" defaultValue={exam.totalNet} />
        </div>
        <input
          name="score"
          type="number"
          min="0"
          step="0.01"
          defaultValue={exam.score ?? ""}
          placeholder="Puan"
        />
        <textarea name="notes" rows={3} defaultValue={exam.notes ?? ""} />
        <div className="inline-actions">
          <button className="primary-button inline-button" type="submit" disabled={isPending}>
            Kaydet
          </button>
          <button
            className="danger-button inline-button"
            type="button"
            disabled={isPending}
            onClick={() => void deleteExam()}
          >
            Sil
          </button>
        </div>
        {error ? <span className="inline-error">{error}</span> : null}
      </form>
    </details>
  );
}
