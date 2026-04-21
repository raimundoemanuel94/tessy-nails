"use client";

import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceSearchProps {
  onSearch: (query: string) => void;
  onFilterActive: (activeOnly: boolean) => void;
  placeholder?: string;
}

export function ServiceSearch({ 
  onSearch, 
  onFilterActive, 
  placeholder = "Buscar serviços..." 
}: ServiceSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const toggleActiveFilter = () => {
    const newValue = !showOnlyActive;
    setShowOnlyActive(newValue);
    onFilterActive(newValue);
  };

  return (
    <div className="mb-8 space-y-4 px-2">
      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-primary text-brand-text-sub">
          <Search size={20} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="w-full h-14 rounded-2xl border border-brand-soft bg-white py-3 pl-12 pr-4 text-brand-text-main font-bold placeholder:text-brand-text-sub/60 focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm"
        />
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={showOnlyActive ? "default" : "outline"}
          size="sm"
          onClick={toggleActiveFilter}
          className={cn(
            "h-10 rounded-xl font-bold transition-all",
            showOnlyActive 
              ? "bg-brand-primary text-white hover:bg-brand-secondary border-none shadow-lg shadow-brand-primary/20" 
              : "border-brand-soft text-brand-text-sub hover:bg-brand-primary/5"
          )}
        >
          <Filter className="mr-2 h-4 w-4" />
          <span className="text-[10px] uppercase tracking-widest">{showOnlyActive ? "Todos" : "Apenas ativos"}</span>
        </Button>
      </div>

      {/* Active Filter Info */}
      {showOnlyActive && (
        <div className="rounded-2xl bg-brand-primary/5 p-4 text-[10px] font-bold text-brand-primary uppercase tracking-widest border border-brand-primary/10 animate-in fade-in slide-in-from-top-2">
          Mostrando apenas serviços disponíveis para agendamento
        </div>
      )}
    </div>
  );
}
