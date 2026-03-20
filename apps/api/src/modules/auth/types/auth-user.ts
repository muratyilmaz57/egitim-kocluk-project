export type UserRole = "admin" | "coach" | "student";
export type MfaMethod = "authenticator" | "email";

export type AuthUser = {
  id: string;
  sessionId?: string | null;
  email: string;
  fullName: string;
  role: UserRole;
  studentProfileId?: string | null;
  coachUserId?: string | null;
  mfaEnabled?: boolean;
  mfaMethod?: MfaMethod | null;
  passwordExpired?: boolean;
};
