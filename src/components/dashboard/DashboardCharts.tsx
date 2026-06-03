"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, LabelList,
} from "recharts";

interface RevenueData  { date: string; total: number; }
interface ServiceData  { name: string; value: number; count?: number; revenue?: number; }

// ── Paleta Nailit ────────────────────────────────────────────────
const PALETTE = ["#7C5CBF", "#9D7FD4", "#C4A8E8", "#EDE5FF", "#5A3F9A", "#3D2060"];

// ── Tooltip customizado ──────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl"
      style={{ background:"#1E1A2E", border:"1px solid rgba(157,127,212,0.3)" }}>
      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">{label}</p>
      <p className="text-[14px] font-black text-white">
        R$ {Number(payload[0].value).toLocaleString("pt-BR", { minimumFractionDigits:2 })}
      </p>
    </div>
  );
};

const ServiceTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: ServiceData }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl"
      style={{ background:"#1E1A2E", border:"1px solid rgba(157,127,212,0.3)" }}>
      <p className="text-[10px] font-bold text-white mb-0.5">{payload[0].payload.name}</p>
      <p className="text-[11px] font-black text-[#9D7FD4]">{payload[0].value}%</p>
      {payload[0].payload.count !== undefined && (
        <p className="text-[9px] text-white/30">{payload[0].payload.count} agendamentos</p>
      )}
    </div>
  );
};

// ── Gráfico de receita (área) ────────────────────────────────────
export function RevenueChart({ data, compact = false }: {
  data: RevenueData[];
  compact?: boolean;
}) {
  return (
    <div className="w-full space-y-3">
      <div>
        <h3 className="text-[13px] font-black text-[#0D0B18] leading-none"
          style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>
          Evolução financeira
        </h3>
        <p className="text-[9px] font-bold text-[#9B8FC0] uppercase tracking-widest mt-0.5">
          Faturamento bruto
        </p>
      </div>
      <div className={compact ? "h-[170px] w-full" : "h-[220px] w-full"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top:4, right:4, bottom:0, left:0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7C5CBF" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7C5CBF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(157,127,212,0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill:"#9B8FC0", fontSize:8, fontWeight:600 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill:"#9B8FC0", fontSize:8 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `R$${Number(v)/1000 >= 1 ? (Number(v)/1000).toFixed(0)+"k" : v}`}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#9D7FD4"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={false}
              activeDot={{ r:5, fill:"#9D7FD4", stroke:"white", strokeWidth:2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Donut de serviços (simples) ──────────────────────────────────
export function ServicesDonut({ data }: { data: ServiceData[] }) {
  if (!data.length) return (
    <div className="h-full flex items-center justify-center">
      <p className="text-[11px] text-[#9B8FC0]">Sem dados no período</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<ServiceTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda compacta */}
      <div className="flex flex-col gap-1 px-1">
        {data.slice(0, 5).map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-2 w-2 rounded-full shrink-0"
                style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="text-[9px] text-[#6B6080] truncate">{item.name}</span>
            </div>
            <span className="text-[9px] font-black text-[#9D7FD4] shrink-0">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NOVO: Ranking horizontal de serviços ─────────────────────────
export function TopServicesChart({ data }: { data: ServiceData[] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-40">
      <p className="text-[11px] text-[#9B8FC0]">Sem dados no período</p>
    </div>
  );

  // Normalizar para max = 100%
  const max = data[0].value;
  const normalized = data.map(d => ({
    ...d,
    pct: Math.round((d.value / max) * 100),
  }));

  return (
    <div className="space-y-2.5">
      {normalized.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          {/* Rank */}
          <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0"
            style={{
              background: i === 0 ? "linear-gradient(135deg,#7C5CBF,#9D7FD4)"
                        : i === 1 ? "rgba(157,127,212,0.2)"
                        : "rgba(255,255,255,0.05)",
              color: i === 0 ? "white" : i === 1 ? "#C4A8E8" : "#5A5280",
            }}>
            {i + 1}
          </div>

          {/* Nome */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#0D0B18] truncate">{item.name}</span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {item.count !== undefined && (
                  <span className="text-[8px] font-bold text-[#9B8FC0]">{item.count}x</span>
                )}
                <span className="text-[9px] font-black text-[#7C5CBF]">{item.value}%</span>
              </div>
            </div>
            {/* Barra */}
            <div className="h-1.5 rounded-full overflow-hidden"
              style={{ background:"#EDE5FF" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${item.pct}%`,
                  background: i === 0
                    ? "linear-gradient(90deg,#5A3F9A,#9D7FD4)"
                    : PALETTE[i % PALETTE.length],
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Gráfico de barras de receita por serviço ─────────────────────
export function ServiceRevenueChart({ data }: { data: ServiceData[] }) {
  if (!data.length) return null;

  const formatted = data.slice(0, 6).map(d => ({
    name: d.name.length > 12 ? d.name.slice(0, 10) + "…" : d.name,
    fullName: d.name,
    revenue: d.revenue ?? d.value,
    count: d.count ?? 0,
  }));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top:8, right:4, bottom:0, left:0 }}
          barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(157,127,212,0.08)" horizontal vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill:"#9B8FC0", fontSize:8, fontWeight:600 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill:"#9B8FC0", fontSize:8 }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `R$${v}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as typeof formatted[0];
              return (
                <div className="rounded-xl px-3 py-2 shadow-xl"
                  style={{ background:"#1E1A2E", border:"1px solid rgba(157,127,212,0.3)" }}>
                  <p className="text-[10px] font-bold text-white mb-1">{d.fullName}</p>
                  <p className="text-[11px] font-black text-[#9D7FD4]">
                    R$ {Number(d.revenue).toLocaleString("pt-BR", { minimumFractionDigits:2 })}
                  </p>
                  <p className="text-[9px] text-white/30">{d.count} agendamentos</p>
                </div>
              );
            }}
          />
          <Bar dataKey="revenue" radius={[6,6,0,0]}>
            {formatted.map((_, i) => (
              <Cell key={i} fill={i === 0 ? "#9D7FD4" : i === 1 ? "#7C5CBF" : `rgba(157,127,212,${0.4 - i*0.05})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
