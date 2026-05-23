/**
 * Hook para proteger rotas por role de usuário
 * Valida autenticação e autorização
 * 
 * Uso:
 * const { user, loading } = useProtectedRoute('client');
 * 
 * ou
 * 
 * const { user, loading } = useProtectedRoute(['admin', 'professional']);
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export type AllowedRole = 'client' | 'admin' | 'professional';

interface UseProtectedRouteResult {
  user: any; // User type
  loading: boolean;
}

/**
 * Hook que protege uma rota verificando autenticação e role
 * @param allowed - Função de role permitido(s)
 * @returns { user, loading }
 * 
 * @example
 * // Página só para clientes
 * const { user, loading } = useProtectedRoute('client');
 * 
 * @example
 * // Página para admin OU professional
 * const { user, loading } = useProtectedRoute(['admin', 'professional']);
 */
export function useProtectedRoute(
  allowed: AllowedRole | AllowedRole[]
): UseProtectedRouteResult {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Esperar carregamento do usuário
    if (loading) return;

    // Se não está autenticado, redirecionar para login
    if (!user) {
      console.warn('[useProtectedRoute] Usuário não autenticado, redirecionando para /login');
      router.push('/login');
      return;
    }

    // Verificar se role está permitido
    const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
    const hasAccess = allowedRoles.includes(user.role as AllowedRole);

    if (!hasAccess) {
      console.warn(
        `[useProtectedRoute] Usuário com role '${user.role}' não tem acesso. Roles permitidos: ${allowedRoles.join(', ')}`
      );
      // Redirecionar para a página apropriada baseada no role
      if (user.role === 'client') {
        router.push('/cliente');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    // Tudo OK, usuário tem acesso
  }, [user, loading, allowed, router]);

  return { user, loading };
}
