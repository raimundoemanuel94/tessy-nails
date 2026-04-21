import { Client, Service, User } from "@/types";
import { clientService, salonService } from "@/services";

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

if (typeof window !== "undefined") {
  const cached = localStorage.getItem("tessy_global_cache");
  if (cached) {
    try {
      state = { ...state, ...JSON.parse(cached) };
    } catch (error) {
      console.error("Failed to parse cache", error);
    }
  }
}

const listeners = new Set<() => void>();

export const globalStore = {
  getState: () => state,
  setState: (newState: Partial<GlobalState>) => {
    state = { ...state, ...newState };

    if (typeof window !== "undefined") {
      localStorage.setItem("tessy_global_cache", JSON.stringify(state));
    }

    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  fetchServices: async (force = false) => {
    if (state.services && !force) return state.services;
    const data = await salonService.getAllWithInactive();
    globalStore.setState({ services: data });
    return data;
  },
  fetchRecentClients: async (force = false) => {
    if (state.clients && !force) return state.clients;
    const { clients } = await clientService.getPaginated(50);
    globalStore.setState({ clients });
    return clients;
  },
};
