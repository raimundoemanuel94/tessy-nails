"use client";

import {
  Calendar,
  Clock,
  Settings,
  HelpCircle,
  LogOut,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileShortcutsProps {
  onMyAppointments?: () => void;
  onNewAppointment?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  onLogout?: () => void;
  onBackToHome?: () => void;
}

export function ProfileShortcuts({
  onMyAppointments,
  onNewAppointment,
  onSettings,
  onHelp,
  onLogout,
  onBackToHome
}: ProfileShortcutsProps) {
  const shortcuts = [
    {
      id: 'appointments',
      title: 'Meus agendamentos',
      description: 'Ver todos os seus horários agendados',
      icon: Calendar,
      color: 'text-brand-primary',
      bgColor: 'bg-brand-primary/10',
      action: onMyAppointments
    },
    {
      id: 'new-appointment',
      title: 'Agendar novo horário',
      description: 'Marcar um novo atendimento',
      icon: Clock,
      color: 'text-success',
      bgColor: 'bg-success/10',
      action: onNewAppointment
    },
    {
      id: 'settings',
      title: 'Configurações da conta',
      description: 'Gerenciar suas preferências',
      icon: Settings,
      color: 'text-brand-secondary',
      bgColor: 'bg-brand-secondary/10',
      action: onSettings
    },
    {
      id: 'help',
      title: 'Ajuda e suporte',
      description: 'Tirar dúvidas e obter ajuda',
      icon: HelpCircle,
      color: 'text-brand-accent',
      bgColor: 'bg-brand-accent/10',
      action: onHelp
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-serif font-bold text-brand-text-main mb-4">
          Acesso rápido
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              onClick={shortcut.action}
              className="group rounded-xl border border-brand-accent/15 bg-white p-4 text-left transition-all hover:shadow-premium hover:border-brand-accent/30 hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${shortcut.bgColor}`}>
                  <shortcut.icon className={`h-6 w-6 ${shortcut.color}`} />
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-brand-text-main group-hover:text-brand-primary">
                    {shortcut.title}
                  </h4>
                  <p className="text-sm text-brand-text-sub">
                    {shortcut.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-serif font-bold text-brand-text-main mb-4">
          Conta
        </h3>

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={onBackToHome}
            className="w-full justify-start border-brand-accent/30 text-brand-primary hover:bg-brand-soft/30"
          >
            <Home className="mr-2 h-4 w-4" />
            Voltar para o início
          </Button>

          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full justify-start border-red-200 text-red-700 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-brand-text-sub opacity-70">
          Precisa de ajuda? Entre em contato conosco através do suporte.
        </p>
      </div>
    </div>
  );
}
