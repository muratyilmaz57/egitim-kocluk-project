import type { ReactNode, SVGProps } from "react";

export type AppIconName =
  | "dashboard"
  | "notifications"
  | "activity"
  | "students"
  | "lessons"
  | "plans"
  | "tasks"
  | "exams"
  | "pomodoro"
  | "messages"
  | "agenda"
  | "library"
  | "settings"
  | "profile"
  | "spark"
  | "plus"
  | "logout"
  | "chart"
  | "target"
  | "focus"
  | "shield";

type AppIconProps = {
  name: AppIconName;
  className?: string;
} & SVGProps<SVGSVGElement>;

export function AppIcon({ name, className, ...props }: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

const iconPaths: Record<AppIconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="11" width="7" height="10" rx="2" />
      <rect x="3" y="13" width="7" height="8" rx="2" />
    </>
  ),
  notifications: (
    <>
      <path d="M8 17h8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
      <path d="M6 17V11a6 6 0 1 1 12 0v6l1.6 1.6A1 1 0 0 1 18.9 20H5.1a1 1 0 0 1-.7-1.4Z" />
    </>
  ),
  activity: (
    <>
      <path d="M3 12h4l2.5-5 4 10 2.5-5H21" />
      <circle cx="6" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="18" cy="12" r="1" />
    </>
  ),
  students: (
    <>
      <path d="M16 20a4 4 0 0 0-8 0" />
      <circle cx="12" cy="9" r="3.5" />
      <path d="M20 19a3 3 0 0 0-3-3" />
      <path d="M7 16a3 3 0 0 0-3 3" />
    </>
  ),
  lessons: (
    <>
      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v16H7.5A2.5 2.5 0 0 0 5 20.5Z" />
      <path d="M5 4.5V20.5" />
      <path d="M9 6h7" />
      <path d="M9 10h8" />
      <path d="M9 14h6" />
    </>
  ),
  plans: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
      <path d="M8 14h3" />
      <path d="M13.5 16.5 15 18l3-3" />
    </>
  ),
  tasks: (
    <>
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="m4 6 1.3 1.3L7.7 5" />
      <path d="m4 12 1.3 1.3L7.7 11" />
      <path d="m4 18 1.3 1.3L7.7 17" />
    </>
  ),
  exams: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-8" />
      <path d="M22 20v-5" />
    </>
  ),
  pomodoro: (
    <>
      <path d="M9 3h6" />
      <path d="M12 7v5l3 2" />
      <circle cx="12" cy="14" r="7" />
      <path d="m16.5 5.5 1.5-1.5" />
    </>
  ),
  messages: (
    <>
      <path d="M5 18.5 4 21l4.3-1.3a9 9 0 1 0-3.3-3.2Z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </>
  ),
  agenda: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 9h16" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </>
  ),
  library: (
    <>
      <path d="M5 4h4v16H5z" />
      <path d="M10 4h5v16h-5z" />
      <path d="m17 6 3 14" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4H20a1 1 0 0 0-.6.6Z" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.8 4.7L19 9.5l-4.1 2.7L16.4 17 12 14.1 7.6 17l1.5-4.8L5 9.5l5.2-1.8Z" />
      <path d="m19.5 3 .6 1.6L21.7 5l-1.6.5-.6 1.6-.5-1.6L17.4 5l1.6-.4Z" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19h16" />
      <path d="M7 15V9" />
      <path d="M12 15V5" />
      <path d="M17 15v-3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 5v2" />
      <path d="M12 17v2" />
      <path d="M5 12h2" />
      <path d="M17 12h2" />
    </>
  ),
  focus: (
    <>
      <path d="M12 3c1.6 2.6 4.4 4.9 4.4 8.2A4.4 4.4 0 0 1 12 15.6a4.4 4.4 0 0 1-4.4-4.4C7.6 7.9 10.4 5.6 12 3Z" />
      <path d="M8.5 20c.7-1.8 2-2.7 3.5-2.7s2.8.9 3.5 2.7" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.4 2.8 8.5 7 10 4.2-1.5 7-5.6 7-10V6Z" />
      <path d="m9.5 12 1.7 1.7 3.8-4.2" />
    </>
  ),
};
