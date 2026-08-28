"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { LessonRecord, StudentSummary } from "@web/lib/api";
import { AppIcon } from "../ui/app-icon";

type TaskCreateFormProps = {
  students: StudentSummary[];
  lessons?: LessonRecord[];
  defaultStudentId?: string | null;
  defaultDueAt?: string | null;
  onSuccessRedirectTo?: string;
};

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatWeekLabel(date: Date) {
  const end = addDays(date, 6);
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  });
  return `${formatter.format(date)} - ${formatter.format(end)}`;
}

function dayNameShort(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(date);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateNumber(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric" }).format(date);
}

function parseDueTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function combineDateAndTime(dateValue: string, timeValue?: string | null) {
  const time = timeValue && timeValue.trim() ? timeValue : "17:00";
  return new Date(`${dateValue}T${time}:00`).toISOString();
}

export function TaskCreateForm({
  students,
  lessons = [],
  defaultStudentId,
  defaultDueAt,
  onSuccessRedirectTo,
}: TaskCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(defaultDueAt ? new Date(defaultDueAt) : new Date()),
  );
  const [selectedDates, setSelectedDates] = useState<string[]>(() => {
    if (defaultDueAt) {
      return [defaultDueAt.slice(0, 10)];
    }
    return [isoDate(new Date())];
  });
  const [isPending, startTransition] = useTransition();
  const initialTime = parseDueTime(defaultDueAt);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);
        return {
          iso: isoDate(date),
          label: dayNameShort(date),
          number: dateNumber(date),
          isToday: isoDate(date) === isoDate(new Date()),
        };
      }),
    [weekStart],
  );

  const lessonTopics =
    lessons.find((lesson) => lesson.id === selectedLessonId)?.topics ?? [];

  useEffect(() => {
    if (!selectedLessonId) {
      setSelectedTopicId("");
      return;
    }

    if (!lessonTopics.some((topic) => topic.id === selectedTopicId)) {
      setSelectedTopicId("");
    }
  }, [lessonTopics, selectedLessonId, selectedTopicId]);

  async function submitForm(formData: FormData) {
    setError(null);
    if (!selectedDates.length) {
      setError("En az bir gun secmelisin.");
      return;
    }

    let resourceFilePath: string | undefined;
    let resourceFileName: string | undefined;
    const resourceFile = formData.get("resourceFile");
    if (resourceFile instanceof File && resourceFile.size > 0) {
      const uploadData = new FormData();
      uploadData.set("file", resourceFile);
      const uploadResponse = await fetch("/api/uploads/resources", {
        method: "POST",
        body: uploadData,
      });
      const uploadPayload = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok) {
        setError(uploadPayload?.message ?? "Kaynak dosyası yüklenemedi.");
        return;
      }
      resourceFilePath = uploadPayload.filePath;
      resourceFileName = uploadPayload.fileName;
    }

    const resourceUrl = String(formData.get("resourceUrl") ?? "").trim();
    const descriptionParts = [String(formData.get("description") ?? "").trim()];
    if (resourceUrl) descriptionParts.push(`Kaynak bağlantısı: ${resourceUrl}`);
    if (resourceFilePath) {
      descriptionParts.push(`Kaynak dosyası: ${resourceFileName ?? "Dosya"} | ${resourceFilePath}`);
    }

    const basePayload = {
      studentId: Number(formData.get("studentId")),
      lessonId: selectedLessonId ? Number(selectedLessonId) : undefined,
      topicId: selectedTopicId ? Number(selectedTopicId) : undefined,
      title: String(formData.get("title") ?? ""),
      taskType: String(formData.get("taskType") ?? "study"),
      description: descriptionParts.filter(Boolean).join("\n"),
      targetQuestionCount: Number(formData.get("targetQuestionCount") || 0),
      targetMinutes: Number(formData.get("targetMinutes") || 0),
      priority: String(formData.get("priority") ?? "medium"),
    };

    for (const dateValue of selectedDates) {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...basePayload,
          dueAt: combineDateAndTime(dateValue, String(formData.get("dueTime") ?? "")),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.message ?? "Gorev olusturulamadi.");
        return;
      }
    }

    startTransition(() => {
      if (onSuccessRedirectTo) {
        router.replace(onSuccessRedirectTo);
        return;
      }

      router.refresh();
    });
  }

  function toggleDate(dateValue: string) {
    setSelectedDates((current) =>
      current.includes(dateValue)
        ? current.filter((item) => item !== dateValue)
        : [...current, dateValue],
    );
  }

  return (
    <form
      className="task-composer"
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm(new FormData(event.currentTarget));
      }}
    >
      <section className="task-composer__hero">
        <div className="task-composer__hero-icon">
          <AppIcon name="tasks" />
        </div>
        <div>
          <strong>Görev Ekle</strong>
          <p>3 kısa adım · {selectedDates.length} güne eklenecek</p>
        </div>
      </section>

      <nav className="task-stepper" aria-label="Görev oluşturma adımları">
        {["Ders ve Kaynak", "Görev Detayları", "Zaman ve Günler"].map((label, index) => (
          <button
            key={label}
            className={step === index + 1 ? "task-step task-step--active" : "task-step"}
            type="button"
            onClick={() => setStep(index + 1)}
          >
            <span>{index + 1}</span>{label}
          </button>
        ))}
      </nav>

      <section className="task-date-picker" hidden={step !== 3}>
        <div className="task-date-picker__header">
          <div>
            <strong>Hangi gunlere eklenecek?</strong>
            <span>Birden fazla gun secersen ayni gorev hepsine yazilir.</span>
          </div>
          <div className="task-date-picker__nav">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, -7))}
            >
              Onceki hafta
            </button>
            <div className="task-date-picker__range">{formatWeekLabel(weekStart)}</div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, 7))}
            >
              Sonraki hafta
            </button>
          </div>
        </div>
        <div className="task-date-grid">
          {weekDays.map((day) => {
            const active = selectedDates.includes(day.iso);
            return (
              <button
                key={day.iso}
                className={`task-date-chip${active ? " task-date-chip--active" : ""}${day.isToday ? " task-date-chip--today" : ""}`}
                type="button"
                onClick={() => toggleDate(day.iso)}
              >
                <span>{day.label}</span>
                <strong>{day.number}</strong>
              </button>
            );
          })}
        </div>
      </section>

      <div className="task-composer__grid">
        <section className="task-composer__section" hidden={step !== 1}>
          <div className="task-composer__section-title">
            <span className="task-composer__section-icon task-composer__section-icon--lesson">
              <AppIcon name="lessons" />
            </span>
            <strong>Ders Bilgileri</strong>
          </div>
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
              <span>Ders</span>
              <select
                name="lessonId"
                value={selectedLessonId}
                onChange={(event) => setSelectedLessonId(event.target.value)}
              >
                <option value="">Ders seciniz</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
              <span>Konu veya Unite Sec</span>
              <select
                name="topicId"
                value={selectedTopicId}
                onChange={(event) => setSelectedTopicId(event.target.value)}
                disabled={!selectedLessonId}
              >
                <option value="">Konu seciniz (opsiyonel)</option>
                {lessonTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
              <span>Kaynak bağlantısı</span>
              <input name="resourceUrl" type="url" placeholder="https://youtube.com/..." />
            </label>
            <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
              <span>Kaynak dosyası</span>
              <input
                name="resourceFile"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,application/pdf"
              />
              <small>PDF, Word, PowerPoint veya metin dosyası · en fazla 10 MB</small>
            </label>
          </div>
        </section>

        <section className="task-composer__section" hidden={step !== 2}>
          <div className="task-composer__section-title">
            <span className="task-composer__section-icon task-composer__section-icon--task">
              <AppIcon name="spark" />
            </span>
            <strong>Gorev Detaylari</strong>
          </div>
          <div className="student-form__grid">
            <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
              <span>Gorev Basligi</span>
              <input name="title" placeholder="Problemler 40 soru" required autoFocus />
            </label>
            <label className="auth-field">
              <span>Gorev Turu</span>
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
              <span>Aciklama</span>
              <input name="description" placeholder="Opsiyonel gorev notu" />
            </label>
          </div>
        </section>

        <section className="task-composer__section" hidden={step !== 3}>
          <div className="task-composer__section-title">
            <span className="task-composer__section-icon task-composer__section-icon--time">
              <AppIcon name="focus" />
            </span>
            <strong>Zaman Ayarlari</strong>
          </div>
          <div className="student-form__grid">
            <label className="auth-field">
              <span>Saat</span>
              <input name="dueTime" type="time" defaultValue={initialTime} />
            </label>
            <label className="auth-field">
              <span>Sure (Dakika)</span>
              <input name="targetMinutes" type="number" min="0" defaultValue="45" />
            </label>
          </div>
        </section>
      </div>

      {error ? <div className="auth-error">{error}</div> : null}

      <div className="task-composer__footer">
        {onSuccessRedirectTo ? (
          <button
            className="secondary-button"
            type="button"
            onClick={() => router.replace(onSuccessRedirectTo)}
          >
            Iptal
          </button>
        ) : null}
        {step > 1 ? (
          <button className="secondary-button" type="button" onClick={() => setStep(step - 1)}>
            Geri
          </button>
        ) : null}
        {step < 3 ? (
          <button className="primary-button" type="button" onClick={() => setStep(step + 1)}>
            Devam et
          </button>
        ) : (
          <button className="primary-button auth-submit" type="submit" disabled={isPending}>
            {isPending ? "Kaydediliyor..." : "Görevi Oluştur"}
          </button>
        )}
      </div>
    </form>
  );
}
