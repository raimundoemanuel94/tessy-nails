"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Scissors } from "lucide-react";
import { getPostAuthRedirectPath } from "@/lib/auth/post-auth-redirect";

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

function SetupPageContent() {
  const router = useRouter();
  const [step, setStep] = useState<1|2>(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [name, setName]   = useState("");
  const [slug, setSlug]   = useState("");
  const [phone, setPhone] = useState("");

  const [services, setServices] = useState(
    SERVICES_DEFAULT.map(s => ({ ...s, selected: true }))
  );

  const supabase = createClient();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "1";

  // Tela de trial expirado
  if (!checking && isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-md text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <Scissors size={28} color="#f87171" />
            </div>
            <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Período de teste encerrado</h1>
            <p className="text-sm mt-2" style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              Seu acesso de teste expirou. Para continuar usando o Nailit, entre em contato com a equipe e ative seu plano.
            </p>
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <a
              href="https://wa.me/5566999990000?text=Ol%C3%A1%2C+quero+ativar+meu+plano+no+Nailit"
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              Falar com a equipe no WhatsApp
            </a>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="btn-ghost w-full"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se já tem studio, vai direto pro dashboard
  useEffect(() => {
    async function checkStudio() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("studio_id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.studio_id || profile?.role === "superadmin") {
        router.replace(getPostAuthRedirectPath(profile));
        return;
      }
      setChecking(false);
    }
    checkStudio();
  }, []);

  function handleNameChange(v: string) {
    setName(v);
    setSlug(v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
  }

  async function finish() {
    if (!name || !slug) { toast.error("Nome e slug são obrigatórios."); return; }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: studio, error: studioErr } = await supabase.from("studios")
      .insert({ name, slug, phone: phone || null, owner_id: user.id, plan: "pro" })
      .select("id").single();

    if (studioErr) {
      toast.error(studioErr.message.includes("unique") ? "Este slug já está em uso. Tente outro." : studioErr.message);
      setLoading(false); return;
    }

    await supabase.from("profiles").update({ studio_id: studio.id }).eq("id", user.id);
    await supabase.from("salon_settings").upsert({
        studio_id: studio.id,
        slot_duration: 30,
        advance_days: 30,
        cancel_hours: 2,
        auto_confirm: false,
        blocked_dates: [],
        working_hours: {
          mon: { is_open: true,  open: "09:00", close: "18:00" },
          tue: { is_open: true,  open: "09:00", close: "18:00" },
          wed: { is_open: true,  open: "09:00", close: "18:00" },
          thu: { is_open: true,  open: "09:00", close: "18:00" },
          fri: { is_open: true,  open: "09:00", close: "18:00" },
          sat: { is_open: true,  open: "08:00", close: "13:00" },
          sun: { is_open: false, open: "09:00", close: "18:00" },
        },
      });

    const selectedSvcs = services.filter(s => s.selected).map(s => ({
      studio_id: studio.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes,
    }));
    if (selectedSvcs.length > 0) await supabase.from("services").insert(selectedSvcs);

    toast.success("Studio configurado com sucesso!");
    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
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

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}><Loader2 size={28} className="animate-spin" style={{ color: "var(--brand)" }} /></div>}>
      <SetupPageContent />
    </Suspense>
  );
}
