"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { StudentSummary } from "@web/lib/api";

type NoteCreateFormProps = {
  students: StudentSummary[];
  defaultStudentId?: string | null;
  onSuccessRedirectTo?: string;
};

function toDateInputValue(value?: string | null) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function NoteCreateForm({
  students,
  onSuccessRedirectTo,
}: NoteCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [targetEveryone, setTargetEveryone] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const gradeLevels = useMemo(
    () => [...new Set(students.map((student) => student.gradeLevel))].sort((left, right) => left.localeCompare(right, "tr")),
    [students],
  );
  const filteredStudents = students.filter((student) =>
    `${student.fullName} ${student.gradeLevel}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")),
  );

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((item) => item !== studentId)
        : [...current, studentId],
    );
    setSelectedParentIds((current) => current.filter((item) => item !== studentId));
  }

  function toggleParent(studentId: string) {
    setSelectedParentIds((current) =>
      current.includes(studentId)
        ? current.filter((item) => item !== studentId)
        : [...current, studentId],
    );
    if (!selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds((current) => [...current, studentId]);
    }
  }

  function toggleGrade(gradeLevel: string) {
    setSelectedGradeLevels((current) =>
      current.includes(gradeLevel)
        ? current.filter((item) => item !== gradeLevel)
        : [...current, gradeLevel],
    );
  }

  async function submitForm(formData: FormData) {
    setError(null);
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        noteType: String(formData.get("noteType") ?? "meeting"),
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        visibility: String(formData.get("visibility") ?? "private"),
        rating: formData.get("rating") ? Number(formData.get("rating")) : undefined,
        scheduledFor: String(formData.get("scheduledFor") ?? ""),
        studentTargetIds: selectedStudentIds.map(Number),
        parentTargetIds: selectedParentIds.map(Number),
        gradeLevels: selectedGradeLevels,
        targetEveryone,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Not kaydedilemedi.");
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

  if (!students.length) {
    return null;
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
          <span>Not Tipi</span>
          <select name="noteType" defaultValue="meeting">
            <option value="meeting">Gorusme</option>
            <option value="reminder">Hatirlatici</option>
            <option value="weekly_report">Haftalik rapor</option>
            <option value="motivation">Motivasyon</option>
            <option value="coach_comment">Koç yorumu</option>
          </select>
        </label>
        <label className="auth-field">
          <span>Gorunurluk</span>
          <select name="visibility" defaultValue="private">
            <option value="private">Sadece koç</option>
            <option value="student_visible">Ogrenci gorur</option>
            <option value="parent_visible">Veli gorur</option>
          </select>
        </label>
        <label className="auth-field">
          <span>Puan</span>
          <input name="rating" type="number" min="1" max="10" placeholder="8" />
        </label>
        <label className="auth-field">
          <span>Tarih</span>
          <input name="scheduledFor" type="date" required defaultValue={toDateInputValue()} />
        </label>
        <div className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Etiketler</span>
          <div className="audience-panel">
            <div className="audience-panel__toolbar">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ogrenci ara"
              />
              <label className="audience-chip">
                <input
                  checked={targetEveryone}
                  onChange={(event) => setTargetEveryone(event.target.checked)}
                  type="checkbox"
                />
                <span>@everyone</span>
              </label>
            </div>

            <div className="audience-chip-list">
              {gradeLevels.map((gradeLevel) => (
                <label className="audience-chip" key={gradeLevel}>
                  <input
                    checked={selectedGradeLevels.includes(gradeLevel)}
                    onChange={() => toggleGrade(gradeLevel)}
                    type="checkbox"
                  />
                  <span>@{gradeLevel}</span>
                </label>
              ))}
            </div>

            <div className="audience-list">
              {filteredStudents.map((student) => (
                <label className="audience-row" key={student.id}>
                  <span className="audience-row__main">
                    <input
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      type="checkbox"
                    />
                    <span>
                      <strong>{student.fullName}</strong>
                      <small>{student.gradeLevel}</small>
                    </span>
                  </span>
                  <span className="audience-row__aside">
                    <input
                      checked={selectedParentIds.includes(student.id)}
                      onChange={() => toggleParent(student.id)}
                      type="checkbox"
                    />
                    <span>Veli</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Baslik</span>
          <input name="title" required placeholder="Haftalik degerlendirme" autoFocus />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Icerik</span>
          <textarea name="content" rows={4} required placeholder="Gorusme notu veya aksiyon maddeleri" />
        </label>
      </div>
      {error ? <div className="auth-error">{error}</div> : null}
      <button className="primary-button auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Not ekle"}
      </button>
    </form>
  );
}
