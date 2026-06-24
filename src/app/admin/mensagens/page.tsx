"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Cake, MessageCircle, RotateCcw, Send, Sparkles, ExternalLink, Users, Phone } from "lucide-react";

const C = { card: "#ffffff", border: "#e2e8f0", sep: "#f0f0f8", text: "#0f172a", sub: "#64748b", muted: "#94a3b8" };

const TEMPLATES: Record<string, (c: string, s: string, h: string, link: string) => string> = {
  lembrete:   (c, s, h) => `Oi, ${c}! 💅 Passando para lembrar do seu horário amanhã às ${h} no ${s}. Qualquer dúvida, é só chamar!`,
  reativacao: (c, s, _, link) => `Oi, ${c}! Já está na hora de cuidar das unhas? 😍 O ${s} tem horários disponíveis pra você. Agende pelo link: ${link}`,
  aniversario:(c, s) => `Feliz aniversário, ${c}! 🎂🎉 O ${s} manda muitas felicidades. Venha comemorar com a gente — temos um carinho especial pra você!`,
  campanha:   (c, s, _, link) => `Oi, ${c}! 💅 Novos horários disponíveis no ${s}. Garanta o seu: ${link}`,
};

function waLink(phone: string, msg: string) {
  const num = phone.replace(/\D/g, "");
  const prefix = num.startsWith("55") ? num : `55${num}`;
  return `https://wa.me/${prefix}?text=${encodeURIComponent(msg)}`;
}

function ClientRow({ client, studio, template, booking_url }: any) {
  const phone = client.phone ?? client.whatsapp ?? "";
  const hora = client.next_hour ?? "";
  const msg = TEMPLATES[template]?.(
    client.name ?? "cliente",
    studio?.name ?? "o salão",
    hora,
    booking_url
  ) ?? "";
  const link = phone ? waLink(phone, msg) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px auto", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${C.sep}` }}
      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
      onMouseLeave={e => (e.currentTarget.style.background = "")}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{phone || "Sem telefone"} {client.studio_name ? `· ${client.studio_name}` : ""}</div>
      </div>
      {hora ? (
        <span style={{ fontSize: 12, color: C.sub }}>{hora}</span>
      ) : (
        <span style={{ fontSize: 11, color: C.muted }}>—</span>
      )}
      <span style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {client.last_visit ? `${client.days_away}d sem visita` : client.birth_str ?? "—"}
      </span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8,
            background: "#25d366", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
          <ExternalLink size={12} /> WhatsApp
        </a>
      ) : (
        <span style={{ fontSize: 11, color: "#ef4444" }}>Sem telefone</span>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, color, clients, studio, template, booking_url, empty }: any) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
          background: "none", border: "none", cursor: "pointer", borderBottom: open ? `1px solid ${C.sep}` : "none", textAlign: "left" }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}12`, border: `1px solid ${color}30` }}>
          <Icon size={15} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{clients.length}</span>
          <span style={{ fontSize: 11, color: C.muted }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px auto", gap: 12, padding: "8px 16px", background: "#f8fafc", borderBottom: `1px solid ${C.sep}` }}>
            {["Cliente", "Horário", "Info", "Ação"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".07em" }}>{h}</span>
            ))}
          </div>
          {clients.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", color: C.muted, fontSize: 13 }}>{empty}</div>
          ) : (
            clients.map((c: any) => (
              <ClientRow key={c.id} client={c} studio={studio} template={template} booking_url={booking_url} />
            ))
          )}
          {clients.length > 0 && (
            <div style={{ padding: "10px 16px", background: "#f8fafc", borderTop: `1px solid ${C.sep}`, display: "flex", justifyContent: "flex-end" }}>
              <a href={`https://wa.me/?text=${encodeURIComponent(TEMPLATES[template]?.("", studio?.name ?? "o salão", "", booking_url) ?? "")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: C.sub, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                <Send size={11} /> Ver template completo
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminMensagensPage() {
  const sb = createClient();
  const [clients, setClients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studioFilter, setStudioFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      sb.from("clients").select("id,name,phone,email,birth_date,studio_id,created_at,is_active"),
      sb.from("appointments").select("id,client_id,client_name,studio_id,appointment_date,status").order("appointment_date"),
      sb.from("studios").select("id,name,slug,whatsapp,phone,brand_color"),
    ]).then(([c, a, s]) => {
      setClients(c.data ?? []);
      setAppointments(a.data ?? []);
      setStudios(s.data ?? []);
      setLoading(false);
    });
  }, []);

  const studioById = useMemo(() => new Map(studios.map(s => [s.id, s])), [studios]);

  const filtered = useMemo(() => studioFilter === "all" ? clients : clients.filter(c => c.studio_id === studioFilter), [clients, studioFilter]);

  // Agendamentos próximas 24h
  const tomorrow = new Date(); tomorrow.setHours(tomorrow.getHours() + 24);
  const today = new Date(); today.setHours(0,0,0,0);
  const upcomingAppts = appointments.filter(a => {
    const d = new Date(a.appointment_date);
    return d >= today && d <= tomorrow && !["cancelled","canceled","completed"].includes(a.status ?? "");
  });

  const lembretes = useMemo(() => {
    const clientIds = new Set(upcomingAppts.map(a => a.client_id));
    return filtered.filter(c => clientIds.has(c.id)).map(c => {
      const appt = upcomingAppts.find(a => a.client_id === c.id);
      const d = appt ? new Date(appt.appointment_date) : null;
      const studio = studioById.get(c.studio_id);
      return { ...c, next_hour: d ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "", studio_name: studio?.name };
    });
  }, [filtered, upcomingAppts, studioById]);

  // Inativos 45+ dias
  const reativacao = useMemo(() => {
    return filtered.filter(c => {
      const lastAppt = appointments.filter(a => a.client_id === c.id && a.status === "completed").sort((a,b) => b.appointment_date.localeCompare(a.appointment_date))[0];
      const ref = lastAppt?.appointment_date ?? c.created_at;
      const days = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
      return days >= 45;
    }).map(c => {
      const lastAppt = appointments.filter(a => a.client_id === c.id).sort((a,b) => b.appointment_date.localeCompare(a.appointment_date))[0];
      const ref = lastAppt?.appointment_date ?? c.created_at;
      const days = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
      const studio = studioById.get(c.studio_id);
      return { ...c, last_visit: ref, days_away: days, studio_name: studio?.name };
    });
  }, [filtered, appointments, studioById]);

  // Aniversariantes do mês
  const thisMonth = new Date().getMonth() + 1;
  const aniversariantes = useMemo(() => {
    return filtered.filter(c => {
      if (!c.birth_date) return false;
      const m = new Date(c.birth_date).getMonth() + 1;
      return m === thisMonth;
    }).map(c => {
      const d = new Date(c.birth_date);
      const studio = studioById.get(c.studio_id);
      return { ...c, birth_str: `${d.getDate()}/${thisMonth}`, studio_name: studio?.name };
    });
  }, [filtered, thisMonth, studioById]);

  // Com telefone para campanha
  const campanha = useMemo(() => filtered.filter(c => c.phone).map(c => {
    const studio = studioById.get(c.studio_id);
    return { ...c, studio_name: studio?.name };
  }), [filtered, studioById]);

  const primaryStudio = studios[0];
  const bookingUrl = primaryStudio ? `https://tessy-nails.vercel.app/agendar/${primaryStudio.slug}` : "";

  const totalWithPhone = clients.filter(c => c.phone).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Relacionamento</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-.03em" }}>Central de mensagens</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>Contatos organizados por prioridade — clique em WhatsApp para enviar</p>
        </div>
        <select value={studioFilter} onChange={e => setStudioFilter(e.target.value)}
          style={{ height: 36, padding: "0 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: "#fff", color: C.text, fontFamily: "inherit", cursor: "pointer" }}>
          <option value="all">Todos os salões</option>
          {studios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Com WhatsApp", value: totalWithPhone, icon: Phone, color: "#25d366" },
          { label: "Lembretes hoje", value: lembretes.length, icon: Bell, color: "#f59e0b" },
          { label: "Para reativar", value: reativacao.length, icon: RotateCcw, color: "#7c3aed" },
          { label: "Aniversariantes", value: aniversariantes.length, icon: Cake, color: "#ec4899" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1 }}>{loading ? "—" : value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Aviso */}
      <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.20)", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
        <p style={{ fontSize: 12, color: C.sub, margin: 0, lineHeight: 1.5 }}>
          Clique em <strong style={{ color: "#25d366" }}>WhatsApp</strong> em cada cliente para abrir a conversa com a mensagem já preenchida. Envio manual por enquanto — automação completa requer gateway (Z-API ou Evolution API).
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando...</div>
      ) : (
        <>
          <Section title="Lembretes — agendamentos nas próximas 24h" icon={Bell} color="#f59e0b"
            clients={lembretes} studio={primaryStudio} template="lembrete" booking_url={bookingUrl}
            empty="Nenhum agendamento nas próximas 24 horas." />

          <Section title="Reativação — 45+ dias sem visita" icon={RotateCcw} color="#7c3aed"
            clients={reativacao.slice(0, 30)} studio={primaryStudio} template="reativacao" booking_url={bookingUrl}
            empty="Nenhum cliente inativo no momento." />

          <Section title={`Aniversariantes de ${new Date().toLocaleDateString("pt-BR", { month: "long" })}`} icon={Cake} color="#ec4899"
            clients={aniversariantes} studio={primaryStudio} template="aniversario" booking_url={bookingUrl}
            empty="Nenhum aniversariante este mês." />

          <Section title="Campanha geral — todos com telefone" icon={Sparkles} color="#3b82f6"
            clients={campanha.slice(0, 50)} studio={primaryStudio} template="campanha" booking_url={bookingUrl}
            empty="Nenhum cliente com telefone cadastrado." />
        </>
      )}
    </div>
  );
}
