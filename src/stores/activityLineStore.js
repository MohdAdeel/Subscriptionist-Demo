import { create } from "zustand";

export const activityLineStore = create((set) => ({
  activityLines: [],
  setActivityLines: (activityLines) => set({ activityLines }),
}));
