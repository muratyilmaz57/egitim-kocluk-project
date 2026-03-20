import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { MessageCreateForm } from "@web/components/messages/message-create-form";
import { StudentProfileHeader } from "@web/components/students/student-profile-header";
import { formatDate, getMessages } from "@web/lib/api";
import { getAuthorizedStudentPage } from "@web/lib/student-page";

export default async function StudentMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ currentUser, student }, messages] = await Promise.all([
    getAuthorizedStudentPage(id),
    getMessages(id),
  ]);
  const receiverUserId =
    currentUser.role === "student" ? currentUser.coachUserId ?? null : student.userId ?? null;
  const students = [
    {
      id: student.id,
      userId: student.userId ?? null,
      fullName: student.fullName,
      gradeLevel: student.gradeLevel,
      targetExam: student.targetExam,
      status: student.status,
      overallProgress: student.overallProgress,
      latestExamNet: student.latestExamNet,
    },
  ];

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ogrenci profili"
      title={`${student.fullName} mesajlari`}
      actions={[
        { label: "Genel bakis", href: `/students/${student.id}` },
        { label: "Ajanda", href: "/agenda" },
      ]}
    >
      <StudentProfileHeader currentUser={currentUser} student={student} activeTab="messages" />

      <section className="two-column">
        <SectionCard title="Mesaj gonder" subtitle="Bu ogrenciye bagli sohbet akisi">
          <MessageCreateForm
            students={students}
            receiverUserId={receiverUserId}
            defaultStudentId={student.id}
          />
        </SectionCard>

        <SectionCard title="Sohbet gecmisi" subtitle="Koç ve ogrenci arasindaki mesajlar">
          <div className="list">
            {messages.length ? (
              messages.map((message) => (
                <div className="list-item" key={message.id}>
                  <div className="list-item__meta">
                    <strong>{message.sender.fullName} → {message.receiver.fullName}</strong>
                    <span>{message.content}</span>
                  </div>
                  <span className="badge badge--warning">{formatDate(message.createdAt)}</span>
                </div>
              ))
            ) : (
              <div className="list-item">
                <div className="list-item__meta">
                  <strong>Mesaj yok</strong>
                  <span>Bu ogrenciyle ilgili mesaj kaydi bulunmuyor.</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}
