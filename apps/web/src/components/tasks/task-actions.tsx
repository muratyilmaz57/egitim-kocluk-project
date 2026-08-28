"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { LessonRecord, TaskRecord } from "@web/lib/api";

type TaskActionsProps = {
  task: TaskRecord;
  lessons?: LessonRecord[];
};

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TaskActions({ task, lessons = [] }: TaskActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(task.lessonId ?? "");
  const [selectedTopicId, setSelectedTopicId] = useState<string>(task.topicId ?? "");
  const [isPending, startTransition] = useTransition();

  const lessonTopics = lessons.find((lesson) => lesson.id === selectedLessonId)?.topics ?? [];

  useEffect(() => {
    if (!selectedLessonId) {
      setSelectedTopicId("");
      return;
    }

    if (!lessonTopics.some((topic) => topic.id === selectedTopicId)) {
      setSelectedTopicId("");
    }
  }, [lessonTopics, selectedLessonId, selectedTopicId]);

  async function submitPatch(formData: FormData) {
    setError(null);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        taskType: String(formData.get("taskType") ?? task.taskType),
        targetQuestionCount: Number(formData.get("targetQuestionCount") ?? task.targetQuestionCount),
        targetMinutes: Number(formData.get("targetMinutes") ?? task.targetMinutes),
        priority: String(formData.get("priority") ?? task.priority),
        lessonId: selectedLessonId ? Number(selectedLessonId) : null,
        topicId: selectedTopicId ? Number(selectedTopicId) : null,
        status: String(formData.get("status") ?? task.status),
        progressPercent: Number(formData.get("progressPercent") ?? task.progressPercent),
        dueAt: formData.get("dueAt")
          ? new Date(String(formData.get("dueAt"))).toISOString()
          : null,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Gorev guncellenemedi.");
      return;
    }

    startTransition(() => {
      setIsOpen(false);
      router.refresh();
    });
  }

  async function markCompleted() {
    setError(null);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        status: "completed",
        progressPercent: 100,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Islem basarisiz.");
      return;
    }

    startTransition(() => {
      setIsOpen(false);
      router.refresh();
    });
  }

  async function removeTask() {
    setError(null);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Islem basarisiz.");
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
      <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby={`task-edit-title-${task.id}`}>
      <button className="modal-backdrop task-edit-backdrop" type="button" aria-label="Kapat" onClick={() => setIsOpen(false)} />
      <div className="modal-card task-edit-modal">
        <div className="modal-card__header">
          <div>
            <h2 id={`task-edit-title-${task.id}`}>Görevi düzenle</h2>
            <p>{task.student.fullName} · Görev bilgilerini kompakt biçimde güncelleyin.</p>
          </div>
          <button className="modal-card__close" type="button" aria-label="Kapat" onClick={() => setIsOpen(false)}>×</button>
        </div>
        <div className="modal-card__body">
      <form
        className="student-form task-edit-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submitPatch(new FormData(event.currentTarget));
        }}
      >
        <input name="title" defaultValue={task.title} required />
        <textarea name="description" rows={3} defaultValue={task.description ?? ""} />
        <div className="inline-grid inline-grid--2">
          <select name="taskType" defaultValue={task.taskType}>
            <option value="study">Calisma</option>
            <option value="question">Soru</option>
            <option value="video">Video</option>
            <option value="exam">Deneme</option>
            <option value="reading">Okuma</option>
          </select>
          <select name="status" defaultValue={task.status}>
            <option value="pending">Bekliyor</option>
            <option value="in_progress">Devam ediyor</option>
            <option value="completed">Tamamlandi</option>
            <option value="missed">Gecikti</option>
          </select>
        </div>
        <div className="inline-grid inline-grid--2">
          <select value={selectedLessonId} onChange={(event) => setSelectedLessonId(event.target.value)}>
            <option value="">Ders seciniz</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
          <select
            value={selectedTopicId}
            onChange={(event) => setSelectedTopicId(event.target.value)}
            disabled={!selectedLessonId}
          >
            <option value="">Konu seciniz</option>
            {lessonTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>
        <div className="inline-grid inline-grid--2">
          <input
            name="targetQuestionCount"
            type="number"
            min="0"
            defaultValue={task.targetQuestionCount}
            placeholder="Soru"
          />
          <input
            name="targetMinutes"
            type="number"
            min="0"
            defaultValue={task.targetMinutes}
            placeholder="Dakika"
          />
        </div>
        <div className="inline-grid inline-grid--2">
          <select name="priority" defaultValue={task.priority}>
            <option value="low">Dusuk</option>
            <option value="medium">Orta</option>
            <option value="high">Yuksek</option>
          </select>
          <input
            name="progressPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={task.progressPercent}
          />
        </div>
        <input name="dueAt" type="datetime-local" defaultValue={toDateTimeLocalValue(task.dueAt)} />
        <div className="inline-actions">
          <button className="primary-button inline-button" type="submit" disabled={isPending}>
            Kaydet
          </button>
          {task.status !== "completed" ? (
            <button
              className="secondary-button inline-button"
              type="button"
              disabled={isPending}
              onClick={() => void markCompleted()}
            >
              Tamamla
            </button>
          ) : null}
          <button
            className="danger-button inline-button"
            type="button"
            disabled={isPending}
            onClick={() => void removeTask()}
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
