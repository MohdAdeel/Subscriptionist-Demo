/**
 * Profile API functions
 * All API calls related to profile / contact operations
 */

const API_BASE_URL =
  "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
const API_KEY = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";

/**
 * Get contact/profile by contact ID
 * @param {string} contactId - Contact ID (e.g. "030ef119-c1c1-ee11-9079-00224827e8f9")
 * @returns {Promise<Object>} Contact/profile data
 */
export async function getProfile(contactId) {
  const response = await fetch(`${API_BASE_URL}/getContact/${contactId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get profile: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function getProfileImage(contactId) {
  const response = await fetch(`${API_BASE_URL}/getContactProfile?contactId=${contactId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get profile: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

/**
 * Get notification data by contact ID
 * @param {string} contactId - Contact ID (e.g. "030ef119-c1c1-ee11-9079-00224827e8f9")
 * @returns {Promise<Object>} Notification data from backend
 */
export async function getNotificationData(contactId) {
  const response = await fetch(
    `${API_BASE_URL}/getNotificationData?contactId=${encodeURIComponent(contactId)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": API_KEY,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get notification data: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

/**
 * Add an associated user (invite/link a user to the current contact).
 * @param {Object} payload - { FirstName, LastName, Email, LoginContactId }
 * @param {string} payload.FirstName - New user first name
 * @param {string} payload.LastName - New user last name
 * @param {string} payload.Email - New user email (required)
 * @param {string} payload.LoginContactId - Current contact ID (the user adding the associate)
 * @returns {Promise<Object>} Response data
 */
export async function addAssociatedUser(payload) {
  const response = await fetch(`${API_BASE_URL}/addAssociateUser`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add associated user: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) return {};
  return response.json();
}

/**
 * Delete an associated user by user/record ID.
 * @param {string} userId - User/record ID to delete (e.g. "78011893-6bfc-f011-8406-00224826f893")
 * @returns {Promise<Object>} Response data
 */
export async function deleteAssociatedUser(userId) {
  const response = await fetch(`${API_BASE_URL}/deleteUser(${encodeURIComponent(userId)})`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete associated user: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) return {};
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Get associated users by contact ID
 * @param {string} contactId - Contact ID (e.g. "32bbf110-bab8-f011-bbd3-7c1e5215388e")
 * @returns {Promise<Array>} Associated users list
 */
export async function getAssociatedUsers(contactId) {
  const response = await fetch(
    `${API_BASE_URL}/getAssociatedUsers?contactId=${encodeURIComponent(contactId)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": API_KEY,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get associated users: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) return [];
  return response.json();
}

/**
 * Update notification data (save notification preferences)
 * @param {Object} payload - { contactId, yiic_subscriptionexpirationreminder, yiic_planchangeconfirmation, yiic_importantpolicyupdate, yiic_subscriptioncancelled, yiic_daysforreminder, yiic_emailsubscriptionexpirationreminder, yiic_emailplanchangeconfirmation, yiic_emailimportantpolicyupdate, yiic_emailsubscriptioncancelled, yiic_emaildaysforreminder }
 * @returns {Promise<Object>} Response data
 */
export async function updateNotificationData(payload) {
  const response = await fetch(`${API_BASE_URL}/saveNotificationData`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save notification data: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) return {};
  return response.json();
}

/**
 * Update contact/profile by contact ID
 * @param {string} contactId - Contact ID (e.g. "32bbf110-bab8-f011-bbd3-7c1e5215388e")
 * @param {Object} updateData - Updated contact data (firstname, lastname, emailaddress1, telephone1, adx_organizationname, accountrolecode, websiteurl, etc.)
 * @returns {Promise<Object>} Response data
 */
export async function updateContact(contactId, updateData) {
  const response = await fetch(`${API_BASE_URL}/updateContact/${contactId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update profile: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) return {};
  return response.json();
}

/**
 * Update profile picture by contact ID (sends image as base64 in body)
 * @param {string} contactId - Contact ID (e.g. "32bbf110-bab8-f011-bbd3-7c1e5215388e")
 * @param {string} entityimage - Base64-encoded image string (without data URL prefix)
 * @returns {Promise<Object>} Response data
 */
export async function updateProfilePicture(contactId, entityimage) {
  const response = await fetch(`${API_BASE_URL}/updateProfilePic(${contactId})`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
    body: JSON.stringify({ entityimage }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update profile picture: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) return {};
  return response.json();
}
