"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarViewProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
}

export function CalendarView({ 
  selectedDate, 
  onDateSelect, 
  onMonthChange 
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Gerar dias do mês
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Nomes dos dias da semana
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekDaysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Função para navegar meses
  const previousMonth = () => {
    setCurrentMonth(prev => addMonths(prev, -1));
    onMonthChange?.(addMonths(currentMonth, -1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
    onMonthChange?.(addMonths(currentMonth, 1));
  };

  // Função para verificar se o dia está no passado
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Função para verificar se é o dia selecionado
  const isSelected = (date: Date) => {
    return selectedDate ? isSameDay(date, selectedDate) : false;
  };

  // Obter primeiro dia da semana do mês
  const firstDayOfMonth = getDay(monthStart);

  return (
    <div className="bg-white rounded-2xl border border-violet-100 p-4">
      {/* Calendar Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={previousMonth}
          className="text-violet-600 hover:bg-violet-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextMonth}
          className="text-violet-600 hover:bg-violet-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDaysShort.map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="h-10" />
        ))}

        {/* Days of month */}
        {monthDays.map((day, index) => {
          const isPast = isPastDate(day);
          const selected = isSelected(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const dayNumber = format(day, "d");

          return (
            <button
              key={index}
              onClick={() => !isPast && onDateSelect?.(day)}
              disabled={isPast}
              className={`
                relative h-10 rounded-lg border p-2 text-sm transition-all
                ${isPast 
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                  : selected
                  ? 'border-violet-500 bg-violet-500 text-white font-semibold'
                  : isCurrentMonth
                  ? 'border-violet-200 bg-white text-gray-900 hover:bg-violet-50 hover:border-violet-300'
                  : 'border-transparent bg-transparent text-gray-400'
                }
              `}
            >
              <span className={isPast ? 'line-through' : ''}>
                {dayNumber}
              </span>

              {/* Selected indicator */}
              {selected && (
                <div className="absolute bottom-1 left-1/2 right-1/2 h-1 bg-violet-500 rounded-full" />
              )}
            </button>
          );
        })}

        {/* Empty cells after last day */}
        {Array.from({ length: (42 - (firstDayOfMonth + monthDays.length)) }).map((_, index) => (
          <div key={`empty-after-${index}`} className="h-10" />
        ))}
      </div>

      {/* Calendar Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-violet-500 mr-2" />
          <span>Selecionado</span>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-gray-300 mr-2" />
          <span>Indisponível</span>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-green-500 mr-2" />
          <span>Disponível</span>
        </div>
      </div>
    </div>
  );
}
