"use client";

import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgendarHeaderProps {
  title?: string;
  onBack?: () => void;
}

export function AgendarHeader({ title = "Escolha a data", onBack }: AgendarHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-violet-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-violet-600 hover:bg-violet-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Title */}
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-violet-600" />
            {title}
          </h1>
        </div>

        {/* Spacer */}
        <div className="w-20 md:w-24" />
      </div>
    </header>
  );
}
