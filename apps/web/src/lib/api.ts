import { getApiBaseUrl, getSessionToken } from "./auth";
import { formatDate, formatDateTime, formatMinutes } from "./format";
export { formatDate, formatDateTime, formatMinutes } from "./format";

export type SessionUser = {
  id: string;
  sessionId?: string | null;
  email: string;
  fullName: string;
  role: "admin" | "coach" | "student";
  studentProfileId?: string | null;
  coachUserId?: string | null;
  mfaEnabled?: boolean;
  mfaMethod?: "authenticator" | "email" | null;
  passwordExpired?: boolean;
};

export type DashboardPayload = {
  summary: {
    totalStudents: number;
    totalLessons: number;
    completedTasksToday: number;
    dailyStudyMinutes: number;
    unreadMessages: number;
    overallCompletionPercent: number;
    upcomingMeetings: number;
  };
  focusTrend: Array<{
    date: string;
    label: string;
    minutes: number;
  }>;
  taskStatusBreakdown: Array<{
    status: string;
    label: string;
    tone: string;
    count: number;
  }>;
  examTrend: Array<{
    id: string;
    label: string;
    examName: string;
    studentName: string;
    totalNet: number;
  }>;
  todayTasks: Array<{
    id: string;
    title: string;
    meta: string;
    status: string;
    progressPercent: number;
    dueAt: string | null;
  }>;
  riskStudents: Array<{
    id: string;
    fullName: string;
    gradeLevel: string;
    openTasks: number;
    avgProgress: number;
  }>;
  recentMessages: Array<{
    id: string;
    content: string;
    isRead: boolean;
    studentName: string;
    createdAt: string;
  }>;
};

export type ActivityPayload = {
  items: Array<{
    id: string;
    type: "task" | "exam" | "message" | "note" | "plan" | "pomodoro";
    occurredAt: string;
    title: string;
    description: string;
    tone: "success" | "warning" | "neutral";
    href: string;
    studentName: string;
  }>;
  summary: {
    totalItems: number;
    trackedStudents: number;
    unreadMessages: number;
    completedTasks: number;
  };
};

export type NotificationRecord = {
  id: string;
  type: "task" | "exam" | "message" | "note" | "plan" | "pomodoro" | "resource";
  title: string;
  body: string | null;
  href: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  actorName: string | null;
  studentName: string | null;
};

export type NotificationPayload = {
  unreadCount: number;
  items: NotificationRecord[];
};

export type NotificationPreferenceRecord = {
  type: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

export type SecurityPayload = {
  mfaEnabled: boolean;
  mfaMethod: "authenticator" | "email" | null;
  hasPendingSetup: boolean;
  pendingMethod: "authenticator" | "email" | null;
  passwordChangedAt: string;
  passwordExpiresAt: string;
  passwordExpired: boolean;
};

export type AuditLogRecord = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata: unknown;
  createdAt: string;
  actorName: string | null;
  subjectName: string | null;
  studentName: string | null;
};

export type StudentSummary = {
  id: string;
  userId?: string | null;
  fullName: string;
  gradeLevel: string;
  photoUrl?: string | null;
  parentName?: string | null;
  targetExam: string | null;
  status: string;
  overallProgress: number;
  latestExamNet: number | null;
};

export type StudentDetail = StudentSummary & {
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  schoolName: string | null;
  enrollmentDate: string;
  stats: {
    completionPercent: number;
    totalFocusMinutes: number;
    latestExamNet: number;
    missingTopicCount: number;
    unreadMessageCount: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    lessonName: string | null;
    topicName: string | null;
    progressPercent: number;
    status: string;
    targetMinutes: number;
    targetQuestionCount: number;
  }>;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }>;
  examTrend: Array<{
    id: string;
    examName: string;
    examDate: string;
    totalNet: number;
  }>;
  weakTopics: Array<{
    id: string;
    topicName: string;
    priority: number;
  }>;
};

export type TaskRecord = {
  id: string;
  title: string;
  taskType: string;
  description: string | null;
  resourceUrl: string | null;
  resourceFilePath: string | null;
  resourceFileName: string | null;
  targetQuestionCount: number;
  targetMinutes: number;
  priority: string;
  status: string;
  progressPercent: number;
  dueAt: string | null;
  lessonId: string | null;
  topicId: string | null;
  student: {
    id: string;
    fullName: string;
    gradeLevel: string;
  };
  lessonName: string | null;
  topicName: string | null;
};

export type ExamRecord = {
  id: string;
  examName: string;
  examType: string;
  examDate: string;
  totalNet: number;
  score: number | null;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  rankInGroup: number | null;
  notes?: string | null;
  student: {
    id: string;
    fullName: string;
    gradeLevel: string;
  };
};

export type LessonRecord = {
  id: string;
  name: string;
  code: string;
  color: string | null;
  topicCount: number;
  topics: Array<{
    id: string;
    name: string;
    gradeLevel: string | null;
    difficultyLevel: number | null;
    estimatedMinutes: number | null;
  }>;
};

export type StudyPlanRecord = {
  id: string;
  title: string;
  planType: string;
  status: string;
  startDate: string;
  endDate: string;
  totalTargetMinutes: number;
  notes: string | null;
  taskCount: number;
  student: {
    id: string;
    fullName: string;
  };
};

export type PomodoroRecord = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  breakMinutes: number;
  sessionType: string;
  deviceType: string | null;
  notes: string | null;
  student: {
    id: string;
    fullName: string;
  };
  taskTitle: string | null;
};

export type MessageRecord = {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  studentId: string | null;
  studentName: string | null;
  sender: {
    id: string;
    fullName: string;
  };
  receiver: {
    id: string;
    fullName: string;
  };
};

export type ResourceRecord = {
  id: string;
  title: string;
  description: string | null;
  resourceType: string;
  url: string | null;
  filePath: string | null;
  lessonId?: string | null;
  topicId?: string | null;
  targetGradeLevel: string | null;
  lessonName: string | null;
  topicName: string | null;
  isFeatured: boolean;
};

export type NoteRecord = {
  id: string;
  title: string;
  content: string;
  noteType: string;
  visibility: string;
  studentId?: string;
  rating?: number | null;
  scheduledFor: string | null;
  createdAt: string;
  studentName: string;
  tags: string[];
};

async function apiGet<T>(path: string): Promise<T> {
  const token = await getSessionToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store",
    headers: token
      ? {
          authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path} with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getDashboardData(): Promise<DashboardPayload | null> {
  try {
    return await apiGet<DashboardPayload>("/dashboard/summary");
  } catch {
    return null;
  }
}

export async function getActivityFeed(): Promise<ActivityPayload | null> {
  try {
    return await apiGet<ActivityPayload>("/dashboard/activity");
  } catch {
    return null;
  }
}

export async function getNotifications(unread?: boolean, limit?: number): Promise<NotificationPayload | null> {
  try {
    const params = new URLSearchParams();
    if (unread) {
      params.set("unread", "true");
    }
    if (typeof limit === "number") {
      params.set("limit", String(limit));
    }
    const query = params.size ? `?${params.toString()}` : "";
    return await apiGet<NotificationPayload>(`/notifications${query}`);
  } catch {
    return null;
  }
}

export async function getNotificationPreferences(): Promise<NotificationPreferenceRecord[]> {
  try {
    return await apiGet<NotificationPreferenceRecord[]>("/notifications/preferences");
  } catch {
    return [];
  }
}

export async function getSecurityStatus(): Promise<SecurityPayload | null> {
  try {
    return await apiGet<SecurityPayload>("/auth/security");
  } catch {
    return null;
  }
}

export async function getAuditLogs(limit?: number): Promise<AuditLogRecord[]> {
  try {
    const query = typeof limit === "number" ? `?limit=${encodeURIComponent(String(limit))}` : "";
    return await apiGet<AuditLogRecord[]>(`/audit-logs${query}`);
  } catch {
    return [];
  }
}

export async function getStudents(): Promise<StudentSummary[]> {
  try {
    return await apiGet<StudentSummary[]>("/students");
  } catch {
    return [];
  }
}

export async function getStudent(id: string): Promise<StudentDetail | null> {
  try {
    return await apiGet<StudentDetail>(`/students/${id}`);
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    return await apiGet<SessionUser>("/auth/me");
  } catch {
    return null;
  }
}

export async function getTasks(studentId?: string): Promise<TaskRecord[]> {
  try {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return await apiGet<TaskRecord[]>(`/tasks${query}`);
  } catch {
    return [];
  }
}

export async function getExamResults(studentId?: string): Promise<ExamRecord[]> {
  try {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return await apiGet<ExamRecord[]>(`/exam-results${query}`);
  } catch {
    return [];
  }
}

export async function getLessons(): Promise<LessonRecord[]> {
  try {
    return await apiGet<LessonRecord[]>("/lessons");
  } catch {
    return [];
  }
}

export async function getStudyPlans(): Promise<StudyPlanRecord[]> {
  try {
    return await apiGet<StudyPlanRecord[]>("/study-plans");
  } catch {
    return [];
  }
}

export async function getStudyPlansForStudent(studentId?: string): Promise<StudyPlanRecord[]> {
  try {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return await apiGet<StudyPlanRecord[]>(`/study-plans${query}`);
  } catch {
    return [];
  }
}

export async function getPomodoroSessions(studentId?: string): Promise<PomodoroRecord[]> {
  try {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return await apiGet<PomodoroRecord[]>(`/pomodoro-sessions${query}`);
  } catch {
    return [];
  }
}

export async function getMessages(studentId?: string): Promise<MessageRecord[]> {
  try {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return await apiGet<MessageRecord[]>(`/messages${query}`);
  } catch {
    return [];
  }
}

export async function getResources(): Promise<ResourceRecord[]> {
  try {
    return await apiGet<ResourceRecord[]>("/resources");
  } catch {
    return [];
  }
}

export async function getNotes(noteType?: string): Promise<NoteRecord[]> {
  try {
    const query = noteType ? `?noteType=${encodeURIComponent(noteType)}` : "";
    return await apiGet<NoteRecord[]>(`/notes${query}`);
  } catch {
    return [];
  }
}

export function formatStudentStatus(status: string) {
  switch (status) {
    case "active":
      return "Aktif";
    case "paused":
      return "Duraklatildi";
    case "graduated":
      return "Mezun";
    default:
      return status;
  }
}

export function formatTaskStatus(status: string) {
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
