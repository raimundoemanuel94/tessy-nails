"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  History,
  User as UserIcon, 
  Plus, 
  ChevronRight,
  Loader2,
  Sparkles,
  Sparkle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNav } from "@/components/cliente/BottomNav";
import { appointmentService } from "@/services/appointments";
import { globalStore } from "@/store/globalStore";
import { format, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Service } from "@/types";
import { Badge } from "@/components/ui/badge";
import { getGreeting, cn } from "@/lib/utils";

export default function ClientePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setDataLoading(true);
        const [appointments, allServices] = await Promise.all([
          appointmentService.getByClientIdWithServices(user.uid),
          globalStore.fetchServices(false)
        ]);

        const upcoming = appointments
          .filter(apt => (isFuture(apt.date) || isToday(apt.date)) && apt.status !== 'cancelled')
          .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
        
        setNextAppointment(upcoming);
        setServices(allServices.slice(0, 4));
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  const statusConfig: Record<string, { variant: "warning" | "success" | "default" | "destructive" }> = {
    pending: { variant: "warning" },
    confirmed: { variant: "success" },
    completed: { variant: "default" },
    cancelled: { variant: "destructive" },
  };

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Cliente";
  
  const quickActions = [
    {
      id: "agenda",
      title: "Minha agenda",
      description: "Próximos horários",
      icon: Calendar,
      gradient: "from-brand-primary/10 to-brand-primary/5",
      iconColor: "text-brand-primary",
      href: "/cliente/agendamentos",
    },
    {
      id: "services",
      title: "Serviços",
      description: "Tabela de preços",
      icon: Sparkles,
      gradient: "from-brand-secondary/10 to-brand-secondary/5",
      iconColor: "text-brand-secondary",
      href: "/cliente/servicos",
    },
    {
      id: "history",
      title: "Histórico",
      description: "Seus atendimentos",
      icon: History,
      gradient: "from-brand-accent/20 to-brand-accent/10",
      iconColor: "text-brand-primary",
      href: "/cliente/agendamentos",
    },
    {
      id: "profile",
      title: "Meu Perfil",
      description: "Dados da conta",
      icon: UserIcon,
      gradient: "from-brand-soft/20 to-brand-soft/10",
      iconColor: "text-brand-text-main",
      href: "/cliente/perfil",
    },
  ];

  return (
    <div className="w-full mx-auto pb-32">
      {/* Premium HEADER (Hero Card Full Bleed) */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-linear-to-br from-[#4B2E2B] to-[#6D4C41] px-6 pb-8 pt-[env(safe-area-inset-top)] text-white shadow-[0_12px_40px_rgba(75, 46, 43, 0.15)]">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#6D4C41]/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                 <UserIcon className="text-white" size={20} />
               </div>
               <div>
                 <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/70">{getGreeting()}</p>
                 <h1 className="text-lg font-bold tracking-tight leading-none">{firstName}</h1>
                 <p className="text-[9px] text-white/60 mt-0.5">
                   {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                 </p>
               </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs font-light text-white/90 leading-relaxed max-w-[260px]">
              Sua beleza e bem-estar em um só lugar. Reserve seu momento hoje.
            </p>

            <Button 
              className="w-full h-11 rounded-xl bg-white text-brand-primary font-bold text-xs shadow-lg hover:bg-white/90 active:scale-95 transition-all border-none"
              onClick={() => router.push("/cliente/agendar")}
            >
              <Plus className="mr-2" size={16} strokeWidth={3} />
              Agendar agora
            </Button>
          </div>
        </div>
      </section>

      <div className="px-5 mt-6 space-y-8 max-w-2xl mx-auto">
        {/* NEXT APPOINTMENT CARD */}
        <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-brand-text-main tracking-tight">Seu próximo horário</h2>
          {nextAppointment && (
            <button 
              onClick={() => router.push("/cliente/agendamentos")} 
              className="text-xs font-medium text-[#4B2E2B] underline underline-offset-4"
            >
              Ver todos
            </button>
          )}
        </div>

        {nextAppointment ? (
          <Card className="rounded-2xl border-[#EFEAE4] bg-white shadow-sm overflow-hidden hover:shadow-md transition-all group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Serviço</span>
                  <h3 className="text-base font-semibold text-brand-text-main">{nextAppointment.service.name}</h3>
                </div>
                <Badge 
                  className={cn(
                    "status-badge",
                    nextAppointment.status === 'confirmed' ? "bg-[#4CAF50]/10 text-[#4CAF50]" :
                    nextAppointment.status === 'pending' ? "bg-[#FFC107]/10 text-[#FFC107]" :
                    "bg-[#F44336]/10 text-[#F44336]"
                  )}
                >
                  {nextAppointment.status === 'confirmed' ? 'Confirmado' : 
                   nextAppointment.status === 'pending' ? 'Pendente' : 'Cancelado'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8F6F3]">
                  <Calendar size={16} className="text-[#4B2E2B]" />
                  <span className="text-xs font-semibold text-[#2C2C2C] tabular-nums">
                    {format(nextAppointment.date, "dd/MM")}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8F6F3]">
                  <Clock size={16} className="text-[#4B2E2B]" />
                  <span className="text-xs font-semibold text-[#2C2C2C] tabular-nums">
                    {nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}
                  </span>
                </div>
              </div>

              <Button 
                variant="ghost"
                className="w-full text-xs font-semibold text-[#4B2E2B] hover:bg-[#4B2E2B]/5 rounded-xl h-10"
                onClick={() => router.push("/cliente/agendamentos")}
              >
                Ver detalhes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-[#EFEAE4] bg-white text-center space-y-4">
             <div className="h-14 w-14 rounded-full bg-[#F8F6F3] flex items-center justify-center text-[#A98B73]">
               <Calendar size={28} />
             </div>
             <div className="space-y-1">
               <p className="text-sm font-semibold text-[#2C2C2C]">Nenhum agendamento ativo</p>
               <p className="text-[11px] text-[#6B6B6B]">Reserve seu horário em poucos segundos</p>
             </div>
             <Button 
               className="bg-brand-primary hover:bg-[#D43B7B] text-white rounded-full text-xs px-6 h-9"
               onClick={() => router.push("/cliente/agendar")}
             >
               Agendar agora
             </Button>
          </div>
        )}
      </section>

      {/* QUICK ACTIONS GRID (2x2) */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand-text-main tracking-tight px-1">Atalhos rápidos</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => router.push(action.href)}
              className="flex flex-col p-3.5 rounded-2xl bg-white border border-brand-soft shadow-sm text-left transition-all active:scale-95 group"
            >
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-background text-brand-primary transition-transform group-hover:scale-110">
                <action.icon size={18} strokeWidth={2.5} />
              </div>
              <p className="text-xs font-bold text-brand-text-main leading-none mb-1">{action.title}</p>
              <p className="text-[9px] font-medium text-brand-text-sub">{action.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* OPTIONAL SECTION (SMART UX) */}
      {services.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#2C2C2C] px-1">Sugestões para você</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
            {services.map((service) => (
              <div 
                key={service.id}
                className="min-w-[130px] p-2.5 rounded-2xl bg-white border border-brand-soft shadow-sm space-y-2 shrink-0"
              >
                <div className="h-16 w-full rounded-xl bg-brand-background flex items-center justify-center text-brand-secondary">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#2C2C2C] line-clamp-1">{service.name}</p>
                  <p className="text-[10px] text-[#6B6B6B]">Explorar serviço</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer Branding */}
      <footer className="pt-6 flex flex-col items-center justify-center gap-3 text-center opacity-40">
        <div className="flex items-center gap-2">
          <Sparkle className="text-[#4B2E2B]" size={10} />
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#4B2E2B]">Tessy Nails</span>
        </div>
        </footer>
      </div>
    </div>
  );
}
