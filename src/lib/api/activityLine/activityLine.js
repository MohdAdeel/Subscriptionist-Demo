import API from "../api";

/**
 * Fetches activity lines from the API
 * This is the pure fetch function - no side effects
 * Use useActivityLines hook for React components
 *
 * @param {string} contactId - Optional contact ID override
 * @returns {Promise<Array>} Raw activity lines data
 */
export const fetchActivityLines = async (contactId = "030ef119-c1c1-ee11-9079-00224827e8f9") => {
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
