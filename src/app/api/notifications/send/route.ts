import { NextRequest, NextResponse } from "next/server";
import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { tokens, notification, data } = await request.json();

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ error: "No tokens provided" }, { status: 400 });
    }

    const app = getFirebaseAdminApp();

    if (!app) {
      return NextResponse.json(
        { error: "Firebase Admin nao configurado" },
        { status: 500 }
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

    const response = await admin.messaging(app).sendEachForMulticast(message);

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sending notification";
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
