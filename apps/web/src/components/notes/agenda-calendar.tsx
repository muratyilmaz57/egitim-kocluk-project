"use client";

import { useMemo, useState } from "react";
import type { NoteRecord } from "@web/lib/api";

type AgendaCalendarProps = {
  notes: NoteRecord[];
};

function startOfWeek(value: Date) {
  const date = new Date(value);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, amount: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function isoDate(value: Date | string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthDays(value: Date) {
  const first = new Date(value.getFullYear(), value.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function AgendaCalendar({ notes }: AgendaCalendarProps) {
  const [view, setView] = useState<"week" | "month">("month");
  const [cursor, setCursor] = useState(() => new Date());
  const days = useMemo(
    () => view === "month"
      ? monthDays(cursor)
      : Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index)),
    [cursor, view],
  );
  const scheduledNotes = notes.filter((note) => note.scheduledFor);
  const label = view === "month"
    ? new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(cursor)
    : `${new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(days[0])} – ${new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(days[6])}`;

  function navigate(amount: number) {
    const next = new Date(cursor);
    if (view === "month") next.setMonth(next.getMonth() + amount);
    else next.setDate(next.getDate() + amount * 7);
    setCursor(next);
  }

  return (
    <section className="agenda-calendar">
      <header className="agenda-calendar__header">
        <div>
          <h2>Görüşme takvimi</h2>
          <p>Öğrenci ve veli görüşmelerini tarihleriyle birlikte takip edin.</p>
        </div>
        <div className="agenda-calendar__controls">
          <div className="agenda-calendar__switch" aria-label="Takvim görünümü">
            <button className={view === "week" ? "is-active" : ""} type="button" onClick={() => setView("week")}>Hafta</button>
            <button className={view === "month" ? "is-active" : ""} type="button" onClick={() => setView("month")}>Ay</button>
          </div>
          <button type="button" onClick={() => navigate(-1)} aria-label="Önceki dönem">‹</button>
          <button className="agenda-calendar__today" type="button" onClick={() => setCursor(new Date())}>Bugün</button>
          <button type="button" onClick={() => navigate(1)} aria-label="Sonraki dönem">›</button>
        </div>
      </header>
      <div className="agenda-calendar__label">{label}</div>
      <div className={`agenda-calendar__grid agenda-calendar__grid--${view}`}>
        {days.map((day) => {
          const key = isoDate(day);
          const dayNotes = scheduledNotes.filter((note) => note.scheduledFor && isoDate(note.scheduledFor) === key);
          const outside = view === "month" && day.getMonth() !== cursor.getMonth();
          return (
            <article className={`agenda-calendar__day${outside ? " is-outside" : ""}${key === isoDate(new Date()) ? " is-today" : ""}`} key={key}>
              <div className="agenda-calendar__day-title">
                <span>{new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(day)}</span>
                <strong>{day.getDate()}</strong>
              </div>
              <div className="agenda-calendar__events">
                {dayNotes.map((note) => (
                  <div className="agenda-calendar__event" key={note.id} title={note.content}>
                    <strong>{note.title}</strong>
                    <span>{new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(note.scheduledFor!))} · {note.studentName}</span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
