import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import {
  authGuardErrorResponse,
  isAuthGuardError,
  requireAuth,
} from "@/lib/server/route-guards";

const CheckoutRequestSchema = z.object({
  serviceName: z.string().min(1, "Nome do servico e obrigatorio"),
  price: z.number().min(0, "Preco deve ser maior que 0"),
  appointmentId: z.string().optional(),
  clientId: z.string().optional(),
  isDeposit: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();

    const validation = CheckoutRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Dados invalidos", details: validation.error.issues }, { status: 400 });
    }

    const { serviceName, price, appointmentId, clientId, isDeposit } = validation.data;

    if (session.role === "client" && clientId && clientId !== session.uid) {
      return NextResponse.json({ error: "Cliente nao autorizado para este pagamento" }, { status: 403 });
    }

    const resolvedClientId = clientId || session.uid;

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("dummy")) {
      return NextResponse.json(
        { error: "Sistema de pagamento nao configurado", message: "Entre em contato com o suporte" },
        { status: 503 }
      );
    }

    const amountInCents = Math.round(price * 100);
    if (amountInCents < 50) {
      return NextResponse.json({ error: "Valor minimo de pagamento e R$ 0.50" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || req.headers.get("referer");
    let appUrl = "https://tessy-nails.vercel.app";
    if (origin) {
      try {
        appUrl = new URL(origin).origin;
      } catch {
        // Keep fallback appUrl
      }
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
      appUrl = process.env.NEXT_PUBLIC_APP_URL;
    }

    const stripeSession = await stripe.checkout.sessions.create({
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
        clientId: resolvedClientId || "N/A",
        serviceName,
        paymentType: isDeposit ? "deposit" : "full",
      },
    });

    if (!stripeSession?.url) {
      throw new Error("Stripe nao retornou URL de checkout");
    }

    return NextResponse.json({ url: stripeSession.url, sessionId: stripeSession.id });
  } catch (error) {
    if (isAuthGuardError(error)) {
      return authGuardErrorResponse(error);
    }

    const message = error instanceof Error ? error.message : "Falha ao criar sessao de pagamento";
    console.error("Erro no checkout Stripe:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
