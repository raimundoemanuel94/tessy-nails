"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";

// Define promise handler que não quebra em runtime se a var falhar
const getStripe = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.warn("Stripe publishable key is missing");
    return null;
  }
  return loadStripe(key);
};
const stripePromise = getStripe();

interface PaymentButtonProps {
  serviceName: string;
  price: number;
  appointmentId?: string;
  clientId?: string;
  isDeposit?: boolean;
  className?: string;
  title?: string;
}

export function PaymentButton({
  serviceName,
  price,
  appointmentId,
  clientId,
  isDeposit = false,
  className = "",
  title = "Pagar Agora",
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceName,
          price,
          appointmentId,
          clientId,
          isDeposit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar pagamento");
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Erro de checkout:", error);
      toast.error(error.message || "Não foi possível iniciar o pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className={`bg-purple-600 hover:bg-purple-700 text-white shadow-md font-semibold transition-all ${className}`}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="mr-2 h-4 w-4" />
      )}
      {title}
    </Button>
  );
}
