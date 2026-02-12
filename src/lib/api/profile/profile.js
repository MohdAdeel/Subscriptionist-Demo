import API from "../api.js";

/**
 * Get contact/profile by contact ID
 * @param {string} contactId - Contact ID (e.g. "030ef119-c1c1-ee11-9079-00224827e8f9")
 * @returns {Promise<Object>} Contact/profile data
 */
export async function getProfile(contactId) {
  try {
    const response = await API.get(`/getContact/${contactId}`);
    if (response.status === 204) return null;
    return response.data;
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to get profile: ${err.response?.status ?? ""} - ${message}`);
  }
}

export async function getProfileImage(contactId) {
  try {
    const response = await API.get("/getContactProfile", { params: { contactId } });
    if (response.status === 204) return null;
    return response.data;
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to get profile: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Get notification data by contact ID
 * @param {string} contactId - Contact ID
 * @returns {Promise<Object>} Notification data from backend
 */
export async function getNotificationData(contactId) {
  try {
    const response = await API.get("/getNotificationData", { params: { contactId } });
    if (response.status === 204) return null;
    return response.data;
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to get notification data: ${err.response?.status ?? ""} - ${message}`);
  }
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
  try {
    const response = await API.post("/addAssociateUser", payload);
    if (response.status === 204) return {};
    const data = response.data ?? {};
    await createUserInB2C({ email: data.email });
    return data;
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to add associated user: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Delete an associated user by user/record ID.
 * @param {string} userId - User/record ID to delete (e.g. "78011893-6bfc-f011-8406-00224826f893")
 * @returns {Promise<Object>} Response data
 */
export async function deleteAssociatedUser(userId) {
  try {
    const { data } = await API.delete(`/deleteUser(${encodeURIComponent(userId)})`);
    return data ?? {};
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to delete associated user: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Get associated users by contact ID
 * @param {string} contactId - Contact ID (e.g. "32bbf110-bab8-f011-bbd3-7c1e5215388e")
 * @returns {Promise<Array>} Associated users list
 */
export async function getAssociatedUsers(contactId) {
  try {
    const { data } = await API.get("/getAssociatedUsers", { params: { contactId } });
    return data ?? [];
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to get associated users: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Update notification data (save notification preferences)
 * @param {Object} payload - { contactId, yiic_subscriptionexpirationreminder, yiic_planchangeconfirmation, yiic_importantpolicyupdate, yiic_subscriptioncancelled, yiic_daysforreminder, yiic_emailsubscriptionexpirationreminder, yiic_emailplanchangeconfirmation, yiic_emailimportantpolicyupdate, yiic_emailsubscriptioncancelled, yiic_emaildaysforreminder }
 * @returns {Promise<Object>} Response data
 */
export async function updateNotificationData(payload) {
  try {
    const { data } = await API.post("/saveNotificationData", payload);
    return data ?? {};
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to save notification data: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Update contact/profile by contact ID
 * @param {string} contactId - Contact ID (e.g. "32bbf110-bab8-f011-bbd3-7c1e5215388e")
 * @param {Object} updateData - Updated contact data (firstname, lastname, emailaddress1, telephone1, adx_organizationname, accountrolecode, websiteurl, etc.)
 * @returns {Promise<Object>} Response data
 */
export async function updateContact(contactId, updateData) {
  try {
    const { data } = await API.patch(`/updateContact/${contactId}`, updateData);
    return data ?? {};
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to update profile: ${err.response?.status ?? ""} - ${message}`);
  }
}

/**
 * Update profile picture by contact ID (sends image as base64 in body)
 * @param {string} contactId - Contact ID (e.g. "32bbf110-bab8-f011-bbd3-7c1e5215388e")
 * @param {string} entityimage - Base64-encoded image string (without data URL prefix)
 * @returns {Promise<Object>} Response data
 */
export async function updateProfilePicture(contactId, entityimage) {
  try {
    const { data } = await API.patch(`/updateProfilePic(${contactId})`, { entityimage });
    return data ?? {};
  } catch (err) {
    const message = err.response?.data != null ? String(err.response.data) : err.message;
    throw new Error(`Failed to update profile picture: ${err.response?.status ?? ""} - ${message}`);
  }
}

export async function createUserInB2C(payload) {
  try {
    const url = import.meta.env.VITE_AZURE_B2C_API_URL;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }
    if (!response.ok) {
      throw new Error(`B2C create failed: ${response.status} - ${text || JSON.stringify(data)}`);
    }
    return data;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error(`B2C create failed: ${String(err)}`);
  }
}
