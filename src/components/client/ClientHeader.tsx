"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ClientHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <a href="/servicos" className="text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
            Serviços
          </a>
          <a href="#beneficios" className="text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
            Benefícios
          </a>
          <a href="#contato" className="text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
            Contato
          </a>
        </nav>

        {/* CTA Button */}
        <div className="hidden md:block">
          <a 
            href="/agendar"
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium px-6 py-2 rounded-lg inline-flex items-center transition-colors"
          >
            Agendar Agora
          </a>
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
            <a href="/servicos" className="block text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
              Serviços
            </a>
            <a href="#beneficios" className="block text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
              Benefícios
            </a>
            <a href="#contato" className="block text-gray-700 hover:text-pink-600 transition-colors text-sm font-medium">
              Contato
            </a>
            <Button 
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium"
            >
              <a href="/agendar">Agendar Agora</a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
