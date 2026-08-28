import { redirect } from "next/navigation";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { TaskActions } from "@web/components/tasks/task-actions";
import { TaskCreateForm } from "@web/components/tasks/task-create-form";
import { ModalFrame } from "@web/components/ui/modal-frame";
import {
  formatDate,
  formatTaskStatus,
  getCurrentUser,
  getLessons,
  getStudents,
  getTasks,
} from "@web/lib/api";

function matches(value: string, query: string) {
  return value.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"));
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    create?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const [{ q = "", status = "", create = "" }, students, tasks, lessons] = await Promise.all([
    searchParams,
    currentUser.role === "student" ? Promise.resolve([]) : getStudents(),
    getTasks(),
    currentUser.role === "student" ? Promise.resolve([]) : getLessons(),
  ]);
  const createOpen = create === "1";
  const filteredTasks = tasks.filter((task) => {
    const queryMatch = q
      ? matches(
          `${task.title} ${task.student.fullName} ${task.lessonName ?? ""} ${task.topicName ?? ""}`,
          q,
        )
      : true;
    const statusMatch = status ? task.status === status : true;
    return queryMatch && statusMatch;
  });
  const exportHref = `/api/export/tasks?q=${encodeURIComponent(q)}&status=${encodeURIComponent(
    status,
  )}`;

  return (
    <AppShell
      user={currentUser}
      eyebrow="Gorev yonetimi"
      title="Gorev panosu"
      actions={
        currentUser.role === "student"
          ? [{ label: "Planlarim", href: "/plans" }]
          : [
              { label: "Gorev ekle", href: "/tasks?create=1", icon: "plus" },
              { label: "Planlar", href: "/plans" },
            ]
      }
    >
      <section className="two-column">
        <SectionCard
          title={currentUser.role === "student" ? "Aktif gorevlerim" : "Aktif gorevler"}
          subtitle={currentUser.role === "student" ? "Kendi gorev durumun" : "Tum ogrenciler icin son durum"}
          action={
            currentUser.role === "student"
              ? { label: "CSV indir", href: exportHref }
              : { label: "Gorev ekle", href: "/tasks?create=1", icon: "plus" }
          }
        >
          <form className="filter-form" method="get" style={{ marginBottom: 14 }}>
            <input defaultValue={q} name="q" placeholder="Gorev, ogrenci veya konu ara" />
            <select defaultValue={status} name="status">
              <option value="">Tum durumlar</option>
              <option value="pending">Bekliyor</option>
              <option value="in_progress">Devam ediyor</option>
              <option value="completed">Tamamlandi</option>
              <option value="missed">Gecikti</option>
            </select>
            <button className="secondary-button" type="submit">
              Filtrele
            </button>
          </form>
          <div className="list">
            {filteredTasks.length ? (
              filteredTasks.map((task) => (
                <div className="list-item" key={task.id}>
                  <div className="list-item__meta">
                    <strong>{task.title}</strong>
                    <span>
                      {task.student.fullName} | {task.lessonName ?? "Ders yok"} |{" "}
                      {task.targetMinutes
                        ? `${task.targetMinutes} dk`
                        : `${task.targetQuestionCount} soru`}
                    </span>
                    {task.resourceUrl || task.resourceFilePath ? (
                      <span className="task-resource-links">
                        {task.resourceUrl ? <a href={task.resourceUrl} target="_blank" rel="noreferrer">Bağlantıyı aç</a> : null}
                        {task.resourceFilePath ? <a href={task.resourceFilePath} target="_blank" rel="noreferrer">{task.resourceFileName ?? "Dosyayı aç"}</a> : null}
                      </span>
                    ) : null}
                  </div>
                  <div className="list-item__aside">
                    <span className="badge badge--warning">
                      {formatTaskStatus(task.status)}
                    </span>
                    {currentUser.role !== "student" ? (
                      <TaskActions task={task} lessons={lessons} />
                    ) : null}
                  </div>
                </div>
              ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Gorev kaydi bulunmuyor</strong>
                <span>Secili filtrelerle eslesen gorev yok.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
      </section>

      <SectionCard
        title={currentUser.role === "student" ? "Gorev ayrintilarim" : "Gorev tablosu"}
        subtitle="Son teslim tarihi ve ilerleme yuzdesi"
      >
        <div className="list">
          {filteredTasks.length ? (
            filteredTasks.map((task) => (
              <div className="list-item" key={`${task.id}-detail`}>
                <div className="list-item__meta">
                  <strong>
                    {task.student.fullName} | {task.title}
                  </strong>
                  <span>
                    {task.topicName ?? "Konu yok"} | Son tarih:{" "}
                    {task.dueAt ? formatDate(task.dueAt) : "Tanimsiz"}
                  </span>
                </div>
                <div className="list-item__aside">
                  <span className="badge badge--success">%{task.progressPercent}</span>
                  {currentUser.role !== "student" ? (
                    <TaskActions task={task} lessons={lessons} />
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Henuz gorev yok</strong>
                <span>Secili filtrelerle eslesen gorev bulunmuyor.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {currentUser.role !== "student" && createOpen ? (
        <ModalFrame
          closeHref="/tasks"
          title="Gorev Ekle"
          subtitle={`${selectedStudentLabel(students)} icin yeni gorev akisi`}
        >
          <TaskCreateForm
            students={students}
            lessons={lessons}
            onSuccessRedirectTo="/tasks"
          />
        </ModalFrame>
      ) : null}
    </AppShell>
  );
}

function selectedStudentLabel(students: Awaited<ReturnType<typeof getStudents>>) {
  if (students.length === 1) {
    return students[0]?.fullName ?? "Secili ogrenci";
  }

  return "secili ogrenci";
}
