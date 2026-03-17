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

    // Calcula o valor: se for depósito, pode ser um valor fixo ou porcentagem.
    // Para fundação, assumiremos que o "price" já vem calculado em centavos.
    // Ex: R$ 50,00 -> 5000 centavos
    const amountInCents = Math.round(price * 100);

    // Cria a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/cancelado`,
      metadata: {
        appointmentId: appointmentId || "N/A",
        clientId: clientId || "N/A",
        serviceName: serviceName,
        paymentType: isDeposit ? "deposit" : "full",
      },
      // opcional: guardar email do cliente se disponivel
      // customer_email: clientEmail,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Erro na criação de Checkout Session:", error);
    return NextResponse.json(
      { error: "Falha ao criar sessão de pagamento" },
      { status: 500 }
    );
  }
}
