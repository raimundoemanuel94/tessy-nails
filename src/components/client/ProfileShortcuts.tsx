"use client";

import { 
  Calendar, 
  Clock, 
  Settings, 
  HelpCircle, 
  LogOut,
  Home,
  User
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
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      action: onMyAppointments
    },
    {
      id: 'new-appointment',
      title: 'Agendar novo horário',
      description: 'Marcar um novo atendimento',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: onNewAppointment
    },
    {
      id: 'settings',
      title: 'Configurações da conta',
      description: 'Gerenciar suas preferências',
      icon: Settings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: onSettings
    },
    {
      id: 'help',
      title: 'Ajuda e suporte',
      description: 'Tirar dúvidas e obter ajuda',
      icon: HelpCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: onHelp
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Acesso rápido
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              onClick={shortcut.action}
              className={`
                group rounded-xl border border-gray-200 bg-white p-4 text-left transition-all
                hover:shadow-md hover:border-violet-200 hover:scale-[1.02]
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  h-12 w-12 rounded-full flex items-center justify-center
                  ${shortcut.bgColor}
                `}>
                  <shortcut.icon className={`h-6 w-6 ${shortcut.color}`} />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-violet-600">
                    {shortcut.title}
                  </h4>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700">
                    {shortcut.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Conta
        </h3>
        
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={onBackToHome}
            className="w-full justify-start border-violet-200 text-violet-700 hover:bg-violet-50"
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

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Precisa de ajuda? Entre em contato conosco através do suporte.
        </p>
      </div>
    </div>
  );
}
