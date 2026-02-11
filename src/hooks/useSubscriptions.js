import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addBudget,
  checkBudget,
  updateBudget,
  getCategories,
  getDeparments,
  fetchVendorList,
  fetchBudgetData,
  getFinancialYear,
  addSubscription,
  getActivityLines,
  populateEditForm,
  updateSubscription,
  createVendorRecord,
  checkVendorExistance,
  getRelationshipSubsLines,
  checkSubscriptionExistance,
  getSubscriptionActivityById,
  deleteSubscriptionActivityLine,
} from "../lib/api/Subscription/subscriptions";
import { useAuthStore } from "../stores";

/** Query key for main subscription grid - invalidate to refetch after add/update/delete */
export const SUBSCRIPTION_DATA_QUERY_KEY = ["subscriptionData"];
export const VENDOR_LIST_QUERY_KEY = ["subscriptionVendorList"];
export const BUDGET_DATA_QUERY_KEY = ["budgetData"];
export const DEPARTMENTS_QUERY_KEY = ["departments"];
export const CATEGORIES_QUERY_KEY = ["categories"];

/**
 * Build query key for subscription list with filters
 */
export const getSubscriptionDataQueryKey = (filters = {}) => [
  ...SUBSCRIPTION_DATA_QUERY_KEY,
  filters,
];

/**
 * Main subscription grid data. Refetches when invalidated (after add/update/delete).
 */
export const useSubscriptionData = (filters = {}, options = {}) => {
  const userAuth = useAuthStore((state) => state.userAuth);
  const parsedStatus =
    filters.status != null && filters.status !== ""
      ? Number.parseInt(String(filters.status), 10)
      : 3;
  const status = Number.isNaN(parsedStatus) ? 3 : parsedStatus;
  const requestBody = {
    contactId: filters.contactId ?? userAuth?.contactid,
    status,
    pagenumber: filters.pagenumber ?? 1,
    startdate: filters.startdate ?? null,
    enddate: filters.enddate ?? null,
    vendorName: filters.vendorName ?? null,
    subsciptionActivityline: filters.subsciptionActivityline ?? null,
  };

  return useQuery({
    queryKey: getSubscriptionDataQueryKey(requestBody),
    queryFn: () => getRelationshipSubsLines(requestBody),
    ...options,
  });
};

/**
 * Populate edit form by activity ID (for EditSubscriptionModal)
 */
export const usePopulateEditForm = (activityId, options = {}) => {
  return useQuery({
    queryKey: ["populateEditForm", activityId],
    queryFn: () => populateEditForm(activityId),
    enabled: Boolean(activityId) && Boolean(options.enabled !== false),
    ...options,
  });
};

/**
 * Departments lookup
 */
export const useDepartments = (options = {}) => {
  return useQuery({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: () => getDeparments().then((r) => r?.value ?? []),
    ...options,
  });
};

/**
 * Categories lookup
 */
export const useCategories = (options = {}) => {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: getCategories,
    ...options,
  });
};

/**
 * Vendor list for Add Subscription flow
 */
export const useVendorList = (activityId, options = {}) => {
  const userAuth = useAuthStore((state) => state.userAuth);
  const accountId = activityId ?? userAuth?.accountid;
  return useQuery({
    queryKey: [...VENDOR_LIST_QUERY_KEY, accountId],
    queryFn: () => fetchVendorList(accountId),
    enabled: Boolean(options.enabled !== false),
    ...options,
  });
};

/**
 * Budget data for Budget Management modal
 */
export const useBudgetData = (pageNumber = 1, options = {}) => {
  const userAuth = useAuthStore((state) => state.userAuth);
  const contactId = userAuth?.contactid;
  return useQuery({
    queryKey: [...BUDGET_DATA_QUERY_KEY, pageNumber, contactId],
    queryFn: () => fetchBudgetData({ pageNumber, contactId }),
    enabled: Boolean(options.enabled !== false),
    ...options,
  });
};

/**
 * Financial years for Add Budget
 */
export const useFinancialYear = (options = {}) => {
  return useQuery({
    queryKey: ["financialYear"],
    queryFn: getFinancialYear,
    ...options,
  });
};

/**
 * Activity lines for Add Budget subscription dropdown
 */
export const useSubscriptionActivityLines = (accountId, options = {}) => {
  const userAuth = useAuthStore((state) => state.userAuth);
  const effectiveAccountId = accountId ?? userAuth?.accountid;
  return useQuery({
    queryKey: ["subscriptionActivityLines", effectiveAccountId],
    queryFn: () => getActivityLines(effectiveAccountId),
    enabled: Boolean(options.enabled !== false),
    ...options,
  });
};

/**
 * Check budget (financial year + department)
 */
export const useCheckBudget = (financialYearId, departmentId, options = {}) => {
  return useQuery({
    queryKey: ["checkBudget", financialYearId, departmentId],
    queryFn: () => checkBudget(financialYearId, departmentId),
    enabled: Boolean(financialYearId) && Boolean(departmentId) && options.enabled !== false,
    ...options,
  });
};

// --- Mutations (all invalidate subscription list or relevant data) ---

/**
 * Add subscription. Invalidates subscription list on success.
 */
export const useAddSubscriptionMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => addSubscription(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_DATA_QUERY_KEY });
    },
    ...options,
  });
};

/**
 * Update subscription. Invalidates subscription list on success.
 */
export const useUpdateSubscriptionMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => updateSubscription(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_DATA_QUERY_KEY });
    },
    ...options,
  });
};

/**
 * Delete subscription activity line. Invalidates subscription list on success.
 */
export const useDeleteSubscriptionActivityLineMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityLineId) => deleteSubscriptionActivityLine(activityLineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_DATA_QUERY_KEY });
    },
    ...options,
  });
};

/**
 * Create vendor record. Invalidates vendor list (and subscription list for consistency).
 */
export const useCreateVendorRecordMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => createVendorRecord(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_LIST_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_DATA_QUERY_KEY });
    },
    ...options,
  });
};

/**
 * Add budget. Invalidates budget data on success.
 */
export const useAddBudgetMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => addBudget(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_DATA_QUERY_KEY });
    },
    ...options,
  });
};

/**
 * Update budget. Invalidates budget data on success.
 */
export const useUpdateBudgetMutation = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, payload }) => updateBudget(budgetId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_DATA_QUERY_KEY });
    },
    ...options,
  });
};

// Re-export API functions for one-off calls (e.g. checkSubscriptionExistance before update)
export { checkSubscriptionExistance, checkVendorExistance, getSubscriptionActivityById };
