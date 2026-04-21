import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

// ✅ Validar payload do checkout
const CheckoutRequestSchema = z.object({
  serviceName: z.string().min(1, "Nome do serviço é obrigatório"),
  price: z.number().min(0, "Preço deve ser maior que 0"),
  appointmentId: z.string().optional(),
  clientId: z.string().optional(),
  isDeposit: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Validar dados
    const validation = CheckoutRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { serviceName, price, appointmentId, clientId, isDeposit } = validation.data;

    // ✅ Validar se Stripe está configurado
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("dummy")) {
      console.warn("⚠️ Stripe não está configurado com chave real");
      return NextResponse.json(
        {
          error: "Sistema de pagamento não configurado",
          message: "Entre em contato com o suporte"
        },
        { status: 503 }
      );
    }

    const amountInCents = Math.round(price * 100);

    // ✅ Validar valor mínimo (5 centavos = R$0.05)
    if (amountInCents < 50) {
      return NextResponse.json(
        { error: "Valor mínimo de pagamento é R$ 0.50" },
        { status: 400 }
      );
    }
    // Garantir uso correto da origem 
    const origin = req.headers.get("origin") || req.headers.get("referer");
    // Extrai apenas o site raiz se vier URL inteira e usa localhost como fallback absoluto de ultima chance
    let appUrl = "https://tessy-nails.vercel.app";
    if (origin) {
         try { appUrl = new URL(origin).origin } catch(e){}
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
         appUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
    
    console.log(`💳 Criando sessão de checkout: ${serviceName} (R$ ${price})`);

    try {
      // Cria a sessão de checkout no Stripe
      const session = await stripe.checkout.sessions.create({
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

      console.log(`✅ Sessão criada: ${session.id}`);
      return NextResponse.json({ url: session.url, sessionId: session.id });
    } catch (stripeError) {
      console.error("❌ Erro do Stripe:", stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : "Erro ao conectar com Stripe";
      throw new Error(`Stripe: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error("Erro na criação de Checkout Session:", error);
    return NextResponse.json(
      { error: error?.message || "Falha interna ao criar sessão de pagamento no Stripe" },
      { status: 500 }
    );
  }
}
