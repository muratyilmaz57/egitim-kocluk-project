"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type {
  LessonRecord,
  SessionUser,
  StudentSummary,
  StudyPlanRecord,
  TaskRecord,
} from "@web/lib/api";
import { TaskActions } from "../tasks/task-actions";
import { StudyPlanActions } from "./study-plan-actions";

type WeeklyProgramBoardProps = {
  user: SessionUser;
  students: StudentSummary[];
  lessons: LessonRecord[];
  selectedStudentId?: string | null;
  plans: StudyPlanRecord[];
  tasks: TaskRecord[];
  weekOffset: number;
  weekDays: string[];
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
};

type DayGroup = {
  isoDate: string;
  dayName: string;
  shortDate: string;
  isToday: boolean;
  tasks: TaskRecord[];
  isOutsideMonth?: boolean;
};

function monthCalendarDays(baseDate: Date) {
  const first = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const gridStart = startOfCalendarWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function startOfCalendarWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay();
  value.setDate(value.getDate() + (day === 0 ? -6 : 1 - day));
  value.setHours(0, 0, 0, 0);
  return value;
}

function formatDayName(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
  }).format(new Date(value));
}

function formatDayDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatClock(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} dk`;
  }

  return `${hours}s ${minutes}dk`;
}

function formatTaskStatus(status: string) {
  switch (status) {
    case "completed":
      return "Tamamlandi";
    case "in_progress":
      return "Devam ediyor";
    case "pending":
      return "Bekliyor";
    case "missed":
      return "Gecikti";
    default:
      return status;
  }
}

function sameDay(left: string | Date, right: string | Date) {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

function toneClass(status: string) {
  switch (status) {
    case "completed":
      return "badge badge--success";
    case "missed":
      return "badge badge--danger";
    default:
      return "badge badge--warning";
  }
}

function buildHref(pathname: string, weekOffset: number, selectedStudentId?: string | null) {
  const params = new URLSearchParams();
  if (weekOffset !== 0) {
    params.set("weekOffset", String(weekOffset));
  }
  if (selectedStudentId) {
    params.set("studentId", selectedStudentId);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildModalHref(
  pathname: string,
  weekOffset: number,
  selectedStudentId: string | null | undefined,
  mode: "createTask" | "createPlan",
  dueDate?: string,
) {
  const params = new URLSearchParams();
  params.set(mode, "1");
  if (weekOffset !== 0) {
    params.set("weekOffset", String(weekOffset));
  }
  if (selectedStudentId) {
    params.set("studentId", selectedStudentId);
  }
  if (dueDate) {
    params.set("dueDate", dueDate);
  }

  return `${pathname}?${params.toString()}`;
}

function nextDueAt(isoDate: string, currentDueAt: string | null) {
  const target = new Date(`${isoDate}T09:00:00`);
  if (currentDueAt) {
    const existing = new Date(currentDueAt);
    target.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
  }

  return target.toISOString();
}

export function WeeklyProgramBoard({
  user,
  students,
  lessons,
  selectedStudentId,
  plans,
  tasks,
  weekOffset,
  weekDays,
  weekLabel,
  weekStart,
  weekEnd,
}: WeeklyProgramBoardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const today = new Date();
  const [dragEnabled, setDragEnabled] = useState(true);
  const [hourlyMode, setHourlyMode] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [monthOffset, setMonthOffset] = useState(0);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    weekDays.find((day) => sameDay(day, today)) ?? weekDays[0] ?? weekStart,
  );
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const monthBase = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const displayDays = viewMode === "month" ? monthCalendarDays(monthBase) : weekDays;
  const displayStart = displayDays[0] ?? weekStart;
  const displayEnd = displayDays.at(-1) ?? weekEnd;
  const displayLabel = viewMode === "month"
    ? new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(monthBase)
    : weekLabel;
  const visiblePlans = plans.filter(
    (plan) =>
      new Date(plan.startDate).getTime() <= new Date(displayEnd).getTime() &&
      new Date(plan.endDate).getTime() >= new Date(displayStart).getTime(),
  );
  const canManage = user.role !== "student";
  const weekTasks = tasks
    .filter((task) => task.dueAt && displayDays.some((day) => sameDay(task.dueAt as string, day)))
    .sort((left, right) => {
      if (!left.dueAt || !right.dueAt) {
        return 0;
      }

      return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
    });

  const dayGroups: DayGroup[] = displayDays.map((day) => ({
    isoDate: day,
    dayName: formatDayName(day),
    shortDate: formatDayDate(day),
    isToday: sameDay(day, today),
    tasks: weekTasks.filter((task) => task.dueAt && sameDay(task.dueAt, day)),
    isOutsideMonth: viewMode === "month" && new Date(day).getMonth() !== monthBase.getMonth(),
  }));

  const scheduledTasks = weekTasks.length;
  const completedTasks = weekTasks.filter((task) => task.status === "completed").length;
  const overdueTasks = weekTasks.filter((task) => task.status === "missed").length;
  const weekTargetMinutes = visiblePlans.reduce((total, plan) => total + plan.totalTargetMinutes, 0);

  async function moveTask(taskId: string, isoDate: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    setError(null);
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        dueAt: nextDueAt(isoDate, task.dueAt),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Gorev tasinamadi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function pasteTask(isoDate: string) {
    const task = tasks.find((item) => item.id === copiedTaskId);
    if (!task || !canManage) return;
    setError(null);
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        studentId: Number(task.student.id),
        lessonId: task.lessonId ? Number(task.lessonId) : undefined,
        topicId: task.topicId ? Number(task.topicId) : undefined,
        title: task.title,
        description: task.description ?? "",
        taskType: task.taskType,
        targetQuestionCount: task.targetQuestionCount,
        targetMinutes: task.targetMinutes,
        priority: task.priority,
        dueAt: nextDueAt(isoDate, task.dueAt),
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Görev yapıştırılamadı.");
      return;
    }
    setCopiedTaskId(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="planner-shell">
      <section className="planner-panel planner-panel--hero">
        <div className="planner-panel__heading">
          <div className="planner-heading">
            <span className="planner-heading__bar" />
            <div>
              <h2>{viewMode === "month" ? "Aylık Çalışma Programı" : "Haftalık Çalışma Programı"}</h2>
              <p>
                {user.role === "student"
                  ? "Haftalik planini, gunlere dagilan gorevlerini ve odak akisini takip et."
                  : "Secili ogrenci icin haftalik programi yonet, gorevleri gunlere dagit ve plan aksini anlik izle."}
              </p>
            </div>
          </div>
          <button
            className="planner-pdf-button"
            type="button"
            onClick={() => window.print()}
          >
            PDF
          </button>
        </div>

        <div className="planner-toolbar-card">
          <div className="planner-toolbar-card__row">
            {canManage ? (
              <div className="planner-filters planner-filters--primary">
                <label className="planner-student-select">
                  <span>Öğrenci</span>
                  <select
                    value={selectedStudentId ?? ""}
                    onChange={(event) => router.push(buildHref(pathname, weekOffset, event.target.value || null))}
                  >
                    <option value="">Öğrenci seçin</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName} | {student.gradeLevel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : <span />}

            <div className="planner-toolbar-card__meta">
              <span className="planner-bullet" />
              <strong>{displayLabel}</strong>
              <div className="planner-view-switch" aria-label="Takvim görünümü">
                <button className={viewMode === "week" ? "is-active" : ""} type="button" onClick={() => setViewMode("week")}>Hafta</button>
                <button className={viewMode === "month" ? "is-active" : ""} type="button" onClick={() => setViewMode("month")}>Ay</button>
              </div>
              <label className="planner-switch">
                <span>Saatli Mod</span>
                <input checked={hourlyMode} onChange={(event) => setHourlyMode(event.target.checked)} type="checkbox" />
                <span className="planner-switch__track" />
              </label>
            </div>
          </div>

          <div className="planner-toolbar-card__row planner-toolbar-card__row--secondary">
            {canManage ? (
              <div className="planner-actions">
                <button className="planner-action planner-action--primary" disabled={!selectedStudentId} type="button" onClick={() => {
                  const dueDate = selectedDate || weekDays[0] || weekStart;
                  router.push(buildModalHref(pathname, weekOffset, selectedStudentId, "createTask", dueDate));
                }}>+ Görev Ekle</button>
                <button className="planner-action" disabled={!selectedStudentId} type="button" onClick={() => router.push(buildModalHref(pathname, weekOffset, selectedStudentId, "createPlan"))}>Hızlı Program</button>
                <button className={`planner-action planner-action--success${dragEnabled ? " planner-action--active" : ""}`} disabled={!selectedStudentId} type="button" onClick={() => setDragEnabled((current) => !current)}>Sürükle-Bırak</button>
              </div>
            ) : <span />}

            <div className="planner-nav">
              {viewMode === "month" ? (
                <>
                  <button className="planner-nav__button" type="button" onClick={() => setMonthOffset((value) => value - 1)}>Önceki ay</button>
                  <button className="planner-nav__button planner-nav__button--primary" type="button" onClick={() => setMonthOffset(0)}>Bu ay</button>
                  <button className="planner-nav__button" type="button" onClick={() => setMonthOffset((value) => value + 1)}>Sonraki ay</button>
                </>
              ) : (
              <>
              <Link className="planner-nav__button" href={buildHref(pathname, weekOffset - 1, selectedStudentId)}>
                {"<<"} Hafta
              </Link>
              <Link className="planner-nav__button planner-nav__button--icon" href={buildHref(pathname, weekOffset - 1, selectedStudentId)}>
                {"<"}
              </Link>
              <Link className="planner-nav__button planner-nav__button--primary" href={buildHref(pathname, 0, selectedStudentId)}>
                Bugun
              </Link>
              <Link className="planner-nav__button planner-nav__button--icon" href={buildHref(pathname, weekOffset + 1, selectedStudentId)}>
                {">"}
              </Link>
              <Link className="planner-nav__button" href={buildHref(pathname, weekOffset + 1, selectedStudentId)}>
                Hafta {">>"}
              </Link>
              </>
              )}
            </div>
          </div>
          {copiedTaskId ? <div className="planner-copy-banner">Görev kopyalandı. Hedef günün içine tıklayarak yapıştırın.</div> : null}

          {error ? <div className="auth-error">{error}</div> : null}

        </div>
      </section>

      {canManage && !selectedStudentId ? (
        <section className="planner-empty-state">
          <strong>Çalışma programını görüntülemek için öğrenci seçin.</strong>
          <span>Sol üstteki öğrenci alanından seçim yaptığınızda plan ve görevler burada açılır.</span>
        </section>
      ) : null}

      {selectedStudentId ? <><section className="planner-metrics">
        <div className="planner-metric">
          <span>Haftalik hedef</span>
          <strong>{formatMinutes(weekTargetMinutes)}</strong>
        </div>
        <div className="planner-metric">
          <span>Planlanan gorev</span>
          <strong>{scheduledTasks}</strong>
        </div>
        <div className="planner-metric">
          <span>Tamamlanan</span>
          <strong>{completedTasks}</strong>
        </div>
        <div className="planner-metric">
          <span>Riskli gorev</span>
          <strong>{overdueTasks}</strong>
        </div>
      </section>

      <section className="planner-panel">
        <div className={`${viewMode === "month" ? "planner-month-grid" : "planner-week-grid"}${hourlyMode ? " planner-week-grid--hourly" : ""}`}>
          {dayGroups.map((day) => (
            <div
              className={`planner-day${day.isToday ? " planner-day--today" : ""}${dragEnabled ? " planner-day--droppable" : ""}${day.isOutsideMonth ? " planner-day--outside" : ""}${copiedTaskId ? " planner-day--paste-ready" : ""}`}
              key={day.isoDate}
              onDragOver={(event) => {
                if (!dragEnabled || !canManage) {
                  return;
                }
                event.preventDefault();
              }}
              onDrop={(event) => {
                if (!dragEnabled || !canManage || !draggingTaskId) {
                  return;
                }
                event.preventDefault();
                void moveTask(draggingTaskId, day.isoDate);
                setDraggingTaskId(null);
              }}
            >
              <div className={`planner-day__header${day.isToday ? " planner-day__header--today" : ""}`}>
                <div>
                  <strong>{day.dayName}</strong>
                  <span>{day.shortDate}</span>
                </div>
                {canManage ? (
                  <button
                    className="planner-day__add"
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.isoDate);
                      router.push(
                        buildModalHref(pathname, weekOffset, selectedStudentId, "createTask", day.isoDate),
                      );
                    }}
                  >
                    +
                  </button>
                ) : null}
              </div>

              <div className="planner-day__body" onClick={() => copiedTaskId ? void pasteTask(day.isoDate) : undefined}>
                {day.tasks.length ? (
                  day.tasks.map((task) => (
                    <article
                      className={`planner-task-card${dragEnabled && canManage ? " planner-task-card--draggable" : ""}`}
                      draggable={dragEnabled && canManage}
                      key={task.id}
                      onClick={(event) => event.stopPropagation()}
                      onDragStart={() => setDraggingTaskId(task.id)}
                      onDragEnd={() => setDraggingTaskId(null)}
                    >
                      <div className="planner-task-card__top">
                        <strong>{task.title}</strong>
                        <span className={toneClass(task.status)}>{formatTaskStatus(task.status)}</span>
                      </div>
                      <div className="planner-task-card__meta">
                        <span>{task.lessonName ?? "Genel calisma"}</span>
                        {hourlyMode && task.dueAt ? <span>{formatClock(task.dueAt)}</span> : null}
                      </div>
                      <div className="planner-task-card__stats">
                        {task.targetMinutes ? <span>{task.targetMinutes} dk</span> : null}
                        {task.targetQuestionCount ? <span>{task.targetQuestionCount} soru</span> : null}
                        <span>%{task.progressPercent}</span>
                      </div>
                      {canManage ? (
                        <div className="planner-task-actions">
                          <TaskActions task={task} lessons={lessons} />
                          <button className={copiedTaskId === task.id ? "task-copy-button task-copy-button--active" : "task-copy-button"} type="button" onClick={() => setCopiedTaskId(task.id)} aria-label={`${task.title} görevini kopyala`}>
                            Kopyala
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="planner-empty">
                    {copiedTaskId ? "Buraya yapıştır" : "Boş · Görev sürükleyin"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section></> : null}

      <section className="planner-panel">
        <div className="section-card__header">
          <div>
            <div className="section-card__title">Aktif planlar</div>
            <div className="section-card__subtitle">Secili haftaya temas eden planlar ve yonetim aksiyonlari</div>
          </div>
        </div>
        <div className="list">
          {visiblePlans.length ? (
            visiblePlans.map((plan) => (
              <div className="list-item" key={plan.id}>
                <div className="list-item__meta">
                  <strong>{plan.title}</strong>
                  <span>
                    {plan.student.fullName} | {formatDayDate(plan.startDate)} - {formatDayDate(plan.endDate)}
                  </span>
                  {plan.notes ? <span>{plan.notes}</span> : null}
                </div>
                <div className="list-item__aside">
                  <span className="badge badge--success">
                    {plan.taskCount} gorev | {formatMinutes(plan.totalTargetMinutes)}
                  </span>
                    {canManage ? <StudyPlanActions plan={plan} students={students} /> : null}
                  </div>
                </div>
              ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Plan bulunmuyor</strong>
                <span>Bu hafta icin plan kaydi yok. Hizli Program ile yeni plan ekleyebilirsin.</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
