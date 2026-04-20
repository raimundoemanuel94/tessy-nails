import { NextRequest, NextResponse } from "next/server";
import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { tokens, notification, data } = await request.json();

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: "Nenhum token de dispositivo fornecido" },
        { status: 400 }
      );
    }

    if (!notification?.title || !notification?.body) {
      return NextResponse.json(
        { error: "Título e corpo da notificação são obrigatórios" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdminApp();

    if (!app) {
      console.warn("⚠️ Firebase Admin não está configurado para enviar notificações");
      return NextResponse.json(
        {
          error: "Firebase Admin não configurado",
          message: "Notificações não podem ser enviadas neste momento"
        },
        { status: 503 }
      );
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.icon ? { imageUrl: notification.icon } : {}),
      },
      data: data || {},
      tokens,
    };

    console.log(`📤 Enviando notificação para ${tokens.length} dispositivo(s)...`);
    const response = await admin.messaging(app).sendEachForMulticast(message);

    console.log(`✅ Notificações enviadas: ${response.successCount} sucesso, ${response.failureCount} falha`);

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao enviar notificação";
    console.error("❌ Erro ao enviar notificação:", error);
    return NextResponse.json(
      {
        error: message,
        code: "NOTIFICATION_ERROR"
      },
      { status: 500 }
    );
  }
}
