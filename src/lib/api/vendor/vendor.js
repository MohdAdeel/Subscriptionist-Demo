/**
 * Vendor API functions
 * All API calls related to vendor operations
 */

const API_BASE_URL =
  "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
const API_KEY = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";

/**
 * Create a new vendor record
 * @param {Object} record - Vendor record data
 * @returns {Promise<Object>} Response data
 */
export async function createVendor(record) {
  const response = await fetch(`${API_BASE_URL}/createVendor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
    body: JSON.stringify(record),
  });
  console.log("response", response);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create vendor: ${response.status} - ${errorText}`);
  }

  // Try to parse JSON, but handle cases where response might be empty
  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (e) {
      // Response might be empty, that's okay for 201
      console.log("Response body is empty or not JSON, which is fine for 201 status");
    }
  }

  return data;
}

/**
 * Get vendor data with filters
 * @param {Object} requestBody - Request body with filters
 * @returns {Promise<Object>} Vendor data response
 */
export async function getVendorData(requestBody) {
  const response = await fetch(`${API_BASE_URL}/GetVendorData`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get vendor details by activity ID
 * @param {string} activityID - Vendor activity ID
 * @returns {Promise<Object>} Vendor details
 */
export async function getVendorDetails(activityID) {
  const response = await fetch(`${API_BASE_URL}/getVendorDetails/${activityID}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Update vendor record
 * @param {string} activityID - Vendor activity ID
 * @param {Object} updateData - Updated vendor data
 * @returns {Promise<Object>} Response data
 */
export async function updateVendor(activityID, updateData) {
  const response = await fetch(`${API_BASE_URL}/updateVendor/${activityID}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
}

/**
 * Delete vendor by ID
 * @param {string} vendorId - Vendor ID to delete
 * @returns {Promise<Object>} Response data
 */
export async function deleteVendor(vendorId) {
  const response = await fetch(`${API_BASE_URL}/deleteVendor/${vendorId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete vendor: ${response.status} - ${errorText}`);
  }

  // Try to parse JSON, but handle empty responses
  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (e) {
      // Empty response is fine for DELETE operations
      console.log("Delete response is empty, which is normal");
    }
  }

  return { success: true, data };
}

/**
 * Get subscription activity lines by subscription activity ID
 * @param {string} subscriptionActivityId - Subscription activity ID
 * @returns {Promise<Array>} Array of activity lines
 */
export async function getSubscriptionActivityLinesBySubscriptionActivity(subscriptionActivityId) {
  const response = await fetch(
    `${API_BASE_URL}/getSubscriptionActivityLinesBySubscriptionActivity?subscriptionActivityId=${subscriptionActivityId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.value || [];
}

/**
 * Delete subscription activity line
 * @param {string} activityLineId - Activity line ID to delete
 * @returns {Promise<Object>} Response data
 */
export async function deleteSubscriptionActivityLine(activityLineId) {
  const response = await fetch(`${API_BASE_URL}/deleteSubscriptionActivityLine/${activityLineId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete activity line: ${response.status} - ${errorText}`);
  }

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (e) {
      console.log("Delete response is empty, which is normal");
    }
  }

  return { success: true, data };
}
