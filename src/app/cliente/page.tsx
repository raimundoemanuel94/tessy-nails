"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  Star, 
  User as UserIcon, 
  Plus, 
  ChevronRight,
  Loader2,
  CalendarDays
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
import { cn } from "@/lib/utils";

export default function ClientePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setDataLoading(true);
        const [appointments, allServices] = await Promise.all([
          appointmentService.getByClientIdWithServices(user.uid),
          salonService.getAll()
        ]);

        // Encontrar o próximo agendamento (futuro ou hoje)
        const upcoming = appointments
          .filter(apt => (isFuture(apt.date) || isToday(apt.date)) && apt.status !== 'cancelled')
          .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
        
        setNextAppointment(upcoming);
        setServices(allServices.slice(0, 4)); // Mostrar apenas os 4 primeiros no dashboard
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Cliente";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Topo / Saudação */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 italic">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-sm font-medium">Bem-vinda de volta,</p>
            <h1 className="text-2xl font-bold text-slate-900">{firstName}! ✨</h1>
          </div>
          <div 
            className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 cursor-pointer"
            onClick={() => router.push("/cliente/perfil")}
          >
            <UserIcon size={24} />
          </div>
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* Bloco principal: Agendar Agora */}
        <section>
          <Button 
            className="w-full h-20 bg-violet-600 hover:bg-violet-700 text-white rounded-3xl flex items-center justify-between px-6 shadow-xl shadow-violet-200 group transition-all"
            onClick={() => router.push("/cliente/servicos")}
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <div className="text-left">
                <span className="block text-lg font-bold">Agendar agora</span>
                <span className="text-violet-100 text-xs">Escolha seu serviço favorito</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-violet-200" />
          </Button>
        </section>

        {/* Card: Próximo agendamento */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Seu próximo horário</h2>
            <button 
              onClick={() => router.push("/cliente/agendamentos")}
              className="text-violet-600 text-sm font-semibold"
            >
              Ver todos
            </button>
          </div>

          {nextAppointment ? (
            <Card className="border-none shadow-md bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CalendarDays size={80} />
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-violet-500 hover:bg-violet-500 text-white border-none mb-2">
                        Confirmado
                      </Badge>
                      <h3 className="text-xl font-bold">{nextAppointment.service.name}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-violet-400" />
                      <span className="text-sm font-medium">
                        {format(nextAppointment.date, "dd 'de' MMM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-violet-400" />
                      <span className="text-sm font-medium">{nextAppointment.time.time}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-slate-200 bg-white shadow-none rounded-3xl p-8 text-center text-slate-400">
              <p className="text-sm">Você não tem agendamentos próximos.</p>
            </Card>
          )}
        </section>

        {/* Atalhos */}
        <section className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-24 rounded-3xl bg-white border-slate-100 flex-col gap-2 hover:bg-slate-50 hover:border-violet-200 transition-all font-semibold"
            onClick={() => router.push("/cliente/agendamentos")}
          >
            <div className="text-violet-600">
              <Clock size={24} />
            </div>
            Minha Agenda
          </Button>
          <Button 
            variant="outline" 
            className="h-24 rounded-3xl bg-white border-slate-100 flex-col gap-2 hover:bg-slate-50 hover:border-violet-200 transition-all font-semibold"
            onClick={() => router.push("/cliente/servicos")}
          >
            <div className="text-violet-600">
              <Star size={24} />
            </div>
            Serviços
          </Button>
        </section>

        {/* Lista de Serviços rápidos */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Serviços populares</h2>
            <button 
              onClick={() => router.push("/cliente/servicos")}
              className="text-violet-600 text-sm font-semibold"
            >
              Ver mais
            </button>
          </div>

          <div className="grid gap-4">
            {services.map((service) => (
              <div 
                key={service.id}
                className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between hover:border-violet-100 transition-colors cursor-pointer group"
                onClick={() => router.push(`/cliente/servicos?id=${service.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 font-bold group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    {service.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{service.name}</h4>
                    <p className="text-xs text-slate-400">R$ {service.price.toFixed(2)} • {service.durationMinutes} min</p>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-violet-600 group-hover:border-violet-200 transition-all">
                  <Plus size={20} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Navegação Inferior */}
      <BottomNav />
    </div>
  );
}
