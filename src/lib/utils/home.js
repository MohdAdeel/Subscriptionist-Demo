import { useHomeStore } from "../../stores/HomeStore";

var SubscriptionJSonBackup = [];
var SubscriptionJSon = [];
var monthlySubscription = [];
var renewalArray = [];
var currentDate = new Date();
var startMonthIndex = 0;
var endMonthIndex = 11;
var monthlyDepartments = [];
var startDateforDep = new Date(currentDate.getFullYear(), startMonthIndex, 1);
var endDatefordep = new Date(currentDate.getFullYear(), endMonthIndex + 1, 0);
var BugetDeprartment = [];
var vendorProfileCounts = [];
var vendorProfileMap = {
  0: "Strategic",
  1: "Tactical",
  2: "Operational",
};
var monthlyrenewal = [];

var startDateforRenwal = new Date();
startDateforRenwal.setDate(1);
var endDateforRenewal = new Date(new Date().setMonth(new Date().getMonth() + 6));
endDateforRenewal.setDate(0);

const API_KEY = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
const BUDGETS_API_URL =
  "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/getBudgets";
const currentYear = currentDate.getFullYear();
let startDateForBudget = new Date(currentYear, 0, 1);
let endDateForBudget = new Date(currentYear, 11, 31);

function resetHomeProcessingState() {
  SubscriptionJSonBackup = [];
  SubscriptionJSon = [];
  monthlySubscription = [];
  renewalArray = [];
  monthlyDepartments = [];
  BugetDeprartment = [];
  vendorProfileCounts = [];
  monthlyrenewal = [];

  currentDate = new Date();
  startDateforDep = new Date(currentDate.getFullYear(), startMonthIndex, 1);
  endDatefordep = new Date(currentDate.getFullYear(), endMonthIndex + 1, 0);
  const year = currentDate.getFullYear();
  startDateForBudget = new Date(year, 0, 1);
  endDateForBudget = new Date(year, 11, 31);
}
/**
 * Process activity lines data for the Home page.
 * Call this when on Home and data is available (e.g. from useActivityLines().data).
 */
export function handleDataProcessing(originalData) {
  if (!originalData) {
    console.warn("[Home] No data to process");
    return;
  }

  resetHomeProcessingState();

  const lines = Array.isArray(originalData)
    ? originalData
    : Array.isArray(originalData.lines)
      ? originalData.lines
      : Array.isArray(originalData.ActivityLines)
        ? originalData.ActivityLines
        : Array.isArray(originalData.value)
          ? originalData.value
          : [];

  const transformedData = groupByVendorName(lines);

  SubscriptionJSonBackup = transformedData;
  SubscriptionJSon = JSON.parse(JSON.stringify(SubscriptionJSonBackup));

  filterSubscriptionsByCurrentYear(SubscriptionJSon);
  countByVendorName(SubscriptionJSon);
  ModifySubscriptionsWithchartLimit();
  const renewalResult = calculateSubscriptionAmount("4");
  const { setRenewalTimelineCards } = useHomeStore.getState();
  setRenewalTimelineCards(renewalResult.upcomingRenewalAmount, renewalResult.renewalTimelineCount);
  ModifyBudgetChartLimit();
  ModifyDepartmentchartLimit();
  ModifyRenewalSubscriptionsWithchartLimit();
  countConcludedSubscriptions(SubscriptionJSon);
}

function ModifySubscriptionsWithchartLimit() {
  // Remove duplicate objects based on their time properties
  removeObjectsWithSameTime(SubscriptionJSon);

  // Iterate through each subscription array in SubscriptionJSon
  SubscriptionJSon.forEach(function (subArray) {
    // Loop through each record in the subArray
    subArray.forEach(function (record) {
      // Process only if SubscriptionFrequency is valid and not empty
      if (record.SubscriptionFrequency && record.SubscriptionFrequency.trim() !== "") {
        // generateSimilarRecordsbyYear(record);
        // Check if the subscription frequency is monthly or contains 'Months'
        if (
          record.SubscriptionFrequency.includes("Monthly") ||
          record.SubscriptionFrequency.includes("Months")
        ) {
          generateSimilarRecordsbyMonth(record);
        }
        // Check if the subscription frequency is yearly or contains 'Years'
        else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsbyYear(record);
        }
      }
    });
  });

  renewalArray = JSON.parse(JSON.stringify(monthlySubscription));
  setActiveCards(renewalArray);

  // Merge all records by month
  mergeRecordsByMonth();
}

function setActiveCards(arraySubs) {
  var today = new Date();
  var currentDate = new Date();

  // Define start and end dates for the specified range within the current year
  const startMonthIndex = 0; // Set the desired start month index (0 = January)
  const endMonthIndex = 11; // Set the desired end month index (11 = December)
  const startDate = new Date(currentDate.getFullYear(), startMonthIndex, 1);
  const endDate = new Date(currentDate.getFullYear(), endMonthIndex + 1, 0); // Last day of the end month

  // Filter subscriptions within the specified date range
  var tempMonthly = [];
  arraySubs.forEach(function (record) {
    var subscriptionStartDate = new Date(record.SubscriptionStartDate);
    if (subscriptionStartDate >= startDate && subscriptionStartDate <= endDate) {
      tempMonthly.push(record);
    }
  });

  // Update arraySubs to include only the filtered records within the date range
  arraySubs = tempMonthly;

  // Filter subscriptions which are not expired
  arraySubs = arraySubs.filter((subscription) => {
    const endDate = new Date(subscription.SubscriptionEndDate);
    return endDate > today;
  });

  // Calculate amount for active subscriptions
  const totalContractAmount = arraySubs.reduce((sum, subscription) => {
    return sum + (subscription.SubscriptionContractAmount?.Value || 0);
  }, 0);

  // Remove duplicates using multiple fields
  const uniqueSubscriptions = arraySubs.filter((subscription, index, self) => {
    return (
      index ===
      self.findIndex(
        (s) =>
          s.SubscriptionName === subscription.SubscriptionName &&
          s.VendorName === subscription.VendorName &&
          s.SubscriptionFrequency === subscription.SubscriptionFrequency &&
          (s.SubscriptionContractAmount?.Value || 0) ===
            (subscription.SubscriptionContractAmount?.Value || 0) &&
          (s.DepartmentNames?.Name || "") === (subscription.DepartmentNames?.Name || "")
      )
    );
  });

  var ActiveCount = uniqueSubscriptions.length;

  const { setFirstTwoCards } = useHomeStore.getState();
  setFirstTwoCards(ActiveCount, totalContractAmount);
}

function generateSimilarRecordsbyMonth(record) {
  var endDate = new Date(record.SubscriptionEndDate);
  var startDate = new Date(record.SubscriptionStartDate);

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
  var monthDifference = (endYear - startYear) * 12 + (endMonth - startMonth);

  var tempdate = new Date(startDate);
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setMonth(endDateForComparison.getMonth() + monthDifference);
  endDateForComparison.setDate(endDate.getDate());
  // Loop from startDate to endDate with frequency as the increment
  while (startDate <= endDateForComparison) {
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
      SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
      SubscriptionContractAmount: {
        Value: subscriptionAmount,
      },
      VendorName: record.VendorName,
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: {
        Name: record.DepartmentNames.Name,
      },
    };

    monthlySubscription.push(newRecord);

    startDate.setMonth(startDate.getMonth() + frequency);
    tempdate = new Date(startDate);
  }
}

function generateSimilarRecordsbyYear(record) {
  var LastDueDate = new Date(record.LastDueDate);
  var NextDueeDate = new Date(record.NextDueDate);
  var endDate = new Date(record.SubscriptionEndDate);
  var startDate = new Date(record.SubscriptionStartDate);

  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return [];
  }

  if (startDate.getFullYear() === 1) {
    return [];
  }

  var currentdate = new Date();
  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();
  var yearDifference = endYear - startYear;

  var endDateForComparison = new Date(startDate);
  endDateForComparison.setFullYear(endDateForComparison.getFullYear() + yearDifference);
  endDateForComparison.setDate(endDate.getDate());
  var tempdate = new Date(startDate);

  // Loop from startDate to endDate with frequency as the increment
  while (startDate.getFullYear() < endDateForComparison.getFullYear()) {
    var subscriptionAmount =
      record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

    var newRecord = {
      SubscriptionStartDate: tempdate, // Convert date to ISO format
      SubscriptionEndDate: record.SubscriptionEndDate,
      SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
      SubscriptionContractAmount: {
        Value: subscriptionAmount,
      },
      VendorName: record.VendorName,
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: {
        Name: record.DepartmentNames.Name,
      },
    };

    monthlySubscription.push(newRecord);
    startDate.setFullYear(startDate.getFullYear() + frequency);

    tempdate = new Date(startDate);
  }
}

/**
 * Maps timeline option (1–4) to number of months.
 * 1 = 1 month, 2 = 3 months, 3 = 6 months, 4 = 12 months.
 */
function getMonthsFromTimelineValue(value) {
  const numericValue = parseInt(value, 10);
  switch (numericValue) {
    case 1:
      return 1;
    case 2:
      return 3;
    case 3:
      return 6;
    case 4:
      return 12;
    default:
      return 12;
  }
}

/**
 * Calculates upcoming renewal amount and count for a given timeline.
 * Pure function: no DOM access, no side effects. Use the returned values in React state/UI.
 *
 * @param {string|number} value - Timeline option: 1 (1 month), 2 (3 months), 3 (6 months), 4 (12 months)
 * @param {Array} renewalData - List of subscription records (defaults to module-level renewalArray if omitted)
 * @returns {{ upcomingRenewalAmount: number, renewalTimelineCount: number }}
 */
export function calculateSubscriptionAmount(value, renewalData = renewalArray) {
  const months = getMonthsFromTimelineValue(value);
  const today = new Date();
  const endDate = new Date(today);
  endDate.setMonth(today.getMonth() + months);

  const data = Array.isArray(renewalData) ? renewalData : [];
  const upcomingRenewals = data.filter((subscription) => {
    const subEndDate = new Date(subscription.SubscriptionEndDate);
    return subEndDate > today;
  });

  let totalContractAmountFuture = 0;
  let subscriptionCount = 0;

  upcomingRenewals.forEach((subscription) => {
    const startDate = new Date(subscription.SubscriptionStartDate);
    if (startDate >= today && startDate <= endDate) {
      totalContractAmountFuture += subscription.SubscriptionContractAmount?.Value || 0;
      subscriptionCount += 1;
    }
  });

  return {
    upcomingRenewalAmount: totalContractAmountFuture,
    renewalTimelineCount: subscriptionCount,
  };
}

function countConcludedSubscriptions(data) {
  const today = new Date();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(today.getFullYear() - 1);

  let expiredCount = 0;

  // Iterate through the data
  data.forEach((subscriptions) => {
    subscriptions.forEach((subscription) => {
      const endDate = new Date(subscription.SubscriptionEndDate);
      // Check if the SubscriptionEndDate is less than today and within the last 12 months
      if (endDate < today && endDate >= twelveMonthsAgo) {
        expiredCount++;
      }
    });
  });
  const { setRecentlyConcluded } = useHomeStore.getState();
  setRecentlyConcluded(expiredCount);
}

function countByVendorName(data) {
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

  const { setVendorDoughnutChartData } = useHomeStore.getState();
  setVendorDoughnutChartData(finalArray);
}

function mergeRecordsByMonth() {
  // Create an object to store merged records

  let mergedRecords = {};
  filtermonthlysubsinRange();

  monthlySubscription.forEach((record) => {
    if (record && record.SubscriptionStartDate) {
      // Extract the month from the SubscriptionnextDate
      const monthKey = record.SubscriptionStartDate.getMonth();
      // If the monthKey exists in mergedRecords, accumulate the value
      if (mergedRecords.hasOwnProperty(monthKey)) {
        mergedRecords[monthKey].SubscriptionContractAmount.Value +=
          record.SubscriptionContractAmount.Value;
      } else {
        // Otherwise, create a new entry in mergedRecords
        mergedRecords[monthKey] = { ...record };
      }
    }
  });

  // Convert mergedRecords object back to an array of arrays
  const mergedArray = Object.values(mergedRecords).map((record) => [record]);
  const flattenedArray = mergedArray.flat();

  const { setMonthlySpendChartData } = useHomeStore.getState();
  setMonthlySpendChartData(flattenedArray);
}

function ModifyBudgetChartLimit() {
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
          generateSimilarRecordsbyMonthforDepartmentforBudget(record);
        }
        // Check if the subscription frequency is yearly or contains 'Years'
        else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsbyYearfordepartmentforBudget(record);
        }
      }
    });
  });

  mergeRecordsForBudget();
}

function generateSimilarRecordsbyMonthforDepartmentforBudget(record) {
  var startDate = new Date(record.SubscriptionStartDate);
  var endDate = new Date(record.SubscriptionEndDate);
  var renewalDate = new Date(record.NextDueDate);
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
  if (renewalDate >= startDate && renewalDate < endDate) {
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
        SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
        SubscriptionContractAmount: {
          Value: subscriptionAmount,
        },
        VendorName: record.VendorName,
        SubscriptionName: record.SubscriptionName,
        DepartmentNames: {
          Name: record.DepartmentNames.Name,
        },
      };

      BugetDeprartment.push(newRecord);

      startDate.setMonth(startDate.getMonth() + frequency);
      tempdate = new Date(startDate);
    }
  }
}

function generateSimilarRecordsbyYearfordepartmentforBudget(record) {
  var startDate = new Date(record.SubscriptionStartDate);
  var endDate = new Date(record.SubscriptionEndDate);
  var renewalDate = new Date(record.NextDueDate);
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
  if (renewalDate >= startDate && renewalDate < endDate) {
    while (startDate.getFullYear() < endDateForComparison.getFullYear()) {
      var subscriptionAmount =
        record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

      var newRecord = {
        SubscriptionStartDate: tempdate, // Convert date to ISO format
        SubscriptionEndDate: record.SubscriptionEndDate,
        SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
        SubscriptionContractAmount: {
          Value: subscriptionAmount,
        },
        VendorName: record.VendorName,
        SubscriptionName: record.SubscriptionName,
        DepartmentNames: {
          Name: record.DepartmentNames.Name,
        },
      };

      BugetDeprartment.push(newRecord);

      startDate.setFullYear(startDate.getFullYear() + frequency);

      tempdate = new Date(startDate);
    }
  }
}

function mergeRecordsForBudget() {
  // Create an object to store merged records

  let mergedRecords = {};

  filterForBudgetDepartment();
  BugetDeprartment.forEach((record) => {
    if (record && record.DepartmentNames.Name) {
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
  const mergedArray = Object.values(mergedRecords).map((record) => [record]);
  retrieveBudget(mergedArray);

  //updateDepartmentChart(mergedArray);
}

async function retrieveBudget(mergedArray) {
  const toYearNumber = (value) => {
    if (value == null) return null;
    if (typeof value === "number") return value;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getBudgetYear = (record) =>
    toYearNumber(
      record?.financialYear ??
        record?.FinancialYear ??
        record?.financialYearName ??
        record?.FinancialYearName ??
        record?.year ??
        record?.Year ??
        record?.["_yiic_financialyear_value@OData.Community.Display.V1.FormattedValue"]
    );

  const getDepartmentName = (record) =>
    record?.departmentName ??
    record?.DepartmentName ??
    record?.department ??
    record?.Department ??
    record?.DepartmentNames?.Name ??
    record?.["_yiic_department_value@OData.Community.Display.V1.FormattedValue"];

  const getBudgetAmount = (record) =>
    record?.budgetAmount ??
    record?.BudgetAmount ??
    record?.amount ??
    record?.Amount ??
    record?.yiic_amount ??
    record?.BudgetAmount?.Value ??
    record?.budgetAmount?.Value ??
    0;

  try {
    const response = await fetch(BUDGETS_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Budget fetch failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json().catch(() => ({}));
    const records = Array.isArray(data?.value)
      ? data.value
      : Array.isArray(data?.DepartmentBudget)
        ? data.DepartmentBudget
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

    const targetYear = startDateForBudget.getFullYear();
    const filteredRecords = records.filter((record) => getBudgetYear(record) === targetYear);

    const updatedMergedArray = mergedArray.map((entry) => {
      const item = entry[0];
      const deptName = item.DepartmentNames?.Name;
      const matchingBudget = filteredRecords.find(
        (record) => getDepartmentName(record) === deptName
      );

      item.BudgetAmount = { Value: Number(getBudgetAmount(matchingBudget)) || 0 };
      return [item];
    });
    const { setActualVsBudgetData } = useHomeStore.getState();
    setActualVsBudgetData(updatedMergedArray);
  } catch (error) {
    console.error("Budget fetch failed:", error);
  }
}

function filterForBudgetDepartment() {
  const Today = new Date();

  var tempdepartments = [];

  BugetDeprartment.forEach(function (record, index) {
    var subscriptionstartDate = new Date(record.SubscriptionStartDate);

    if (subscriptionstartDate >= startDateForBudget && subscriptionstartDate <= endDateForBudget) {
      // Keep the record if the end date is within the specified range
      tempdepartments.push(record);
    }
  });
  BugetDeprartment = tempdepartments;
}

function parseFrequency(frequencyString) {
  // Extract digits from the frequencyString using a regular expression
  const digits = parseInt(frequencyString.match(/\d+/)[0]);
  return digits;
}

function filtermonthlysubsinRange() {
  const startDate = new Date(currentDate.getFullYear(), startMonthIndex, 1);
  const endDate = new Date(currentDate.getFullYear(), endMonthIndex + 1, 0); // Set end date to last day of end month
  var tempMonthly = [];

  monthlySubscription.forEach(function (record) {
    var subscriptionstartDate = new Date(record.SubscriptionStartDate);

    if (subscriptionstartDate >= startDate && subscriptionstartDate <= endDate) {
      // Keep the record if the date is within the specified range
      tempMonthly.push(record);
    }
  });

  monthlySubscription = tempMonthly;
}

function ModifyDepartmentchartLimit() {
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
          generateSimilarRecordsbyMonthforDepartment(record);
        }
        // Check if the subscription frequency is yearly or contains 'Years'
        else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsbyYearfordepartment(record);
        }
      }
    });
  });

  // Merge all records by month for department processing
  mergeRecordsBymonthForDepartment();
}

function generateSimilarRecordsbyYearfordepartment(record) {
  var startDate = new Date(record.SubscriptionStartDate);
  var endDate = new Date(record.SubscriptionEndDate);
  var renewalDate = new Date(record.NextDueDate);
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
  if (renewalDate >= startDate && renewalDate < endDate) {
    while (startDate.getFullYear() < endDateForComparison.getFullYear()) {
      var subscriptionAmount =
        record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

      var newRecord = {
        SubscriptionStartDate: tempdate, // Convert date to ISO format
        SubscriptionEndDate: record.SubscriptionEndDate,
        SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
        SubscriptionContractAmount: {
          Value: subscriptionAmount,
        },
        VendorName: record.VendorName,
        SubscriptionName: record.SubscriptionName,
        DepartmentNames: {
          Name: record.DepartmentNames.Name,
        },
      };

      monthlyDepartments.push(newRecord);

      startDate.setFullYear(startDate.getFullYear() + frequency);

      tempdate = new Date(startDate);
    }
  }
}

function mergeRecordsBymonthForDepartment() {
  let mergedRecords = {};

  monthlyDepartments.forEach((record) => {
    if (record && record.DepartmentNames.Name) {
      const departmentName = record.DepartmentNames.Name;
      const recordDate = new Date(record.SubscriptionStartDate);
      if (Number.isNaN(recordDate.getTime())) return;
      const year = recordDate.getFullYear();
      const recordKey = `${departmentName}-${year}`;
      if (mergedRecords.hasOwnProperty(recordKey)) {
        mergedRecords[recordKey].SubscriptionContractAmount.Value +=
          record.SubscriptionContractAmount.Value;
      } else {
        // Otherwise, create a new entry in mergedRecords
        mergedRecords[recordKey] = { ...record };
      }
    }
  });
  const mergedArray = Object.values(mergedRecords).map((record) => [record]);
  const { setDepartmentSpendChartData } = useHomeStore.getState();
  setDepartmentSpendChartData(mergedArray);
}

function generateSimilarRecordsbyMonthforDepartment(record) {
  var startDate = new Date(record.SubscriptionStartDate);
  var endDate = new Date(record.SubscriptionEndDate);
  var renewalDate = new Date(record.NextDueDate);
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
  if (renewalDate >= startDate && renewalDate < endDate) {
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
        SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
        SubscriptionContractAmount: {
          Value: subscriptionAmount,
        },
        VendorName: record.VendorName,
        SubscriptionName: record.SubscriptionName,
        DepartmentNames: {
          Name: record.DepartmentNames.Name,
        },
      };

      monthlyDepartments.push(newRecord);

      startDate.setMonth(startDate.getMonth() + frequency);
      tempdate = new Date(startDate);
    }
  }
}
function filterSubscriptionsByCurrentYear(subscriptions) {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1); // January 1st of the current year
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59); // December 31st of the current year

  // Store the filtered records in a variable
  const filteredSubscriptions = subscriptions
    .map((subscriptionGroup) =>
      subscriptionGroup.filter((subscription) => {
        const subscriptionStartDate = new Date(subscription.SubscriptionStartDate);
        return subscriptionStartDate >= startOfYear && subscriptionStartDate <= endOfYear;
      })
    )
    .filter((subscriptionGroup) => subscriptionGroup.length > 0); // Removes empty groups
  //  createVendorMonthChart(filteredSubscriptions);
  processVendorprofiles(filteredSubscriptions);
}

function processVendorprofiles(filteredSubscriptions) {
  let profileMap = new Map();

  // Iterate through the SubscriptionJSon array
  filteredSubscriptions.forEach((subArray) => {
    subArray.forEach((subscription) => {
      // Check if the subscription object has a VendorProfile
      let vendorProfile = subscription.VendorProfile;
      if (vendorProfile !== null && vendorProfile !== undefined) {
        // Increment the count for this VendorProfile
        if (profileMap.has(vendorProfile)) {
          profileMap.set(vendorProfile, profileMap.get(vendorProfile) + 1);
        } else {
          profileMap.set(vendorProfile, 1);
        }
      }
    });
  });

  // Convert the map to an array of objects with count and VendorProfile attributes
  vendorProfileCounts = Array.from(profileMap, ([VendorProfile, count]) => ({
    VendorProfile,
    count,
  }));
  mapVendorProfileNames();
  const { setVendorProfileCounts } = useHomeStore.getState();
  setVendorProfileCounts(vendorProfileCounts.map((profile) => ({ ...profile })));
  setVendorProfileChart();
}
function setVendorProfileChart() {
  const profileValue = useHomeStore.getState().vendorProfileCounts ?? [];
  const profileName = profileValue[0]?.VendorProfile;
  let filteredData = [];
  SubscriptionJSon.forEach((subArray) => {
    subArray.forEach((subscription) => {
      if (vendorProfileMap[subscription.VendorProfile] === profileName) {
        filteredData.push(subscription);
      }
    });
  });
  const { setVendorProfileChartData } = useHomeStore.getState();
  setVendorProfileChartData(filteredData);
}
function mapVendorProfileNames() {
  vendorProfileCounts.forEach((profile) => {
    const mappedProfile = vendorProfileMap[profile.VendorProfile];
    profile.VendorProfile = mappedProfile ?? profile.VendorProfile ?? "Unknown";
  });
}

function filtermonthlysubsinRangeforDepartment() {
  const Today = new Date();

  var tempdepartments = [];

  monthlyDepartments.forEach(function (record, index) {
    var subscriptionstartDate = new Date(record.SubscriptionStartDate);

    if (subscriptionstartDate >= startDateforDep && subscriptionstartDate <= endDatefordep) {
      tempdepartments.push(record);
    }
  });
  monthlyDepartments = tempdepartments;
}

function ModifyRenewalSubscriptionsWithchartLimit() {
  monthlyrenewal = [];

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
          generateSimilarRecordsbyMonthforRenewal(record);
        }
        // Check if the subscription frequency is yearly or contains 'Years'
        else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsbyYearforRenewal(record);
        }
      }
    });
  });

  // Merge all records by month for renewal processing
  mergeRecordsByMonthforRenewal();
}

function mergeRecordsByMonthforRenewal() {
  // Create an object to store merged records

  filtermonthlysubsinRangeforRenewal();

  // setrenewalchart();
}

function filtermonthlysubsinRangeforRenewal() {
  const startDate = new Date(startDateforRenwal);
  const endDate = new Date(endDateforRenewal); // Set end date to last day of end month
  const allRenewals = [...monthlyrenewal];
  var tempMonthly = [];

  monthlyrenewal.forEach(function (record) {
    var subscriptionstartDate = new Date(record.SubscriptionStartDate);

    if (subscriptionstartDate >= startDate && subscriptionstartDate <= endDate) {
      // Keep the record if the date is within the specified range
      tempMonthly.push(record);
    }
  });

  monthlyrenewal = tempMonthly;

  const { setUpcomingRenewalRecords } = useHomeStore.getState();
  setUpcomingRenewalRecords(allRenewals);
}

function generateSimilarRecordsbyMonthforRenewal(record) {
  var endDate = new Date(record.SubscriptionEndDate);
  var startDate = new Date(record.SubscriptionStartDate);
  // var LastDueDate = new Date(record.LastDueDate);

  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return [];
  }
  if (startDate.getFullYear() === 1) {
    return [];
  }
  // var currentdate= new Date()    ;
  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();
  var monthDifference = (endYear - startYear) * 12 + (endMonth - startMonth);

  var tempdate = new Date(startDate);
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setMonth(endDateForComparison.getMonth() + monthDifference);
  endDateForComparison.setDate(endDate.getDate());

  // Loop from startDate to endDate with frequency as the increment
  while (startDate <= endDateForComparison) {
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
      SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
      SubscriptionContractAmount: {
        Value: subscriptionAmount,
      },
      VendorName: record.VendorName,
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: {
        Name: record.DepartmentNames.Name,
      },
    };

    monthlyrenewal.push(newRecord);

    startDate.setMonth(startDate.getMonth() + frequency);
    tempdate = new Date(startDate);
  }
}

function generateSimilarRecordsbyYearforRenewal(record) {
  var LastDueDate = new Date(record.LastDueDate);
  var NextDueeDate = new Date(record.NextDueDate);
  var endDate = new Date(record.SubscriptionEndDate);
  var startDate = new Date(record.SubscriptionStartDate);

  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return [];
  }

  if (startDate.getFullYear() === 1) {
    return [];
  }

  var currentdate = new Date();
  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();
  var yearDifference = endYear - startYear;

  var endDateForComparison = new Date(startDate);
  endDateForComparison.setFullYear(endDateForComparison.getFullYear() + yearDifference);
  endDateForComparison.setDate(endDate.getDate());
  var tempdate = new Date(startDate);

  // Loop from startDate to endDate with frequency as the increment
  while (startDate.getFullYear() < endDateForComparison.getFullYear()) {
    var subscriptionAmount =
      record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

    var newRecord = {
      SubscriptionStartDate: tempdate, // Convert date to ISO format
      SubscriptionEndDate: record.SubscriptionEndDate,
      SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
      SubscriptionContractAmount: {
        Value: subscriptionAmount,
      },
      VendorName: record.VendorName,
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: {
        Name: record.DepartmentNames.Name,
      },
    };

    monthlyrenewal.push(newRecord);

    startDate.setFullYear(startDate.getFullYear() + frequency);

    tempdate = new Date(startDate);
  }
}

function groupByVendorName(data) {
  const groupedData = [];

  data.forEach((item) => {
    let existingGroup = groupedData.find((group) => group[0]?.VendorName === item.VendorName);

    if (existingGroup) {
      existingGroup.push(item);
    } else {
      groupedData.push([item]);
    }
  });

  return groupedData;
}

function removeObjectsWithSameTime(array) {
  for (let i = 0; i < array.length; i++) {
    let subArray = array[i];
    for (let j = 0; j < subArray.length; j++) {
      let record = subArray[j];
      let startDate = new Date(record.SubscriptionStartDate);
      let endDate = new Date(record.SubscriptionEndDate);
      if (startDate.getTime() === endDate.getTime()) {
        // Remove the object from the array
        subArray.splice(j, 1);
        j--; // Adjust the index after removal
      }
    }
  }
  // return array;
}
