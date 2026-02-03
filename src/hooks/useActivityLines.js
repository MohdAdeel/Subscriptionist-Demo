import { useQuery } from "@tanstack/react-query";
import { useActivityLineStore } from "../stores";
import { fetchActivityLines } from "../lib/api/activityLine/activityLine";
import { handleActivityLinesSuccess } from "../lib/utils/reportsPage";

/**
 * Query key for activity lines - used for caching and invalidation
 */
export const ACTIVITY_LINES_QUERY_KEY = ["activityLines"];

/**
 * Custom hook to fetch and manage activity lines data
 *
 * Features:
 * - Automatic caching (data fetched once, reused everywhere)
 * - Background refetching when stale
 * - Loading and error states
 * - Raw data stored in Zustand for global access
 *
 * @param {Object} options - Optional React Query options to override defaults
 * @returns {Object} Query result with data, isLoading, error, etc.
 */
export const useActivityLines = (options = {}) => {
  const setActivityLines = useActivityLineStore((state) => state.setActivityLines);

  return useQuery({
    queryKey: ACTIVITY_LINES_QUERY_KEY,
    queryFn: async () => {
      const data = await fetchActivityLines();

      // Store raw data in Zustand for global access outside React Query
      setActivityLines(data);

      // Process data for reports (populates reportsPageStore)
      handleActivityLinesSuccess(data);

      return data;
    },
    ...options,
  });
};

/**
 * Hook to access raw activity lines from cache without triggering a fetch
 * Useful for components that only need data if it's already loaded
 */
export const useActivityLinesData = () => {
  return useActivityLineStore((state) => state.activityLines);
};
