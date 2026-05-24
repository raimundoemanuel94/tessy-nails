/**
 * Helper server-side para enviar notificações FCM via Admin SDK.
 * Usado por rotas API (stripe/verify, appointments, etc).
 */

import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";

interface NotifyPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

/** Busca tokens FCM de um usuário e envia notificação push. */
export async function notifyUser(userId: string, payload: NotifyPayload): Promise<void> {
  const app = getFirebaseAdminApp();
  if (!app) return; // Admin SDK não configurado — silent fail

  try {
    const db = admin.firestore(app);
    const snap = await db.collection("fcmTokens")
      .where("userId", "==", userId)
      .get();

    if (snap.empty) return;

    const tokens = snap.docs.map(d => d.data().token as string).filter(Boolean);
    if (!tokens.length) return;

    await admin.messaging(app).sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.icon ?? "/brand/icons/icon-192.png",
      },
      data: {
        url: payload.url ?? "/",
        tag: payload.tag ?? "default",
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
      },
      webpush: {
        notification: {
          icon: payload.icon ?? "/brand/icons/icon-192.png",
          badge: "/brand/icons/icon-72.png",
          requireInteraction: false,
        },
        fcmOptions: { link: payload.url ?? "/" },
      },
    });
  } catch (err) {
    // Nunca deixa a notificação quebrar a operação principal
    console.error("[notify] Erro ao enviar push:", err);
  }
}

/** Busca todos admins/professionals e notifica. */
export async function notifyAllStaff(payload: NotifyPayload): Promise<void> {
  const app = getFirebaseAdminApp();
  if (!app) return;

  try {
    const db = admin.firestore(app);
    const snap = await db.collection("users")
      .where("role", "in", ["admin", "professional"])
      .where("isActive", "==", true)
      .get();

    const staffIds = snap.docs.map(d => d.id);
    await Promise.allSettled(staffIds.map(uid => notifyUser(uid, payload)));
  } catch (err) {
    console.error("[notify] Erro ao notificar staff:", err);
  }
}
