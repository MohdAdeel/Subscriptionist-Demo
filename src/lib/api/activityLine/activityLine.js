import API from "../api";

/**
 * Fetches activity lines from the API
 * This is the pure fetch function - no side effects
 * Use useActivityLines hook for React components
 *
 * @param {string} contactId - Optional contact ID override
 * @returns {Promise<Array>} Raw activity lines data
 */
export const fetchActivityLines = async (contactId = "4dc801c2-7ac1-f011-bbd3-7c1e5215388e") => {
  const { data } = await API.get("/GetActivityLinesByContactId", {
    params: { contactId },
  });
  return data;
};

/**
 * @deprecated Use useActivityLines hook instead for React components
 * Keeping for backward compatibility during migration
 */
export const getActivity = fetchActivityLines;
