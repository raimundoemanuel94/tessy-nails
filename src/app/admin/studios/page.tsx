// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Building2, Loader2, Pencil, Power } from "lucide-react";
import Link from "next/link";

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

export default function AdminStudiosPage() {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);

  const [nome, setNome]   = useState("");
  const [slug, setSlug]   = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan]   = useState("pro");

  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase
      .from("studios")
      .select("id, name, slug, plan, is_active, owner_id, profiles!studios_owner_id_fkey(name, email)")
      .order("created_at", { ascending: false });
    setStudios(data ?? []);
    setLoading(false);
  }

  function handleNome(v: string) {
    setNome(v);
    setSlug(v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }

  async function criar() {
    if (!nome || !slug) { toast.error("Nome e slug são obrigatórios."); return; }
    setSaving(true);
    try {
      const { data: studio, error } = await supabase
        .from("studios")
        .insert({ name: nome, slug, phone: phone || null, plan, is_active: true })
        .select("id").single();

      if (error) { toast.error(error.message.includes("unique") ? "Slug já em uso." : error.message); return; }

      await supabase.from("salon_settings").insert({ studio_id: studio.id });
      await supabase.from("services").insert(SERVICES_DEFAULT.map(s => ({ ...s, studio_id: studio.id, is_active: true })));

      toast.success(`Studio "${nome}" criado com 8 serviços padrão!`);
      setOpen(false); setNome(""); setSlug(""); setPhone("");
      await load();
    } catch (e) {
      toast.error("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("studios").update({ is_active: !current }).eq("id", id);
    setStudios(s => s.map(x => x.id === id ? { ...x, is_active: !current } : x));
    toast.success(current ? "Studio desativado." : "Studio ativado.");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Studios</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{studios.length} studios na plataforma</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary" style={{ background: "#f59e0b", color: "#000" }}>
          <Plus size={16} /> Novo Studio
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={28} style={{ color: "#f59e0b" }} /></div>
      ) : studios.length === 0 ? (
        <div className="card text-center py-12"><Building2 size={32} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p style={{ color: "var(--muted)" }}>Nenhum studio cadastrado.</p></div>
      ) : (
        <div className="flex flex-col gap-3">
          {studios.map(s => (
            <div key={s.id} className="card flex items-center gap-4" style={{ opacity: s.is_active ? 1 : 0.5 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0"
                style={{ background: "#f59e0b", color: "#000" }}>{s.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black" style={{ color: "var(--text)" }}>{s.name}</p>
                  <span className="badge badge-purple capitalize">{s.plan}</span>
                  {!s.is_active && <span className="badge badge-gray">Inativo</span>}
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  /agendar/{s.slug}
                  {s.profiles?.name
                    ? <span style={{ color: "#4ade80" }}> · {s.profiles.name}</span>
                    : <span style={{ color: "#f59e0b" }}> · sem profissional vinculado</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/admin/studios/${s.id}`} className="btn-ghost p-2"><Pencil size={14} /></Link>
                <button onClick={() => toggleActive(s.id, s.is_active)} className="btn-ghost p-2">
                  <Power size={14} style={{ color: s.is_active ? "#4ade80" : "#f87171" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="card w-full max-w-md">
            <h2 className="text-base font-black mb-4" style={{ color: "var(--text)" }}>Novo Studio</h2>
            <div className="flex flex-col gap-3">
              <input className="input-base" placeholder="Nome do studio *" value={nome} onChange={e => handleNome(e.target.value)} />
              <input className="input-base" placeholder="Slug (URL) *" value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
              {slug && <p className="text-xs" style={{ color: "var(--brand-light)" }}>/agendar/{slug}</p>}
              <input className="input-base" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} />
              <select className="input-base" value={plan} onChange={e => setPlan(e.target.value)}>
                <option value="free">Free</option>
                <option value="starter">Starter — R$19/mês</option>
                <option value="pro">Pro — R$29/mês</option>
                <option value="studio">Studio — R$59/mês</option>
              </select>
              <p className="text-xs p-3 rounded-xl" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
                💡 Após criar, vá em <strong>Editar Studio</strong> para vincular o profissional ao studio. O profissional precisa criar a conta primeiro em <strong>/login</strong>.
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={criar} className="btn-primary flex-1" disabled={saving}
                style={{ background: "#f59e0b", color: "#000" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Criar Studio"}
              </button>
              <button onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
