// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlanosClient } from "./PlanosClient";

export const dynamic = "force-dynamic";

export default async function PlanosPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "superadmin") redirect("/dashboard");

  // Busca planos + quantos salões em cada
  const [{ data: prices }, { data: studios }] = await Promise.all([
    sb.from("plan_prices").select("plan, price, label, updated_at").order("price"),
    sb.from("studios").select("plan, subscription_status"),
  ]);

  const planos = (prices ?? []).map(p => {
    const inPlan  = (studios ?? []).filter(s => s.plan === p.plan);
    const paying  = inPlan.filter(s => s.subscription_status === "active").length;
    const total   = inPlan.length;
    const mrr     = paying * Number(p.price);
    return { ...p, paying, total, mrr };
  });

  return <PlanosClient planos={planos} />;
}
