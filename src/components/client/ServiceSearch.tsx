"use client";

import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="w-full rounded-lg border border-pink-200 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors"
        />
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={showOnlyActive ? "default" : "outline"}
          size="sm"
          onClick={toggleActiveFilter}
          className={`${
            showOnlyActive 
              ? "bg-pink-500 text-white hover:bg-pink-600" 
              : "border-pink-200 text-pink-700 hover:bg-pink-50"
          }`}
        >
          <Filter className="mr-2 h-4 w-4" />
          {showOnlyActive ? "Todos" : "Apenas ativos"}
        </Button>
      </div>

      {/* Active Filter Info */}
      {showOnlyActive && (
        <div className="rounded-lg bg-pink-50 p-3 text-sm text-pink-700">
          Mostrando apenas serviços disponíveis para agendamento
        </div>
      )}
    </div>
  );
}
