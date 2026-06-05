// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth, endOfMonth, startOfDay, subDays } from "date-fns";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("studio_id").eq("id", user.id).single();
  const studioId = profile?.studio_id;
  if (!studioId) redirect("/configuracoes");

  const now = new Date();
  const [month, prev30] = await Promise.all([
    supabase.from("appointments").select("price, status, service_name")
      .eq("studio_id", studioId)
      .gte("appointment_date", startOfMonth(now).toISOString())
      .lte("appointment_date", endOfMonth(now).toISOString()),
    supabase.from("appointments").select("price, status, service_name")
      .eq("studio_id", studioId)
      .gte("appointment_date", startOfDay(subDays(now, 30)).toISOString()),
  ]);

  const m = month.data ?? [];
  const p = prev30.data ?? [];

  const totalRev   = m.filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);
  const totalAppts = m.length;
  const completed  = m.filter(a => a.status === "completed").length;
  const cancelled  = m.filter(a => a.status === "cancelled").length;

  // Top services
  const svcMap = new Map<string, { count: number; revenue: number }>();
  p.filter(a => a.status === "completed").forEach(a => {
    const n = a.service_name || "Sem nome";
    const cur = svcMap.get(n) ?? { count: 0, revenue: 0 };
    svcMap.set(n, { count: cur.count + 1, revenue: cur.revenue + (a.price ?? 0) });
  });
  const topServices = Array.from(svcMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Relatórios</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Receita/mês",    value: formatCurrency(totalRev), icon: DollarSign, color: "#4ade80" },
          { label: "Total agendados", value: String(totalAppts),       icon: BarChart3,  color: "#818cf8" },
          { label: "Concluídos",     value: String(completed),         icon: TrendingUp, color: "#a78bfa" },
          { label: "Cancelados",     value: String(cancelled),         icon: Users,      color: "#f87171" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</span>
              <Icon size={15} style={{ color }} />
            </div>
            <p className="text-xl font-black" style={{ color: "var(--text)" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: "var(--text)" }}>Top Serviços (30 dias)</h2>
        {topServices.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Sem dados ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {topServices.map(svc => (
              <div key={svc.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{svc.name}</span>
                    <span className="text-sm font-bold" style={{ color: "#4ade80" }}>{formatCurrency(svc.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (svc.count / (topServices[0]?.count || 1)) * 100)}%`, background: "var(--brand)" }} />
                  </div>
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: "var(--muted)" }}>{svc.count}x</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
