import API from "../api";

// Contact ID used across all report API calls
const CONTACT_ID = "030ef119-c1c1-ee11-9079-00224827e8f9";

// Get KPI data for reports dashboard
export const getKPIData = async () => {
  const { data } = await API.get("/GetKPIData", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get all subscription data
export const getSubscriptionData = async () => {
  const { data } = await API.get("/GetSubscriptionData", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get financial report data
export const getFinancialReportData = async () => {
  const { data } = await API.get("/GetFinancialReportData", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get department spending data
export const getDepartmentSpending = async () => {
  const { data } = await API.get("/GetDepartmentSpending", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get vendor spending data
export const getVendorSpending = async () => {
  const { data } = await API.get("/GetVendorSpending", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get subscription type data
export const getSubscriptionTypeData = async () => {
  const { data } = await API.get("/GetSubscriptionTypeData", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get budget vs actual data
export const getBudgetVsActualData = async () => {
  const { data } = await API.get("/GetBudgetVsActualData", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get most expensive subscriptions
export const getMostExpensiveSubscriptions = async () => {
  const { data } = await API.get("/GetMostExpensiveSubscriptions", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get usage analysis data
export const getUsageAnalysisData = async () => {
  const { data } = await API.get("/GetUsageAnalysisData", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get category spending data
export const getCategorySpending = async () => {
  const { data } = await API.get("/GetCategorySpending", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get renewal data
export const getRenewalData = async () => {
  const { data } = await API.get("/GetRenewalData", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get expired subscriptions
export const getExpiredSubscriptions = async () => {
  const { data } = await API.get("/GetExpiredSubscriptions", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};

// Get renewal costs and usage evaluation
export const getRenewalCostsData = async () => {
  const { data } = await API.get("/GetRenewalCostsData", {
    params: {
      contactId: CONTACT_ID,
    },
  });
  return data;
};
