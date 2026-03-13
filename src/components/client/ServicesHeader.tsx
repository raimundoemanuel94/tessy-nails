"use client";

import { ArrowLeft, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ServicesHeaderProps {
  title?: string;
  onBack?: () => void;
}

export function ServicesHeader({ title = "Escolha um serviço", onBack }: ServicesHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-pink-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-pink-600 hover:bg-pink-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Title */}
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            {title}
          </h1>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Desktop Actions */}
        <div className="hidden md:block">
          <a 
            href="/cliente"
            className="bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium px-6 py-2 rounded-lg inline-flex items-center transition-colors"
          >
            Voltar
          </a>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-pink-100 bg-white">
          <div className="container px-4 py-4">
            <a 
              href="/cliente"
              className="w-full bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium px-6 py-2 rounded-lg inline-flex items-center justify-center transition-colors"
            >
              Voltar
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
