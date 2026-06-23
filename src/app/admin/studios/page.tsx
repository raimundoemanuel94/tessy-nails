"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Building2, Loader2, Pencil, Power, X, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

/* ── Services default ─────────────────────────────── */
const SERVICES_DEFAULT = [
  { name: "Manicure simples",   price: 35,  duration_minutes: 45  },
  { name: "Pedicure simples",   price: 40,  duration_minutes: 60  },
  { name: "Manicure em gel",    price: 80,  duration_minutes: 90  },
  { name: "Pedicure em gel",    price: 90,  duration_minutes: 90  },
  { name: "Alongamento em gel", price: 150, duration_minutes: 120 },
  { name: "Esmaltação em gel",  price: 60,  duration_minutes: 60  },
  { name: "Spa dos pés",        price: 70,  duration_minutes: 75  },
  { name: "Nail art",           price: 15,  duration_minutes: 30  },
];

/* ── Design tokens ────────────────────────────────── */
const C = {
  card:   "#ffffff",
  border: "#e8e8f0",
  sep:    "#1a1a2e",
  text:   "#1a1a2e",
  sub:    "#64748b",
  muted:  "#94a3b8",
  dim:    "#64748b",
  r:      10,
};

/* ── Plan colors ─────────────────────────────────── */
const PC: Record<string, { bg: string; color: string; border: string }> = {
  pro:     { bg: "rgba(99,102,241,0.10)",  color: "#7c3aed", border: "rgba(99,102,241,0.22)"  },
  starter: { bg: "rgba(96,165,250,0.10)",  color: "#60a5fa", border: "rgba(96,165,250,0.22)"  },
  free:    { bg: "rgba(113,113,122,0.10)", color: "#94a3b8", border: "rgba(113,113,122,0.20)" },
  studio:  { bg: "rgba(244,114,182,0.10)", color: "#f472b6", border: "rgba(244,114,182,0.22)" },
};

/* ── Health config ───────────────────────────────── */
const HEALTH_CFG = {
  active: { dot: "#22c55e", color: "#4ade80", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.20)",   label: "Ativo"  },
  warm:   { dot: "#eab308", color: "#fbbf24", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.20)",   label: "Morno"  },
  risk:   { dot: "#94a3b8", color: "#94a3b8", bg: "rgba(82,82,91,0.10)",    border: "rgba(82,82,91,0.18)",    label: "Risco"  },
};

/* ── Filter chips config ─────────────────────────── */
const FILTERS = [
  { key: "all",      label: "Todos"    },
  { key: "active",   label: "Ativos"   },
  { key: "inactive", label: "Inativos" },
  { key: "pro",      label: "Pro"      },
  { key: "free",     label: "Free"     },
] as const;

/* ── Helpers ─────────────────────────────────────── */
function relTime(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 3600)    return `${Math.floor(diff/60)}min`;
  if (diff < 86400)   return `${Math.floor(diff/3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function fmtDate(d: string | null) {
  if (!d) return null;
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7)   return `${days}d atrás`;
  if (days < 30)  return `${days}d atrás`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function calcHealth(lastDate: string | null): "active" | "warm" | "risk" {
  if (!lastDate) return "risk";
  const days = (Date.now() - new Date(lastDate).getTime()) / 86400000;
  if (days <= 7)  return "active";
  if (days <= 30) return "warm";
  return "risk";
}

/* ── Main page ───────────────────────────────────── */
export default function AdminStudiosPage() {
  const [studios,    setStudios]    = useState<any[]>([]);
  const [health,     setHealth]     = useState<Record<string, { last: string | null; d7: number; d30: number; status: string }>>({});
  const [loading,    setLoading]    = useState(true);
  const [open,       setOpen]       = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [confirmToggle, setConfirmToggle] = useState<{ id: string; name: string; active: boolean } | null>(null);
  const [sortKey, setSortKey] = useState<string>("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [nome,       setNome]       = useState("");
  const [slug,       setSlug]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [plan,       setPlan]       = useState("pro");
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const now   = new Date();
    const ago7  = new Date(now.getTime() -  7 * 86400000).toISOString().slice(0, 10);
    const ago30 = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

    const [{ data: studioData }, { data: apptData }] = await Promise.all([
      supabase
        .from("studios")
        .select("id, name, slug, plan, is_active, created_at, profiles!studios_owner_id_fkey(name, email)")
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("studio_id, appointment_date")
        .not("studio_id", "is", null),
    ]);

    setStudios(studioData ?? []);

    /* Build health map */
    const map: Record<string, { last: string | null; d7: number; d30: number; status: string }> = {};
    for (const a of (apptData ?? [])) {
      const sid  = a.studio_id;
      const date = a.appointment_date as string;
      if (!sid) continue;
      if (!map[sid]) map[sid] = { last: null, d7: 0, d30: 0, status: "risk" };
      if (!map[sid].last || date > map[sid].last!) map[sid].last = date;
      if (date >= ago7)  map[sid].d7++;
      if (date >= ago30) map[sid].d30++;
    }
    for (const sid of Object.keys(map)) {
      map[sid].status = calcHealth(map[sid].last);
    }
    setHealth(map);
    setLoading(false);
  }

  function handleNome(v: string) {
    setNome(v);
    setSlug(v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
  }

  async function criar() {
    if (!nome || !slug) { toast.error("Nome e slug são obrigatórios."); return; }
    setSaving(true);
    let createdStudioId: string | null = null;
    try {
      const { data: studio, error } = await supabase
        .from("studios").insert({ name: nome, slug, phone: phone||null, plan, is_active: true })
        .select("id").single();
      if (error) { toast.error(error.message.includes("unique") ? "Slug já em uso." : error.message); return; }
      createdStudioId = studio.id;

      const { error: settingsError } = await supabase.from("salon_settings").insert({ studio_id: studio.id });
      if (settingsError) throw new Error(`Studio criado, mas falhou ao criar configurações: ${settingsError.message}`);

      const { error: servicesError } = await supabase.from("services").insert(SERVICES_DEFAULT.map(s => ({ ...s, studio_id: studio.id, is_active: true })));
      if (servicesError) throw new Error(`Studio criado, mas falhou ao criar serviços padrão: ${servicesError.message}`);

      toast.success(`"${nome}" criado!`);
      setOpen(false); setNome(""); setSlug(""); setPhone("");
      await load();
    } catch (e: any) {
      if (createdStudioId) {
        await supabase.from("studios").delete().eq("id", createdStudioId);
      }
      toast.error(e.message);
    }
    finally { setSaving(false); }
  }

  async function toggleActive(id: string, cur: boolean) {
    const { error } = await supabase.from("studios").update({ is_active: !cur }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStudios(s => s.map(x => x.id === id ? { ...x, is_active: !cur } : x));
    toast.success(cur ? "Studio desativado." : "Studio ativado.");
  }

  /* ── Filtering logic ── */
  const afterSearch = studios.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  const filtered = afterSearch.filter(s => {
    if (activeFilter === "active")   return s.is_active;
    if (activeFilter === "inactive") return !s.is_active;
    if (activeFilter === "pro")      return s.plan === "pro";
    if (activeFilter === "free")     return s.plan === "free";
    return true;
  });

  /* ── Sort ── */
  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }
  const HEALTH_RANK: Record<string,number> = { active: 3, warm: 2, risk: 1 };
  const sorted = [...filtered].sort((a, b) => {
    let av: any, bv: any;
    if      (sortKey === "name")   { av = a.name.toLowerCase();              bv = b.name.toLowerCase(); }
    else if (sortKey === "plan")   { av = a.plan;                            bv = b.plan; }
    else if (sortKey === "status") { av = a.is_active ? 1 : 0;              bv = b.is_active ? 1 : 0; }
    else if (sortKey === "health") { av = HEALTH_RANK[health[a.id]?.status ?? "risk"]; bv = HEALTH_RANK[health[b.id]?.status ?? "risk"]; }
    else if (sortKey === "last")   { av = health[a.id]?.last ?? "";          bv = health[b.id]?.last ?? ""; }
    else                           { av = a.created_at;                      bv = b.created_at; }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
  function healthTooltip(hd: any): string {
    if (!hd?.last) return "Sem agendamentos registrados";
    const days = Math.floor((Date.now() - new Date(hd.last).getTime()) / 86400000);
    const ago = days === 0 ? "hoje" : days === 1 ? "ontem" : `há ${days} dias`;
    return `Último agendamento ${ago} · ${hd.d7} nos últimos 7d · ${hd.d30} em 30d`;
  }

  const total    = studios.length;
  const nActive  = studios.filter(s => s.is_active).length;
  const nInactive= studios.filter(s => !s.is_active).length;

  const filterCounts: Record<string, number> = {
    all:      total,
    active:   nActive,
    inactive: nInactive,
    pro:      studios.filter(s => s.plan === "pro").length,
    free:     studios.filter(s => s.plan === "free").length,
  };

  const COLS = "minmax(220px, 1fr) 140px 82px 140px 110px 92px 72px";
  const TABLE_MIN_WIDTH = 900;

  return (
    <div className="admin-studios-page" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1120 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5 }}>
            Operação
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.025em" }}>Salões</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            {total} {total === 1 ? "salão" : "salões"} na plataforma
            {nActive > 0 && <span style={{ color: "#4ade80", marginLeft: 6 }}>{nActive} ativos</span>}
          </p>
        </div>
        <button onClick={() => setOpen(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "9px 16px", borderRadius: 8,
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
          fontSize: 13, fontWeight: 600, color: "#7c3aed", cursor: "pointer", fontFamily: "inherit",
          transition: "background .15s",
        }}>
          <Plus size={13}/> Novo salão
        </button>
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={13} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou link público…"
            style={{
              width: "100%", height: 38, paddingLeft: 36, paddingRight: 12,
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 13, outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map(f => {
            const isOn  = activeFilter === f.key;
            const count = filterCounts[f.key] ?? 0;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 11px", borderRadius: 20, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12, fontWeight: isOn ? 600 : 400,
                  transition: "all .15s",
                  background: isOn ? "rgba(99,102,241,0.14)" : "#f4f5fb",
                  border: isOn ? "1px solid rgba(99,102,241,0.30)" : `1px solid ${C.border}`,
                  color: isOn ? "#818cf8" : C.sub,
                }}
              >
                {f.label}
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: isOn ? "#818cf8" : C.muted,
                  background: isOn ? "rgba(99,102,241,0.15)" : "#e8e8f0",
                  padding: "1px 5px", borderRadius: 10,
                }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="admin-studios-table" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, overflowX: "auto", overflowY: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0", gap: 10 }}>
            <Loader2 size={16} color={C.muted} className="spin"/>
            <span style={{ fontSize: 13, color: C.muted }}>Carregando…</span>
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#f4f5fb", border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <Building2 size={20} color={C.muted}/>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.sub, margin: "0 0 6px" }}>
              {search || activeFilter !== "all" ? "Nenhum resultado" : "Nenhum salão ainda"}
            </p>
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 20px" }}>
              {search
                ? `Sem resultados para "${search}"`
                : activeFilter !== "all"
                ? "Tente outro filtro"
                : "Crie o primeiro salão da plataforma"}
            </p>
            {!search && activeFilter === "all" && (
              <button onClick={() => setOpen(true)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.22)",
                fontSize: 13, fontWeight: 600, color: "#7c3aed", cursor: "pointer", fontFamily: "inherit",
              }}>
                <Plus size={13}/> Criar salão
              </button>
            )}
          </div>

        ) : (
          <>
            {/* Table header — sortable */}
            <div className="admin-studios-table-head" style={{
              display: "grid", gridTemplateColumns: COLS,
              padding: "8px 18px", borderBottom: `1px solid ${C.sep}`,
              minWidth: TABLE_MIN_WIDTH,
            }}>
              {[
                { label: "Salão",         key: "name"   },
                { label: "Responsável",   key: null     },
                { label: "Plano",         key: "plan"   },
                { label: "Última agenda", key: "last"   },
                { label: "Saúde",         key: "health" },
                { label: "Status",        key: "status" },
                { label: "",              key: null     },
              ].map(h => {
                const active = h.key && sortKey === h.key;
                return (
                  <span key={h.label || "act"}
                    onClick={h.key ? () => toggleSort(h.key!) : undefined}
                    style={{
                      fontSize: 10, fontWeight: 500,
                      color: active ? "#818cf8" : C.muted,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      cursor: h.key ? "pointer" : "default",
                      userSelect: "none",
                      display: "inline-flex", alignItems: "center", gap: 3,
                    }}>
                    {h.label}
                    {active && <span style={{ fontSize: 8 }}>{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </span>
                );
              })}
            </div>

            {/* Rows */}
            {sorted.map((s, i) => {
              const pc  = PC[s.plan] ?? PC.free;
              const hd  = health[s.id];
              const hs  = (hd?.status ?? "risk") as keyof typeof HEALTH_CFG;
              const hc  = HEALTH_CFG[hs];
              const lastFmt = fmtDate(hd?.last ?? null);
              const isLast  = i === sorted.length - 1;

              return (
                <div
                  key={s.id}
                  className="a-row admin-studios-row"
                  style={{
                    display: "grid", gridTemplateColumns: COLS,
                    alignItems: "center", padding: "12px 18px",
                    minWidth: TABLE_MIN_WIDTH,
                    borderBottom: !isLast ? `1px solid ${C.sep}` : "none",
                    opacity: s.is_active ? 1 : 0.55,
                    transition: "opacity .15s",
                  }}
                >
                  {/* Studio */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#7c3aed",
                    }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <code style={{ fontSize: 10, color: C.muted }}>/{s.slug}</code>
                        <span style={{ fontSize: 9, color: C.dim }}>·</span>
                        <span style={{ fontSize: 10, color: C.muted }}>{relTime(s.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Responsável */}
                  <div style={{ minWidth: 0 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: s.profiles?.name ? C.sub : C.dim,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
                    }}>
                      {s.profiles?.name ?? "—"}
                    </span>
                  </div>

                  {/* Plano */}
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                      background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
                    }}>
                      {s.plan}
                    </span>
                  </div>

                  {/* Ultimo agendamento */}
                  <div>
                    {lastFmt ? (
                      <span style={{ fontSize: 12, color: C.sub }}>{lastFmt}</span>
                    ) : (
                      <span style={{ fontSize: 12, color: C.dim }}>—</span>
                    )}
                  </div>

                  {/* Saúde — tooltip explica critério */}
                  <div title={healthTooltip(hd)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "help" }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                      background: hc.dot,
                      boxShadow: hs === "active" ? `0 0 6px ${hc.dot}66` : "none",
                    }}/>
                    <span style={{
                      fontSize: 11, fontWeight: 500, color: hc.color,
                      borderBottom: "1px dotted rgba(255,255,255,0.15)",
                    }}>
                      {hc.label}
                    </span>
                  </div>

                  {/* Status ativo/inativo */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                      background: s.is_active ? "#22c55e" : C.dim,
                    }}/>
                    <span style={{ fontSize: 11, color: s.is_active ? "#4ade80" : C.muted }}>
                      {s.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                    <Link
                      href={`/admin/studios/${s.id}`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: 6,
                        background: "#f4f5fb", border: `1px solid ${C.sep}`,
                        color: C.muted, textDecoration: "none", transition: "all .15s",
                      }}
                      onMouseEnter={(e: any) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = "#e8e8f0"; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = "#f4f5fb"; }}
                    >
                      <Pencil size={11}/>
                    </Link>
                    <button
                      onClick={() => setConfirmToggle({ id: s.id, name: s.name, active: s.is_active })}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: 6,
                        background: "#f4f5fb", border: `1px solid ${C.sep}`,
                        color: s.is_active ? "#4ade80" : C.muted,
                        cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                      }}
                      onMouseEnter={(e: any) => { e.currentTarget.style.background = "#e8e8f0"; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.background = "#f4f5fb"; }}
                    >
                      <Power size={11}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Modal novo salão ── */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
        }}>
          <div style={{
            width: "100%", maxWidth: 440,
            background: "#111113", border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14, padding: "24px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
                  Novo salão
                </h2>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  Inclui 8 serviços padrão automaticamente.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "#1a1a2e", border: `1px solid ${C.sep}`,
                  borderRadius: 7, padding: "6px", cursor: "pointer", color: C.muted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={14}/>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: "block",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Nome *</label>
                <input className="input-base" value={nome}
                  onChange={e => handleNome(e.target.value)} placeholder="Ex: Tessy Nails"/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: "block",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Link público *</label>
                <input className="input-base" value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))}
                  placeholder="tessy-nails"/>
                {slug && (
                  <p style={{ fontSize: 11, color: "#7c3aed", marginTop: 5, fontFamily: "monospace" }}>
                    nailit.com.br/agendar/{slug}
                  </p>
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: "block",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Telefone</label>
                <input className="input-base" value={phone}
                  onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999"/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: "block",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Plano</label>
                <select className="input-base" value={plan} onChange={e => setPlan(e.target.value)}>
                  <option value="free">Free — Gratuito</option>
                  <option value="starter">Starter — R$19/mês</option>
                  <option value="pro">Pro — R$29/mês</option>
                  <option value="studio">Studio — R$59/mês</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
              <button onClick={criar} disabled={saving} style={{
                flex: 1, height: 40, borderRadius: 8,
                background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)",
                color: "#7c3aed", fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit", opacity: saving ? 0.6 : 1,
              }}>
                {saving ? <Loader2 size={13} className="spin"/> : <Plus size={13}/>}
                Criar salão
              </button>
              <button onClick={() => setOpen(false)} style={{
                height: 40, padding: "0 16px", borderRadius: 8,
                background: "#f4f5fb", border: `1px solid ${C.sep}`,
                color: C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm toggle modal */}
      {confirmToggle && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setConfirmToggle(null)}>
          <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, maxWidth: 380, width: "calc(100% - 40px)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" }}>
              {confirmToggle.active ? "Desativar" : "Ativar"} salão?
            </p>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
              {confirmToggle.active
                ? `O salão "${confirmToggle.name}" ficará inacessível para novos agendamentos.`
                : `O salão "${confirmToggle.name}" voltará a aceitar agendamentos.`}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmToggle(null)}
                style={{ padding: "8px 18px", borderRadius: 8, background: "#e8e8f0", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                Cancelar
              </button>
              <button onClick={() => void toggleActive(confirmToggle.id, confirmToggle.active)}
                style={{ padding: "8px 18px", borderRadius: 8, background: confirmToggle.active ? "#dc2626" : "#16a34a", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
                {confirmToggle.active ? "Sim, desativar" : "Sim, ativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
