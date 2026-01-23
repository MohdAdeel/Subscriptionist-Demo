import { create } from "zustand";

const initialFilters = {
  startDate: null,
  endDate: null,
  amount1: null,
  amount2: null,
  status: null,
};

export const useReportsPageStore = create((set) => ({
  filters: initialFilters,
  reports: [],
  loading: false,
  error: null,
  TopCards: {
    totalContractAmount: 0,
    totalContractAmountFuture: 0,
    ActiveCount: 0,
  },
  monthlySpendChartData: {
    labels: [],
    data: [],
  },
  vendorCountData: [],
  vendorProfileAggregation: [],
  mostExpensiveAggregations: [],
  categorySummary: [],
  spendByDepartmentChartData: [],
  categorizedSubscriptions: {
    veryUrgent: [],
    urgent: [],
    notUrgent: [],
  },
  nearingRenewalData: [],
  expiredSubscriptionsData: [],
  setVendorCountData: (vendorCountData) => set({ vendorCountData: vendorCountData }),
  setVendorProfileAggregation: (vendorProfileAggregation) => set({ vendorProfileAggregation }),
  setMostExpensiveAggregations: (mostExpensiveAggregations) => set({ mostExpensiveAggregations }),
  setSpendByDepartmentChartData: (spendByDepartmentChartData) =>
    set({ spendByDepartmentChartData: spendByDepartmentChartData }),
  setCategorySummary: (categorySummary) => set({ categorySummary }),
  setCategorizedSubscriptions: (categorizedSubscriptions) => set({ categorizedSubscriptions }),
  setNearingRenewalData: (nearingRenewalData) => set({ nearingRenewalData }),
  setExpiredSubscriptionsData: (expiredSubscriptionsData) => set({ expiredSubscriptionsData }),
  // Subscription table data from API
  subscriptionTableData: [],
  // Active tab for subscription table: 'all' | 'active' | 'expired'
  activeSubscriptionTab: "all",

  setFilters: (updates) =>
    set((state) => ({
      filters: { ...state.filters, ...updates },
    })),
  setReports: (reports) => set({ reports }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setTopCards: (TopCards) => set({ TopCards }),
  setMonthlySpendChartData: (monthlySpendChartData) => set({ monthlySpendChartData }),
  setSubscriptionTableData: (subscriptionTableData) => set({ subscriptionTableData }),
  setActiveSubscriptionTab: (activeSubscriptionTab) => set({ activeSubscriptionTab }),
  resetReportsPage: () =>
    set({
      filters: initialFilters,
      reports: [],
      loading: false,
      error: null,
      TopCards: {
        totalContractAmount: 0,
        totalContractAmountFuture: 0,
        ActiveCount: 0,
      },
      monthlySpendChartData: {
        labels: [],
        data: [],
      },
      subscriptionTableData: [],
      vendorProfileAggregation: [],
      mostExpensiveAggregations: [],
      categorySummary: [],
      categorizedSubscriptions: {
        veryUrgent: [],
        urgent: [],
        notUrgent: [],
      },
      nearingRenewalData: [],
      expiredSubscriptionsData: [],
      activeSubscriptionTab: "all",
    }),
}));
