"use client";

import { MessageSquare } from "lucide-react";

interface ObservationFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ObservationField({ 
  value, 
  onChange, 
  placeholder = "Digite alguma observação para o atendimento (opcional)",
  disabled = false 
}: ObservationFieldProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <div className="flex items-center">
          <MessageSquare className="mr-2 h-4 w-4 text-pink-600" />
          Observação (opcional)
        </div>
      </label>
      
      <textarea
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        className={`
          w-full rounded-lg border border-pink-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500
          focus:border-pink-400 focus:ring-2 focus:ring-pink-200 focus:outline-none
          transition-colors resize-none
          ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-50' : ''}
        `}
      />
      
      <p className="text-xs text-gray-500">
        Adicione informações importantes sobre seu agendamento (alergias, preferências, etc.)
      </p>
    </div>
  );
}
