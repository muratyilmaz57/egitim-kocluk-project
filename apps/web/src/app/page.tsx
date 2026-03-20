import { redirect } from "next/navigation";
import { getSessionToken } from "@web/lib/auth";
import { getDefaultAppPathFromToken } from "@web/lib/jwt";

export default async function HomePage() {
  const token = await getSessionToken();
  redirect(token ? getDefaultAppPathFromToken(token) : "/login");
}
