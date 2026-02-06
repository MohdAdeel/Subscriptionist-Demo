import { create } from "zustand";

/**
 * Store for Home page data (KPI cards, etc.)
 * Populated by handleDataProcessing / setActiveCards in lib/utils/home.js
 */
export const useHomeStore = create((set) => ({
  FirstTwoCards: {
    ActiveCount: 0,
    totalContractAmount: 0,
  },

  setFirstTwoCards: (ActiveCount, totalContractAmount) =>
    set({
      FirstTwoCards: {
        ActiveCount,
        totalContractAmount,
      },
    }),

  /** Upcoming renewal amount and count for the selected timeline (from calculateSubscriptionAmount) */
  renewalTimelineCards: {
    upcomingRenewalAmount: 0,
    renewalTimelineCount: 0,
  },

  setRenewalTimelineCards: (upcomingRenewalAmount, renewalTimelineCount) =>
    set({
      renewalTimelineCards: {
        upcomingRenewalAmount,
        renewalTimelineCount,
      },
    }),

  /** Number of subscriptions expired during the last 12 months (from countConcludedSubscriptions) */
  RecentlyConcluded: 0,

  setRecentlyConcluded: (RecentlyConcluded) => set({ RecentlyConcluded }),

  VendorDoughnutChartData: [],

  setVendorDoughnutChartData: (VendorDoughnutChartData) => set({ VendorDoughnutChartData }),

  /** Monthly spend chart: array of { SubscriptionStartDate, SubscriptionContractAmount } from mergeRecordsByMonth */
  monthlySpendChartData: [],

  setMonthlySpendChartData: (monthlySpendChartData) => set({ monthlySpendChartData }),

  /** Department spend chart: array of [record] entries from mergeRecordsBymonthForDepartment */
  departmentSpendChartData: [],

  setDepartmentSpendChartData: (departmentSpendChartData) => set({ departmentSpendChartData }),

  /** Actual vs Budget chart: array of [record] entries from retrieveBudget */
  ActualVsBudgetData: [],

  setActualVsBudgetData: (ActualVsBudgetData) => set({ ActualVsBudgetData }),

  /** Upcoming renewal records (expanded occurrences within the window) */
  upcomingRenewalRecords: [],

  setUpcomingRenewalRecords: (upcomingRenewalRecords) => set({ upcomingRenewalRecords }),
}));
