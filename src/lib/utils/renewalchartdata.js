import {
  isValidDate,
  destroyChart,
  parseFrequency,
  getElementById,
  getExistingChart,
  groupByVendorName,
} from "./sharedUtils";
import Chart from "chart.js/auto";

/**
 * State manager for renewal chart data
 */
class RenewalChartState {
  constructor() {
    const currentDate = new Date();
    this.subscriptionJSon = [];
    this.subscriptionJSonBackup = [];
    this.monthlyRenewal = [];
    this.startDateforRenewal = new Date();
    this.startDateforRenewal.setDate(1);
    this.endDateforRenewal = new Date(
      new Date().setMonth(new Date().getMonth() + 6)
    );
    this.endDateforRenewal.setDate(0);
    this.chartInstance = null;
  }

  updateRenewalDateRange(action) {
    if (action === "next-x-months") {
      this.startDateforRenewal.setMonth(
        this.startDateforRenewal.getMonth() + 6
      );
      this.endDateforRenewal.setMonth(this.endDateforRenewal.getMonth() + 6);
    } else if (action === "last-x-months") {
      this.startDateforRenewal.setMonth(
        this.startDateforRenewal.getMonth() - 6
      );
      this.endDateforRenewal.setMonth(this.endDateforRenewal.getMonth() - 6);
    }
  }

  isCurrentPeriod() {
    const currentDate = new Date();
    return (
      this.startDateforRenewal.getMonth() <= currentDate.getMonth() &&
      this.startDateforRenewal.getFullYear() <= currentDate.getFullYear()
    );
  }
}

const state = new RenewalChartState();

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
 * Generates similar records by year for renewal
 */
function generateSimilarRecordsByYearForRenewal(record, outputArray) {
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
 * Generates similar records by month for renewal
 */
function generateSimilarRecordsByMonthForRenewal(record, outputArray) {
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
 * Processes subscriptions for renewal chart
 */
function modifyRenewalSubscriptionsWithChartLimit(subscriptionJSon) {
  state.monthlyRenewal = [];
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
          generateSimilarRecordsByMonthForRenewal(record, state.monthlyRenewal);
        } else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsByYearForRenewal(record, state.monthlyRenewal);
        }
      }
    });
  });

  return state.monthlyRenewal;
}

/**
 * Filters monthly renewals by date range
 */
function filterMonthlySubsInRangeForRenewal(monthlyRenewal) {
  const startDate = new Date(state.startDateforRenewal);
  const endDate = new Date(state.endDateforRenewal);

  return monthlyRenewal.filter((record) => {
    const subscriptionStartDate = new Date(record.SubscriptionStartDate);
    return (
      subscriptionStartDate >= startDate && subscriptionStartDate <= endDate
    );
  });
}

/**
 * Counts subscriptions ending in next six months
 */
export function countSubscriptionsEndingInNextSixMonths(subscriptions) {
  const counts = Array(6).fill(0);
  const now = new Date(state.startDateforRenewal);

  subscriptions.forEach((subscription) => {
    const startDate = new Date(subscription.SubscriptionStartDate);
    const monthDiff =
      startDate.getMonth() -
      now.getMonth() +
      12 * (startDate.getFullYear() - now.getFullYear());

    if (monthDiff >= 0 && monthDiff < 6) {
      counts[monthDiff]++;
    }
  });

  return counts;
}

/**
 * Shows renewal grid (DOM manipulation kept for backward compatibility)
 * TODO: Refactor to React component
 */
function showRenewalGrid(profile, monthlyRenewal) {
  const monthNames = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const chartContainer = getElementById("renewalcontainer");
  const chartCanvas = getElementById("chart3");
  if (!chartContainer || !chartCanvas) return;

  chartCanvas.style.display = "none";

  const existingGridContainer = getElementById("renewalGrid");
  if (existingGridContainer) {
    chartContainer.removeChild(existingGridContainer);
  }

  const gridContainer = document.createElement("div");
  gridContainer.id = "renewalGrid";
  Object.assign(gridContainer.style, {
    backgroundColor: "white",
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "black",
    position: "relative",
    padding: "8px",
  });

  const backButton = document.createElement("button");
  backButton.innerText = "Back";
  Object.assign(backButton.style, {
    position: "absolute",
    top: "-30px",
    right: "25px",
    padding: "6px 12px",
    backgroundColor: "#000640",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  });

  backButton.onmouseover = () => {
    backButton.style.backgroundColor = "#0056b3";
  };
  backButton.onmouseout = () => {
    backButton.style.backgroundColor = "#000640";
  };
  backButton.onclick = () => {
    resetChartRenewal();
  };

  const gridContent = document.createElement("div");
  Object.assign(gridContent.style, {
    fontSize: "16px",
    width: "100%",
    overflowX: "auto",
  });

  const monthYearParts = profile.match(/([a-zA-Z]+)\s+(\d{4})/);
  if (!monthYearParts) {
    gridContent.innerText = `Invalid profile format: ${profile}`;
    gridContainer.appendChild(backButton);
    gridContainer.appendChild(gridContent);
    chartContainer.appendChild(gridContainer);
    return;
  }

  const month = monthYearParts[1].toLowerCase();
  const year = parseInt(monthYearParts[2]);
  const monthIndex = monthNames[month];

  let filteredData = [];
  if (monthIndex !== undefined) {
    filteredData = monthlyRenewal.filter((subscription) => {
      const startDate = new Date(subscription.SubscriptionStartDate);
      return (
        startDate.getMonth() === monthIndex && startDate.getFullYear() === year
      );
    });
  }

  if (filteredData.length > 0) {
    const table = document.createElement("table");
    Object.assign(table.style, {
      width: "100%",
      borderCollapse: "collapse",
    });

    const headerRow = document.createElement("tr");
    const headers = ["Name", "Due Date", "Frequency"];

    headers.forEach((headerText) => {
      const headerCell = document.createElement("th");
      headerCell.innerText = headerText;
      Object.assign(headerCell.style, {
        border: "1px solid #dddddd",
        padding: "8px",
        backgroundColor: "#f2f2f2",
        textAlign: "left",
        fontSize: "10px",
      });
      headerRow.appendChild(headerCell);
    });

    table.appendChild(headerRow);

    filteredData.forEach((subscription) => {
      const dataRow = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.innerText = subscription.SubscriptionName;
      Object.assign(nameCell.style, {
        border: "1px solid #dddddd",
        padding: "8px",
        fontSize: "10px",
      });
      dataRow.appendChild(nameCell);

      const endDateCell = document.createElement("td");
      endDateCell.innerText = new Date(
        subscription.SubscriptionStartDate
      ).toLocaleDateString();
      Object.assign(endDateCell.style, {
        border: "1px solid #dddddd",
        padding: "8px",
        fontSize: "10px",
      });
      dataRow.appendChild(endDateCell);

      const frequencyCell = document.createElement("td");
      frequencyCell.innerText = subscription.SubscriptionFrequency;
      Object.assign(frequencyCell.style, {
        border: "1px solid #dddddd",
        padding: "8px",
        fontSize: "10px",
      });
      dataRow.appendChild(frequencyCell);

      table.appendChild(dataRow);
    });

    gridContent.appendChild(table);
  } else {
    gridContent.innerText = `No subscriptions found for: ${profile}`;
  }

  gridContainer.appendChild(backButton);
  gridContainer.appendChild(gridContent);
  chartContainer.appendChild(gridContainer);
}

/**
 * Resets renewal chart view
 */
function resetChartRenewal() {
  const chartContainer = getElementById("renewalcontainer");
  const gridContainer = getElementById("renewalGrid");
  const chartCanvas = getElementById("chart3");
  const leftArrow = getElementById("leftarrowRen");
  const rightArrow = getElementById("rightarrowRen");
  const fin = getElementById("financialyearRen");

  if (gridContainer && chartContainer) {
    chartContainer.removeChild(gridContainer);
  }
  if (chartCanvas) {
    chartCanvas.style.display = "block";
  }
  if (fin) {
    fin.style.display = "block";
  }
  if (rightArrow) {
    rightArrow.style.display = "block";
  }
  if (leftArrow) {
    const currentDate = new Date();
    if (
      state.startDateforRenewal.getMonth() === currentDate.getMonth() &&
      state.startDateforRenewal.getFullYear() === currentDate.getFullYear()
    ) {
      leftArrow.style.display = "none";
    } else {
      leftArrow.style.display = "inline-block";
    }
  }
}

/**
 * Sets renewal chart
 */
function setRenewalChart(canvas) {
  if (!canvas) {
    canvas = getElementById("chart3");
  }
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Destroy existing chart
  destroyChart(state.chartInstance);
  const existingChart = getExistingChart(canvas);
  destroyChart(existingChart);

  const filtered = filterMonthlySubsInRangeForRenewal(state.monthlyRenewal);
  const counts = countSubscriptionsEndingInNextSixMonths(filtered);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const labels = [];
  let currentDate = new Date(state.startDateforRenewal);

  while (currentDate <= state.endDateforRenewal) {
    labels.push(
      monthNames[currentDate.getMonth()] + " " + currentDate.getFullYear()
    );
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const data = labels.map((_, index) => counts[index] || 0);
  const maxAmount = Math.max(...data, 0);

  state.chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Renewals in the Next 6 Months",
          data: data,
          backgroundColor: [
            "#DBEAFE",
            "#B9D3FF",
            "#ADCCFF",
            "#7BADFF",
            "#7BADFF",
            "#7BADFF",
          ],
          borderWidth: 0,
          borderRadius: 10,
          hoverBackgroundColor: [
            "#DBEAFE",
            "#B9D3FF",
            "#ADCCFF",
            "#7BADFF",
            "#7BADFF",
            "#7BADFF",
          ],
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
          },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: "#000000",
            font: { size: 12 },
            callback: function (value) {
              return value.toLocaleString();
            },
            maxTicksLimit: 5,
            stepSize: maxAmount > 0 ? Math.ceil(maxAmount / 6) : 1,
          },
          grid: {
            display: true,
            color: "#EAECF0",
            borderDash: [5, 5],
          },
          beginAtZero: true,
          suggestedMin: 0,
          suggestedMax: Math.ceil(maxAmount * 1.1),
          border: {
            color: "#FFFFFF",
            width: 1,
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.raw.toLocaleString();
            },
          },
        },
        legend: { display: false },
      },
      onClick: function (event, elements) {
        if (elements.length > 0) {
          const index = elements[0].index;
          const profile = labels[index];
          showRenewalGrid(profile, filtered);
        }
      },
    },
  });
}

/**
 * Gets renewal trend (navigates months)
 */
export function Getrenewal(action) {
  state.updateRenewalDateRange(action);

  // Update DOM elements (kept for backward compatibility)
  const leftArrow = getElementById("leftarrowRen");
  const rightArrow = getElementById("rightarrowRen");

  if (leftArrow && rightArrow) {
    if (state.isCurrentPeriod()) {
      leftArrow.style.pointerEvents = "none";
      leftArrow.style.opacity = "0.5";
    } else {
      leftArrow.style.pointerEvents = "auto";
      leftArrow.style.opacity = "1";
    }
  }

  const financialYearElement = getElementById("financialyearRen");
  if (financialYearElement) {
    financialYearElement.textContent = `FY${state.startDateforRenewal
      .getFullYear()
      .toString()
      .slice(-2)}`;
  }

  state.monthlyRenewal = modifyRenewalSubscriptionsWithChartLimit(
    state.subscriptionJSon
  );
  const canvas = getElementById("chart3");
  setRenewalChart(canvas);
}

/**
 * Main data processing function
 */
export function handleDataProcessing(originalData, canvas) {
  if (!originalData || !originalData.lines || originalData.lines.length === 0) {
    return null;
  }

  const transformedData = groupByVendorName(originalData.lines);
  state.subscriptionJSonBackup = transformedData;
  state.subscriptionJSon = JSON.parse(JSON.stringify(transformedData));

  state.monthlyRenewal = modifyRenewalSubscriptionsWithChartLimit(
    state.subscriptionJSon
  );
  setRenewalChart(canvas);

  return {
    subscriptionJSon: state.subscriptionJSon,
  };
}
