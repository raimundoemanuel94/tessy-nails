/**
 * Helper server-side para enviar notificações FCM via Admin SDK.
 * Não faz queries ao Firestore client-side — usa Admin SDK direto.
 */
import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";

interface NotifyPayload {
  title: string; body: string;
  url?: string; tag?: string; icon?: string;
}

export async function notifyUser(userId: string, payload: NotifyPayload): Promise<void> {
  const app = getFirebaseAdminApp();
  if (!app) return;
  try {
    const db = admin.firestore(app);
    const snap = await db.collection("fcmTokens").where("userId", "==", userId).get();
    if (snap.empty) return;
    const tokens = snap.docs.map(d => d.data().token as string).filter(Boolean);
    if (!tokens.length) return;
    await admin.messaging(app).sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body, imageUrl: payload.icon ?? "/brand/icons/icon-192.png" },
      data: { url: payload.url ?? "/", tag: payload.tag ?? "default" },
      webpush: { fcmOptions: { link: payload.url ?? "/" } },
    });
  } catch (err) { console.error("[notify] Erro:", err); }
}

export async function notifyAllStaff(payload: NotifyPayload): Promise<void> {
  const app = getFirebaseAdminApp();
  if (!app) return;
  try {
    const db = admin.firestore(app);
    const snap = await db.collection("users")
      .where("role", "in", ["admin", "professional"])
      .where("isActive", "==", true)
      .get();
    await Promise.allSettled(snap.docs.map(d => notifyUser(d.id, payload)));
  } catch (err) { console.error("[notify] Staff error:", err); }
}
