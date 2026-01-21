import { create } from "zustand";

export const useVendorsStore = create((set) => ({
  vendorList: [],
  selectedVendorId: null,
  loading: false,
  error: null,

  setVendorList: (vendorList) => set({ vendorList }),
  setSelectedVendorId: (id) => set({ selectedVendorId: id }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetVendors: () =>
    set({
      vendorList: [],
      selectedVendorId: null,
      loading: false,
      error: null,
    }),
}));
