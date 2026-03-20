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
import { BottomNav } from "@/components/client/BottomNav";
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

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 border-amber-200" },
    confirmed: { label: "Confirmado", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    completed: { label: "Concluído", className: "bg-brand-primary/10 text-brand-primary border-brand-primary/20" },
    cancelled: { label: "Cancelado", className: "bg-rose-100 text-rose-700 border-rose-200" },
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
      gradient: "from-brand-text-muted/10 to-brand-text-muted/5",
      iconColor: "text-brand-text",
      href: "/cliente/perfil",
    },
  ];

  return (
    <div className="px-5 pt-8 max-w-2xl mx-auto space-y-10">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-linear-to-br from-brand-primary to-brand-secondary p-8 text-white shadow-2xl shadow-brand-primary/30">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-brand-accent/20 blur-3xl" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
               <Sparkles className="text-white" size={24} />
             </div>
             <div>
               <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">{getGreeting()}</p>
               <h1 className="text-3xl font-black tracking-tight">{firstName}</h1>
             </div>
          </div>
          
          <p className="text-sm leading-relaxed text-white/90 font-medium max-w-[280px]">
            Seu momento de beleza está apenas a alguns toques de distância.
          </p>

          <Button 
            className="w-full h-14 rounded-2xl bg-white text-brand-primary font-black text-base shadow-xl hover:bg-white/90 active:scale-95 transition-all mt-4"
            onClick={() => router.push("/cliente/agendar")}
          >
            <Plus className="mr-2" size={20} strokeWidth={3} />
            Agendar Agora
          </Button>
        </div>
      </section>

      {/* Next Appointment Card */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-brand-text tracking-tight">Próximo Horário</h2>
          {nextAppointment && (
            <button onClick={() => router.push("/cliente/agendamentos")} className="text-xs font-bold text-brand-primary uppercase tracking-widest">Ver Todos</button>
          )}
        </div>

        {nextAppointment ? (
          <div className="group relative overflow-hidden rounded-[2.5rem] border border-brand-border bg-white p-6 shadow-xl shadow-brand-primary/5 transition-all hover:shadow-2xl hover:shadow-brand-primary/10">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/80">Confirmado</span>
                <h3 className="text-xl font-black text-brand-text">{nextAppointment.service.name}</h3>
              </div>
              <div className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${nextStatus?.className}`}>
                {nextStatus?.label}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-background border border-brand-border/40">
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-primary">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Data</p>
                  <p className="text-sm font-black text-brand-text">{format(nextAppointment.date, "dd 'de' MMMM", { locale: ptBR })}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-background border border-brand-border/40">
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-secondary">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Horário</p>
                  <p className="text-sm font-black text-brand-text font-mono tracking-wider">{nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}</p>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline"
              className="w-full mt-6 h-12 rounded-2xl border-brand-border text-brand-text font-bold hover:bg-brand-background hover:text-brand-primary transition-all"
              onClick={() => router.push("/cliente/agendamentos")}
            >
              Ver Detalhes
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 rounded-[2.5rem] border border-dashed border-brand-border bg-white/50 text-center space-y-4">
             <div className="h-16 w-16 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary/40">
               <Calendar size={32} />
             </div>
             <div className="space-y-1">
               <p className="font-black text-brand-text">Nenhum agendamento ativo</p>
               <p className="text-xs text-brand-text-muted max-w-[200px] mx-auto">Sua próxima experiência está esperando por você.</p>
             </div>
             <Button 
               variant="link" 
               className="text-brand-primary font-bold decoration-2 underline-offset-4"
               onClick={() => router.push("/cliente/agendar")}
             >
               Reservar meu horário
             </Button>
          </div>
        )}
      </section>

      {/* Quick Access Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-brand-text tracking-tight px-2">Acesso Rápido</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => router.push(action.href)}
              className={cn(
                "group relative overflow-hidden rounded-[2rem] border border-brand-border bg-white p-5 text-left transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95",
              )}
            >
              <div className={cn(
                "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
                "bg-linear-to-br", action.gradient
              )}>
                <action.icon className={action.iconColor} size={22} strokeWidth={2.5} />
              </div>
              <p className="text-sm font-black text-brand-text tracking-tight">{action.title}</p>
              <p className="text-[10px] font-medium text-brand-text-muted leading-relaxed mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="pt-10 flex flex-col items-center justify-center gap-4 text-center pb-8 opacity-50">
        <div className="flex items-center gap-2">
          <Sparkle className="text-brand-primary" size={12} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-text">Tessy Nails</span>
        </div>
        <p className="text-[10px] font-bold text-brand-text-muted">A experiência premium que você merece.</p>
      </footer>
    </div>
  );
}
