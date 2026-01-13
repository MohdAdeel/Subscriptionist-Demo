import {
  destroyChart,
  getElementById,
  getExistingChart,
  groupByVendorName,
} from "./sharedUtils";
import Chart from "chart.js/auto";
import { countByVendorName } from "./countByVendorName";

/**
 * State manager for vendor profile data
 */
class VendorProfileState {
  constructor() {
    this.subscriptionJSon = [];
    this.subscriptionJSonBackup = [];
    this.vendorProfileCounts = [];
    this.chartInstance = null;
  }
}

const state = new VendorProfileState();

const vendorProfileMap = {
  0: "Strategic",
  1: "Tactical",
  2: "Operational",
};

/**
 * Filters subscriptions by current year
 */
function filterSubscriptionsByCurrentYear(subscriptions) {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

  return subscriptions
    .map((subscriptionGroup) =>
      subscriptionGroup.filter((subscription) => {
        const subscriptionStartDate = new Date(
          subscription.SubscriptionStartDate
        );
        return (
          subscriptionStartDate >= startOfYear &&
          subscriptionStartDate <= endOfYear
        );
      })
    )
    .filter((subscriptionGroup) => subscriptionGroup.length > 0);
}

/**
 * Maps vendor profile numbers to names
 */
function mapVendorProfileNames(profileCounts) {
  return profileCounts.map((profile) => ({
    ...profile,
    VendorProfile: vendorProfileMap[profile.VendorProfile] || "Unknown",
  }));
}

/**
 * Processes vendor profiles and counts them
 */
function processVendorProfiles(filteredSubscriptions) {
  const profileMap = new Map();

  filteredSubscriptions.forEach((subArray) => {
    subArray.forEach((subscription) => {
      const vendorProfile = subscription.VendorProfile;
      if (vendorProfile !== null && vendorProfile !== undefined) {
        profileMap.set(vendorProfile, (profileMap.get(vendorProfile) || 0) + 1);
      }
    });
  });

  const profileCounts = Array.from(profileMap, ([VendorProfile, count]) => ({
    VendorProfile,
    count,
  }));

  return mapVendorProfileNames(profileCounts);
}

/**
 * Shows grid with subscription details (DOM manipulation kept for backward compatibility)
 * TODO: Refactor to React component
 */
function showGrid(profile, subscriptionJSon) {
  const chartContainer = getElementById("vendorprofile");
  const chartCanvas = getElementById("chart6");
  if (!chartContainer || !chartCanvas) return;

  chartCanvas.style.display = "none";

  const existingGridContainer = getElementById("gridContainer");
  if (existingGridContainer) {
    chartContainer.removeChild(existingGridContainer);
  }

  const gridContainer = document.createElement("div");
  gridContainer.id = "gridContainer";
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
    resetChart();
  };

  const profileMap = {
    Strategic: 0,
    Tactical: 1,
    Operational: 2,
  };

  const profileValue = profileMap[profile];
  const filteredData = [];

  subscriptionJSon.forEach((subArray) => {
    subArray.forEach((subscription) => {
      if (subscription.VendorProfile === profileValue) {
        filteredData.push(subscription);
      }
    });
  });

  const gridContent = document.createElement("div");
  Object.assign(gridContent.style, {
    fontSize: "16px",
    width: "100%",
    overflowX: "auto",
  });

  if (filteredData.length > 0) {
    const table = document.createElement("table");
    Object.assign(table.style, {
      width: "100%",
      borderCollapse: "collapse",
    });

    const headerRow = document.createElement("tr");
    const headers = ["Name", "Start Date", "End Date"];

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

      const startDateCell = document.createElement("td");
      startDateCell.innerText = new Date(
        subscription.SubscriptionStartDate
      ).toLocaleDateString();
      Object.assign(startDateCell.style, {
        border: "1px solid #dddddd",
        padding: "8px",
        fontSize: "10px",
      });
      dataRow.appendChild(startDateCell);

      const endDateCell = document.createElement("td");
      endDateCell.innerText = new Date(
        subscription.SubscriptionEndDate
      ).toLocaleDateString();
      Object.assign(endDateCell.style, {
        border: "1px solid #dddddd",
        padding: "8px",
        fontSize: "10px",
      });
      dataRow.appendChild(endDateCell);

      table.appendChild(dataRow);
    });

    gridContent.appendChild(table);
  } else {
    gridContent.innerText = `No subscriptions found for profile: ${profile}`;
  }

  gridContainer.appendChild(backButton);
  gridContainer.appendChild(gridContent);
  chartContainer.appendChild(gridContainer);
}

/**
 * Resets chart view
 */
function resetChart() {
  const chartContainer = getElementById("vendorprofile");
  const gridContainer = getElementById("gridContainer");
  const chartCanvas = getElementById("chart6");

  if (gridContainer && chartContainer) {
    chartContainer.removeChild(gridContainer);
  }
  if (chartCanvas) {
    chartCanvas.style.display = "block";
  }
}

/**
 * Sets vendor profile chart
 */
function setVendorProfileChart(chartRef, profileCounts) {
  if (!chartRef?.current) return;

  // Destroy existing chart
  destroyChart(state.chartInstance);
  const existingChart = getExistingChart(chartRef.current);
  destroyChart(existingChart);

  const ctx = chartRef.current.getContext("2d");
  if (!ctx) return;

  const hasValidData =
    profileCounts && Array.isArray(profileCounts) && profileCounts.length > 0;

  let labels = ["No Data Available"];
  let data = [0];

  if (hasValidData) {
    labels = profileCounts.map((profile) => profile.VendorProfile || "Unknown");
    data = profileCounts.map((profile) => profile.count || 0);
  }

  const maxAmount = hasValidData ? Math.max(...data) : 0;

  state.chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Vendor Profile Counts",
          data: data,
          backgroundColor: hasValidData
            ? ["#93E8FF", "#BFF1FF", "#00C2FA"]
            : ["rgba(0, 0, 0, 0.1)"],
          borderWidth: 0,
          borderRadius: 10,
          hoverBackgroundColor: hasValidData
            ? ["#93E8FF", "#BFF1FF", "#00C2FA"]
            : ["rgba(0, 0, 0, 0.2)"],
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
            maxTicksLimit: 6,
            stepSize: Math.ceil(maxAmount / 6),
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
          showGrid(profile, state.subscriptionJSon);
        }
      },
    },
  });
}

/**
 * Main data processing function
 */
export function handleDataProcessing(originalData, chartRef) {
  const lines = Array.isArray(originalData?.lines)
    ? originalData.lines
    : Array.isArray(originalData)
    ? originalData
    : [];

  if (lines.length === 0) return null;

  const transformedData = groupByVendorName(originalData.lines);
  state.subscriptionJSonBackup = transformedData;
  state.subscriptionJSon = JSON.parse(JSON.stringify(transformedData));

  const filteredSubscriptions = filterSubscriptionsByCurrentYear(
    state.subscriptionJSon
  );
  state.vendorProfileCounts = processVendorProfiles(filteredSubscriptions);

  countByVendorName(state.subscriptionJSon);
  setVendorProfileChart(chartRef, state.vendorProfileCounts);

  return {
    subscriptionJSon: state.subscriptionJSon,
    vendorProfileCounts: state.vendorProfileCounts,
  };
}
