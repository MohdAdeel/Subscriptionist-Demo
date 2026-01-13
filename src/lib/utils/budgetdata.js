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
 * State manager for budget data
 */
class BudgetDataState {
  constructor() {
    const currentYear = new Date().getFullYear();
    this.subscriptionJSon = [];
    this.subscriptionJSonBackup = [];
    this.budgetDepartment = [];
    this.startDateForBudget = new Date(currentYear, 0, 1);
    this.endDateForBudget = new Date(currentYear, 11, 31);
    this.chartInstance = null;
  }

  updateBudgetDateRange(action) {
    if (action === "next-x-months") {
      this.startDateForBudget = new Date(
        this.startDateForBudget.getFullYear() + 1,
        0,
        1
      );
      this.endDateForBudget = new Date(
        this.endDateForBudget.getFullYear() + 1,
        11,
        31
      );
    } else if (action === "last-x-months") {
      this.startDateForBudget = new Date(
        this.startDateForBudget.getFullYear() - 1,
        0,
        1
      );
      this.endDateForBudget = new Date(
        this.endDateForBudget.getFullYear() - 1,
        11,
        31
      );
    }
  }

  isCurrentYear() {
    const currentYear = new Date().getFullYear();
    return this.startDateForBudget.getFullYear() === currentYear;
  }
}

const state = new BudgetDataState();

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
 * Generates similar records by month for budget
 */
function generateSimilarRecordsByMonthForBudget(record, outputArray) {
  const startDate = new Date(record.SubscriptionStartDate);
  const endDate = new Date(record.SubscriptionEndDate);
  const renewalDate = new Date(record.NextDueDate);
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

  if (renewalDate >= startDate && renewalDate < endDate) {
    let tempDate = new Date(startDate);
    const subscriptionAmount = record.SubscriptionContractAmount?.Value || 0;

    while (startDate < endDateForComparison) {
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
}

/**
 * Generates similar records by year for budget
 */
function generateSimilarRecordsByYearForBudget(record, outputArray) {
  const startDate = new Date(record.SubscriptionStartDate);
  const endDate = new Date(record.SubscriptionEndDate);
  const renewalDate = new Date(record.NextDueDate);
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

  if (renewalDate >= startDate && renewalDate < endDate) {
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
}

/**
 * Processes subscriptions for budget chart
 */
function modifyBudgetChartLimit(subscriptionJSon) {
  state.budgetDepartment = [];
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
          generateSimilarRecordsByMonthForBudget(
            record,
            state.budgetDepartment
          );
        } else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsByYearForBudget(record, state.budgetDepartment);
        }
      }
    });
  });

  return state.budgetDepartment;
}

/**
 * Filters budget department records by date range
 */
function filterForBudgetDepartment(budgetDepartment) {
  return budgetDepartment.filter((record) => {
    const subscriptionStartDate = new Date(record.SubscriptionStartDate);
    return (
      subscriptionStartDate >= state.startDateForBudget &&
      subscriptionStartDate <= state.endDateForBudget
    );
  });
}

/**
 * Merges records by department for budget
 */
function mergeRecordsForBudget(budgetDepartment) {
  const filtered = filterForBudgetDepartment(budgetDepartment);
  const mergedRecords = {};

  filtered.forEach((record) => {
    if (record && record.DepartmentNames?.Name) {
      const departmentName = record.DepartmentNames.Name;
      if (mergedRecords[departmentName]) {
        mergedRecords[departmentName].SubscriptionContractAmount.Value +=
          record.SubscriptionContractAmount.Value;
      } else {
        mergedRecords[departmentName] = { ...record };
      }
    }
  });

  return Object.values(mergedRecords).map((record) => [record]);
}

/**
 * Fetches budget data from API
 */
async function retrieveBudget(mergedArray) {
  try {
    const response = await fetch(
      "/_api/yiic_budgets?$select=yiic_amount,_yiic_department_value,_yiic_financialyear_value&$filter=yiic_departmentbudget eq true",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
          Prefer: "odata.include-annotations=*",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Response is not JSON");
    }

    const data = await response.json();

    if (!data || !data.value || !Array.isArray(data.value)) {
      console.warn("Budget API returned unexpected data structure");
      updateDepartmentBudgetChart(mergedArray);
      return;
    }

    const targetYear = state.startDateForBudget.getFullYear();
    const filteredRecords = data.value.filter((record) => {
      return (
        parseInt(
          record[
            "_yiic_financialyear_value@OData.Community.Display.V1.FormattedValue"
          ]
        ) === targetYear
      );
    });

    const updatedMergedArray = mergedArray.map((entry) => {
      const item = entry[0];
      const deptName = item.DepartmentNames?.Name;

      const matchingBudget = filteredRecords.find(
        (b) =>
          b[
            "_yiic_department_value@OData.Community.Display.V1.FormattedValue"
          ] === deptName
      );

      if (matchingBudget) {
        item.BudgetAmount = { Value: matchingBudget.yiic_amount };
      } else {
        item.BudgetAmount = { Value: 0 };
      }

      return [item];
    });

    updateDepartmentBudgetChart(updatedMergedArray);
  } catch (error) {
    console.warn(
      "Budget API not available, using default values:",
      error.message
    );
    updateDepartmentBudgetChart(mergedArray);
  }
}

/**
 * Updates the department budget chart
 */
function updateDepartmentBudgetChart(departmentData) {
  const canvas = getElementById("chartBudget");
  if (!canvas) {
    if (!updateDepartmentBudgetChart.retryCount) {
      updateDepartmentBudgetChart.retryCount = 1;
      setTimeout(() => {
        updateDepartmentBudgetChart.retryCount = 0;
        updateDepartmentBudgetChart(departmentData);
      }, 100);
    }
    return;
  }
  updateDepartmentBudgetChart.retryCount = 0;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Destroy existing chart
  destroyChart(state.chartInstance);
  const existingChart = getExistingChart(canvas);
  destroyChart(existingChart);

  const hasValidData =
    departmentData &&
    Array.isArray(departmentData) &&
    departmentData.length > 0;

  let departmentNames = ["No Data Available"];
  let actualAmounts = [0];
  let budgetAmounts = [0];

  const breakLongDepartmentNames = (name, maxLength) => {
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
    if (typeof window === "undefined") return 15;
    const screenWidth = window.innerWidth;
    if (screenWidth > 1200) return 15;
    if (screenWidth > 768) return 10;
    return 6;
  };

  const maxLabelLength = getMaxLabelLength();

  if (hasValidData) {
    departmentNames = departmentData.map((dept) =>
      breakLongDepartmentNames(
        dept[0]?.DepartmentNames?.Name || "Unknown",
        maxLabelLength
      )
    );

    actualAmounts = departmentData.map(
      (dept) => dept[0]?.SubscriptionContractAmount?.Value || 0
    );

    budgetAmounts = departmentData.map(
      (dept) => dept[0]?.BudgetAmount?.Value || 0
    );
  }

  const maxAmount = hasValidData
    ? Math.max(...actualAmounts.concat(budgetAmounts))
    : 0;
  const stepSize = maxAmount > 0 ? Math.ceil(maxAmount / 5) : 1;

  state.chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: departmentNames,
      datasets: [
        {
          label: "Budget",
          data: budgetAmounts,
          backgroundColor: "#CCD6EB",
          borderRadius: 10,
        },
        {
          label: "Actual Spend",
          data: actualAmounts,
          backgroundColor: "#E1DBFE",
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: "#000000",
            font: { size: 12 },
            maxRotation: 0,
            minRotation: 0,
            callback: function (value) {
              return this.getLabelForValue(value).split("\n");
            },
          },
          grid: { display: false },
          stacked: false,
        },
        y: {
          ticks: {
            color: "#000000",
            font: { size: 12 },
            callback: (value) => "$" + value.toLocaleString(),
            stepSize: stepSize,
            maxTicksLimit: 5,
          },
          grid: {
            display: true,
            color: "#EAECF0",
            borderDash: [5, 5],
            drawBorder: false,
            drawTicks: false,
          },
          beginAtZero: true,
          suggestedMax: stepSize * 5,
        },
      },
      plugins: {
        tooltip: {
          position: "nearest",
          backgroundColor: "#ffffff",
          titleColor: "#000",
          bodyColor: "#000",
          borderColor: "#ccc",
          borderWidth: 1,
          usePointStyle: true,
          callbacks: {
            labelPointStyle: () => ({
              pointStyle: "circle",
              rotation: 0,
            }),
            label: function (tooltipItem) {
              return (
                tooltipItem.dataset.label +
                ": $" +
                tooltipItem.raw.toLocaleString()
              );
            },
          },
        },
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            color: "#000000",
            font: { size: 12 },
          },
        },
      },
    },
  });
}

/**
 * Gets budget trend (navigates years)
 */
export function GetBudgetTrend(action) {
  const currentYear = new Date().getFullYear();
  state.updateBudgetDateRange(action);

  // Update DOM elements (kept for backward compatibility)
  const leftArrow = getElementById("leftarrowbudget");
  const rightArrow = getElementById("rightarrowbudget");

  if (leftArrow && rightArrow) {
    if (state.isCurrentYear()) {
      leftArrow.style.pointerEvents = "none";
      leftArrow.style.opacity = "0.5";
    } else {
      leftArrow.style.pointerEvents = "auto";
      leftArrow.style.opacity = "1";
    }

    rightArrow.style.pointerEvents = "auto";
    rightArrow.style.opacity = "1";
  }

  const financialYearElement = getElementById("financialyearbudget");
  if (financialYearElement) {
    financialYearElement.textContent = `FY${state.startDateForBudget
      .getFullYear()
      .toString()
      .slice(-2)}`;
  }

  const budgetDept = modifyBudgetChartLimit(state.subscriptionJSon);
  const merged = mergeRecordsForBudget(budgetDept);
  retrieveBudget(merged);
}

/**
 * Main data processing function
 */
export function handleDataProcessing(originalData) {
  const lines = Array.isArray(originalData?.lines)
    ? originalData.lines
    : Array.isArray(originalData)
    ? originalData
    : [];

  if (lines.length === 0) return null;

  const transformedData = groupByVendorName(originalData.lines);
  state.subscriptionJSonBackup = transformedData;
  state.subscriptionJSon = JSON.parse(JSON.stringify(transformedData));

  countByVendorName(state.subscriptionJSon);

  const budgetDept = modifyBudgetChartLimit(state.subscriptionJSon);
  const merged = mergeRecordsForBudget(budgetDept);
  retrieveBudget(merged);

  return {
    subscriptionJSon: state.subscriptionJSon,
  };
}
