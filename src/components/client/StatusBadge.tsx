"use client";

import { Clock, CheckCircle, X, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendente',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          icon: Clock,
          iconColor: 'text-yellow-600'
        };
      case 'confirmed':
        return {
          label: 'Confirmado',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'completed':
        return {
          label: 'Concluído',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: CheckCircle,
          iconColor: 'text-blue-600'
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: X,
          iconColor: 'text-red-600'
        };
      default:
        return {
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: AlertCircle,
          iconColor: 'text-gray-600'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();

  return (
    <div className={`
      inline-flex items-center rounded-full font-medium
      ${config.bgColor} ${config.textColor} ${config.borderColor}
      ${sizeClasses}
    `}>
      {showIcon && (
        <config.icon className={`mr-1 h-3 w-3 ${config.iconColor}`} />
      )}
      <span>{config.label}</span>
    </div>
  );
}
