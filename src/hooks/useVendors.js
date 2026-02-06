import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVendorData,
  getVendorDetails,
  createVendor,
  updateVendor,
  deleteVendor,
  deleteSubscriptionActivityLine,
  getSubscriptionActivityLinesBySubscriptionActivity,
} from "../lib/api/vendor/vendor";

/**
 * Query key for vendor list - used for caching and invalidation.
 * Invalidate ["vendorData"] to refetch all vendor list queries.
 */
export const VENDOR_DATA_QUERY_KEY = ["vendorData"];

const DEFAULT_CONTACT_ID = "c199b131-4c62-f011-bec2-6045bdffa665";

/**
 * Build query key for vendor list with filters
 */
export const getVendorDataQueryKey = (filters = {}) => [
  ...VENDOR_DATA_QUERY_KEY,
  {
    contactId: filters.contactId ?? DEFAULT_CONTACT_ID,
    status: filters.status ?? 3,
    pagenumber: filters.pagenumber ?? 1,
    vendor: filters.vendor ?? null,
  },
];

/**
 * Fetch vendor list with filters.
 * Refetches automatically after create, update, delete via query invalidation.
 */
export const useVendorData = (filters = {}, options = {}) => {
  const normalizedStatus =
    filters.status != null && filters.status !== ""
      ? Number.parseInt(String(filters.status), 10)
      : 3;
  const status = Number.isNaN(normalizedStatus) ? 3 : normalizedStatus;
  const requestBody = {
    contactId: filters.contactId ?? DEFAULT_CONTACT_ID,
    status,
    pagenumber: filters.pagenumber ?? 1,
    vendor: filters.vendor?.trim() || null,
  };

  return useQuery({
    queryKey: getVendorDataQueryKey({
      contactId: requestBody.contactId,
      status: requestBody.status,
      pagenumber: requestBody.pagenumber,
      vendor: requestBody.vendor,
    }),
    queryFn: () => getVendorData(requestBody),
    ...options,
  });
};

/**
 * Fetch vendor details by activity ID
 */
export const useVendorDetails = (activityID, options = {}) => {
  return useQuery({
    queryKey: ["vendorDetails", activityID],
    queryFn: () => getVendorDetails(activityID),
    enabled: Boolean(activityID),
    ...options,
  });
};

/**
 * Create vendor mutation. Invalidates vendor list on success.
 */
export const useCreateVendorMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (record) => createVendor(record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_DATA_QUERY_KEY });
    },
    ...options,
  });
};

/**
 * Update vendor mutation. Invalidates vendor list on success.
 */
export const useUpdateVendorMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityID, updateData }) => updateVendor(activityID, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_DATA_QUERY_KEY });
    },
    ...options,
  });
};

/**
 * Delete vendor mutation. Invalidates vendor list on success.
 */
export const useDeleteVendorMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vendorId) => deleteVendor(vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_DATA_QUERY_KEY });
    },
    ...options,
  });
};

/**
 * Fetch subscription activity lines by subscription activity ID
 */
export const useSubscriptionActivityLines = (subscriptionActivityId, options = {}) => {
  return useQuery({
    queryKey: ["subscriptionActivityLines", subscriptionActivityId],
    queryFn: () => getSubscriptionActivityLinesBySubscriptionActivity(subscriptionActivityId),
    enabled: Boolean(subscriptionActivityId),
    ...options,
  });
};

/**
 * Delete subscription activity line mutation.
 * Optionally invalidate vendor list or subscription activity lines.
 */
export const useDeleteSubscriptionActivityLineMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityLineId) => deleteSubscriptionActivityLine(activityLineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_DATA_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["subscriptionActivityLines"] });
    },
    ...options,
  });
};
