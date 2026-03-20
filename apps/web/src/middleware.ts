import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./lib/constants";
import { getDefaultAppPathFromToken, isJwtExpired, parseJwtPayload } from "./lib/jwt";

const protectedPrefixes = [
  "/dashboard",
  "/students",
  "/lessons",
  "/plans",
  "/tasks",
  "/exams",
  "/pomodoro",
  "/messages",
  "/agenda",
  "/library",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isTokenExpired = accessToken ? isJwtExpired(accessToken) : true;
  const tokenPayload = parseJwtPayload(accessToken);

  if (pathname === "/" && !accessToken && !refreshToken) {
    return NextResponse.next();
  }

  if ((pathname === "/" || isProtected || pathname === "/login") && refreshToken && isTokenExpired) {
    const refreshUrl = new URL("/api/session/refresh", request.url);
    const returnTo = pathname === "/login" ? getDefaultAppPathFromToken(accessToken) : pathname;
    refreshUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(refreshUrl);
  }

  if (pathname === "/login" && accessToken && !isTokenExpired) {
    return NextResponse.redirect(new URL(getDefaultAppPathFromToken(accessToken), request.url));
  }

  if (pathname === "/" && accessToken && !isTokenExpired) {
    return NextResponse.redirect(new URL(getDefaultAppPathFromToken(accessToken), request.url));
  }

  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isProtected && isTokenExpired) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    tokenPayload?.passwordExpired &&
    pathname !== "/settings/security" &&
    !pathname.startsWith("/settings/security/")
  ) {
    return NextResponse.redirect(new URL("/settings/security?force=1", request.url));
  }

  if (
    tokenPayload?.role === "student" &&
    (pathname === "/dashboard" || pathname === "/students/new")
  ) {
    return NextResponse.redirect(
      new URL(getDefaultAppPathFromToken(accessToken), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/students/:path*",
    "/lessons/:path*",
    "/plans/:path*",
    "/tasks/:path*",
    "/exams/:path*",
    "/pomodoro/:path*",
    "/messages/:path*",
    "/agenda/:path*",
    "/library/:path*",
    "/settings/:path*",
    "/api/session/refresh",
  ],
};
