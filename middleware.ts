import { NextRequest, NextResponse } from "next/server";
import { isStaffRole, normalizeRole } from "@/lib/rbac";
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

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

function redirectByRole(request: NextRequest, role: string) {
  const target = isStaffRole(normalizeRole(role)) ? "/dashboard" : "/cliente";
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

  if (adminRoute && !isStaffRole(session.role)) {
    return NextResponse.redirect(new URL("/cliente", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
