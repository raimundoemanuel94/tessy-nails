"use client";

import { Button } from "@/components/ui/button";

interface SuccessHeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export function SuccessHeader({ showBackButton = false, onBack }: SuccessHeaderProps) {
  return (
    <header className="sticky top-0 pt-[env(safe-area-inset-top)] z-50 w-full border-b border-brand-primary/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Back Button - Optional */}
        {showBackButton && onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-brand-primary hover:bg-brand-primary/5"
          >
            ← Voltar
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logo/Brand */}
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="ml-2 text-lg font-bold text-gray-900 leading-none">Tessy Nails</span>
        </div>

        {/* Spacer */}
        <div className="w-20 md:w-24" />
      </div>
    </header>
  );
}
