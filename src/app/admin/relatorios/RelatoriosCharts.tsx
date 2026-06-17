"use client";
import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";

function fmtK(v: number) {
  if (v >= 1000) return `R$ ${(v/1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
}

function AreaChart({ data, valueKey, color, formatValue }: any) {
  const W = 560, H = 150, P = 12, BL = 22;
  const values = data.map((d: any) => d[valueKey]);
  const max = Math.max(...values, 1);
  const range = max || 1;
  const stepX = (W - P*2) / (data.length - 1 || 1);
  const points = data.map((d: any, i: number) => ({
    x: P + i * stepX,
    y: H - BL - (d[valueKey] / range) * (H - BL - P),
    v: d[valueKey], label: d.label,
  }));
  const path = points.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${points[points.length-1].x} ${H-BL} L ${points[0].x} ${H-BL} Z`;
  const gid = `ar-${valueKey}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25,0.5,0.75].map(f => (
        <line key={f} x1={P} y1={P + f*(H-BL-P)} x2={W-P} y2={P + f*(H-BL-P)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4"/>
      ))}
      <path d={area} fill={`url(#${gid})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p: any, i: number) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--surface)" stroke={color} strokeWidth="2"/>
          <text x={p.x} y={H-6} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600">{p.label}</text>
          {(i === points.length-1 || i === 0) && (
            <text x={p.x} y={p.y-9} textAnchor={i===0?"start":"end"} fontSize="10" fontWeight="800" fill={color}>
              {formatValue ? formatValue(p.v) : p.v}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function BarChart({ data, color }: any) {
  const W = 560, H = 150, P = 12, BL = 22;
  const max = Math.max(...data.map((d: any) => d.newStudios), 1);
  const bw = (W - P*2) / data.length * 0.55;
  const gap = (W - P*2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {data.map((d: any, i: number) => {
        const x = P + i * gap + (gap - bw)/2;
        const h = (d.newStudios / max) * (H - BL - P);
        const y = H - BL - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(h,2)} rx="4" fill={color} opacity="0.85"/>
            <text x={x + bw/2} y={H-6} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600">{d.label}</text>
            {d.newStudios > 0 && <text x={x + bw/2} y={y-5} textAnchor="middle" fontSize="10" fontWeight="800" fill={color}>{d.newStudios}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function RelatoriosCharts({ months, planDist }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(34,212,123,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DollarSign size={15} color="var(--green)"/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Evolução da Receita (MRR)</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>últimos 6 meses</div>
          </div>
        </div>
        <AreaChart data={months} valueKey="mrr" color="var(--green)" formatValue={fmtK}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(124,92,191,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={15} color="var(--brand-light)"/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Total de Salões</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>acumulado</div>
            </div>
          </div>
          <AreaChart data={months} valueKey="studios" color="var(--brand-light)"/>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(90,158,245,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={15} color="#5a9ef5"/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Novos Salões</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>por mês</div>
            </div>
          </div>
          <BarChart data={months} color="#5a9ef5"/>
        </div>
      </div>
    </div>
  );
}
