import {
  parseFrequency,
  groupByVendorName,
  clearMonthlySubscription,
  filterMonthlySubsinRange,
  removeObjectsWithSameTime,
  generateSimilarRecordsbyYear,
  generateSimilarRecordsbyMonth,
  transformAzureResponseToBlobFormat,
} from "./sharedUtils";
import { useReportsPageStore } from "../../stores";

const getReportFilters = () => useReportsPageStore.getState().filters;
const updateReportFilters = (updates) => useReportsPageStore.getState().setFilters(updates);
let filtersForFinance = {
  startDate: null,
  endDate: null,
  amount1: null,
  amount2: null,
  status: null,
};
let filtersforRenewal = {
  startDate: null,
  endDate: null,
  amount1: null,
  amount2: null,
  status: null,
};
let subscriptionArray = [];
let monthlyRenewal = [];
let monthlySubscription = [];
let SubscriptionJSonBackup = [];
let SubscriptionJSon = [];
let startMonthIndex = 0;
let endMonthIndex = 11;
var startDateForRen = new Date();
var endDateForRen = new Date(startDateForRen.getFullYear(), 11, 31);
let startDateforRenwal = 0;
let endDateforRenewal = 11;
let currentDate = new Date();
var nearingRenewal = [];

export const handleActivityLinesSuccess = (originalData) => {
  // IMPORTANT: Clear all module-level arrays to prevent data duplication on refetch
  // These arrays persist between React Query refetches and would otherwise accumulate data
  subscriptionArray = [];
  monthlyDepartments = [];
  clearMonthlySubscription();

  // Extract lines from response - handle different response structures
  var lines;

  if (originalData && Array.isArray(originalData)) {
    // Response is directly an array
    lines = originalData;
  } else if (originalData.lines && Array.isArray(originalData.lines)) {
    // Azure Function format with "lines" property
    lines = originalData.lines;
  } else if (originalData.ActivityLines && Array.isArray(originalData.ActivityLines)) {
    // Alternative Azure Function format
    lines = originalData.ActivityLines;
  } else if (originalData.value && Array.isArray(originalData.value)) {
    // OData format
    lines = originalData.value;
  } else {
    // Unknown format - try to extract any array property
    const arrayKeys = Object.keys(originalData).filter((key) => Array.isArray(originalData[key]));
    if (arrayKeys.length > 0) {
      lines = originalData[arrayKeys[0]];
    } else {
      console.error("No array found in response. Available keys:", Object.keys(originalData));
      throw new Error("No activity lines array found in response");
    }
  }

  if (!lines || !Array.isArray(lines)) {
    console.error("Lines is not an array:", lines);
    throw new Error("Activity lines data is not in expected array format");
  }

  const transformedLines = transformAzureResponseToBlobFormat(lines);

  const transformedData = groupByVendorName(transformedLines);
  SubscriptionJSonBackup = transformedData;
  countByVendorName(SubscriptionJSonBackup);
  SubscriptionJSon = JSON.parse(JSON.stringify(SubscriptionJSonBackup));
  modifySubscriptionsWithChartLimit(SubscriptionJSon);

  var sortedSubscriptions = modifyRenewalCalendarReport(SubscriptionJSon);
  var categorizedSubscriptions = categorizeSubscriptionsByUrgency(sortedSubscriptions);
  const { setCategorizedSubscriptions } = useReportsPageStore.getState();
  setCategorizedSubscriptions(categorizedSubscriptions);
  modifyRenewalSubscriptionsWithChartLimit(SubscriptionJSon);
  // initializeCalendar(categorizedSubscriptions);
};

function modifySubscriptionsWithChartLimit(SubscriptionJSon) {
  // Remove objects with the same time (assuming this function handles duplicates)
  removeObjectsWithSameTime(SubscriptionJSon);

  // Loop through the SubscriptionJSon array
  SubscriptionJSon.forEach(function (subArray) {
    // Loop through each record in the subArray
    subArray.forEach(function (record) {
      // Check if SubscriptionFrequency exists and is not empty
      if (record.SubscriptionFrequency && record.SubscriptionFrequency.trim() !== "") {
        if (
          record.SubscriptionFrequency.includes("Monthly") ||
          record.SubscriptionFrequency.includes("Months")
        ) {
          generateSimilarRecordsbyMonth(record);
        } else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsbyYear(record);
        }
      }
    });
  });

  // Merge records by month
  mergeRecordsByMonth();

  modifyDepartmentChartLimit(SubscriptionJSon);
  const aggregatedByVendorProfile = aggregateByVendorProfileAndMonth(subscriptionArray);
  const { setVendorProfileAggregation } = useReportsPageStore.getState();
  setVendorProfileAggregation(aggregatedByVendorProfile);
  const mostExpensiveSubscriptions = aggregateSubscriptionsByName(subscriptionArray);
  const { setMostExpensiveAggregations } = useReportsPageStore.getState();
  setMostExpensiveAggregations(mostExpensiveSubscriptions);
  const subsbyCategory = aggregateSubscriptionsByCategory(SubscriptionJSon);
  const { setCategorySummary } = useReportsPageStore.getState();
  setCategorySummary(subsbyCategory);
}

export function mergeRecordsByMonth() {
  // Create an object to store merged records
  let mergedRecords = {};

  subscriptionArray = JSON.parse(
    JSON.stringify(filterMonthlySubsinRange(startMonthIndex, endMonthIndex))
  ); // Filtering subscriptions based on user-selected date range

  // Get current active tab from store (React best practice - no DOM manipulation)
  const { activeSubscriptionTab } = useReportsPageStore.getState();

  // Convert tab name to status for backward compatibility
  // 'active' -> 0, 'expired' -> 1, 'all' -> null
  let status = null;
  if (activeSubscriptionTab === "active") {
    status = 0;
  } else if (activeSubscriptionTab === "expired") {
    status = 1;
  }

  // Merging records into one array based on their similar months
  subscriptionArray.forEach((record) => {
    if (record && record.SubscriptionStartDate) {
      // Extract the month from the SubscriptionStartDate
      const subscriptionDate = new Date(record.SubscriptionStartDate);
      const monthKey = subscriptionDate.getMonth();
      // If the monthKey exists in mergedRecords, accumulate the value
      if (mergedRecords.hasOwnProperty(monthKey)) {
        mergedRecords[monthKey].SubscriptionContractAmount.Value +=
          record.SubscriptionContractAmount.Value;
      } else {
        // Otherwise, create a new entry in mergedRecords with a deep copy
        mergedRecords[monthKey] = JSON.parse(JSON.stringify(record));
      }
    }
  });

  // Convert mergedRecords object back to an array of arrays
  const mergedArray = Object.values(mergedRecords).map((record) => [record]);
  const flattenedArray = mergedArray.flat();

  // Update store with processed data (React best practice)
  setSubscriptionTableDataInStore(status, subscriptionArray);
  setStandardReportCards(subscriptionArray);
  // Pass dynamic month indices for proper chart label generation
  setMonthlySpendChartData(flattenedArray, startMonthIndex, endMonthIndex);
}

export function setStandardReportCards(arraySubs) {
  const { setTopCards } = useReportsPageStore.getState();
  var today = new Date();
  // Filter subscriptions which are not expired
  arraySubs = arraySubs.filter((subscription) => {
    const endDate = new Date(subscription.SubscriptionEndDate);
    return endDate > today;
  });

  var todayForRen = new Date();
  var endOfYear = null;
  const filters = getReportFilters();
  if (filters.startDate == null && filters.endDate == null) {
    endOfYear = new Date(todayForRen.getFullYear(), 11, 31); // December 31st of the current year
  } else {
    todayForRen = new Date(filters.startDate);
    endOfYear = new Date(filters.endDate);
  }

  // Calculate amount for active subscriptions
  const totalContractAmount = arraySubs.reduce((sum, subscription) => {
    return sum + (subscription.SubscriptionContractAmount?.Value || 0);
  }, 0);

  // Calculate the renewal amount
  const totalContractAmountFuture = arraySubs.reduce((sum, subscription) => {
    const startdate = new Date(subscription.SubscriptionStartDate);
    return startdate >= todayForRen && startdate <= endOfYear
      ? sum + (subscription.SubscriptionContractAmount?.Value || 0)
      : sum;
  }, 0);

  // Remove duplicates
  const uniqueSubscriptions = arraySubs.filter((subscription, index, self) => {
    return index === self.findIndex((s) => s.SubscriptionName === subscription.SubscriptionName);
  });
  var ActiveCount = uniqueSubscriptions.length;

  setTopCards({
    totalContractAmount,
    totalContractAmountFuture,
    ActiveCount,
  });

  return { totalContractAmount, totalContractAmountFuture, ActiveCount };
}

/**
 * Computes chart data (labels and values) from MonthlySpend data
 * This is a pure function that returns the data needed for chart rendering
 * @param {Array} MonthlySpend - Array of monthly spend data
 * @param {number} startMonthIndex - Start month index (default: 0 for January)
 * @param {number} endMonthIndex - End month index (default: 11 for December)
 * @returns {{ labels: string[], data: number[] }}
 */
export function computeMonthlySpendChartData(
  MonthlySpend,
  startMonthIndex = 0,
  endMonthIndex = 11
) {
  const currentDate = new Date();
  const labels = [];
  const data = [];

  for (let i = startMonthIndex; i <= endMonthIndex; i++) {
    const adjustedMonthIndex = ((i % 12) + 12) % 12;
    const yDate = new Date(currentDate.getFullYear(), i, 1);
    const year = yDate.getFullYear();

    const month = new Date(year, adjustedMonthIndex, 1);
    labels.push(month.toLocaleString("default", { month: "short", year: "numeric" }));

    const monthData = MonthlySpend.find((item) => {
      const itemDate = new Date(item.SubscriptionStartDate);
      const itemMonth = new Date(itemDate.getFullYear(), itemDate.getMonth(), 1);
      const adjustedMonth = new Date(year, adjustedMonthIndex, 1);
      return itemMonth.getTime() === adjustedMonth.getTime();
    });

    if (monthData) {
      data.push(monthData.SubscriptionContractAmount.Value);
    } else {
      data.push(0);
    }
  }

  return { labels, data };
}

/**
 * Processes MonthlySpend data and updates the store with chart data
 * @param {Array} MonthlySpend - Array of monthly spend data
 * @param {number} startMonthIndex - Start month index (default: 0)
 * @param {number} endMonthIndex - End month index (default: 11)
 */
export function setMonthlySpendChartData(MonthlySpend, startMonthIndex = 0, endMonthIndex = 11) {
  const { setMonthlySpendChartData: setStoreChartData } = useReportsPageStore.getState();
  const chartData = computeMonthlySpendChartData(MonthlySpend, startMonthIndex, endMonthIndex);
  setStoreChartData(chartData);
}

/**
 * Transforms raw subscription data to a normalized format for React table
 * @param {Array} subscriptionArray - Raw subscription data from API
 * @returns {Array} Normalized subscription data for table rendering
 */
function transformSubscriptionDataForTable(subscriptionArray) {
  const today = new Date();

  // Remove duplicates based on SubscriptionName and Amount
  const uniqueSubscriptions = subscriptionArray.filter((subscription, index, self) => {
    return (
      index ===
      self.findIndex(
        (s) =>
          s.SubscriptionName === subscription.SubscriptionName &&
          s.SubscriptionContractAmount?.Value === subscription.SubscriptionContractAmount?.Value
      )
    );
  });

  // Transform to normalized format with activity status
  return uniqueSubscriptions.map((subscription, index) => {
    const endDate = new Date(subscription.SubscriptionEndDate);
    const isActive = endDate > today;

    return {
      id: subscription.id || `sub-${index}-${Date.now()}`,
      subscriptionName: subscription.SubscriptionName || "",
      vendorName: subscription.VendorName || "",
      subscriptionAmount: subscription.SubscriptionContractAmount?.Value || 0,
      startDate: subscription.SubscriptionStartDate || "",
      endDate: subscription.SubscriptionEndDate || "",
      paymentFrequency: subscription.SubscriptionFrequency || "",
      activityStatus: isActive ? "Active" : "Expired",
    };
  });
}

/**
 * Determines which tab should be active based on status
 * @param {number|null} status - 0 for active, 1 for expired, null for all
 * @returns {'all' | 'active' | 'expired'}
 */
function getActiveTabFromStatus(status) {
  if (status === 0) return "active";
  if (status === 1) return "expired";
  return "all";
}

/**
 * Processes subscription data and updates the Zustand store (React best practice)
 * @param {number|null} status - Tab status (0: active, 1: expired, null: all)
 * @param {Array} subscriptionArray - Raw subscription data
 */
function setSubscriptionTableDataInStore(status, subscriptionArray) {
  const { setSubscriptionTableData, setActiveSubscriptionTab } = useReportsPageStore.getState();

  // Transform data to normalized format
  const tableData = transformSubscriptionDataForTable(subscriptionArray);

  // Update store with table data
  setSubscriptionTableData(tableData);

  // Set active tab based on status
  const activeTab = getActiveTabFromStatus(status);
  setActiveSubscriptionTab(activeTab);
}

//Financial Reports
let monthlyDepartments = [];

export function generateSimilarRecordsbyMonthforDepartment(record) {
  var startDate = new Date(record.SubscriptionStartDate);
  var endDate = new Date(record.SubscriptionEndDate);
  var RenewalDate = new Date(record.NextDueDate);
  //  var digit =
  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return [];
  }
  if (startDate.getFullYear() === 1) {
    return [];
  }

  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();
  var tempdate = new Date(startDate);
  var today = new Date();
  var monthDifference = (endYear - startYear) * 12 + (endMonth - startMonth);
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setMonth(endDateForComparison.getMonth() + monthDifference);
  endDateForComparison.setDate(endDate.getDate());
  if (RenewalDate >= startDate && RenewalDate < endDate) {
    while (startDate < endDateForComparison) {
      if (
        startDate.getFullYear() === endDateForComparison.getFullYear() &&
        startDate.getMonth() === endDateForComparison.getMonth()
      ) {
        break; // Exit loop if year and month match
      }

      var subscriptionAmount =
        record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

      var newRecord = {
        SubscriptionStartDate: tempdate, // Convert date to ISO format
        SubscriptionEndDate: record.SubscriptionEndDate,
        ActivityGuid: record.ActivityId,
        SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
        SubscriptionContractAmount: {
          Value: subscriptionAmount,
        },
        SubscriptionName: record.SubscriptionName,
        DepartmentNames: {
          Name: record.DepartmentNames.Name,
          Budget: record.DepartmentNames.Budget?.Value ?? "",
        },
      };

      monthlyDepartments.push(newRecord);

      startDate.setMonth(startDate.getMonth() + frequency);
      tempdate = new Date(startDate);
    }
  }
}

export function generateSimilarRecordsByYearForDepartment(record) {
  var startDate = new Date(record.SubscriptionStartDate);
  var endDate = new Date(record.SubscriptionEndDate);
  var RenewalDate = new Date(record.NextDueDate);
  //  var digit =
  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return [];
  }
  if (startDate.getFullYear() === 1) {
    return [];
  }

  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();
  var tempdate = new Date(startDate);
  var today = new Date();
  var yearDifference = endYear - startYear;
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setFullYear(endDateForComparison.getFullYear() + yearDifference);
  endDateForComparison.setDate(endDate.getDate());
  if (RenewalDate >= startDate && RenewalDate < endDate) {
    while (startDate.getFullYear() < endDateForComparison.getFullYear()) {
      var subscriptionAmount =
        record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

      var newRecord = {
        SubscriptionStartDate: tempdate, // Convert date to ISO format
        SubscriptionEndDate: record.SubscriptionEndDate,
        ActivityGuid: record.ActivityId,
        SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
        SubscriptionContractAmount: {
          Value: subscriptionAmount,
        },
        SubscriptionName: record.SubscriptionName,
        DepartmentNames: {
          Name: record.DepartmentNames.Name,
          Budget: record.DepartmentNames.Budget?.Value ?? "",
        },
      };

      monthlyDepartments.push(newRecord);

      startDate.setFullYear(startDate.getFullYear() + frequency);

      tempdate = new Date(startDate);
    }
  }
}

export function countByVendorName(data) {
  const result = {};

  // Loop through each array (group) of subscriptions
  data.forEach((subscriptions) => {
    // Loop through each subscription in the group
    subscriptions.forEach((subscription) => {
      // Only count if status is 0
      if (subscription.status === 0) {
        // If vendor already exists in the result, increment the count
        if (result[subscription.VendorName]) {
          result[subscription.VendorName]++;
        } else {
          // If vendor does not exist, add it with count 1
          result[subscription.VendorName] = 1;
        }
      }
    });
  });

  // Convert result to array format as requested
  const finalArray = Object.keys(result).map((vendorName) => ({
    vendor: vendorName,
    count: result[vendorName],
  }));
  const { setVendorCountData } = useReportsPageStore.getState();
  setVendorCountData(finalArray);
}

function modifyDepartmentChartLimit(SubscriptionJSon) {
  // Ensure the data is filtered properly
  removeObjectsWithSameTime(SubscriptionJSon);

  SubscriptionJSon.forEach(function (subArray) {
    // Loop through each record in the subArray
    subArray.forEach(function (record) {
      // Process only if SubscriptionFrequency is valid
      if (record.SubscriptionFrequency && record.SubscriptionFrequency.trim() !== "") {
        if (
          record.SubscriptionFrequency.includes("Monthly") ||
          record.SubscriptionFrequency.includes("Months")
        ) {
          generateSimilarRecordsbyMonthforDepartment(record);
        } else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsByYearForDepartment(record);
        }
      }
    });
  });

  mergeRecordsBymonthForDepartment();
  //closePopup("popup_loading");
}

function filterMonthlySubsinRangeForDepartment() {
  const Today = new Date();
  const currentYear = Today.getFullYear();
  var startDateForDep = new Date(currentYear, 0, 1);
  var endDateForDep = new Date(startDateForDep.getFullYear(), 11, 31); // Months are zero-based, so 11 is December

  var tempDepartments = [];

  monthlyDepartments.forEach(function (record, index) {
    var subscriptionstartDate = new Date(record.SubscriptionStartDate);

    if (subscriptionstartDate >= startDateForDep && subscriptionstartDate <= endDateForDep) {
      // Keep the record if the end date is within the specified range
      tempDepartments.push(record);
    }
  });
  monthlyDepartments = tempDepartments;
}

function mergeRecordsBymonthForDepartment() {
  // Create an object to store merged records
  let mergedRecords = {};

  filterMonthlySubsinRangeForDepartment();

  monthlyDepartments.forEach((record) => {
    if (record && record.DepartmentNames.Name) {
      // Extract the month from the SubscriptionnextDate
      const departmentName = record.DepartmentNames.Name; // If the monthKey exists in mergedRecords, accumulate the value
      if (mergedRecords.hasOwnProperty(departmentName)) {
        mergedRecords[departmentName].SubscriptionContractAmount.Value +=
          record.SubscriptionContractAmount.Value;
      } else {
        // Otherwise, create a new entry in mergedRecords
        mergedRecords[departmentName] = { ...record };
      }
    }
  });
  var mergedArray = Object.values(mergedRecords).map((record) => [record]);
  const { setSpendByDepartmentChartData } = useReportsPageStore.getState();
  setSpendByDepartmentChartData(mergedArray);
}

function aggregateByVendorProfileAndMonth(records) {
  // Helper function to get the month name from a date string
  function getMonthName(dateString) {
    const date = new Date(dateString);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[date.getUTCMonth()]; // Using getUTCMonth ensures the correct month index
  }

  // Object to hold aggregated records
  let aggregatedRecords = {};

  // Iterate through the subscription records
  records.forEach((record) => {
    // Destructure necessary values from the record
    const { VendorProfile, SubscriptionContractAmount, SubscriptionStartDate } = record;

    // Check if VendorProfile and SubscriptionContractAmount are valid
    if (
      VendorProfile !== null &&
      VendorProfile !== undefined &&
      SubscriptionContractAmount &&
      SubscriptionStartDate
    ) {
      // Get the month name from the SubscriptionStartDate
      const monthName = getMonthName(SubscriptionStartDate);

      // Create a unique key combining VendorProfile and monthName
      const key = `${VendorProfile}-${monthName}`;

      // Initialize the entry if it doesn't exist
      if (!aggregatedRecords[key]) {
        aggregatedRecords[key] = {
          VendorProfile: VendorProfile,
          SubscriptionContractAmount: { Value: 0 },
          Month: monthName,
        };
      }

      // Accumulate the subscription contract amount
      aggregatedRecords[key].SubscriptionContractAmount.Value += SubscriptionContractAmount.Value;
    }
  });

  // Convert aggregatedRecords object back to an array
  const aggregatedArray = Object.values(aggregatedRecords);

  // Return the aggregated array
  return aggregatedArray;
}

function aggregateSubscriptionsByName(subscriptionArray) {
  let subscriptionAmounts = {};
  subscriptionArray = subscriptionArray.filter((subscription) => subscription.status !== 1);

  // Aggregate amounts by SubscriptionName and SubscriptionContractAmount.Value
  subscriptionArray.forEach((record) => {
    if (
      record &&
      record.SubscriptionName &&
      record.SubscriptionContractAmount &&
      record.SubscriptionContractAmount.Value !== undefined
    ) {
      const name = record.SubscriptionName;
      const amount = record.SubscriptionContractAmount.Value;

      // Create a unique key using both SubscriptionName and SubscriptionContractAmount.Value
      const key = `${name}_${amount}`;

      if (!subscriptionAmounts[key]) {
        subscriptionAmounts[key] = {
          SubscriptionName: name,
          SubscriptionContractAmount: { Value: 0 },
        };
      }
      subscriptionAmounts[key].SubscriptionContractAmount.Value += amount;
    }
  });

  // Convert the aggregated amounts object to an array
  const aggregatedArray = Object.values(subscriptionAmounts);

  // Sort the array by SubscriptionContractAmount in descending order
  aggregatedArray.sort(
    (a, b) => b.SubscriptionContractAmount.Value - a.SubscriptionContractAmount.Value
  );

  // Return the top four subscriptions
  return aggregatedArray.slice(0, 4);
}

function aggregateSubscriptionsByCategory(subscriptions) {
  const Today = new Date();
  const currentYear = Today.getFullYear();
  var startDateForDep = new Date(currentYear, 0, 1);
  var endDateForDep = new Date(startDateForDep.getFullYear(), 11, 31);
  // Step 1: Flatten the array
  const flattened = subscriptions.flat();
  // Filter the subscriptions to return only those with an end date greater than today
  const filtered = flattened.filter((subscription) => {
    const endDate = new Date(subscription.SubscriptionStartDate);
    return endDate >= startDateForDep && endDate <= endDateForDep;
  });

  // Step 2: Create a map to aggregate amounts and count subscriptions
  const categoryMap = {};

  filtered.forEach((subscription) => {
    const categoryName = subscription.SubscriptionCategory?.Name;

    if (categoryName === null) {
      return;
    }

    const amount = subscription.SubscriptionContractAmount.Value;

    // Initialize the category if it doesn't exist
    if (!categoryMap[categoryName]) {
      categoryMap[categoryName] = {
        accumulatedAmount: 0,
        count: 0,
      };
    }

    // Update accumulated amount and count
    categoryMap[categoryName].accumulatedAmount += amount;
    categoryMap[categoryName].count += 1;
  });

  // Step 3: Convert the map to an array
  const result = Object.keys(categoryMap).map((category) => ({
    category: category,
    accumulatedAmount: categoryMap[category].accumulatedAmount,
    count: categoryMap[category].count,
  }));
  const filteredSubscriptions = result.filter((subscription) => {
    const amountValue = subscription.accumulatedAmount;
    const isWithinRange =
      (filtersForFinance.amount1 === null || amountValue >= filtersForFinance.amount1) &&
      (filtersForFinance.amount2 === null || amountValue <= filtersForFinance.amount2);
    return isWithinRange;
  });
  return filteredSubscriptions;
}

function modifyRenewalCalendarReport(subscriptions) {
  // Flatten the array of subscriptions if it's nested
  const flattened = subscriptions.flat();

  // Sort the flattened array by SubscriptionEndDate in ascending order
  const sorted = flattened.sort((a, b) => {
    const dateA = new Date(a.SubscriptionEndDate);
    const dateB = new Date(b.SubscriptionEndDate);
    return dateA - dateB; // Sort in ascending order
  });

  const today = new Date(); // Get the current date

  // Filter the subscriptions to return only those with an end date within the specified range
  const filtered = sorted.filter((subscription) => {
    const endDate = new Date(subscription.SubscriptionEndDate);
    return endDate >= startDateForRen && endDate <= endDateForRen; // Keep subscriptions in the specified date range
  });

  const filteredSubscriptions = filtered.filter((subscription) => {
    if (
      !subscription.SubscriptionContractAmount ||
      subscription.SubscriptionContractAmount.Value == null
    ) {
      return false; // Exclude subscriptions with null or missing SubscriptionContractAmount
    }

    const amountValue = subscription.SubscriptionContractAmount.Value;
    const isWithinRange =
      (filtersforRenewal.amount1 === null || amountValue >= filtersforRenewal.amount1) &&
      (filtersforRenewal.amount2 === null || amountValue <= filtersforRenewal.amount2);

    return isWithinRange;
  });

  return filteredSubscriptions; // Return the filtered subscriptions
}

function categorizeSubscriptionsByUrgency(subscriptions) {
  const today = new Date(startDateForRen); // Get the current date based on the provided start date

  // Create variables for date thresholds: 1 month, 3 months, and 6 months from today
  const oneMonthLater = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const threeMonthsLater = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
  const sixMonthsLater = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());

  // Initialize an object to categorize subscriptions by urgency
  const urgencyCategories = {
    veryUrgent: [], // For subscriptions ending within 1 month
    urgent: [], // For subscriptions ending within 1 to 3 months
    notUrgent: [], // For subscriptions ending within 3 to 6 months
  };

  // Iterate through each subscription and categorize them based on their end date
  subscriptions.forEach((subscription) => {
    const endDate = new Date(subscription.SubscriptionEndDate); // Get the end date of the subscription

    // Categorize based on the defined urgency thresholds
    if (endDate <= oneMonthLater) {
      urgencyCategories.veryUrgent.push(subscription); // Very urgent subscriptions
    } else if (endDate <= threeMonthsLater) {
      urgencyCategories.urgent.push(subscription); // Urgent subscriptions
    } else if (endDate <= sixMonthsLater) {
      urgencyCategories.notUrgent.push(subscription); // Not urgent subscriptions
    }
  });

  return urgencyCategories; // Return the categorized subscriptions
}

function modifyRenewalSubscriptionsWithChartLimit(SubscriptionJSon) {
  // Remove duplicate objects based on their time properties
  removeObjectsWithSameTime(SubscriptionJSon);

  // Iterate through each subscription array in SubscriptionJSon
  SubscriptionJSon.forEach(function (subArray) {
    // Loop through each record in the subArray
    subArray.forEach(function (record) {
      // Process only if SubscriptionFrequency is valid and not empty
      if (record.SubscriptionFrequency && record.SubscriptionFrequency.trim() !== "") {
        // Check if the subscription frequency is monthly or contains 'Months'
        if (
          record.SubscriptionFrequency.includes("Monthly") ||
          record.SubscriptionFrequency.includes("Months")
        ) {
          // Generate similar records for monthly renewals
          generateSimilarRecordsbyMonthforRenewal(record);
        }
        // Check if the subscription frequency is yearly or contains 'Years'
        else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          // Generate similar records for yearly renewals
          generateSimilarRecordsbyYearforRenewal(record);
        }
      }
    });
  });

  // Merge all records by month for renewal processing
  mergeRecordsByMonthforRenewal();
  // Close the loading popup after processing is complete
  // closePopup("popup_loading");
}

function generateSimilarRecordsbyMonthforRenewal(record) {
  // Parse the subscription end and start dates
  var endDate = new Date(record.SubscriptionEndDate);
  var startDate = new Date(record.SubscriptionStartDate);

  // Parse the subscription frequency to get the number of months
  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if the frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return []; // Return an empty array if frequency is invalid
  }

  // Check for an unrealistic year value (e.g., year 1)
  if (startDate.getFullYear() === 1) {
    return []; // Return an empty array if the start year is not valid
  }

  // Initialize year and month variables for calculations
  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();

  // Calculate the total month difference between start and end dates
  var monthDifference = (endYear - startYear) * 12 + (endMonth - startMonth);

  // Create temporary date objects for looping
  var tempDate = new Date(startDate);
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setMonth(endDateForComparison.getMonth() + monthDifference);
  endDateForComparison.setDate(endDate.getDate());

  // Loop from startDate to endDate with frequency as the increment
  while (startDate <= endDateForComparison) {
    // Exit loop if year and month match the end comparison date
    if (
      startDate.getFullYear() === endDateForComparison.getFullYear() &&
      startDate.getMonth() === endDateForComparison.getMonth()
    ) {
      break; // Exit loop if year and month match
    }

    // Get the subscription amount, defaulting to 0 if null
    var subscriptionAmount =
      record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

    // Create a new record for the monthly renewal
    var newRecord = {
      SubscriptionStartDate: tempDate,
      status: record.status, // Retain the original status
      VendorProfile: record.VendorProfile,
      ActivityGuid: record.ActivityId,
      // "ReminderInterval": record.reminderInterval,
      VendorName: record.VendorName,
      SubscriptionEndDate: record.SubscriptionEndDate,
      SubscriptionFrequency: record.SubscriptionFrequency, // Retain the original frequency
      SubscriptionContractAmount: {
        Value: subscriptionAmount,
      },
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: {
        Name: record.DepartmentNames.Name,
      },
    };

    // Push the new record into the monthlyRenewal array
    monthlyRenewal.push(newRecord);

    // Increment the start date by the frequency
    startDate.setMonth(startDate.getMonth() + frequency);
    tempDate = new Date(startDate); // Update the temporary date
  }
}

function generateSimilarRecordsbyYearforRenewal(record) {
  // Parse the subscription end and start dates
  var endDate = new Date(record.SubscriptionEndDate);
  var startDate = new Date(record.SubscriptionStartDate);

  // Parse the subscription frequency to determine the increment in years
  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if the frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return []; // Return an empty array if frequency is invalid
  }

  // Check for an unrealistic year value (e.g., year 1)
  if (startDate.getFullYear() === 1) {
    return []; // Return an empty array if the start year is not valid
  }

  // Initialize year variables for calculations
  var startYear = startDate.getFullYear();
  var endYear = endDate.getFullYear();
  var yearDifference = endYear - startYear;

  // Create a comparison date by adding the year difference to the start date
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setFullYear(endDateForComparison.getFullYear() + yearDifference);
  endDateForComparison.setDate(endDate.getDate()); // Set to the same day of the month

  // Initialize a temporary date for generating new records
  var tempDate = new Date(startDate);

  // Loop from startDate to endDate with frequency as the increment
  while (startDate.getFullYear() < endDateForComparison.getFullYear()) {
    // Get the subscription amount, defaulting to 0 if null
    var subscriptionAmount =
      record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

    // Create a new record for the yearly renewal
    var newRecord = {
      SubscriptionStartDate: tempDate, // Keep the original start date
      VendorName: record.VendorName,
      status: record.status, // Retain the original status
      VendorProfile: record.VendorProfile,
      ActivityGuid: record.ActivityId,
      // "ReminderInterval": record.reminderInterval,
      SubscriptionEndDate: record.SubscriptionEndDate,
      SubscriptionFrequency: record.SubscriptionFrequency, // Retain the original frequency
      SubscriptionContractAmount: {
        Value: subscriptionAmount,
      },
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: {
        Name: record.DepartmentNames.Name,
      },
    };

    // Push the new record into the monthlyRenewal array
    monthlyRenewal.push(newRecord);

    // Increment the start date by the frequency (in years)
    startDate.setFullYear(startDate.getFullYear() + frequency);

    // Update the temporary date to match the new start date
    tempDate = new Date(startDate);
  }
}

function mergeRecordsByMonthforRenewal() {
  // Filter monthly subscriptions within a specific range for renewal
  filterMonthlySubsinRangeForRenewal();

  // Create a deep copy of the monthlyRenewal array for nearing renewal processing
  nearingRenewal = JSON.parse(JSON.stringify(monthlyRenewal));

  // Set the nearing renewal subscriptions in the corresponding table
  setSubscriptionNearingRenTable(nearingRenewal);

  fillExpiredSubscriptionsTable(nearingRenewal);
}

function filterMonthlySubsinRangeForRenewal() {
  // Define the start and end dates for filtering monthly subscriptions
  const startDate = new Date(currentDate.getFullYear(), startDateforRenwal, 1); // Start date: January 1st of the current year
  const endDate = new Date(currentDate.getFullYear(), endDateforRenewal + 1, 0); // End date: December 31st of the current year

  // Temporary array to hold filtered monthly subscriptions
  var tempMonthly = [];

  // Iterate through each record in the monthlyRenewal array
  monthlyRenewal.forEach(function (record) {
    var subscriptionStartDate = new Date(record.SubscriptionStartDate); // Convert subscription start date to Date object

    // Check if the subscription start date is within the specified range
    if (subscriptionStartDate >= startDate && subscriptionStartDate <= endDate) {
      // Keep the record if the date is within the specified range
      tempMonthly.push(record);
    }
  });

  // Update the monthlyRenewal array to only include the filtered records
  monthlyRenewal = tempMonthly;
}

function deepCopyArray(array) {
  return JSON.parse(JSON.stringify(array));
}

function setSubscriptionNearingRenTable(subscriptions) {
  // Create a deep copy of the subscriptions data to avoid mutating the original
  let subscriptionData = deepCopyArray(subscriptions);

  var today = new Date(); // Get the current date

  // Filter out subscriptions that have already ended
  subscriptionData = subscriptionData.filter((subscription) => {
    const endDate = new Date(subscription.SubscriptionEndDate);
    return endDate > today; // Keep only future subscriptions
  });

  var todayForRen = new Date();
  var endOfYear = null;

  // Determine the date range for filtering renewals
  if (filtersforRenewal.startDate == null && filtersforRenewal.endDate == null) {
    endOfYear = new Date(todayForRen.getFullYear(), 11, 31); // Default to December 31st of the current year
  } else {
    todayForRen = new Date(filtersforRenewal.startDate);
    endOfYear = new Date(filtersforRenewal.endDate); // Set end of year based on filter
  }

  // Filter subscriptions to keep those starting within the specified range
  subscriptionData = subscriptionData.filter((subscription) => {
    const startdate = new Date(subscription.SubscriptionStartDate);
    return startdate > todayForRen && startdate <= endOfYear; // Keep subscriptions starting after today and before the end date
  });

  // Remove duplicate subscriptions based on SubscriptionName and SubscriptionContractAmount
  subscriptionData = subscriptionData.filter((subscription, index, self) => {
    return (
      index ===
      self.findIndex(
        (s) =>
          s.SubscriptionName === subscription.SubscriptionName &&
          s.SubscriptionContractAmount.Value === subscription.SubscriptionContractAmount.Value
      )
    );
  });

  const { setNearingRenewalData } = useReportsPageStore.getState();
  setNearingRenewalData(subscriptionData);
}

function fillExpiredSubscriptionsTable(subscriptions) {
  // Create a deep copy of the subscriptions array to avoid modifying the original data
  let expiredSubscriptions = deepCopyArray(subscriptions);

  // Remove duplicate subscriptions based on SubscriptionName and SubscriptionContractAmount
  expiredSubscriptions = expiredSubscriptions.filter((subscription, index, self) => {
    return (
      index ===
      self.findIndex(
        (s) =>
          s.SubscriptionName === subscription.SubscriptionName &&
          s.SubscriptionContractAmount.Value === subscription.SubscriptionContractAmount.Value
      )
    );
  });

  const today = new Date(); // Get the current date

  // Filter subscriptions to keep only those that are expired
  expiredSubscriptions = expiredSubscriptions.filter((subscription) => {
    return new Date(subscription.SubscriptionEndDate) <= today;
  });

  // Further filter subscriptions based on the specified amount range
  const filteredSubscriptions = expiredSubscriptions.filter((subscription) => {
    const amountValue = subscription.SubscriptionContractAmount.Value;
    const isWithinRange =
      (filtersforRenewal.amount1 === null || amountValue >= filtersforRenewal.amount1) &&
      (filtersforRenewal.amount2 === null || amountValue <= filtersforRenewal.amount2);
    return isWithinRange;
  });
  const { setExpiredSubscriptionsData } = useReportsPageStore.getState();
  setExpiredSubscriptionsData(filteredSubscriptions);
}

export function applyFilters() {
  // Get selected range values (amount1 and Amount2) from user
  const filters = getReportFilters();
  var minRangeInput = filters.amount1;
  var maxRangeInput = filters.amount2;
  const filterUpdates = {};
  if (minRangeInput && maxRangeInput) {
    filterUpdates.amount1 = minRangeInput || null; // Set amount1
    filterUpdates.amount2 = maxRangeInput || null; // Set amount2
  }
  // Get date range (StartDate and EndDate) - these are already strings in "YYYY-MM-DD" format
  const startDateValue = filters.startDate;
  const endDateValue = filters.endDate;

  if (startDateValue && endDateValue) {
    // Dates are already in correct format from the store, use them directly
    filterUpdates.startDate = startDateValue;
    filterUpdates.endDate = endDateValue;
    setUserValuesForStand(startDateValue, endDateValue);
  } else {
    startMonthIndex = 0;
    endMonthIndex = 11;
    filterUpdates.startDate = null;
    filterUpdates.endDate = null;
    // Re-render charts with default date range when filters are cleared
    handleFilteredCharts();
  }
}

/**
 * Clears all filters and re-processes data with default values
 * This resets the charts to show full year data without re-fetching from API
 */
export function clearFilters() {
  // Reset filters in store
  updateReportFilters({
    startDate: null,
    endDate: null,
    amount1: null,
    amount2: null,
    status: null,
  });

  // Reset month indices to full year
  startMonthIndex = 0;
  endMonthIndex = 11;

  // Re-process data with default filters
  handleFilteredCharts();
}

function setUserValuesForStand(StartDate, EndDate) {
  var currentYear = new Date().getFullYear();

  // Check and parse StartDate
  if (StartDate) {
    var startDate = new Date(StartDate);
    var startMonth = startDate.getMonth(); // Month index (0-11)

    if (startDate.getFullYear() === currentYear) {
      startMonthIndex = startMonth; // Current year, normal index
    } else if (startDate.getFullYear() < currentYear) {
      startMonthIndex = startMonth - 12; // Previous years, negative index
    } else {
      startMonthIndex = startMonth + 12; // Future years, positive index
    }
  }

  // Check and parse EndDate
  if (EndDate) {
    var endDate = new Date(EndDate);
    var endMonth = endDate.getMonth(); // Month index (0-11)

    if (endDate.getFullYear() === currentYear) {
      endMonthIndex = endMonth; // Current year, normal index
    } else if (endDate.getFullYear() < currentYear) {
      endMonthIndex = endMonth - 12; // Previous years, negative index
    } else {
      endMonthIndex = endMonth + 12; // Future years, positive index
    }
  }

  // getMonthlySpendApi(); //change this to handleActivityLinesSuccess
  handleFilteredCharts();
}

function handleFilteredCharts() {
  SubscriptionJSon = JSON.parse(JSON.stringify(SubscriptionJSonBackup));

  // IMPORTANT: Use clearMonthlySubscription() to clear the array in sharedUtils.js
  // The local monthlySubscription variable in this file is NOT the one used by generateSimilarRecordsbyMonth
  clearMonthlySubscription();
  monthlyDepartments = [];
  monthlyRenewal = [];
  nearingRenewal = [];
  modifySubscriptionsWithChartLimit(SubscriptionJSon);
  modifyDepartmentChartLimit(SubscriptionJSon);
  modifyRenewalSubscriptionsWithChartLimit(SubscriptionJSon);
  var sortedSubscriptions = modifyRenewalCalendarReport(SubscriptionJSon);
  var categorizedSubscriptions = categorizeSubscriptionsByUrgency(sortedSubscriptions);
  const { setCategorizedSubscriptions } = useReportsPageStore.getState();
  setCategorizedSubscriptions(categorizedSubscriptions);
}
