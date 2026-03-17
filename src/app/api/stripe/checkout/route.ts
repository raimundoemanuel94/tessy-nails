import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serviceName, price, appointmentId, clientId, isDeposit } = body;

    if (!serviceName || !price) {
      return NextResponse.json(
        { error: "Nome do serviço e preço são obrigatórios" },
        { status: 400 }
      );
    }

    const amountInCents = Math.round(price * 100);
    // Garantir uso correto da origem 
    const origin = req.headers.get("origin") || req.headers.get("referer");
    // Extrai apenas o site raiz se vier URL inteira e usa localhost como fallback absoluto de ultima chance
    let appUrl = "https://tessy-nails.vercel.app";
    if (origin) {
         try { appUrl = new URL(origin).origin } catch(e){}
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
         appUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // Cria a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "pix"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: isDeposit ? `Sinal / Reserva: ${serviceName}` : `Pagamento: ${serviceName}`,
              description: `Agendamento no Tessy Nails${appointmentId ? ` (Ref: ${appointmentId})` : ""}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pagamento/cancelado`,
      metadata: {
        appointmentId: appointmentId || "N/A",
        clientId: clientId || "N/A",
        serviceName: serviceName,
        paymentType: isDeposit ? "deposit" : "full",
      },
    });

    if (!session || !session.url) {
      throw new Error("Stripe não retornou URL de checkout");
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Erro na criação de Checkout Session:", error);
    return NextResponse.json(
      { error: error?.message || "Falha interna ao criar sessão de pagamento no Stripe" },
      { status: 500 }
    );
  }
}
