import {
  isValidDate,
  destroyChart,
  parseFrequency,
  getElementById,
  getExistingChart,
  groupByVendorName,
} from "./sharedUtils";
import Chart from "chart.js/auto";
import { countByVendorName } from "./countByVendorName";

/**
 * State manager for monthly spend data
 * Uses closure to encapsulate state instead of global variables
 */
class MonthlySpendState {
  constructor() {
    const currentDate = new Date();
    this.endMonthIndex = currentDate.getMonth() + 6;
    this.startMonthIndex = currentDate.getMonth();
    this.renewalArray = [];
    this.monthlySubscription = [];
    this.subscriptionJSon = [];
    this.subscriptionJSonBackup = [];
    this.monthlySpendData = [];
    this.chartInstance = null;
  }

  updateDateRange(direction) {
    if (direction === "next") {
      this.startMonthIndex = this.endMonthIndex + 1;
      this.endMonthIndex = this.startMonthIndex + 6;
    } else if (direction === "previous") {
      this.endMonthIndex = this.startMonthIndex - 1;
      this.startMonthIndex = this.endMonthIndex - 6;
    }
  }
}

// Create singleton instance
const state = new MonthlySpendState();

/**
 * Generates similar records by year based on frequency
 */
function generateSimilarRecordsByYear(record, outputArray) {
  const endDate = new Date(record.SubscriptionEndDate);
  const startDate = new Date(record.SubscriptionStartDate);
  const frequency = parseFrequency(record.SubscriptionFrequency);

  if (!frequency || !isValidDate(startDate)) {
    return;
  }

  const yearDifference = endDate.getFullYear() - startDate.getFullYear();
  const endDateForComparison = new Date(startDate);
  endDateForComparison.setFullYear(
    endDateForComparison.getFullYear() + yearDifference
  );
  endDateForComparison.setDate(endDate.getDate());

  let tempDate = new Date(startDate);
  const subscriptionAmount = record.SubscriptionContractAmount?.Value || 0;

  while (startDate.getFullYear() < endDateForComparison.getFullYear()) {
    outputArray.push({
      SubscriptionStartDate: new Date(tempDate),
      SubscriptionEndDate: record.SubscriptionEndDate,
      SubscriptionFrequency: record.SubscriptionFrequency,
      SubscriptionContractAmount: { Value: subscriptionAmount },
      VendorName: record.VendorName,
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: { Name: record.DepartmentNames?.Name || "" },
    });

    startDate.setFullYear(startDate.getFullYear() + frequency);
    tempDate = new Date(startDate);
  }
}

/**
 * Generates similar records by month based on frequency
 */
function generateSimilarRecordsByMonth(record, outputArray) {
  const endDate = new Date(record.SubscriptionEndDate);
  const startDate = new Date(record.SubscriptionStartDate);
  const frequency = parseFrequency(record.SubscriptionFrequency);

  if (!frequency || !isValidDate(startDate)) {
    return;
  }

  const monthDifference =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  const endDateForComparison = new Date(startDate);
  endDateForComparison.setMonth(
    endDateForComparison.getMonth() + monthDifference
  );
  endDateForComparison.setDate(endDate.getDate());

  let tempDate = new Date(startDate);
  const subscriptionAmount = record.SubscriptionContractAmount?.Value || 0;

  while (startDate <= endDateForComparison) {
    if (
      startDate.getFullYear() === endDateForComparison.getFullYear() &&
      startDate.getMonth() === endDateForComparison.getMonth()
    ) {
      break;
    }

    outputArray.push({
      SubscriptionStartDate: new Date(tempDate),
      SubscriptionEndDate: record.SubscriptionEndDate,
      SubscriptionFrequency: record.SubscriptionFrequency,
      SubscriptionContractAmount: { Value: subscriptionAmount },
      VendorName: record.VendorName,
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: { Name: record.DepartmentNames?.Name || "" },
    });

    startDate.setMonth(startDate.getMonth() + frequency);
    tempDate = new Date(startDate);
  }
}

/**
 * Removes objects with same start and end time
 */
function removeObjectsWithSameTime(array) {
  for (let i = 0; i < array.length; i++) {
    const subArray = array[i];
    for (let j = subArray.length - 1; j >= 0; j--) {
      const record = subArray[j];
      const startDate = new Date(record.SubscriptionStartDate);
      const endDate = new Date(record.SubscriptionEndDate);
      if (startDate.getTime() === endDate.getTime()) {
        subArray.splice(j, 1);
      }
    }
  }
}

/**
 * Processes subscriptions and generates monthly records
 */
function modifySubscriptionsWithChartLimit(
  subscriptionJSon,
  isInitialLoad = false
) {
  state.monthlySubscription = [];
  removeObjectsWithSameTime(subscriptionJSon);

  subscriptionJSon.forEach((subArray) => {
    subArray.forEach((record) => {
      if (
        record.SubscriptionFrequency &&
        record.SubscriptionFrequency.trim() !== ""
      ) {
        if (
          record.SubscriptionFrequency.includes("Monthly") ||
          record.SubscriptionFrequency.includes("Months")
        ) {
          generateSimilarRecordsByMonth(record, state.monthlySubscription);
        } else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsByYear(record, state.monthlySubscription);
        }
      }
    });
  });

  if (isInitialLoad) {
    state.renewalArray = JSON.parse(JSON.stringify(state.monthlySubscription));
  }

  return state.monthlySubscription;
}

/**
 * Calculates active subscriptions and returns data (no DOM manipulation)
 */
export function calculateActiveSubscriptions(subscriptionJSon) {
  const today = new Date();
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const endDate = new Date(currentDate.getFullYear(), 11, 31);

  let tempMonthly = [];
  subscriptionJSon.forEach((subArray) => {
    subArray.forEach((record) => {
      const subscriptionStartDate = new Date(record.SubscriptionStartDate);
      if (
        subscriptionStartDate >= startDate &&
        subscriptionStartDate <= endDate
      ) {
        tempMonthly.push(record);
      }
    });
  });

  const activeSubscriptions = tempMonthly.filter((subscription) => {
    const endDate = new Date(subscription.SubscriptionEndDate);
    return endDate > today;
  });

  const totalContractAmount = activeSubscriptions.reduce(
    (sum, subscription) => {
      return sum + (subscription.SubscriptionContractAmount?.Value || 0);
    },
    0
  );

  const uniqueSubscriptions = activeSubscriptions.filter(
    (subscription, index, self) => {
      return (
        index ===
        self.findIndex(
          (s) =>
            s.SubscriptionName === subscription.SubscriptionName &&
            s.VendorName === subscription.VendorName &&
            s.SubscriptionFrequency === subscription.SubscriptionFrequency &&
            (s.SubscriptionContractAmount?.Value || 0) ===
              (subscription.SubscriptionContractAmount?.Value || 0) &&
            (s.DepartmentNames?.Name || "") ===
              (subscription.DepartmentNames?.Name || "")
        )
      );
    }
  );

  return {
    activeCount: uniqueSubscriptions.length,
    totalAmount: totalContractAmount,
  };
}

/**
 * Updates DOM elements for active cards (kept for backward compatibility)
 * TODO: Refactor to return data and let React component handle rendering
 */
function updateActiveCardsDOM(activeData) {
  const activeCostElement = getElementById("ActiveCostid");
  const activeCostSpan = activeCostElement?.querySelector("span");
  if (activeCostSpan) {
    activeCostSpan.textContent = activeData.activeCount
      ? activeData.totalAmount.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "$0";
  }

  const activeSubsElement = getElementById("ActiveSubsid");
  const activeSubsSpan = activeSubsElement?.querySelector("span");
  if (activeSubsSpan) {
    activeSubsSpan.textContent = activeData.activeCount
      ? activeData.activeCount.toLocaleString()
      : "0";
  }
}

/**
 * Filters monthly subscriptions by date range
 */
function filterMonthlySubsInRange(
  monthlySubscription,
  startMonthIndex,
  endMonthIndex
) {
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), startMonthIndex, 1);
  const endDate = new Date(currentDate.getFullYear(), endMonthIndex + 1, 0);

  return monthlySubscription.filter((record) => {
    const subscriptionStartDate = new Date(record.SubscriptionStartDate);
    return (
      subscriptionStartDate >= startDate && subscriptionStartDate <= endDate
    );
  });
}

/**
 * Merges records by month
 */
function mergeRecordsByMonth(
  monthlySubscription,
  startMonthIndex,
  endMonthIndex
) {
  const filtered = filterMonthlySubsInRange(
    monthlySubscription,
    startMonthIndex,
    endMonthIndex
  );

  const mergedRecords = {};
  filtered.forEach((record) => {
    if (record && record.SubscriptionStartDate) {
      const monthKey = new Date(record.SubscriptionStartDate).getMonth();
      if (mergedRecords[monthKey]) {
        mergedRecords[monthKey].SubscriptionContractAmount.Value +=
          record.SubscriptionContractAmount.Value;
      } else {
        mergedRecords[monthKey] = { ...record };
      }
    }
  });

  return Object.values(mergedRecords);
}

/**
 * Creates or updates the monthly spend chart
 */
function setMonthlySpendChart(
  monthlySpendData,
  startMonthIndex,
  endMonthIndex
) {
  const canvas = getElementById("chart2");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Destroy existing chart
  destroyChart(state.chartInstance);
  const existingChart = getExistingChart(canvas);
  destroyChart(existingChart);

  const labels = [];
  const totalData = [];
  const currentDate = new Date();

  const breakLongMonthNames = (name, maxLength) => {
    if (name.length > maxLength) {
      const words = name.split(" ");
      let currentLine = "";
      const result = [];

      words.forEach((word) => {
        if ((currentLine + word).length <= maxLength) {
          currentLine += word + " ";
        } else {
          result.push(currentLine.trim());
          currentLine = word + " ";
        }
      });

      result.push(currentLine.trim());
      return result.join("\n");
    }
    return name;
  };

  const getMaxLabelLength = () => {
    if (typeof window === "undefined") return 10;
    const screenWidth = window.innerWidth;
    if (screenWidth > 1200) return 10;
    if (screenWidth > 768) return 8;
    return 5;
  };

  const maxLabelLength = getMaxLabelLength();

  for (let i = startMonthIndex; i <= endMonthIndex; i++) {
    const adjustedMonthIndex = ((i % 12) + 12) % 12;
    const yDate = new Date(currentDate.getFullYear(), i, 1);
    const year = yDate.getFullYear();
    const month = new Date(year, adjustedMonthIndex, 1);

    labels.push(
      breakLongMonthNames(
        month.toLocaleString("default", { month: "short", year: "numeric" }),
        maxLabelLength
      )
    );

    const monthData = monthlySpendData.find((item) => {
      const itemDate = new Date(item.SubscriptionStartDate);
      const itemMonth = new Date(
        itemDate.getFullYear(),
        itemDate.getMonth(),
        1
      );
      const adjustedMonth = new Date(year, adjustedMonthIndex, 1);
      return itemMonth.getTime() === adjustedMonth.getTime();
    });

    totalData.push(monthData?.SubscriptionContractAmount?.Value || 0);
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(207, 255, 147, 0.8)");
  gradient.addColorStop(1, "rgba(207, 255, 147, 0)");

  const maxValue = Math.max(...totalData, 0);
  const minValue = Math.min(...totalData, 0);
  const range = maxValue - minValue;
  const stepSize = range > 0 ? Math.ceil(range / 4) : 1;

  state.chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Monthly Spend",
          data: totalData,
          fill: true,
          backgroundColor: gradient,
          borderColor: "#AFFF4A",
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "#AFFF4A",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#475467",
            font: { size: 12 },
            maxRotation: 0,
            minRotation: 0,
            callback: function (value) {
              return this.getLabelForValue(value).split("\n");
            },
          },
        },
        y: {
          grid: {
            display: true,
            color: "#EAECF0",
            borderDash: [5, 5],
          },
          ticks: {
            color: "#475467",
            font: { size: 12 },
            stepSize: stepSize,
            maxTicksLimit: 5,
            callback: function (value) {
              return "$" + value;
            },
          },
          border: {
            color: "#FFFFFF",
            width: 0,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#000000",
          bodyColor: "#000000",
          borderColor: "#AFFF4A",
          borderWidth: 1,
          callbacks: {
            label: function (tooltipItem) {
              return "$" + tooltipItem.raw.toLocaleString();
            },
          },
        },
      },
    },
  });
}

/**
 * Counts concluded subscriptions in the last 12 months
 */
export function countConcludedSubscriptions(subscriptionJSon) {
  const today = new Date();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(today.getFullYear() - 1);

  let expiredCount = 0;

  subscriptionJSon.forEach((subscriptions) => {
    subscriptions.forEach((subscription) => {
      const endDate = new Date(subscription.SubscriptionEndDate);
      if (endDate < today && endDate >= twelveMonthsAgo) {
        expiredCount++;
      }
    });
  });

  // Update DOM (kept for backward compatibility)
  const completedElement = getElementById("completed");
  if (completedElement) {
    completedElement.innerText = expiredCount;
  }

  return expiredCount;
}

/**
 * Calculates subscription amount for renewal timeline
 */
export function calculateSubscriptionAmount(
  value,
  renewalArray = state.renewalArray
) {
  const numericValue = parseInt(value, 10);
  let months = 12;

  switch (numericValue) {
    case 1:
      months = 1;
      break;
    case 2:
      months = 3;
      break;
    case 3:
      months = 6;
      break;
    case 4:
      months = 12;
      break;
  }

  const today = new Date();
  const endDate = new Date(today);
  endDate.setMonth(today.getMonth() + months);

  const upcomingRenewals = renewalArray
    .map((item) => ({ ...item }))
    .filter((subscription) => {
      const subEndDate = new Date(subscription.SubscriptionEndDate);
      return subEndDate > today;
    });

  let totalContractAmountFuture = 0;
  let subscriptionCount = 0;

  upcomingRenewals.forEach((subscription) => {
    const startDate = new Date(subscription.SubscriptionStartDate);
    if (startDate >= today && startDate <= endDate) {
      totalContractAmountFuture +=
        subscription.SubscriptionContractAmount?.Value || 0;
      subscriptionCount++;
    }
  });

  // Update DOM (kept for backward compatibility)
  const renewalCostElement = getElementById("renewalcost");
  const renewalCostSpan = renewalCostElement?.querySelector("span");
  if (renewalCostSpan) {
    renewalCostSpan.textContent = totalContractAmountFuture.toLocaleString(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  const renewalTimelineElement = getElementById("renewalTimeline");
  const renewalTimelineSpan = renewalTimelineElement?.querySelector("span");
  if (renewalTimelineSpan) {
    renewalTimelineSpan.textContent = `${subscriptionCount}`;
  }

  return {
    totalAmount: totalContractAmountFuture,
    count: subscriptionCount,
  };
}

/**
 * Updates subscription amount from dropdown (accepts value parameter)
 */
export function updateSubscriptionAmount(value) {
  const selectedValue =
    value || getElementById("renewalDropdown")?.value || "4";
  return calculateSubscriptionAmount(selectedValue);
}

/**
 * Gets monthly spend trend (navigates months)
 */
export function GetMonthlySpentrend(direction) {
  if (direction === "next-x-months") {
    state.updateDateRange("next");
  } else if (direction === "last-x-months") {
    state.updateDateRange("previous");
  }

  const monthlySubs = modifySubscriptionsWithChartLimit(
    state.subscriptionJSon,
    false
  );
  const merged = mergeRecordsByMonth(
    monthlySubs,
    state.startMonthIndex,
    state.endMonthIndex
  );
  setMonthlySpendChart(merged, state.startMonthIndex, state.endMonthIndex);
}

/**
 * Main data processing function
 */
export function handleDataProcessing(originalData) {
  if (!originalData || !originalData.lines || originalData.lines.length === 0) {
    return null;
  }

  state.monthlySpendData = originalData.lines;
  const transformedData = groupByVendorName(originalData.lines);

  state.subscriptionJSonBackup = transformedData;
  state.subscriptionJSon = JSON.parse(JSON.stringify(transformedData));

  countByVendorName(state.subscriptionJSon);

  const monthlySubs = modifySubscriptionsWithChartLimit(
    state.subscriptionJSon,
    true
  );

  const activeData = calculateActiveSubscriptions(state.subscriptionJSon);
  updateActiveCardsDOM(activeData);

  countConcludedSubscriptions(state.subscriptionJSon);
  calculateSubscriptionAmount("4");

  const merged = mergeRecordsByMonth(
    monthlySubs,
    state.startMonthIndex,
    state.endMonthIndex
  );
  setMonthlySpendChart(merged, state.startMonthIndex, state.endMonthIndex);

  return {
    monthlySpendData: state.monthlySpendData,
    subscriptionJSon: state.subscriptionJSon,
    activeSubscriptions: activeData,
  };
}

// Export state getters for external access if needed
export function getState() {
  return {
    startMonthIndex: state.startMonthIndex,
    endMonthIndex: state.endMonthIndex,
    renewalArray: state.renewalArray,
  };
}
