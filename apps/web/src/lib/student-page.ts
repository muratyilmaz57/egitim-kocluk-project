import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser, getStudent } from "./api";

export async function getAuthorizedStudentPage(studentId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role === "student" && currentUser.studentProfileId !== studentId) {
    redirect(currentUser.studentProfileId ? `/students/${currentUser.studentProfileId}` : "/login");
  }

  const student = await getStudent(studentId);
  if (!student) {
    redirect(currentUser.role === "student" && currentUser.studentProfileId ? `/students/${currentUser.studentProfileId}` : "/students");
  }

  return {
    currentUser,
    student,
  };
}
