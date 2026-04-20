import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "O ID da sessao e obrigatorio" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });
    }

    if (session.payment_status === "paid") {
      const appointmentId = session.metadata?.appointmentId;
      const app = getFirebaseAdminApp();

      if (appointmentId && appointmentId !== "N/A") {
        if (!app) {
          console.warn("⚠️ Firebase Admin não configurado - agendamento não será atualizado");
          return NextResponse.json({
            success: true,
            message: "Pagamento validado no Stripe, mas Firebase Admin não está configurado para atualizar agendamento.",
            warning: "appointment_not_updated",
          });
        }

        try {
          await admin.firestore(app).collection("appointments").doc(appointmentId).update({
            status: "confirmed",
            paymentStatus:
              session.metadata?.paymentType === "deposit" ? "deposit_paid" : "fully_paid",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`✅ Agendamento ${appointmentId} confirmado após pagamento`);
          return NextResponse.json({
            success: true,
            message: "Pagamento validado e agendamento confirmado.",
          });
        } catch (firebaseError) {
          console.error("❌ Erro ao escrever no Firebase Admin", firebaseError);
          const firebaseMessage =
            firebaseError instanceof Error ? firebaseError.message : String(firebaseError);

          return NextResponse.json({
            success: false,
            message: "Pagamento aprovado no Stripe, mas falha ao atualizar agendamento.",
            firebaseError: firebaseMessage,
          }, { status: 202 }); // 202 Accepted - pagamento confirmado mas não processado
        }
      }

      return NextResponse.json({
        success: true,
        message: "Pagamento validado, mas sem ID de agendamento para atualizar.",
      });
    }

    return NextResponse.json({ success: false, message: "Pagamento ainda pendente." });
  } catch (error) {
    console.error("Erro na verificacao do Stripe:", error);
    const message =
      error instanceof Error ? error.message : "Falha interna ao verificar o pagamento no Stripe";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
