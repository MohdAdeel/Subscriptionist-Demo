import { create } from "zustand";

export const useSubscriptionsStore = create((set) => ({
  subscriptions: [],
  selectedSubscriptionId: null,
  loading: false,
  error: null,

  setSubscriptions: (subscriptions) => set({ subscriptions }),
  addSubscription: (subscription) =>
    set((state) => ({ subscriptions: [...state.subscriptions, subscription] })),
  setSelectedSubscriptionId: (id) => set({ selectedSubscriptionId: id }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetSubscriptions: () =>
    set({
      subscriptions: [],
      selectedSubscriptionId: null,
      loading: false,
      error: null,
    }),
}));
