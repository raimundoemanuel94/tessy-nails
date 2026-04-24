import { NextRequest, NextResponse } from "next/server";
import { normalizeRole } from "@/lib/rbac";
import {
  APP_SESSION_COOKIE_NAME,
  getCookieValue,
  verifyAppSessionToken,
} from "@/lib/server/session";

const ADMIN_ROOTS = [
  "/dashboard",
  "/agenda",
  "/agendamentos",
  "/clientes",
  "/servicos",
  "/relatorios",
  "/configuracoes",
] as const;

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROOTS.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isClientRoute(pathname: string): boolean {
  return pathname === "/cliente" || pathname.startsWith("/cliente/");
}

function isAdminUserRole(role: string): boolean {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "admin" || normalizedRole === "professional";
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

function redirectByRole(request: NextRequest, role: string) {
  const target = isAdminUserRole(role) ? "/dashboard" : "/cliente";
  return NextResponse.redirect(new URL(target, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminRoute = isAdminRoute(pathname);
  const clientRoute = isClientRoute(pathname);
  const loginRoute = pathname === "/login";

  if (!adminRoute && !clientRoute && !loginRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(APP_SESSION_COOKIE_NAME)?.value
    ?? getCookieValue(request.headers.get("cookie"), APP_SESSION_COOKIE_NAME);
  const session = token ? await verifyAppSessionToken(token) : null;

  if (!session) {
    if (loginRoute) return NextResponse.next();
    return redirectToLogin(request);
  }

  if (loginRoute) {
    return redirectByRole(request, session.role);
  }

  if (adminRoute && !isAdminUserRole(session.role)) {
    return NextResponse.redirect(new URL("/cliente", request.url));
  }

  if (clientRoute && isAdminUserRole(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/agenda/:path*",
    "/agendamentos/:path*",
    "/clientes/:path*",
    "/servicos/:path*",
    "/relatorios/:path*",
    "/configuracoes/:path*",
    "/cliente/:path*",
  ],
};
