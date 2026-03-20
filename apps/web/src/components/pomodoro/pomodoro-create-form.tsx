"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SessionUser, StudentSummary, TaskRecord } from "@web/lib/api";

type PomodoroCreateFormProps = {
  currentUser: SessionUser;
  students: StudentSummary[];
  tasks: TaskRecord[];
};

function defaultDateTimeLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function PomodoroCreateForm({
  currentUser,
  students,
  tasks,
}: PomodoroCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submit(formData: FormData) {
    setError(null);
    const response = await fetch("/api/pomodoro-sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        studentId:
          currentUser.role === "student"
            ? Number(currentUser.studentProfileId)
            : Number(formData.get("studentId")),
        taskId: formData.get("taskId") ? Number(formData.get("taskId")) : undefined,
        startedAt: new Date(String(formData.get("startedAt") ?? "")).toISOString(),
        endedAt: formData.get("endedAt")
          ? new Date(String(formData.get("endedAt"))).toISOString()
          : undefined,
        durationMinutes: Number(formData.get("durationMinutes") ?? 0),
        breakMinutes: Number(formData.get("breakMinutes") ?? 0),
        sessionType: String(formData.get("sessionType") ?? "focus"),
        deviceType: String(formData.get("deviceType") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Pomodoro oturumu eklenemedi.");
      return;
    }

    startTransition(() => {
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
      {currentUser.role !== "student" ? (
        <select name="studentId" defaultValue={students[0]?.id ?? ""} required>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName} | {student.gradeLevel}
            </option>
          ))}
        </select>
      ) : null}
      <select name="taskId" defaultValue="">
        <option value="">Bagli gorev yok</option>
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.student.fullName} | {task.title}
          </option>
        ))}
      </select>
      <div className="inline-grid inline-grid--2">
        <select name="sessionType" defaultValue="focus">
          <option value="focus">Odak</option>
          <option value="break">Mola</option>
        </select>
        <input name="deviceType" defaultValue="web" placeholder="web" />
      </div>
      <div className="inline-grid inline-grid--2">
        <input name="startedAt" type="datetime-local" defaultValue={defaultDateTimeLocal()} required />
        <input name="endedAt" type="datetime-local" />
      </div>
      <div className="inline-grid inline-grid--2">
        <input name="durationMinutes" type="number" min="0" defaultValue="25" required />
        <input name="breakMinutes" type="number" min="0" defaultValue="5" />
      </div>
      <textarea name="notes" rows={3} placeholder="Oturum notu" />
      <div className="inline-actions">
        <button className="primary-button inline-button" type="submit" disabled={isPending}>
          Oturum ekle
        </button>
      </div>
      {error ? <span className="inline-error">{error}</span> : null}
    </form>
  );
}
