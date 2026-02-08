import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, token: null }),
}));

export const usePropertyStore = create((set) => ({
  properties: [],
  selectedProperty: null,
  isLoading: false,

  setProperties: (properties) => set({ properties }),
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  addProperty: (property) => set((state) => ({
    properties: [...state.properties, property],
  })),
}));

export const useInvestmentStore = create((set) => ({
  investments: [],
  portfolio: null,
  isLoading: false,

  setInvestments: (investments) => set({ investments }),
  setPortfolio: (portfolio) => set({ portfolio }),
  addInvestment: (investment) => set((state) => ({
    investments: [...state.investments, investment],
  })),
}));
