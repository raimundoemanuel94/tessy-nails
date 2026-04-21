import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeRole } from "@/lib/rbac";
import { verifyFirebaseIdToken, getFirebaseProjectId } from "@/lib/server/firebase-token";
import {
  APP_SESSION_COOKIE_NAME,
  APP_SESSION_TTL_SECONDS,
  createAppSessionToken,
} from "@/lib/server/session";

const SessionBodySchema = z.object({
  idToken: z.string().min(1, "idToken e obrigatorio"),
});

async function getUserRoleFromFirestore(uid: string, idToken: string) {
  try {
    const projectId = getFirebaseProjectId();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return "client";

    const data = (await response.json()) as { fields?: { role?: { stringValue?: string } } };
    return normalizeRole(data.fields?.role?.stringValue);
  } catch {
    return "client";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SessionBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
    }

    const firebasePayload = await verifyFirebaseIdToken(parsed.data.idToken);
    const uid = firebasePayload.user_id || firebasePayload.sub;

    if (!uid) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    const role = await getUserRoleFromFirestore(uid, parsed.data.idToken);
    const email = typeof firebasePayload.email === "string" ? firebasePayload.email : undefined;

    const sessionToken = await createAppSessionToken({ uid, role, email });

    const response = NextResponse.json({ ok: true, role });
    response.cookies.set(APP_SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: APP_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Failed to create auth session:", error);
    return NextResponse.json({ error: "Nao foi possivel criar sessao" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(APP_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
