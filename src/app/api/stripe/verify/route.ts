import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import admin from 'firebase-admin';

// Reusa a mesma inicialização admin do Firebase para não crashear
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "dummy@example.com",
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n')
        })
      });
    }
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin na Verificação de Pagamento:', error);
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "O ID da sessão é obrigatório" }, { status: 400 });
    }

    // Busca os dados da sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }

    // Se o pagamento foi concluído com sucesso
    if (session.payment_status === "paid") {
      const appointmentId = session.metadata?.appointmentId;
      
      if (appointmentId && appointmentId !== "N/A" && admin.apps.length > 0) {
        
        // Atualiza no Firestore diretamente pelo lado seguro do Servidor Vercel
        const db = admin.firestore();
        await db.collection('appointments').doc(appointmentId).update({
          status: 'confirmed',
          paymentStatus: session.metadata?.paymentType === 'deposit' ? 'deposit_paid' : 'fully_paid',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return NextResponse.json({ success: true, message: "Pagamento validado e Agendamento Confirmado!" });
      }
      
      return NextResponse.json({ success: true, message: "Pagamento validado, mas sem ID de agendamento atrelado." });
    }

    return NextResponse.json({ success: false, message: "Pagamento ainda pendente." });
  } catch (error: any) {
    console.error("Erro na verificação do Stripe:", error);
    return NextResponse.json(
      { error: error?.message || error?.toString() || "Falha interna ao verificar o pagamento no Stripe", stack: error?.stack },
      { status: 500 }
    );
  }
}
