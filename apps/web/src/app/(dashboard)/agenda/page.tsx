import { redirect } from "next/navigation";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { NoteActions } from "@web/components/notes/note-actions";
import { NoteCreateForm } from "@web/components/notes/note-create-form";
import { AgendaCalendar } from "@web/components/notes/agenda-calendar";
import { ModalFrame } from "@web/components/ui/modal-frame";
import { formatDate, getCurrentUser, getNotes, getStudents } from "@web/lib/api";

type AgendaPageProps = {
  searchParams?: Promise<{
    create?: string;
  }>;
};

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const createOpen = resolvedSearchParams?.create === "1";

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
              { label: "Kayit ekle", href: "/agenda?create=1", icon: "plus" },
              { label: "Mesajlar", href: "/messages" },
            ]
      }
    >
      {currentUser.role !== "student" ? <AgendaCalendar notes={notes} /> : null}

      <SectionCard
        title={currentUser.role === "student" ? "Bana acik notlar" : "Not ve ajanda akisi"}
        subtitle={
          currentUser.role === "student"
            ? "Koç tarafindan ogrenciye acilan gorusme ve not kayitlari"
            : "Gorusmeler, raporlar ve hatirlaticilar"
        }
        action={
          currentUser.role !== "student"
            ? { label: "Kayit ekle", href: "/agenda?create=1", icon: "plus" }
            : undefined
        }
      >
        <div className="list">
          {notes.length ? (
            notes.map((note) => (
              <div className="list-item" key={note.id}>
                <div className="list-item__meta">
                  <strong>{note.title}</strong>
                  <span>
                    {note.studentName} | {note.noteType} | {formatDate(note.scheduledFor ?? note.createdAt)}
                  </span>
                  {note.tags.length ? (
                    <div className="tag-list">
                      {note.tags.map((tag) => (
                        <span className="badge badge--success" key={`${note.id}-${tag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
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

      {currentUser.role !== "student" && createOpen ? (
        <ModalFrame
          closeHref="/agenda"
          title="Yeni ajanda kaydi"
          subtitle="Gorusme, hatirlatici veya haftalik not ekle"
        >
          <NoteCreateForm students={students} onSuccessRedirectTo="/agenda" />
        </ModalFrame>
      ) : null}
    </AppShell>
  );
}
