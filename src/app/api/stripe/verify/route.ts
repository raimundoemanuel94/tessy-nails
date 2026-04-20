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

      if (appointmentId && appointmentId !== "N/A" && app) {
        try {
          await admin.firestore(app).collection("appointments").doc(appointmentId).update({
            status: "confirmed",
            paymentStatus:
              session.metadata?.paymentType === "deposit" ? "deposit_paid" : "fully_paid",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          return NextResponse.json({
            success: true,
            message: "Pagamento validado e agendamento confirmado.",
          });
        } catch (firebaseError) {
          console.error("Erro ao escrever no Firebase Admin", firebaseError);
          const firebaseMessage =
            firebaseError instanceof Error ? firebaseError.message : String(firebaseError);

          return NextResponse.json({
            success: false,
            message: "Pagamento aprovado no Stripe, mas o Firebase falhou ao marcar como pago.",
            firebaseError: firebaseMessage,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Pagamento validado, mas sem ID de agendamento ou Firebase Admin configurado.",
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
