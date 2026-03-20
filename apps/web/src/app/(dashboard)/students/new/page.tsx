import { redirect } from "next/navigation";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { StudentCreateForm } from "@web/components/students/student-create-form";
import { getCurrentUser } from "@web/lib/api";

export default async function NewStudentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "student") {
    redirect(user.studentProfileId ? `/students/${user.studentProfileId}` : "/login");
  }

  return (
    <AppShell
      user={user}
      eyebrow="Ogrenci yonetimi"
      title="Yeni ogrenci ekle"
      actions={[{ label: "Listeye don", href: "/students" }]}
    >
      <SectionCard
        title="Ogrenci kayit formu"
        subtitle="Bu form backend uzerinden canli veritabanina kayit acar"
      >
        <StudentCreateForm />
      </SectionCard>
    </AppShell>
  );
}
