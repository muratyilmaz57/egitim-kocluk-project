import { redirect } from "next/navigation";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { MessagesAutoRead } from "@web/components/messages/messages-auto-read";
import { MessageCreateForm } from "@web/components/messages/message-create-form";
import { MessagesLiveFeed } from "@web/components/messages/messages-live-feed";
import {
  getCurrentUser,
  getMessages,
  getStudent,
  getStudents,
} from "@web/lib/api";

export default async function MessagesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const [messages, coachStudents, linkedStudent] = await Promise.all([
    getMessages(currentUser.studentProfileId ?? undefined),
    currentUser.role === "coach" ? getStudents() : Promise.resolve([]),
    currentUser.role === "student" && currentUser.studentProfileId
      ? getStudent(currentUser.studentProfileId)
      : Promise.resolve(null),
  ]);
  const composeStudents =
    currentUser.role === "coach"
      ? coachStudents
      : linkedStudent
        ? [
            {
              id: linkedStudent.id,
              userId: linkedStudent.userId ?? null,
              fullName: linkedStudent.fullName,
              gradeLevel: linkedStudent.gradeLevel,
              targetExam: linkedStudent.targetExam,
              status: linkedStudent.status,
              overallProgress: linkedStudent.overallProgress,
              latestExamNet: linkedStudent.latestExamNet,
            },
          ]
        : [];
  const receiverUserId =
    currentUser.role === "student" ? currentUser.coachUserId ?? null : null;
  const unreadIncomingCount = messages.filter(
    (message) => !message.isRead && message.receiver.id === currentUser.id,
  ).length;

  return (
    <AppShell
      user={currentUser}
      eyebrow="Iletisim"
      title={currentUser.role === "student" ? "Koç ile mesajlarim" : "Mesajlar"}
      actions={[{ label: "Yeni mesaj", href: "/messages" }]}
    >
      <MessagesAutoRead
        unreadCount={unreadIncomingCount}
        studentId={currentUser.studentProfileId ?? null}
      />
      <section className="two-column">
        <SectionCard
          title="Mesaj gonder"
          subtitle="Canli mesaj kaydi olusturur"
        >
          <MessageCreateForm
            students={composeStudents}
            receiverUserId={receiverUserId}
            defaultStudentId={currentUser.studentProfileId ?? null}
          />
        </SectionCard>

        <SectionCard
          title="Son mesajlar"
          subtitle="Koc ve ogrenci arasindaki canli akis"
        >
          <MessagesLiveFeed currentUser={currentUser} initialMessages={messages} />
        </SectionCard>
      </section>
    </AppShell>
  );
}
