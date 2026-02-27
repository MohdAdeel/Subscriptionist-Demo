import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications } from "../lib/api/Notifications/Notification";
import { useAuthStore } from "../stores";

/**
 * Query key for notifications - use for cache invalidation and refetch.
 * Invalidate this key to mark notifications as stale and trigger refetch.
 */
export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

/**
 * Build query key for notifications (scoped by contactId when needed).
 */
export const getNotificationsQueryKey = (contactId) => [
  ...NOTIFICATIONS_QUERY_KEY,
  { contactId: contactId ?? null },
];

/**
 * Fetch notifications via TanStack Query.
 * Returns query result plus helpers to invalidate (expire) and refetch.
 *
 * @param {object} options - Optional useQuery options (staleTime, refetchOnWindowFocus, etc.)
 * @returns {object} - { data, isLoading, isError, error, refetch, invalidate, ...queryResult }
 *
 * @example
 * const { data: notifications, isLoading, refetch, invalidate } = useNotifications();
 *
 * // Force refetch now
 * await refetch();
 *
 * // Invalidate cache so next read refetches (e.g. after adding a subscription)
 * invalidate();
 */
export function useNotifications(options = {}) {
  const queryClient = useQueryClient();
  const contactId = useAuthStore((state) => state.userAuth?.contactid);

  const query = useQuery({
    queryKey: getNotificationsQueryKey(contactId),
    queryFn: getNotifications,
    enabled: Boolean(contactId),
    staleTime: 60 * 1000, // 1 min - consider data fresh for 1 min before background refetch
    ...options,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
  };

  return {
    ...query,
    invalidate,
  };
}
