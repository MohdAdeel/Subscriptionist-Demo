import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  status: "idle",

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setStatus: (status) => set({ status }),
  resetAuth: () => set({ user: null, token: null, status: "idle" }),
}));
