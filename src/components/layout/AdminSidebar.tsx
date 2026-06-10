// @ts-nocheck
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Building2, Users, LogOut, LayoutGrid, ChevronRight, ChevronDown,
  DollarSign, Settings, TrendingUp, FileText, AlertTriangle, CreditCard, Plus, Tag
} from "lucide-react";

// ===== ESTRUTURA DE NAVEGAÇÃO (grupos + filhos) =====
// type: "link" = navega direto | "group" = expande/colapsa filhos
const NAV = [
  {
    section: "Negócio",
    items: [
      { type: "link", href: "/admin", label: "Visão Geral", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    section: "Tenants",
    items: [
      {
        type: "group", label: "Salões", icon: Building2, key: "saloes",
        children: [
          { href: "/admin/studios", label: "Todos os salões", exact: true },
          { href: "/admin/studios", label: "Novo salão", action: "new-studio" },
        ],
      },
      {
        type: "group", label: "Pessoas", icon: Users, key: "pessoas",
        children: [
          { href: "/admin/profissionais", label: "Profissionais", exact: true },
        ],
      },
    ],
  },
  {
    section: "Dinheiro",
    items: [
      {
        type: "group", label: "Financeiro", icon: DollarSign, key: "financeiro",
        children: [
          { href: "/admin/financeiro", label: "Receita", exact: true },
          { href: "/admin/financeiro/assinaturas", label: "Assinaturas" },
          { href: "/admin/financeiro/inadimplencia", label: "Inadimplência" },
        ],
      },
    ],
  },
  {
    section: "Sistema",
    items: [
      {
        type: "group", label: "Plataforma", icon: Settings, key: "plataforma",
        children: [
          { href: "/admin/config/planos", label: "Planos & preços" },
          { href: "/admin/config", label: "Configurações", exact: true },
        ],
      },
    ],
  },
];

export function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Abre automaticamente o grupo que contém a rota ativa
  useEffect(() => {
    const next: Record<string, boolean> = {};
    NAV.forEach(sec => sec.items.forEach((it: any) => {
      if (it.type === "group") {
        const hasActive = it.children.some((c: any) =>
          c.exact ? pathname === c.href : pathname.startsWith(c.href) && c.href !== "/admin"
        );
        if (hasActive) next[it.key] = true;
      }
    }));
    setOpen(prev => ({ ...prev, ...next }));
  }, [pathname]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  const linkActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : (pathname.startsWith(href) && href !== "/admin");

  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: 240,
      display: "flex", flexDirection: "column",
      background: "var(--surface)", borderRight: "1px solid var(--border)", zIndex: 10,
    }} className="hidden md:flex">

      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: "linear-gradient(135deg, #7C5CBF 0%, #9D7FD4 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(124,92,191,0.4), inset 0 1px 0 rgba(255,255,255,.2)", fontSize: 20, flexShrink: 0 }}>💅</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", letterSpacing: "-.01em" }}>Nailit</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800, letterSpacing: ".18em", color: "var(--gold)", textTransform: "uppercase", background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 6, padding: "1px 7px" }}>⚡ Superadmin</div>
          </div>
        </div>
      </div>

      {/* Atalho cross-mundo */}
      <div style={{ padding: "10px 10px 0" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 12, textDecoration: "none", background: "rgba(124,92,191,0.06)", border: "1px solid rgba(124,92,191,0.12)", color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>
          <LayoutGrid size={14} /> Ir para Dashboard
        </Link>
      </div>

      {/* Nav com grupos */}
      <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", padding: "6px 12px 4px", opacity: .7 }}>
              {section}
            </div>

            {items.map((it: any) => {
              // ITEM SIMPLES (navega direto)
              if (it.type === "link") {
                const active = linkActive(it.href, it.exact);
                const Icon = it.icon;
                return (
                  <Link key={it.href} href={it.href} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, textDecoration: "none", fontSize: 13, fontWeight: active ? 700 : 500,
                    background: active ? "rgba(124,92,191,0.15)" : "transparent",
                    border: active ? "1px solid rgba(124,92,191,0.25)" : "1px solid transparent",
                    color: active ? "var(--brand-light)" : "var(--muted)",
                  }}>
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{it.label}</span>
                    {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
                  </Link>
                );
              }

              // GRUPO (expande/colapsa)
              const Icon = it.icon;
              const isOpen = !!open[it.key];
              const groupActive = it.children.some((c: any) => linkActive(c.href, c.exact));
              return (
                <div key={it.key}>
                  <button onClick={() => toggle(it.key)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                    fontSize: 13, fontWeight: groupActive ? 700 : 500, textAlign: "left",
                    background: groupActive && !isOpen ? "rgba(124,92,191,0.1)" : "transparent",
                    border: "1px solid transparent",
                    color: groupActive ? "var(--brand-light)" : "var(--muted)",
                  }}>
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{it.label}</span>
                    <ChevronDown size={13} style={{ opacity: .6, transition: "transform .2s", transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }} />
                  </button>

                  {/* Filhos */}
                  <div style={{ maxHeight: isOpen ? it.children.length * 44 + 8 : 0, overflow: "hidden", transition: "max-height .25s ease" }}>
                    <div style={{ paddingLeft: 12, marginTop: 2, display: "flex", flexDirection: "column", gap: 1, borderLeft: "1px solid var(--border)", marginLeft: 19 }}>
                      {it.children.map((c: any, i: number) => {
                        const active = linkActive(c.href, c.exact);
                        return (
                          <Link key={i} href={c.href} style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 9, textDecoration: "none",
                            fontSize: 12.5, fontWeight: active ? 700 : 500, marginLeft: 4,
                            background: active ? "rgba(124,92,191,0.13)" : "transparent",
                            color: active ? "var(--brand-light)" : "var(--muted)",
                          }}>
                            {c.action === "new-studio" && <Plus size={12} style={{ opacity: .8 }} />}
                            <span style={{ flex: 1 }}>{c.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(124,92,191,0.06)", border: "1px solid rgba(124,92,191,0.1)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#7C5CBF,#f0b64a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>{name.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <div style={{ fontSize: 10, color: "var(--gold)" }}>Superadmin</div>
          </div>
        </div>
        <button onClick={signOut} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 10, background: "none", border: "1px solid transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--muted)", fontFamily: "inherit" }}
          onMouseEnter={(e: any) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.06)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}>
          <LogOut size={14} /> Sair da conta
        </button>
      </div>
    </aside>
  );
}
