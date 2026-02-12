import API from "../api.js";

export async function getRelationshipSubsLines(body) {
  try {
    const { data } = await API.post("/GetSubscriptionData", body);
    return data;
  } catch (error) {
    console.error("Azure Function call failed, falling back to error handler:", error);
  }
}

export async function populateEditForm(activityId) {
  try {
    const { data } = await API.post("/Getsubscriptionactivityline", null, {
      params: { activityId },
    });
    return data;
  } catch (error) {
    console.error("Azure Function call failed, populate edit form:", error);
  }
}

export async function getDeparments() {
  try {
    const { data } = await API.get("/getDepartments");
    return data;
  } catch (error) {
    console.error("Azure Function call failed, get departments:", error);
  }
}

export async function getCategories() {
  try {
    const { data } = await API.get("/getCategories");
    return data;
  } catch (error) {
    console.error("Azure Function call failed, get categories:", error);
    throw error;
  }
}

export async function checkSubscriptionExistance(subscriptionName, subscriptionActivityId) {
  try {
    const { data } = await API.get("/checkDuplicateSubscription", {
      params: { subscriptionName, subscriptionActivityId },
    });
    return data;
  } catch (error) {
    console.error("Azure Function call failed, check subscription existence:", error);
  }
}

export async function updateSubscription(formData) {
  try {
    const { data } = await API.post("/UpdateSubscriptionActivityLine", formData);
    return data;
  } catch (error) {
    console.error("Azure Function call failed, update subscription:", error);
  }
}

export async function deleteSubscriptionActivityLine(activityLineId) {
  if (!activityLineId) {
    console.warn("deleteSubscriptionActivityLine: activityLineId is required");
    return;
  }
  try {
    const { data } = await API.delete(`/deleteSubscriptionActivityLine/${activityLineId}`);
    return data ?? {};
  } catch (error) {
    const message =
      error.response?.status === 404
        ? "Record not found or already deleted."
        : error.response?.data != null
          ? String(error.response.data)
          : error.message;
    console.error("Azure Function call failed, delete subscription activity line:", error);
    throw new Error(message);
  }
}
// Budget Related Functions
/** Fetch budget data from GetbudgetData API. Call when opening Budget Management modal. */
export async function fetchBudgetData(options = {}) {
  const { pageNumber = 1, contactId } = options;
  try {
    const { data } = await API.post("/GetbudgetData", {
      contactId,
      pagenumber: pageNumber,
    });
    return data;
  } catch (error) {
    console.error("Fetch budget data failed:", error);
    throw error;
  }
}

export async function getFinancialYear() {
  try {
    const { data } = await API.post("/Getfinancialyeardata", {});
    return data;
  } catch (error) {
    console.error("Azure Function call failed, get financial year:", error);
  }
}

/** Get subscription activity lines by account. */
export async function getActivityLines(accountId) {
  try {
    const { data } = await API.get("/getSubscriptionActivityLinesByAccount", {
      params: { accountId },
    });
    return data;
  } catch (error) {
    console.error("Azure Function call failed, get activity lines:", error);
    throw error;
  }
}

/** Check budget by financial year and department. Returns API result (e.g. array). */
export async function checkBudget(financialYearId, departmentId) {
  try {
    const { data } = await API.get("/getBudget/check", {
      params: { financialYearId, departmentId },
    });
    return data;
  } catch (error) {
    console.error("Azure Function call failed, check budget:", error);
    throw error;
  }
}

/** POST budget payload to addBudget API (department or subscription budget). */
export async function addBudget(payload) {
  try {
    const { data } = await API.post("/addBudget", payload);
    return data;
  } catch (error) {
    console.error("Azure Function call failed, add budget:", error);
    throw error;
  }
}

/** Update budget by budgetId. budgetId in URL, rest of payload (yiic_name, yiic_amount) in body. */
export async function updateBudget(budgetId, payload) {
  if (!budgetId) {
    console.warn("updateBudget: budgetId is required");
    return;
  }
  try {
    const body = payload ? { ...payload } : {};
    const { data } = await API.patch(`/updateBudget/${budgetId}`, body);
    return data;
  } catch (error) {
    console.error("Azure Function call failed, update budget:", error);
    throw error;
  }
}

/** Fetch vendor list from getSubscriptionActivities API. Call when opening Add Subscription Manually. */
export async function fetchVendorList(activityId) {
  try {
    const { data } = await API.get(`/getSubscriptionActivities/${activityId}`);
    return data;
  } catch (error) {
    console.error("Azure Function call failed, fetch vendor list:", error);
    throw error;
  }
}

/** Add subscription  */
export async function addSubscription(formData) {
  try {
    const { data } = await API.post("/createSubscriptionActivityLine", formData);
    return data;
  } catch (error) {
    console.error("Azure Function call failed, add subscription:", error);
    throw error;
  }
}
/** Check if vendor exists for account. GET .../api/checkVendorExists?vendorName=...&accountId=... */
export async function checkVendorExistance(accountId, vendorName) {
  try {
    const { data } = await API.get("/checkVendorExists", {
      params: { vendorName, accountId },
    });
    return data;
  } catch (error) {
    console.error("Azure Function call failed, check vendor existence:", error);
    throw error;
  }
}

/** Fetch subscription activity by ID. GET from getSubscriptionActivityById/{id}. */
export async function getSubscriptionActivityById(activityId) {
  try {
    const { data } = await API.get(`/getSubscriptionActivityById/${activityId}`);
    return data;
  } catch (error) {
    console.error("Azure Function call failed, get subscription activity by ID:", error);
    throw error;
  }
}

/** Create vendor record. POST to createVendor with body (vendorName, accountManagerEmail, accountManagerName, accountManagerPhone). */
export async function createVendorRecord(body) {
  try {
    const { data: result } = await API.post("/createVendor", body);

    // If we have a subscription activity ID, fetch the full activity details
    if (result?.yiic_subscriptionsactivityid) {
      const activityData = await getSubscriptionActivityById(result.yiic_subscriptionsactivityid);

      // Extract the first item from activityData.value array (if it exists)
      const activityDetails = activityData?.value?.[0] || {};

      // Merge both responses into a unified object
      const unifiedResponse = {
        ...activityDetails,
        // Preserve fields from the original create response that might not be in activityDetails
        yiic_vendorname: result.yiic_vendorname || activityDetails.yiic_vendorname,
        yiic_accountmanagername:
          result.yiic_accountmanagername || activityDetails.yiic_accountmanagername,
        yiic_accountmanageremail:
          result.yiic_accountmanageremail || activityDetails.yiic_accountmanageremail,
        yiic_accountmanagerphone:
          result.yiic_accountmanagerphone || activityDetails.yiic_accountmanagerphone,
        yiic_subscriptionsactivityid: result.yiic_subscriptionsactivityid,
      };

      return unifiedResponse;
    }

    return result;
  } catch (error) {
    console.error("Azure Function call failed, create vendor:", error);
    throw error;
  }
}
