import { redirect } from "next/navigation";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { NoteActions } from "@web/components/notes/note-actions";
import { NoteCreateForm } from "@web/components/notes/note-create-form";
import { formatDate, getCurrentUser, getNotes, getStudents } from "@web/lib/api";

export default async function AgendaPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const [notes, students] = await Promise.all([
    getNotes(),
    currentUser.role === "student" ? Promise.resolve([]) : getStudents(),
  ]);

  return (
    <AppShell
      user={currentUser}
      eyebrow="Planlama"
      title="Ajanda"
      actions={
        currentUser.role === "student"
          ? [{ label: "Mesajlar", href: "/messages" }]
          : [
              { label: "Gorusme ekle", href: "/agenda" },
              { label: "Hatirlatici", href: "/agenda" },
            ]
      }
    >
      {currentUser.role !== "student" ? (
        <SectionCard
          title="Yeni ajanda kaydi"
          subtitle="Gorusme, hatirlatici veya haftalik not ekle"
        >
          <NoteCreateForm students={students} />
        </SectionCard>
      ) : null}

      <SectionCard
        title={currentUser.role === "student" ? "Bana acik notlar" : "Not ve ajanda akisi"}
        subtitle={
          currentUser.role === "student"
            ? "Koç tarafindan ogrenciye acilan gorusme ve not kayitlari"
            : "Gorusmeler, raporlar ve hatirlaticilar"
        }
      >
        <div className="list">
          {notes.length ? (
            notes.map((note) => (
              <div className="list-item" key={note.id}>
                <div className="list-item__meta">
                  <strong>{note.title}</strong>
                  <span>
                    {note.studentName} | {note.noteType} | {formatDate(note.createdAt)}
                  </span>
                  <span>{note.content}</span>
                </div>
                <div className="list-item__aside">
                  <span className="badge badge--warning">{note.visibility}</span>
                  {currentUser.role !== "student" ? <NoteActions note={note} /> : null}
                </div>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Ajanda kaydi yok</strong>
                <span>Gorusme ve hatirlaticilar daha sonra burada listelenecek.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
