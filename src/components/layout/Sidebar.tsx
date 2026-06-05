// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Calendar, Users, Scissors, BarChart3,
  Settings, LogOut, CalendarDays, Shield, Sparkles,
  ChevronRight
} from "lucide-react";

const NAV = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agenda",        icon: Calendar,        label: "Agenda" },
  { href: "/agendamentos",  icon: CalendarDays,    label: "Agendamentos" },
  { href: "/clientes",      icon: Users,           label: "Clientes" },
  { href: "/servicos",      icon: Scissors,        label: "Serviços" },
  { href: "/relatorios",    icon: BarChart3,       label: "Relatórios" },
  { href: "/configuracoes", icon: Settings,        label: "Configurações" },
];

export function Sidebar({ profile }: { profile: any }) {
  const pathname     = usePathname();
  const router       = useRouter();
  const isSuperadmin = profile?.role === "superadmin";
  const studio       = profile?.studios;

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        position: "fixed", left: 0, top: 0, height: "100%", width: 240,
        display: "flex", flexDirection: "column",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        zIndex: 10
      }} className="hidden md:flex">

        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: isSuperadmin
                ? "linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%)"
                : "linear-gradient(135deg, #7C5CBF 0%, #9D7FD4 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isSuperadmin ? "0 4px 15px rgba(245,158,11,0.3)" : "0 4px 15px rgba(124,92,191,0.3)",
              flexShrink: 0
            }}>
              {isSuperadmin
                ? <Shield size={17} color="#000" />
                : <Sparkles size={17} color="#fff" />}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {studio?.name ?? (isSuperadmin ? "Nailit Admin" : "Meu Studio")}
              </p>
              <p style={{ fontSize: 11, color: "var(--muted)" }}>
                {isSuperadmin ? "Superadmin" : `Plano ${studio?.plan ?? "Pro"}`}
              </p>
            </div>
          </div>
        </div>

        {/* Admin button */}
        {isSuperadmin && (
          <div style={{ padding: "10px 10px 0" }}>
            <Link href="/admin" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12, textDecoration: "none",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#f59e0b", fontSize: 13, fontWeight: 700
            }}>
              <Shield size={15} /> Painel Admin
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12, textDecoration: "none",
                fontSize: 13, fontWeight: active ? 700 : 500,
                transition: "all .15s",
                background: active ? "rgba(124,92,191,0.15)" : "transparent",
                border: active ? "1px solid rgba(124,92,191,0.25)" : "1px solid transparent",
                color: active ? "var(--brand-light)" : "var(--muted)",