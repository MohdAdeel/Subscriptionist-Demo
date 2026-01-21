import { create } from "zustand";

/**
 * Store for raw activity lines data
 * Populated by useActivityLines hook when data is fetched
 * Allows access to raw data anywhere in the app without React Query
 */
export const useActivityLineStore = create((set, get) => ({
  // Raw activity lines from API
  activityLines: null,

  // Actions
  setActivityLines: (activityLines) => set({ activityLines }),

  // Selector to check if data exists
  hasData: () => get().activityLines !== null,

  // Clear data (useful for logout/reset)
  clearActivityLines: () => set({ activityLines: null }),
}));
