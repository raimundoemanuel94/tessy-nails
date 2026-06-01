import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";
import { notifyAllStaff, notifyUser } from "@/lib/server/notify";
import {
  authGuardErrorResponse,
  isAuthGuardError,
  requireAuth,
} from "@/lib/server/route-guards";

export async function POST(req: Request) {
  try {
    const authSession = await requireAuth(req);
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "O ID da sessao e obrigatorio" }, { status: 400 });
    }

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (!stripeSession) {
      return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });
    }

    const sessionClientId = stripeSession.metadata?.clientId;
    if (
      authSession.role === "client" &&
      sessionClientId &&
      sessionClientId !== "N/A" &&
      sessionClientId !== authSession.uid
    ) {
      return NextResponse.json({ error: "Cliente nao autorizado para esta sessao" }, { status: 403 });
    }

    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json({ success: false, message: "Pagamento ainda pendente." });
    }

    const appointmentId = stripeSession.metadata?.appointmentId;
    const app = getFirebaseAdminApp();

    if (!appointmentId || appointmentId === "N/A") {
      return NextResponse.json({
        success: true,
        message: "Pagamento validado, mas sem ID de agendamento para atualizar.",
      });
    }

    if (!app) {
      return NextResponse.json({
        success: true,
        message: "Pagamento validado no Stripe, mas Firebase Admin nao esta configurado.",
        warning: "appointment_not_updated",
      });
    }

    try {
      const apptRef = admin.firestore(app).collection("appointments").doc(appointmentId);
      await apptRef.update({
        status: "confirmed",
        paymentStatus: stripeSession.metadata?.paymentType === "deposit" ? "deposit_paid" : "fully_paid",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ✅ Notificações em paralelo — não bloqueiam a resposta
      const clientId  = stripeSession.metadata?.clientId;
      const svcName   = stripeSession.metadata?.serviceName ?? "seu serviço";
      const apptSnap  = await apptRef.get();
      const apptDate  = apptSnap.data()?.appointmentDate?.toDate?.();
      const dateStr   = apptDate
        ? new Intl.DateTimeFormat("pt-BR", { dateStyle:"short", timeStyle:"short" }).format(apptDate)
        : "";

      void Promise.allSettled([
        // Notificar Nailit (staff) sobre novo agendamento pago
        notifyAllStaff({
          title: "💅 Novo agendamento confirmado!",
          body: `${svcName}${dateStr ? " — " + dateStr : ""}`,
          url: "/agenda",
          tag: "new-appointment",
        }),
        // Notificar cliente sobre confirmação
        clientId && clientId !== "N/A"
          ? notifyUser(clientId, {
              title: "✅ Agendamento confirmado!",
              body: `${svcName} está confirmado. Te esperamos! 💜`,
              url: "/cliente/agendamentos",
              tag: "appointment-confirmed",
            })
          : Promise.resolve(),
      ]);

      return NextResponse.json({
        success: true,
        message: "Pagamento validado e agendamento confirmado.",
      });
    } catch (firebaseError) {
      const firebaseMessage =
        firebaseError instanceof Error ? firebaseError.message : String(firebaseError);

      return NextResponse.json(
        {
          success: false,
          message: "Pagamento aprovado no Stripe, mas falha ao atualizar agendamento.",
          firebaseError: firebaseMessage,
        },
        { status: 202 }
      );
    }
  } catch (error) {
    if (isAuthGuardError(error)) {
      return authGuardErrorResponse(error);
    }

    const message = error instanceof Error ? error.message : "Falha ao verificar o pagamento";
    console.error("Erro na verificacao do Stripe:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
