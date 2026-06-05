// @ts-nocheck
"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Pencil, Loader2, Users, Phone, Mail } from "lucide-react";
import type { Client } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientesPage() {
  const [clients, setClients]   = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);
  const [studioId, setStudioId] = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Client | null>(null);
  const [saving, setSaving]     = useState(false);

  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("studio_id").eq("id", user.id).single();
      
      setStudioId((profile as { studio_id: string | null } | null)?.studio_id ?? null);
      const { data } = await supabase.from("clients").select("*").eq("studio_id", profile.studio_id).order("name");
      setClients(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q));
  }, [clients, search]);

  function openForm(c?: Client) {
    setEditing(c ?? null);
    setName(c?.name ?? ""); setPhone(c?.phone ?? ""); setEmail(c?.email ?? ""); setNotes(c?.notes ?? "");
    setOpen(true);
  }

  async function save() {
    if (!studioId || !name) return;
    setSaving(true);
    const payload = { name, phone: phone || null, email: email || null, notes: notes || null, studio_id: studioId };
    const { error } = editing
      ? await supabase.from("clients").update(payload).eq("id", editing.id)
      : await supabase.from("clients").insert(payload);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(editing ? "Cliente atualizada!" : "Cliente criada!");
    setSaving(false); setOpen(false);
    const { data } = await supabase.from("clients").select("*").eq("studio_id", studioId).order("name");
    setClients(data ?? []);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Clientes</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{clients.length} clientes cadastradas</p>
        </div>
        <button onClick={() => openForm()} className="btn-primary"><Plus size={16} /> Nova</button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input className="input-base pl-10" placeholder="Buscar por nome, telefone ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={28} style={{ color: "var(--brand)" }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={32} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p style={{ color: "var(--muted)" }}>{search ? "Nenhuma cliente encontrada." : "Nenhuma cliente cadastrada."}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(c => (
            <div key={c.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0"
                style={{ background: "var(--brand)" }}>{c.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate" style={{ color: "var(--text)" }}>{c.name}</p>
                <div className="flex gap-3 mt-0.5">
                  {c.phone && <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}><Phone size={10} />{c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}><Mail size={10} />{c.email}</span>}
                </div>
              </div>
              <div className="text-xs shrink-0 hidden md:block" style={{ color: "var(--muted)" }}>
                {format(new Date(c.created_at), "dd/MM/yy", { locale: ptBR })}
              </div>
              <button onClick={() => openForm(c)} className="btn-ghost p-2 shrink-0"><Pencil size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card w-full max-w-md">
            <h2 className="text-base font-black mb-4" style={{ color: "var(--text)" }}>
              {editing ? "Editar cliente" : "Nova cliente"}
            </h2>
            <div className="flex flex-col gap-3">
              <input className="input-base" placeholder="Nome completo *" value={name} onChange={e => setName(e.target.value)} />
              <input className="input-base" type="tel" placeholder="WhatsApp/Telefone" value={phone} onChange={e => setPhone(e.target.value)} />
              <input className="input-base" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
              <textarea className="input-base h-auto py-3" rows={2} placeholder="Observações" value={notes} onChange={e => setNotes(e.target.value)} />
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
