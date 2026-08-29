import { getNotifications } from "@web/lib/api";
import type { SessionUser } from "@web/lib/api";
import { AppShellFrame, type AppShellAction } from "./app-shell-frame";

type AppShellProps = {
  title: string;
  eyebrow: string;
  user: SessionUser;
  actions?: AppShellAction[];
  hidePageHeading?: boolean;
  children: React.ReactNode;
};

export async function AppShell({ title, eyebrow, user, actions = [], hidePageHeading = false, children }: AppShellProps) {
  const notifications = await getNotifications(false, 6);
  return (
    <AppShellFrame
      title={title}
      eyebrow={eyebrow}
      user={user}
      actions={actions}
      hidePageHeading={hidePageHeading}
      notifications={notifications}
    >
      {children}
    </AppShellFrame>
  );
}
