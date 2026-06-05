// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Scissors } from "lucide-react";

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

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1|2>(1);
  const [loading, setLoading] = useState(false);

  const [name, setName]   = useState("");
  const [slug, setSlug]   = useState("");
  const [phone, setPhone] = useState("");

  const [services, setServices] = useState(
    SERVICES_DEFAULT.map(s => ({ ...s, selected: true }))
  );

  const supabase = createClient();

  function handleNameChange(v: string) {
    setName(v);
    setSlug(v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
  }

  async function finish() {
    if (!name || !slug) { toast.error("Nome e slug são obrigatórios."); return; }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Cria studio
    const { data: studio, error: studioErr } = await supabase.from("studios")
      .insert({ name, slug, phone: phone || null, owner_id: user.id, plan: "pro" })
      .select("id").single();

    if (studioErr) {
      toast.error(studioErr.message.includes("unique") ? "Este slug já está em uso. Tente outro." : studioErr.message);
      setLoading(false); return;
    }

    // Atualiza perfil com studio_id
    await supabase.from("profiles").update({ studio_id: studio.id }).eq("id", user.id);

    // Cria settings padrão
    await supabase.from("salon_settings").insert({ studio_id: studio.id });

    // Cria serviços selecionados
    const selectedSvcs = services.filter(s => s.selected).map(s => ({
      studio_id: studio.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes,
    }));
    if (selectedSvcs.length > 0) await supabase.from("services").insert(selectedSvcs);

    toast.success("Studio configurado com sucesso!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--brand)" }}>
            <Scissors size={24} color="#fff" />
          </div>
          <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Configurar seu Studio</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Passo {step} de 2</p>
        </div>

        <div className="card">
          {step === 1 && (
            <>
              <h2 className="text-base font-black mb-4" style={{ color: "var(--text)" }}>Informações básicas</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ color: "var(--muted)" }}>Nome do seu studio *</label>
                  <input className="input-base" placeholder="Ex: Tessy Nails" value={name} onChange={e => handleNameChange(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ color: "var(--muted)" }}>Link de agendamento *</label>
                  <input className="input-base" placeholder="tessy-nails" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))} />
                  {slug && <p className="text-xs mt-1" style={{ color: "var(--brand-light)" }}>/agendar/{slug}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ color: "var(--muted)" }}>WhatsApp (opcional)</label>
                  <input className="input-base" type="tel" placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <button onClick={() => { if (!name||!slug) { toast.error("Preencha nome e slug."); return; } setStep(2); }}
                className="btn-primary w-full mt-4">Próximo →</button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-base font-black mb-1" style={{ color: "var(--text)" }}>Serviços iniciais</h2>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Selecione os serviços que você oferece. Pode editar depois.</p>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {services.map((s, i) => (
                  <label key={s.name} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                    style={{ background: s.selected ? "var(--surface2)" : "transparent", border: `1px solid ${s.selected ? "var(--brand)" : "var(--border)"}` }}>
                    <input type="checkbox" checked={s.selected} onChange={e => setServices(sv => sv.map((x,j) => j===i ? {...x,selected:e.target.checked} : x))}
                      className="accent-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{s.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>R$ {s.price} · {s.duration_minutes}min</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1">← Voltar</button>
                <button onClick={finish} className="btn-primary flex-1" disabled={loading}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : "Criar studio ✓"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
