import { Client, Service, User } from "@/types";
import { clientService, salonService } from "@/services";

const CACHE_KEY   = "nailit_global_cache";
const CACHE_TTL   = 5 * 60 * 1000; // 5 minutos

type GlobalState = {
  services:    Service[] | null;
  clients:     Client[]  | null;
  currentUser: User      | null;
  _cachedAt:   number;
};

export type { GlobalState };

let state: GlobalState = {
  services:    null,
  clients:     null,
  currentUser: null,
  _cachedAt:   0,
};

// Hidratar do localStorage na inicialização
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GlobalState>;
      const age = Date.now() - (parsed._cachedAt ?? 0);
      // Só usa cache se ainda é válido (TTL)
      if (age < CACHE_TTL) {
        state = { ...state, ...parsed };
      } else {
        localStorage.removeItem(CACHE_KEY);
      }
    }
    // Limpar cache antigo do nome "nailit_global_cache"
    localStorage.removeItem("nailit_global_cache");
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
}

const listeners = new Set<() => void>();

export const globalStore = {
  getState: () => state,

  setState: (newState: Partial<GlobalState>) => {
    state = { ...state, ...newState, _cachedAt: Date.now() };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(state));
      } catch { /* quota exceeded — silencioso */ }
    }
    listeners.forEach(l => l());
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Busca serviços com cache TTL de 5 min */
  fetchServices: async (force = false): Promise<Service[]> => {
    const age = Date.now() - state._cachedAt;
    if (state.services && !force && age < CACHE_TTL) return state.services;
    const data = await salonService.getAllLegacy();
    globalStore.setState({ services: data });
    return data;
  },

  /** Busca clientes recentes com cache */
  fetchRecentClients: async (force = false): Promise<Client[]> => {
    const age = Date.now() - state._cachedAt;
    if (state.clients && !force && age < CACHE_TTL) return state.clients;
    const clients = await clientService.getAll('').catch(() => []);
    globalStore.setState({ clients });
    return clients;
  },

  /** Invalida cache manualmente */
  invalidate: () => {
    state = { services: null, clients: null, currentUser: null, _cachedAt: 0 };
    if (typeof window !== "undefined") localStorage.removeItem(CACHE_KEY);
    listeners.forEach(l => l());
  },
};
