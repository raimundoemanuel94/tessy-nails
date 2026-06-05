// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Link2, UserCheck, ExternalLink } from "lucide-react";

export default function AdminStudioDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const supabase = createClient();

  const [studio, setStudio]     = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const [name, setName]         = useState("");
  const [slug, setSlug]         = useState("");
  const [plan, setPlan]         = useState("pro");
  const [isActive, setIsActive] = useState(true);
  const [ownerId, setOwnerId]   = useState("");

  useEffect(() => { load(); }, [id]);

  async function load() {
    const [{ data: s }, { data: p }, { data: svcs }] = await Promise.all([
      supabase.from("studios").select("*, profiles!studios_owner_id_fkey(id, name, email)").eq("id", id).single(),
      supabase.from("profiles").select("id, name, email, role").eq("role", "professional"),
      supabase.from("services").select("id, name, price, is_active").eq("studio_id", id).order("name"),
    ]);
    if (s) {
      setStudio(s);
      setName(s.name ?? ""); setSlug(s.slug ?? "");
      setPlan(s.plan ?? "pro"); setIsActive(s.is_active ?? true);
      setOwnerId(s.owner_id ?? "");
    }
    setProfiles(p ?? []);
    setServices(svcs ?? []);
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("studios")
      .update({ name, slug, plan, is_active: isActive, owner_id: ownerId || null })
      .eq("id", id);

    if (error) { toast.error(error.message); setSaving(false); return; }

    // Vincula studio ao perfil do profissional
    if (ownerId) {
      await supabase.from("profiles").update({ studio_id: id }).eq("id", ownerId);
    }
    toast.success("Studio atualizado!");
    setSaving(false);
    await load();
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="animate-spin" size={28} style={{ color: "#f59e0b" }} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>{studio?.name}</h1>
          <a href={`/agendar/${studio?.slug}`} target="_blank"
            className="text-xs flex items-center gap-1" style={{ color: "#f59e0b" }}>
            /agendar/{studio?.slug} <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Dados */}
      <div className="card space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>Dados do Studio</h2>
        <input className="input-base" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
        <input className="input-base" placeholder="Slug" value={slug}
          onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
        <div className="grid grid-cols-2 gap-3">
          <select className="input-base" value={plan} onChange={e => setPlan(e.target.value)}>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="studio">Studio</option>
          </select>
          <button onClick={() => setIsActive(v => !v)} className="btn-ghost"
            style={isActive ? { borderColor: "#4ade80", color: "#4ade80" } : { borderColor: "#f87171", color: "#f87171" }}>
            {isActive ? "✓ Ativo" : "✗ Inativo"}
          </button>
        </div>
      </div>

      {/* Vincular profissional */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Link2 size={16} style={{ color: "#f59e0b" }} />
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>
            Profissional Vinculado
          </h2>
        </div>

        {studio?.profiles ? (
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "var(--surface2)", border: "1px solid #4ade8040" }}>
            <UserCheck size={18} style={{ color: "#4ade80" }} />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{studio.profiles.name}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{studio.profiles.email}</p>
            </div>
            <button onClick={() => { setOwnerId(""); }} className="btn-ghost text-xs" style={{ color: "#f87171" }}>
              Desvincular
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs p-3 rounded-xl" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
              💡 O profissional precisa criar uma conta em <strong>/login</strong> antes de ser vinculado.
              Peça para ele se cadastrar com o e-mail que você definir.
            </p>
            <select className="input-base" value={ownerId} onChange={e => setOwnerId(e.target.value)}>
              <option value="">— Selecione o profissional —</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
              ))}
            </select>
            {profiles.length === 0 && (
              <p className="text-xs" style={{ color: "#f59e0b" }}>
                Nenhum profissional cadastrado ainda.
              </p>
            )}
          </>
        )}
      </div>

      {/* Serviços do studio */}
      {services.length > 0 && (
        <div className="card space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>
            Serviços ({services.length})
          </h2>
          <div className="flex flex-col gap-2">
            {services.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-xl"
                style={{ background: "var(--surface2)", opacity: s.is_active ? 1 : 0.4 }}>
                <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{s.name}</span>
                <span className="text-sm font-black" style={{ color: "#4ade80" }}>R$ {s.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={save} disabled={saving} className="btn-primary w-full"
        style={{ background: "#f59e0b", color: "#000" }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Salvar</>}
      </button>
    </div>
  );
}
