import { NextResponse } from "next/server";
import { AppRole, STAFF_ROLES, isStaffRole } from "@/lib/rbac";
import {
  APP_SESSION_COOKIE_NAME,
  AppSessionPayload,
  getCookieValue,
  verifyAppSessionToken,
} from "@/lib/server/session";

export class AuthGuardError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isAuthGuardError(error: unknown): error is AuthGuardError {
  return error instanceof AuthGuardError;
}

export function authGuardErrorResponse(error: AuthGuardError) {
  return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
}

async function getCurrentSession(request: Request): Promise<AppSessionPayload | null> {
  const token = getCookieValue(request.headers.get("cookie"), APP_SESSION_COOKIE_NAME);
  if (!token) return null;
  return verifyAppSessionToken(token);
}

export async function requireAuth(request: Request): Promise<AppSessionPayload> {
  const session = await getCurrentSession(request);
  if (!session) {
    throw new AuthGuardError("Autenticacao obrigatoria", 401, "AUTH_REQUIRED");
  }
  return session;
}

export async function getCurrentUserRole(request: Request): Promise<AppRole | null> {
  const session = await getCurrentSession(request);
  return session?.role ?? null;
}

export async function requireRole(request: Request, ...roles: AppRole[]): Promise<AppSessionPayload> {
  const session = await requireAuth(request);
  if (!roles.includes(session.role)) {
    throw new AuthGuardError("Permissao insuficiente", 403, "FORBIDDEN");
  }
  return session;
}

export async function requireStaff(request: Request): Promise<AppSessionPayload> {
  const session = await requireAuth(request);
  if (!isStaffRole(session.role)) {
    throw new AuthGuardError("Permissao de equipe obrigatoria", 403, "STAFF_REQUIRED");
  }
  return session;
}

export { STAFF_ROLES };
