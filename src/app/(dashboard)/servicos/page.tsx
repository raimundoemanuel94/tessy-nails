// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Scissors, Clock, DollarSign } from "lucide-react";
import type { Service } from "@/types/database";

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [studioId, setStudioId] = useState<string | null>(null);

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving]   = useState(false);

  const [name, setName]           = useState("");
  const [price, setPrice]         = useState("");
  const [duration, setDuration]   = useState("");
  const [description, setDesc]    = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("studio_id").eq("id", user.id).single();
      
      setStudioId((profile as { studio_id: string | null } | null)?.studio_id ?? null);
      const { data } = await supabase.from("services").select("*").eq("studio_id", profile.studio_id).order("name");
      setServices(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function openForm(svc?: Service) {
    setEditing(svc ?? null);
    setName(svc?.name ?? "");
    setPrice(String(svc?.price ?? ""));
    setDuration(String(svc?.duration_minutes ?? "30"));
    setDesc(svc?.description ?? "");
    setOpen(true);
  }

  async function save() {
    if (!studioId || !name || !price || !duration) return;
    setSaving(true);
    const payload = { name, price: parseFloat(price), duration_minutes: parseInt(duration), description: description || null, studio_id: studioId };
    const { error } = editing
      ? await supabase.from("services").update(payload).eq("id", editing.id)
      : await supabase.from("services").insert(payload);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(editing ? "Serviço atualizado!" : "Serviço criado!");
    setSaving(false); setOpen(false);
    const { data } = await supabase.from("services").select("*").eq("studio_id", studioId).order("name");
    setServices(data ?? []);
  }

  async function del(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices(s => s.filter(x => x.id !== id));
    toast.success("Serviço excluído.");
  }

  async function toggle(svc: Service) {
    await supabase.from("services").update({ is_active: !svc.is_active }).eq("id", svc.id);
    setServices(s => s.map(x => x.id === svc.id ? { ...x, is_active: !x.is_active } : x));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Serviços</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{services.length} serviços cadastrados</p>
        </div>
        <button onClick={() => openForm()} className="btn-primary"><Plus size={16} /> Novo</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--brand)" }} size={28} /></div>
      ) : services.length === 0 ? (
        <div className="card text-center py-12">
          <Scissors size={32} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p style={{ color: "var(--muted)" }}>Nenhum serviço cadastrado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {services.map(svc => (
            <div key={svc.id} className="card flex items-center gap-4" style={{ opacity: svc.is_active ? 1 : 0.5 }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black truncate" style={{ color: "var(--text)" }}>{svc.name}</p>
                  {!svc.is_active && <span className="badge badge-gray">Inativo</span>}
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#4ade80" }}>
                    <DollarSign size={11} />{formatCurrency(svc.price)}
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                    <Clock size={11} />{formatDuration(svc.duration_minutes)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggle(svc)} className="btn-ghost text-xs px-2">
                  {svc.is_active ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => openForm(svc)} className="btn-ghost p-2"><Pencil size={14} /></button>
                <button onClick={() => del(svc.id)} className="btn-ghost p-2" style={{ color: "#f87171" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card w-full max-w-md">
            <h2 className="text-base font-black mb-4" style={{ color: "var(--text)" }}>
              {editing ? "Editar serviço" : "Novo serviço"}
            </h2>
            <div className="flex flex-col gap-3">
              <input className="input-base" placeholder="Nome do serviço *" value={name} onChange={e => setName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-base" type="number" placeholder="Preço (R$) *" value={price} onChange={e => setPrice(e.target.value)} />
                <input className="input-base" type="number" placeholder="Duração (min) *" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
              <input className="input-base" placeholder="Descrição (opcional)" value={description} onChange={e => setDesc(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={save} className="btn-primary flex-1" disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Salvar"}
              </button>
              <button onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
