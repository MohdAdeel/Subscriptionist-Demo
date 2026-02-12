/**
 * Vendor API functions
 * All API calls related to vendor operations
 */

import API from "../api.js";

/**
 * Create a new vendor record
 * @param {Object} record - Vendor record data
 * @returns {Promise<Object>} Response data
 */
export async function createVendor(record) {
  try {
    const { data } = await API.post("/createVendor", record);
    return data;
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to create vendor: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Get vendor data with filters
 * @param {Object} requestBody - Request body with filters
 * @returns {Promise<Object>} Vendor data response
 */
export async function getVendorData(requestBody) {
  try {
    const { data } = await API.post("/GetVendorData", requestBody);
    return data;
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to get vendor data: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Get vendor details by activity ID
 * @param {string} activityID - Vendor activity ID
 * @returns {Promise<Object>} Vendor details
 */
export async function getVendorDetails(activityID) {
  try {
    const { data } = await API.get(`/getVendorDetails/${activityID}`);
    return data;
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to get vendor details: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Update vendor record
 * @param {string} activityID - Vendor activity ID
 * @param {Object} updateData - Updated vendor data
 * @returns {Promise<Object>} Response data
 */
export async function updateVendor(activityID, updateData) {
  try {
    const { data } = await API.patch(`/updateVendor/${activityID}`, updateData);
    return data;
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to update vendor: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Delete vendor by ID
 * @param {string} vendorId - Vendor ID to delete
 * @returns {Promise<Object>} Response data
 */
export async function deleteVendor(vendorId) {
  try {
    const { data } = await API.delete(`/deleteVendor/${vendorId}`);
    return { success: true, data };
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to delete vendor: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Get subscription activity lines by subscription activity ID
 * @param {string} subscriptionActivityId - Subscription activity ID
 * @returns {Promise<Array>} Array of activity lines
 */
export async function getSubscriptionActivityLinesBySubscriptionActivity(subscriptionActivityId) {
  try {
    const { data } = await API.get("/getSubscriptionActivityLinesBySubscriptionActivity", {
      params: { subscriptionActivityId },
    });
    return Array.isArray(data) ? data : (data?.value ?? []);
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(
      `Failed to get subscription activity lines: ${err.response?.status ?? ""} - ${message}`
    );
  }
}

/**
 * Delete subscription activity line
 * @param {string} activityLineId - Activity line ID to delete
 * @returns {Promise<Object>} Response data
 */
export async function deleteSubscriptionActivityLine(activityLineId) {
  try {
    const { data } = await API.delete(`/deleteSubscriptionActivityLine/${activityLineId}`);
    return { success: true, data };
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to delete activity line: ${err.response?.status ?? ""} - ${message}`);
  }
}
