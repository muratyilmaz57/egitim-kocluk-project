"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { StudentSummary } from "@web/lib/api";

type ExamCreateFormProps = {
  students: StudentSummary[];
};

export function ExamCreateForm({ students }: ExamCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitForm(formData: FormData) {
    setError(null);

    const response = await fetch("/api/exam-results", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        studentId: Number(formData.get("studentId")),
        examName: String(formData.get("examName") ?? ""),
        examType: String(formData.get("examType") ?? "mock"),
        examDate: String(formData.get("examDate") ?? ""),
        durationMinutes: Number(formData.get("durationMinutes") || 0),
        correctCount: Number(formData.get("correctCount") || 0),
        wrongCount: Number(formData.get("wrongCount") || 0),
        blankCount: Number(formData.get("blankCount") || 0),
        totalNet: Number(formData.get("totalNet") || 0),
        score: Number(formData.get("score") || 0),
        rankInGroup: Number(formData.get("rankInGroup") || 0),
        incorrectTopics: String(formData.get("incorrectTopics") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        notes: String(formData.get("notes") ?? ""),
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Deneme sonucu kaydedilemedi.");
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
          <select name="studentId" defaultValue={students[0]?.id}>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field">
          <span>Deneme Adi</span>
          <input name="examName" placeholder="Turkiye Geneli Deneme 6" required />
        </label>
        <label className="auth-field">
          <span>Sinav Tipi</span>
          <select name="examType" defaultValue="mock">
            <option value="mock">Genel Deneme</option>
            <option value="LGS">LGS</option>
            <option value="TYT">TYT</option>
            <option value="AYT">AYT</option>
            <option value="school">Okul</option>
          </select>
        </label>
        <label className="auth-field">
          <span>Tarih</span>
          <input name="examDate" type="date" required />
        </label>
        <label className="auth-field">
          <span>Dogru</span>
          <input name="correctCount" type="number" min="0" defaultValue="0" />
        </label>
        <label className="auth-field">
          <span>Yanlis</span>
          <input name="wrongCount" type="number" min="0" defaultValue="0" />
        </label>
        <label className="auth-field">
          <span>Bos</span>
          <input name="blankCount" type="number" min="0" defaultValue="0" />
        </label>
        <label className="auth-field">
          <span>Toplam Net</span>
          <input name="totalNet" type="number" step="0.25" defaultValue="0" />
        </label>
        <label className="auth-field">
          <span>Puan</span>
          <input name="score" type="number" step="0.01" defaultValue="0" />
        </label>
        <label className="auth-field">
          <span>Siralama</span>
          <input name="rankInGroup" type="number" min="0" defaultValue="0" />
        </label>
        <label className="auth-field">
          <span>Sure (dk)</span>
          <input name="durationMinutes" type="number" min="0" defaultValue="90" />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Eksik Konular</span>
          <input name="incorrectTopics" placeholder="Paragraf Hiz, Carpanlar ve Katlar" />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Koç Notu</span>
          <textarea name="notes" rows={4} placeholder="Kisa analiz notu" />
        </label>
      </div>

      {error ? <div className="auth-error">{error}</div> : null}

      <button className="primary-button auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Deneme sonucunu kaydet"}
      </button>
    </form>
  );
}
