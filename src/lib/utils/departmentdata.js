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
 * State manager for department data
 */
class DepartmentDataState {
  constructor() {
    const currentYear = new Date().getFullYear();
    this.subscriptionJSon = [];
    this.subscriptionJSonBackup = [];
    this.monthlyDepartments = [];
    this.startDateforDep = new Date(currentYear, 0, 1);
    this.endDatefordep = new Date(currentYear, 11, 31);
    this.chartInstance = null;
  }

  updateDepartmentDateRange(action) {
    if (action === "next-x-months") {
      this.startDateforDep = new Date(
        this.startDateforDep.getFullYear() + 1,
        0,
        1
      );
      this.endDatefordep = new Date(
        this.endDatefordep.getFullYear() + 1,
        11,
        31
      );
    } else if (action === "last-x-months") {
      this.startDateforDep = new Date(
        this.startDateforDep.getFullYear() - 1,
        0,
        1
      );
      this.endDatefordep = new Date(
        this.endDatefordep.getFullYear() - 1,
        11,
        31
      );
    }
  }

  isCurrentYear() {
    const currentYear = new Date().getFullYear();
    return this.startDateforDep.getFullYear() === currentYear;
  }
}

const state = new DepartmentDataState();

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
 * Generates similar records by year for department
 */
function generateSimilarRecordsByYearForDepartment(record, outputArray) {
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
 * Generates similar records by month for department
 */
function generateSimilarRecordsByMonthForDepartment(record, outputArray) {
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
 * Processes subscriptions for department chart
 */
function modifyDepartmentChartLimit(subscriptionJSon) {
  state.monthlyDepartments = [];
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
          generateSimilarRecordsByMonthForDepartment(
            record,
            state.monthlyDepartments
          );
        } else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsByYearForDepartment(
            record,
            state.monthlyDepartments
          );
        }
      }
    });
  });

  return state.monthlyDepartments;
}

/**
 * Filters monthly departments by date range
 */
function filterMonthlySubsInRangeForDepartment(monthlyDepartments) {
  return monthlyDepartments.filter((record) => {
    const subscriptionStartDate = new Date(record.SubscriptionStartDate);
    return (
      subscriptionStartDate >= state.startDateforDep &&
      subscriptionStartDate <= state.endDatefordep
    );
  });
}

/**
 * Merges records by department
 */
function mergeRecordsByMonthForDepartment(monthlyDepartments) {
  const filtered = filterMonthlySubsInRangeForDepartment(monthlyDepartments);
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
 * Updates the department chart
 */
function updateDepartmentChart(departmentData) {
  const canvas = getElementById("chart5");
  if (!canvas) {
    if (!updateDepartmentChart.retryCount) {
      updateDepartmentChart.retryCount = 1;
      setTimeout(() => {
        updateDepartmentChart.retryCount = 0;
        updateDepartmentChart(departmentData);
      }, 100);
    }
    return;
  }
  updateDepartmentChart.retryCount = 0;

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
  let departmentAmounts = [0];

  const breakLongDepartmentNames = (name, maxLength) => {
    if (!name) return "Unknown";
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
    departmentNames = departmentData.map((department) =>
      breakLongDepartmentNames(
        department[0]?.DepartmentNames?.Name,
        maxLabelLength
      )
    );

    departmentAmounts = departmentData.map(
      (department) => department[0]?.SubscriptionContractAmount?.Value || 0
    );
  }

  const maxAmount = hasValidData ? Math.max(...departmentAmounts) : 0;
  const stepSize = maxAmount > 0 ? Math.ceil(maxAmount / 5) : 1;

  state.chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: departmentNames,
      datasets: [
        {
          label: "Subscription Contract Amount",
          data: departmentAmounts,
          backgroundColor: hasValidData
            ? ["#E1DBFE", "#BFF1FF", "#E1FFBB", "#EAECF0", "#CFE1FF", "#BFF1FF"]
            : ["rgba(0,0,0,0.1)"],
          borderRadius: 10,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: "#000",
            font: { size: 12 },
            callback: function (value) {
              return this.getLabelForValue(value).split("\n");
            },
          },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#000",
            stepSize: stepSize,
            callback: (value) => "$" + value.toLocaleString(),
          },
          grid: {
            color: "#EAECF0",
            borderDash: [5, 5],
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => "$" + ctx.raw.toLocaleString(),
          },
        },
      },
    },
  });
}

/**
 * Gets department spend trend (navigates years)
 */
export function GetDepartmentSpentrend(action) {
  const currentYear = new Date().getFullYear();
  state.updateDepartmentDateRange(action);

  // Update DOM elements (kept for backward compatibility)
  const leftArrow = getElementById("leftarrowdep");
  const rightArrow = getElementById("rightarrowdep");

  if (leftArrow && rightArrow) {
    if (state.isCurrentYear()) {
      rightArrow.style.pointerEvents = "none";
      rightArrow.style.opacity = "0.5";
      leftArrow.style.pointerEvents = "auto";
      leftArrow.style.opacity = "1";
    } else {
      rightArrow.style.pointerEvents = "auto";
      rightArrow.style.opacity = "1";
      leftArrow.style.pointerEvents = "none";
      leftArrow.style.opacity = "0.5";
    }
  }

  const financialYearElement = getElementById("financialyear");
  if (financialYearElement) {
    financialYearElement.textContent = `FY${state.startDateforDep
      .getFullYear()
      .toString()
      .slice(-2)}`;
  }

  const monthlyDepts = modifyDepartmentChartLimit(state.subscriptionJSon);
  const merged = mergeRecordsByMonthForDepartment(monthlyDepts);
  updateDepartmentChart(merged);
}

/**
 * Main data processing function
 */
export function handleDataProcessing(originalData) {
  if (!originalData || !originalData.lines || originalData.lines.length === 0) {
    return null;
  }

  const transformedData = groupByVendorName(originalData.lines);
  state.subscriptionJSonBackup = transformedData;
  state.subscriptionJSon = JSON.parse(JSON.stringify(transformedData));

  countByVendorName(state.subscriptionJSon);

  const monthlyDepts = modifyDepartmentChartLimit(state.subscriptionJSon);
  const merged = mergeRecordsByMonthForDepartment(monthlyDepts);
  updateDepartmentChart(merged);

  return {
    subscriptionJSon: state.subscriptionJSon,
  };
}
