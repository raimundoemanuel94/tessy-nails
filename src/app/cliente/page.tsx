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
import { salonService } from "@/services/salon";
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
          salonService.getAll()
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
  const nextStatus = nextAppointment ? (statusConfig[nextAppointment.status] || statusConfig.pending) : null;
  
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
    <div className="px-5 pt-6 max-w-2xl mx-auto space-y-8 pb-10">
      {/* Premium HEADER (Hero Card) */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#6F4E37] to-[#A98B73] p-6 text-white shadow-premium-xl">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#C89B7B]/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                 <UserIcon className="text-white" size={24} />
               </div>
               <div>
                 <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">{getGreeting()}</p>
                 <h1 className="text-xl font-semibold tracking-tight">{firstName}</h1>
                 <p className="text-[10px] text-white/60 mt-0.5">
                   {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                 </p>
               </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm font-light text-white/90 leading-relaxed max-w-[240px]">
              Sua beleza e bem-estar em um só lugar. Reserve seu momento hoje.
            </p>

            <Button 
              className="w-full h-12 rounded-full bg-[#C89B7B] text-white font-semibold text-sm shadow-lg hover:bg-[#B07A5A] active:scale-95 transition-all border-none"
              onClick={() => router.push("/cliente/agendar")}
            >
              <Plus className="mr-2" size={18} strokeWidth={3} />
              Agendar agora
            </Button>
          </div>
        </div>
      </section>

      {/* NEXT APPOINTMENT CARD */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold text-[#2C2C2C]">Seu próximo horário</h2>
          {nextAppointment && (
            <button 
              onClick={() => router.push("/cliente/agendamentos")} 
              className="text-xs font-medium text-[#6F4E37] underline underline-offset-4"
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
                  <h3 className="text-base font-semibold text-[#2C2C2C]">{nextAppointment.service.name}</h3>
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
                  <Calendar size={16} className="text-[#6F4E37]" />
                  <span className="text-xs font-semibold text-[#2C2C2C] tabular-nums">
                    {format(nextAppointment.date, "dd/MM")}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8F6F3]">
                  <Clock size={16} className="text-[#6F4E37]" />
                  <span className="text-xs font-semibold text-[#2C2C2C] tabular-nums">
                    {nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}
                  </span>
                </div>
              </div>

              <Button 
                variant="ghost"
                className="w-full text-xs font-semibold text-[#6F4E37] hover:bg-[#6F4E37]/5 rounded-xl h-10"
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
               className="bg-[#C89B7B] hover:bg-[#B07A5A] text-white rounded-full text-xs px-6 h-9"
               onClick={() => router.push("/cliente/agendar")}
             >
               Agendar agora
             </Button>
          </div>
        )}
      </section>

      {/* QUICK ACTIONS GRID (2x2) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2C2C2C] px-1">Atalhos rápidos</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => router.push(action.href)}
              className="flex flex-col p-4 rounded-xl bg-white border border-[#EFEAE4] shadow-sm text-left transition-all hover:scale-[1.02] hover:shadow-md active:scale-95 group"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F8F6F3] text-[#6F4E37] transition-transform group-hover:scale-110">
                <action.icon size={20} strokeWidth={2} />
              </div>
              <p className="text-sm font-semibold text-[#2C2C2C] leading-none mb-1">{action.title}</p>
              <p className="text-[10px] text-[#6B6B6B]">{action.description}</p>
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
                className="min-w-[140px] p-3 rounded-xl bg-white border border-[#EFEAE4] shadow-sm space-y-2 flex-shrink-0"
              >
                <div className="h-20 w-full rounded-lg bg-[#F8F6F3] flex items-center justify-center text-[#A98B73]">
                  <Sparkles size={24} />
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
          <Sparkle className="text-[#6F4E37]" size={10} />
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2C]">Tessy Nails</span>
        </div>
      </footer>
    </div>
  );
}
