"use client";

import { Button } from "@/components/ui/button";

interface SuccessHeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export function SuccessHeader({ showBackButton = false, onBack }: SuccessHeaderProps) {
  return (
    <header className="sticky top-0 pt-[env(safe-area-inset-top)] z-50 w-full bg-brand-primary text-white shadow-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Back Button - Optional */}
        {showBackButton && onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            ← Voltar
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logo/Brand */}
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-brand-primary font-bold text-sm">T</span>
          </div>
          <img src="/images/logo/logo-compact.svg" alt="Tessy Nails" className="h-8 w-auto drop-shadow-sm ml-2 brightness-0 invert" />
        </div>

        {/* Spacer */}
        <div className="w-20 md:w-24" />
      </div>
    </header>
  );
}
