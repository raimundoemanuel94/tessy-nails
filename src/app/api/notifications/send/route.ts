import { NextRequest, NextResponse } from "next/server";
import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";
import {
  authGuardErrorResponse,
  isAuthGuardError,
  requireStaff,
} from "@/lib/server/route-guards";

export async function POST(request: NextRequest) {
  try {
    await requireStaff(request);

    const { tokens, notification, data } = await request.json();

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ error: "Nenhum token de dispositivo fornecido" }, { status: 400 });
    }

    if (!notification?.title || !notification?.body) {
      return NextResponse.json(
        { error: "Titulo e corpo da notificacao sao obrigatorios" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdminApp();
    if (!app) {
      return NextResponse.json(
        {
          error: "Firebase Admin nao configurado",
          message: "Notificacoes nao podem ser enviadas neste momento",
        },
        { status: 503 }
      );
    }

    const response = await admin.messaging(app).sendEachForMulticast({
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.icon ? { imageUrl: notification.icon } : {}),
      },
      data: data || {},
      tokens,
    });

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    if (isAuthGuardError(error)) {
      return authGuardErrorResponse(error);
    }

    const message = error instanceof Error ? error.message : "Erro ao enviar notificacao";
    console.error("Erro ao enviar notificacao:", error);
    return NextResponse.json({ error: message, code: "NOTIFICATION_ERROR" }, { status: 500 });
  }
}
