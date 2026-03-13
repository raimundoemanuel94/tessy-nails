"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthNavigationProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function MonthNavigation({ currentMonth, onMonthChange }: MonthNavigationProps) {
  const previousMonth = () => {
    onMonthChange(addMonths(currentMonth, -1));
  };

  const nextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    const today = new Date();
    onMonthChange(today);
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={previousMonth}
        className="flex items-center text-pink-600 hover:text-pink-700 font-medium transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {format(addMonths(currentMonth, -1), "MMMM", { locale: ptBR })}
      </button>

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="text-sm text-gray-500">
          {subMonths(currentMonth, 0).toLocaleString('pt-BR', { month: 'long' })}
        </div>
      </div>

      <button
        onClick={nextMonth}
        className="flex items-center text-pink-600 hover:text-pink-700 font-medium transition-colors"
      >
        {format(addMonths(currentMonth, 1), "MMMM", { locale: ptBR })}
        <ChevronRight className="h-4 w-4 ml-1" />
      </button>

      <button
        onClick={goToToday}
        className="px-4 py-2 text-sm text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg border border-pink-200 transition-colors"
      >
        Hoje
      </button>
    </div>
  );
}
