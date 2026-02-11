import { create } from "zustand";

export const useAuthStore = create((set) => ({
  accountDetailsAzureResponse: null,
  userAuth: null,
  userAuthLoading: false,

  setAccountDetailsAzureResponse: (account) => set({ accountDetailsAzureResponse: account }),
  setUserAuth: (user) => set({ userAuth: user }),
  setUserAuthLoading: (loading) => set({ userAuthLoading: loading }),

  clearAccountDetailsAzureResponse: () => set({ accountDetailsAzureResponse: null }),
  clearUserAuth: () => set({ userAuth: null }),
}));
