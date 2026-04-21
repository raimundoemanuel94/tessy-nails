"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/agendamentos")}
      className={cn(
        "fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 h-14 w-auto px-6 rounded-full shadow-[0_20px_50px_rgba(236,72,153,0.3)] z-50",
        "bg-primary hover:bg-primary/90 text-primary-foreground border-none",
        "flex items-center gap-2 group transition-all duration-500 hover:scale-105 active:scale-95",
        "md:bottom-10 md:right-10",
        className
      )}
    >
      <div className="bg-white/20 p-1.5 rounded-full transition-transform group-hover:rotate-90 duration-500">
        <Plus className="h-4 w-4" />
      </div>
      <span className="font-bold tracking-tight">Novo Agendamento</span>
    </Button>
  );
}
