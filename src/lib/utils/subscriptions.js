export async function getRelationshipSubsLines(number) {
  let body = {
    contactId: "4dc801c2-7ac1-f011-bbd3-7c1e5215388e",
    status: 0,
    pagenumber: number,
    startdate: null,
    enddate: null,
    vendorName: null,
    subscriptionName: null,
  };
  try {
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/GetSubscriptionData";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";

    // Call the Azure Function
    const response = await fetch(azureFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, falling back to error handler:", error);
  }
}

export async function populateEditForm(activityId) {
  try {
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/Getsubscriptionactivityline";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";

    const response = await fetch(
      `${azureFunctionUrl}?activityId=${encodeURIComponent(activityId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-functions-key": funcKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, populate edit form:", error);
  }
}

export async function getDeparments() {
  try {
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/getDepartments";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, get departments:", error);
  }
}

export async function getCategories() {
  try {
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/getCategories";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, get categories:", error);
    throw error;
  }
}

export async function checkSubscriptionExistance(subscriptionName, subscriptionActivityId) {
  try {
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/checkDuplicateSubscription" +
      `?subscriptionName=${encodeURIComponent(subscriptionName)}` +
      `&subscriptionActivityId=${subscriptionActivityId}`;
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, check subscription existence:", error);
  }
}

export async function updateSubscription(formData) {
  try {
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/UpdateSubscriptionActivityLine";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    return result;
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
    const baseUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
    const azureFunctionUrl = `${baseUrl}/deleteSubscriptionActivityLine/${encodeURIComponent(activityLineId)}`;
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
    });

    if (!response.ok) {
      const message =
        response.status === 404
          ? "Record not found or already deleted."
          : `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(message);
    }

    const result = await response.json().catch(() => ({}));
    return result;
  } catch (error) {
    console.error("Azure Function call failed, delete subscription activity line:", error);
    throw error;
  }
}
// Budget Related Functions
/** Fetch budget data from GetbudgetData API. Call when opening Budget Management modal. */
export async function fetchBudgetData(options = {}) {
  const { pageNumber = 1, contactId = "4dc801c2-7ac1-f011-bbd3-7c1e5215388e" } = options;
  try {
    const baseUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const azureFunctionUrl = `${baseUrl}/GetbudgetData?code=${funcKey}`;
    const response = await fetch(azureFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contactId,
        pagenumber: pageNumber,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch budget data failed:", error);
    throw error;
  }
}

export async function getFinancialYear() {
  try {
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/Getfinancialyeardata";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, get financial year:", error);
  }
}

/** Get subscription activity lines by account. accountId is hardcoded for now. */
export async function getActivityLines(accountId = "f0983e34-d2c5-ee11-9079-00224827e0df") {
  try {
    const baseUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
    const azureFunctionUrl = `${baseUrl}/getSubscriptionActivityLinesByAccount?accountId=${encodeURIComponent(accountId)}`;
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, get activity lines:", error);
    throw error;
  }
}

/** Check budget by financial year and department. Returns API result (e.g. array). */
export async function checkBudget(financialYearId, departmentId) {
  try {
    const baseUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
    const params = new URLSearchParams({
      financialYearId: financialYearId,
      departmentId: departmentId,
    });
    const azureFunctionUrl = `${baseUrl}/getBudget/check?${params.toString()}`;
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, check budget:", error);
    throw error;
  }
}

/** POST budget payload to addBudget API (department or subscription budget). */
export async function addBudget(payload) {
  try {
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/addBudget";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return result;
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
    const baseUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
    const azureFunctionUrl = `${baseUrl}/updateBudget/${encodeURIComponent(budgetId)}`;
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const { ...body } = payload || {};
    const response = await fetch(azureFunctionUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, update budget:", error);
    throw error;
  }
}

/** Fetch vendor list from getSubscriptionActivities API. Call when opening Add Subscription Manually. */
export async function fetchVendorList(activityId = "f0983e34-d2c5-ee11-9079-00224827e0df") {
  try {
    const baseUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
    const azureFunctionUrl = `${baseUrl}/getSubscriptionActivities/${encodeURIComponent(activityId)}`;
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, fetch vendor list:", error);
    throw error;
  }
}

/** Add subscription  */
export async function addSubscription(formData) {
  try {
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/createSubscriptionActivityLine ";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, add subscription:", error);
    throw error;
  }
}
/** Check if vendor exists for account. POST to checkVendorExists.
 *  URL format: .../api/checkVendorExists?$filter=( _yiic_account_value eq 'accountId' and yiic_vendorname eq 'vendorName')
 */
export async function checkVendorExistance(
  accountId = "f0983e34-d2c5-ee11-9079-00224827e0df",
  vendorName
) {
  try {
    const baseUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
    const safeName = (vendorName ?? "").replace(/'/g, "''");
    const filter = `( _yiic_account_value eq '${accountId}' and yiic_vendorname eq '${safeName}')`;
    const azureFunctionUrl = `${baseUrl}/checkVendorExists?$filter=${encodeURIComponent(filter)}`;
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, check vendor existence:", error);
    throw error;
  }
}

/** Fetch subscription activity by ID. GET from getSubscriptionActivityById/{id}. */
export async function getSubscriptionActivityById(activityId) {
  try {
    const baseUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
    const azureFunctionUrl = `${baseUrl}/getSubscriptionActivityById/${activityId}`;
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Azure Function call failed, get subscription activity by ID:", error);
    throw error;
  }
}

/** Create vendor record. POST to createVendor with body (vendorName, accountManagerEmail, accountManagerName, accountManagerPhone). */
export async function createVendorRecord(body) {
  try {
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/createVendor";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
    const response = await fetch(azureFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();

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
