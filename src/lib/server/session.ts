import { SignJWT, jwtVerify } from "jose";
import { AppRole, normalizeRole } from "@/lib/rbac";

export const APP_SESSION_COOKIE_NAME = "tn_session";
export const APP_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

export type AppSessionPayload = {
  uid: string;
  role: AppRole;
  email?: string;
};

function getSessionSecret(): Uint8Array {
  const secret =
    process.env.APP_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== "production" ? "tessy-nails-dev-session-secret" : "");

  if (!secret) {
    throw new Error("APP_SESSION_SECRET is required in production.");
  }

  return new TextEncoder().encode(secret);
}

export async function createAppSessionToken(payload: AppSessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email ?? null })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.uid)
    .setIssuedAt()
    .setExpirationTime(`${APP_SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifyAppSessionToken(token: string): Promise<AppSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    const uid = payload.sub;
    if (!uid) return null;

    const role = normalizeRole(typeof payload.role === "string" ? payload.role : undefined);
    const email = typeof payload.email === "string" ? payload.email : undefined;

    return { uid, role, email };
  } catch {
    return null;
  }
}

export function getCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null;

  const pairs = cookieHeader.split(";").map((pair) => pair.trim());
  for (const pair of pairs) {
    if (!pair.startsWith(`${cookieName}=`)) continue;
    const [, ...rest] = pair.split("=");
    const rawValue = rest.join("=");
    return rawValue ? decodeURIComponent(rawValue) : null;
  }

  return null;
}
