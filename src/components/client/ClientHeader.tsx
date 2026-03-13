"use client";

import { Menu, X, User, Calendar, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function ClientHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // ✅ Comportamento baseado na autenticação
  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleRegisterClick = () => {
    router.push('/login?mode=register');
  };

  const handleAccountClick = () => {
    router.push('/cliente/perfil');
  };

  const handleAppointmentsClick = () => {
    if (user) {
      router.push('/cliente/agendamentos');
    } else {
      router.push('/login');
    }
  };

  const handleScheduleClick = () => {
    if (user) {
      router.push('/cliente/servicos');
    } else {
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-pink-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Tessy Nails
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#servicos" className="text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
            Serviços
          </a>
          <a href="#beneficios" className="text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
            Benefícios
          </a>
          <a href="#contato" className="text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
            Contato
          </a>
          
          {/* ✅ Botão "Meus Agendamentos" */}
          <button 
            onClick={handleAppointmentsClick}
            className="text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium flex items-center gap-1"
          >
            <Calendar className="h-4 w-4" />
            Meus Agendamentos
          </button>
        </nav>

        {/* ✅ CTA Buttons - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {/* ✅ Botões para usuário não autenticado */}
          {!user ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleLoginClick}
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                Entrar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRegisterClick}
                className="border-pink-200 text-pink-600 hover:bg-pink-50 flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Criar Conta
              </Button>
            </>
          ) : (
            /* ✅ Botão para usuário autenticado */
            <Button 
              variant="outline" 
              onClick={handleAccountClick}
              className="border-pink-200 text-pink-600 hover:bg-pink-50 flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              {user.name?.split(' ')[0] || 'Minha Conta'}
            </Button>
          )}
          
          {/* ✅ Botão Agendar Agora */}
          <Button 
            onClick={handleScheduleClick}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium"
          >
            Agendar Agora
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-pink-100 bg-white">
          <div className="container px-4 py-4 space-y-3">
            <a href="#servicos" className="block text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
              Serviços
            </a>
            <a href="#beneficios" className="block text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
              Benefícios
            </a>
            <a href="#contato" className="block text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
              Contato
            </a>
            
            {/* ✅ Botão "Meus Agendamentos" - Mobile */}
            <button 
              onClick={handleAppointmentsClick}
              className="text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium flex items-center gap-1 w-full text-left"
            >
              <Calendar className="h-4 w-4" />
              Meus Agendamentos
            </button>
            
            {/* ✅ Botão Entrar/Criar Conta - Mobile */}
            {user ? (
              <Button 
                variant="outline" 
                onClick={handleAccountClick}
                className="w-full border-pink-200 text-pink-600 hover:bg-pink-50 flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {user.name?.split(' ')[0] || 'Minha Conta'}
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleLoginClick}
                  className="w-full border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  Entrar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRegisterClick}
                  className="w-full border-pink-200 text-pink-600 hover:bg-pink-50 flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Criar Conta
                </Button>
              </>
            )}
            
            {/* ✅ Botão Agendar Agora - Mobile */}
            <Button 
              onClick={handleScheduleClick}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium"
            >
              Agendar Agora
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
