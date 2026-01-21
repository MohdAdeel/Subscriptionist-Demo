import { create } from "zustand";

export const useHomeDataStore = create((set) => ({
  homeData: {},
  loading: false,
  error: null,

  setHomeData: (homeData) => set({ homeData }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetHomeData: () => set({ homeData: {}, loading: false, error: null }),
}));
