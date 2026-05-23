/**
 * Componente para mostrar erros ao usuário
 * Com opções de retry e ações customizadas
 * 
 * Uso:
 * <ErrorState
 *   title="Erro ao carregar"
 *   message="Não conseguimos carregar seus dados"
 *   onRetry={() => loadData()}
 * />
 */

import { AlertCircle, RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  retryLabel?: string;
  dismissLabel?: string;
  icon?: 'alert' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Exibe estado de erro de forma amigável
 */
export function ErrorState({
  title,
  message,
  onRetry,
  onDismiss,
  retryLabel = 'Tentar novamente',
  dismissLabel = 'Descartar',
  icon = 'alert',
  size = 'md',
}: ErrorStateProps) {
  // Tamanhos responsivos
  const sizeClasses = {
    sm: 'py-6 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8',
  };

  const iconSizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]}`}>
      {/* Ícone */}
      <div className={`${iconSizes[size]} rounded-2xl bg-red-100 flex items-center justify-center mb-4`}>
        {icon === 'alert' && <AlertCircle className="h-8 w-8 text-red-600" />}
        {icon === 'error' && <X className="h-8 w-8 text-red-600" />}
        {icon === 'warning' && <AlertCircle className="h-8 w-8 text-red-600" />}
      </div>

      {/* Título */}
      <h3 className={`font-bold text-gray-900 mb-2 ${titleSizes[size]}`}>{title}</h3>

      {/* Mensagem */}
      <p className="text-sm text-gray-600 mb-6 max-w-xs">{message}</p>

      {/* Botões de ação */}
      <div className="flex gap-3 flex-wrap justify-center">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white"
            size="sm"
          >
            <RotateCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        )}

        {onDismiss && (
          <Button onClick={onDismiss} variant="outline" size="sm">
            {dismissLabel}
          </Button>
        )}
      </div>

      {/* Dica */}
      {onRetry && !onDismiss && (
        <p className="text-xs text-gray-500 mt-4">
          Verifique sua conexão e tente novamente
        </p>
      )}
    </div>
  );
}

/**
 * Versão compacta de ErrorState
 */
export function ErrorStateCompact({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void | Promise<void>;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-red-700 font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-100"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
