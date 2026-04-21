import { useSyncExternalStore } from 'react';
import { Service, Client, User } from "@/types";
import { salonService, clientService } from "@/services";

type GlobalState = {
  services: Service[] | null;
  clients: Client[] | null;
  currentUser: User | null;
};

let state: GlobalState = {
  services: null,
  clients: null,
  currentUser: null,
};

// 💾 Carregamento inicial do Cache
if (typeof window !== "undefined") {
  const cached = localStorage.getItem("tessy_global_cache");
  if (cached) {
    try {
      state = { ...state, ...JSON.parse(cached) };
    } catch (e) {
      console.error("Failed to parse cache", e);
    }
  }
}

const listeners = new Set<() => void>();

export const globalStore = {
  getState: () => state,
  setState: (newState: Partial<GlobalState>) => {
    state = { ...state, ...newState };
    // 💾 Persistência
    if (typeof window !== "undefined") {
      localStorage.setItem("tessy_global_cache", JSON.stringify(state));
    }
    listeners.forEach(listener => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  
  // ✅ Actions
  fetchServices: async (force = false) => {
    if (state.services && !force) return state.services;
    const data = await salonService.getAllWithInactive();
    globalStore.setState({ services: data });
    return data;
  },
  
  fetchRecentClients: async (force = false) => {
    if (state.clients && !force) return state.clients;
    // Puxando apenas a primeira página para o cache local em vez do BD inteiro
    const { clients } = await clientService.getPaginated(50);
    globalStore.setState({ clients });
    return clients;
  }
};

export function useGlobalStore() {
  return useSyncExternalStore(
    globalStore.subscribe,
    globalStore.getState,
    globalStore.getState
  );
}
