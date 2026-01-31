import Chart from "chart.js/auto";
import { useEffect, useMemo, useRef } from "react";
import { useReportsPageStore } from "../../../stores";

const VENDOR_CHART_COLORS = [
  "#CCD6EB",
  "#E1FFBB",
  "#1D225D",
  "#BFF1FF",
  "#CFE1FF",
  "#D4F1F4",
  "#E1DBFE",
  "#1D225D",
  "#0891B2",
  "#CCD6EB",
  "#E1DBFE",
];

const DEPARTMENT_BAR_COLORS = ["#E1DBFE", "#BFF1FF", "#E1FFBB", "#EAECF0", "#CFE1FF", "#BFF1FF"];
const MOST_EXP_COLORS = ["#E1DBFE", "#E1FFBB", "#BFF1FF", "#CFE1FF"];

const getVendorLabel = (entry) =>
  entry.vendor ?? entry.name ?? entry.vendorName ?? "Unknown vendor";

const getVendorValue = (entry) => entry.count ?? entry.value ?? entry.amount ?? 0;

const getDepartmentLabel = (entry) =>
  entry?.department ?? entry?.name ?? entry?.DepartmentNames?.Name ?? "Unknown department";

const getDepartmentValue = (entry) =>
  entry?.value ?? entry?.amount ?? entry?.SubscriptionContractAmount?.Value ?? 0;
const MONTHLY_LABELS = [
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
const MONTHLY_VENDORS = {
  0: { label: "Strategic", color: "#7259F6" },
  1: { label: "Tactical", color: "#00C2FA" },
  2: { label: "Operational", color: "#AFFF4A" },
};

const createMonthlyDatasetTemplate = () =>
  Object.values(MONTHLY_VENDORS).map((config) => ({
    label: config.label,
    data: new Array(MONTHLY_LABELS.length).fill(0),
    borderColor: config.color,
    backgroundColor: "transparent",
    fill: false,
    tension: 0.4,
    pointRadius: 3,
    pointBorderColor: config.color,
    pointBackgroundColor: "transparent",
    pointHoverRadius: 5,
    pointHoverBackgroundColor: "#ffffff",
    pointHoverBorderColor: config.color,
    borderWidth: 2,
  }));

const Financial = ({
  departmentChartRef: externalDepartmentChartRef,
  vendorChartRef: externalVendorChartRef,
  mostExpensiveChartRef: externalMostExpensiveChartRef,
  usageAnalysisChartRef: externalUsageAnalysisChartRef,
}) => {
  const vendorCountData = useReportsPageStore((state) => state.vendorCountData);
  const spendByDepartmentChartData = useReportsPageStore(
    (state) => state.spendByDepartmentChartData
  );
  const vendorProfileAggregation = useReportsPageStore((state) => state.vendorProfileAggregation);
  const mostExpensiveAggregations = useReportsPageStore((state) => state.mostExpensiveAggregations);

  const normalizedDepartmentRecords = useMemo(
    () =>
      (spendByDepartmentChartData ?? []).flatMap((entry) => {
        if (!entry) {
          return [];
        }

        return Array.isArray(entry) ? entry.filter(Boolean) : [entry];
      }),
    [spendByDepartmentChartData]
  );

  const vendorChartEntries = useMemo(
    () =>
      vendorCountData.map((entry) => ({
        label: getVendorLabel(entry),
        value: getVendorValue(entry),
      })),
    [vendorCountData]
  );

  const departmentChartEntries = useMemo(
    () =>
      normalizedDepartmentRecords
        .map((record) => ({
          label: getDepartmentLabel(record),
          value: getDepartmentValue(record),
        }))
        .filter(Boolean),
    [normalizedDepartmentRecords]
  );

  const budgetChartData = useMemo(() => {
    const labels = normalizedDepartmentRecords.map((record) => getDepartmentLabel(record));
    const actualSpendData = normalizedDepartmentRecords.map((record) => getDepartmentValue(record));
    const budgetData = normalizedDepartmentRecords.map((record) => {
      const rawBudget =
        record?.DepartmentNames?.Budget?.Value ??
        record?.DepartmentNames?.Budget ??
        record?.budget ??
        0;

      if (rawBudget && typeof rawBudget === "object") {
        return Number(rawBudget.Value ?? 0) || 0;
      }

      return Number(rawBudget) || 0;
    });

    const maxBudget = budgetData.length ? Math.max(...budgetData) : 0;
    const minBudget = budgetData.length ? Math.min(...budgetData) : 0;
    const range = maxBudget - minBudget;
    const stepSize = range > 0 ? Math.ceil(range / 4) : Math.max(1, maxBudget || 1);

    return {
      labels,
      actualSpendData,
      budgetData,
      stepSize,
    };
  }, [normalizedDepartmentRecords]);

  const legendItems = useMemo(
    () =>
      vendorChartEntries.map((entry, index) => ({
        label: entry.label,
        color: VENDOR_CHART_COLORS[index % VENDOR_CHART_COLORS.length],
      })),
    [vendorChartEntries]
  );

  const monthlyTemplateDatasets = useMemo(() => createMonthlyDatasetTemplate(), []);

  const mostExpChartData = useMemo(() => {
    const labels = mostExpensiveAggregations.map(
      (item) => item.SubscriptionName || "Unknown subscription"
    );
    const data = mostExpensiveAggregations.map(
      (item) => item.SubscriptionContractAmount?.Value ?? 0
    );
    const maxValue = data.length ? Math.max(...data) : 0;
    return { labels, data, maxValue };
  }, [mostExpensiveAggregations]);

  const departmentTableRows = useMemo(() => {
    const grouping = {};
    normalizedDepartmentRecords.forEach((record) => {
      const team = getDepartmentLabel(record);
      const value = getDepartmentValue(record);
      const budget =
        Number(record?.DepartmentNames?.Budget ?? record?.DepartmentNames?.Budget?.Value ?? 0) || 0;

      if (!grouping[team]) {
        grouping[team] = { team, actual: 0, budget };
      }

      grouping[team].actual += value;
      if (!grouping[team].budget && budget) {
        grouping[team].budget = budget;
      }
    });

    return Object.values(grouping);
  }, [normalizedDepartmentRecords]);

  const categorySummary = useReportsPageStore((state) => state.categorySummary);
  const categoryRows = useMemo(
    () =>
      (categorySummary || []).map((item) => ({
        category: item.category || "Unknown",
        accumulatedAmount: item.accumulatedAmount || 0,
        count: item.count || 0,
      })),
    [categorySummary]
  );

  useEffect(() => {
    if (!categorySummary || !categorySummary.length) return;
  }, [categorySummary]);

  const internalDepartmentChartRef = useRef(null);
  const departmentChartInstanceRef = useRef(null);
  const internalVendorChartRef = useRef(null);
  const vendorChartInstanceRef = useRef(null);
  const subscriptionTypeChartRef = useRef(null);
  const subscriptionTypeChartInstanceRef = useRef(null);
  const budgetVsActualChartRef = useRef(null);
  const budgetVsActualChartInstanceRef = useRef(null);
  const internalMostExpensiveChartRef = useRef(null);
  const mostExpensiveChartInstanceRef = useRef(null);
  const internalUsageAnalysisChartRef = useRef(null);
  const usageAnalysisChartInstanceRef = useRef(null);

  const departmentChartRef = externalDepartmentChartRef ?? internalDepartmentChartRef;
  const vendorChartRef = externalVendorChartRef ?? internalVendorChartRef;
  const mostExpensiveChartRef = externalMostExpensiveChartRef ?? internalMostExpensiveChartRef;
  const usageAnalysisChartRef = externalUsageAnalysisChartRef ?? internalUsageAnalysisChartRef;

  // Spent By Department Chart
  useEffect(() => {
    if (!departmentChartRef.current) return;

    const ctx = departmentChartRef.current.getContext("2d");
    departmentChartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Spend by Department",
            data: [],
            backgroundColor: [],
            borderWidth: 0,
            borderRadius: 20,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "#f3f4f6",
              drawBorder: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 12,
              },
              callback: function (value) {
                return "$" + value.toLocaleString();
              },
            },
          },
        },
      },
    });

    return () => {
      if (departmentChartInstanceRef.current) {
        departmentChartInstanceRef.current.destroy();
        departmentChartInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!departmentChartInstanceRef.current) return;

    const labels = departmentChartEntries.map((entry) => entry.label);
    const values = departmentChartEntries.map((entry) => entry.value);
    const backgroundColor = labels.map(
      (_, index) => DEPARTMENT_BAR_COLORS[index % DEPARTMENT_BAR_COLORS.length]
    );

    departmentChartInstanceRef.current.data.labels = labels;
    departmentChartInstanceRef.current.data.datasets[0].data = values;
    departmentChartInstanceRef.current.data.datasets[0].backgroundColor = backgroundColor;
    if (values.length) {
      departmentChartInstanceRef.current.options.scales.y.max = Math.max(...values) * 1.2;
    } else {
      delete departmentChartInstanceRef.current.options.scales.y.max;
    }
    departmentChartInstanceRef.current.update();
  }, [departmentChartEntries]);

  // Vendor Donut Chart
  useEffect(() => {
    if (!vendorChartRef.current) return;

    const ctx = vendorChartRef.current.getContext("2d");

    vendorChartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "70%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            cornerRadius: 8,
          },
        },
      },
    });

    return () => {
      if (vendorChartInstanceRef.current) {
        vendorChartInstanceRef.current.destroy();
        vendorChartInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!vendorChartInstanceRef.current) return;

    const labels = vendorChartEntries.map((entry) => entry.label);
    const values = vendorChartEntries.map((entry) => entry.value);
    const backgroundColor = labels.map(
      (_, index) => VENDOR_CHART_COLORS[index % VENDOR_CHART_COLORS.length]
    );

    vendorChartInstanceRef.current.data.labels = labels;
    vendorChartInstanceRef.current.data.datasets[0].data = values;
    vendorChartInstanceRef.current.data.datasets[0].backgroundColor = backgroundColor;
    vendorChartInstanceRef.current.update();
  }, [vendorChartEntries]);

  const monthlySpendChartData = useMemo(() => {
    const datasetMapping = Object.entries(MONTHLY_VENDORS).reduce((acc, [key, config]) => {
      acc[key] = {
        label: config.label,
        data: new Array(MONTHLY_LABELS.length).fill(0),
        borderColor: config.color,
        backgroundColor: "transparent",
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointBorderColor: config.color,
        pointBackgroundColor: "transparent",
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#ffffff",
        pointHoverBorderColor: config.color,
        borderWidth: 2,
      };
      return acc;
    }, {});

    const monthIndexMapping = MONTHLY_LABELS.reduce((acc, month, index) => {
      acc[month] = index;
      return acc;
    }, {});

    (vendorProfileAggregation || []).forEach(
      ({ VendorProfile, SubscriptionContractAmount, Month }) => {
        const monthIndex = monthIndexMapping[Month];
        const dataset = datasetMapping[VendorProfile];
        const value = SubscriptionContractAmount?.Value ?? 0;
        if (dataset && monthIndex !== undefined) {
          dataset.data[monthIndex] = value;
        }
      }
    );

    const datasets = Object.values(datasetMapping);
    const allValues = datasets.flatMap((dataset) => dataset.data);
    const maxSpend = allValues.length ? Math.max(...allValues) : 0;
    const minSpend = allValues.length ? Math.min(...allValues) : 0;
    const range = maxSpend - minSpend;
    const stepSize = range > 0 ? Math.ceil(range / 4) : 1;

    return {
      labels: MONTHLY_LABELS,
      datasets,
      stepSize,
    };
  }, [vendorProfileAggregation]);

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: "#00021D",
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#00021D",
          font: {
            size: 12,
          },
          callback: (value) => "$" + value.toLocaleString(),
        },
        grid: {
          display: true,
          color: "#EAECF0",
          drawBorder: true,
        },
        border: {
          color: "#FFFFFF",
          width: 1,
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          color: "#000000",
          font: {
            size: 12,
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.borderColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              hidden: !chart.isDatasetVisible(i),
              index: i,
            }));
          },
        },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#000000",
        bodyColor: "#000000",
        borderColor: "#7259F6",
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const rawValue = context.parsed?.y ?? context.parsed;
            return (
              context.dataset.label + ": $" + (rawValue ? Number(rawValue).toLocaleString() : "0")
            );
          },
        },
      },
    },
  };

  useEffect(() => {
    if (!subscriptionTypeChartRef.current) return;

    const ctx = subscriptionTypeChartRef.current.getContext("2d");
    subscriptionTypeChartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: MONTHLY_LABELS,
        datasets: monthlyTemplateDatasets,
      },
      options: monthlyChartOptions,
    });

    return () => {
      if (subscriptionTypeChartInstanceRef.current) {
        subscriptionTypeChartInstanceRef.current.destroy();
        subscriptionTypeChartInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!subscriptionTypeChartInstanceRef.current) return;

    const chart = subscriptionTypeChartInstanceRef.current;
    chart.data.labels = monthlySpendChartData.labels;
    chart.data.datasets = monthlySpendChartData.datasets;
    chart.options.scales.y.ticks.stepSize = monthlySpendChartData.stepSize;
    chart.update();
  }, [monthlySpendChartData]);

  const budgetChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: "#00021D",
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#00021D",
          font: {
            size: 12,
          },
          callback: function (value) {
            return "$" + value;
          },
        },
        grid: {
          display: true,
          color: "#EAECF0",
          drawBorder: true,
        },
        border: {
          color: "#FFFFFF",
          width: 1,
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          color: "#000000",
          font: {
            size: 12,
          },
          generateLabels: function (chart) {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.borderColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              hidden: !chart.isDatasetVisible(i),
              index: i,
            }));
          },
        },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#000000",
        bodyColor: "#000000",
        borderColor: "#7259F6",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const rawValue = context.parsed?.y ?? context.parsed;
            return (
              context.dataset.label + ": $" + (rawValue ? Number(rawValue).toLocaleString() : "0")
            );
          },
        },
      },
    },
  };

  // Budget vs Actual Area Chart
  useEffect(() => {
    if (!budgetVsActualChartRef.current) return;

    const ctx = budgetVsActualChartRef.current.getContext("2d");
    const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
    gradient1.addColorStop(0, "rgba(114, 89, 246, 0.5)");
    gradient1.addColorStop(1, "rgba(114, 89, 246, 0)");
    const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
    gradient2.addColorStop(0, "rgba(0, 194, 250, 0.5)");
    gradient2.addColorStop(1, "rgba(0, 194, 250, 0)");

    budgetVsActualChartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Budget",
            data: [],
            borderColor: "#7259F6",
            backgroundColor: gradient1,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBorderColor: "#7259F6",
            pointBackgroundColor: "transparent",
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#ffffff",
            pointHoverBorderColor: "#7259F6",
            borderWidth: 2,
          },
          {
            label: "Actual Spend",
            data: [],
            borderColor: "#00C2FA",
            backgroundColor: gradient2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBorderColor: "#00C2FA",
            pointBackgroundColor: "transparent",
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#ffffff",
            pointHoverBorderColor: "#00C2FA",
            borderWidth: 2,
          },
        ],
      },
      options: budgetChartOptions,
    });

    return () => {
      if (budgetVsActualChartInstanceRef.current) {
        budgetVsActualChartInstanceRef.current.destroy();
        budgetVsActualChartInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!budgetVsActualChartInstanceRef.current) return;

    const chart = budgetVsActualChartInstanceRef.current;
    const { labels, actualSpendData, budgetData, stepSize } = budgetChartData;
    chart.data.labels = labels;
    chart.data.datasets[0].data = budgetData;
    chart.data.datasets[1].data = actualSpendData;
    chart.options.scales.y.ticks.stepSize = stepSize;
    chart.update();
  }, [budgetChartData]);

  // Most Expensive Subscriptions Bar Chart
  useEffect(() => {
    if (!mostExpensiveChartRef.current) return;

    const ctx = mostExpensiveChartRef.current.getContext("2d");
    mostExpensiveChartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Most Expensive Subscriptions",
            data: [],
            backgroundColor: ["#E1DBFE", "#E1FFBB", "#BFF1FF", "#CFE1FF"],
            borderWidth: 0,
            borderRadius: 20,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "#f3f4f6",
              drawBorder: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 12,
              },
              callback: function (value) {
                return "$" + value.toLocaleString();
              },
            },
          },
        },
      },
    });

    return () => {
      if (mostExpensiveChartInstanceRef.current) {
        mostExpensiveChartInstanceRef.current.destroy();
        mostExpensiveChartInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mostExpensiveChartInstanceRef.current) return;

    const chart = mostExpensiveChartInstanceRef.current;
    const { labels, data, maxValue } = mostExpChartData;
    chart.data.labels = labels;
    const dataset = chart.data.datasets[0];
    dataset.data = data;
    dataset.backgroundColor = MOST_EXP_COLORS.slice(0, data.length);
    chart.options.scales.y.max = maxValue ? Math.ceil(maxValue * 1.1) : 0;
    chart.update();
  }, [mostExpChartData]);

  // Usage Analysis Donut Chart
  useEffect(() => {
    if (usageAnalysisChartRef.current && !usageAnalysisChartInstanceRef.current) {
      const ctx = usageAnalysisChartRef.current.getContext("2d");

      usageAnalysisChartInstanceRef.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Used", "Unused"],
          datasets: [
            {
              data: [80, 20],
              backgroundColor: ["#1D225D", "rgba(147, 51, 234, 0.4)"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          cutout: "70%",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: function (context) {
                  return context.label + ": " + context.parsed + "%";
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (usageAnalysisChartInstanceRef.current) {
        usageAnalysisChartInstanceRef.current.destroy();
        usageAnalysisChartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Row: Two Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {/* Spend by Department Bar Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 lg:col-span-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
            Spend by Department
          </h2>
          <div className="relative" style={{ height: "300px", minHeight: "250px" }}>
            <canvas ref={departmentChartRef}></canvas>
          </div>
        </div>

        {/* Spend by Vendor Donut Chart */}
        <div className="bg-white rounded-xl py-4 px-2 sm:py-6 sm:px-3 shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
            Spend by Vendor
          </h2>
          <div className="flex flex-row items-center gap-3 sm:gap-4">
            <div
              className="relative flex-shrink-0"
              style={{
                height: "150px",
                width: "150px",
                minHeight: "80px",
                minWidth: "80px",
              }}
            >
              <canvas ref={vendorChartRef}></canvas>
            </div>
            <div className="flex-1 min-w-0">
              <div
                id="vendor-chart-legend"
                className="flex flex-col gap-1.5 text-xs sm:text-sm max-h-[150px]"
              >
                {legendItems.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-gray-700 truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Full Width Line Chart */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Spend by Subscription type
        </h2>
        <div className="relative" style={{ height: "300px", minHeight: "250px" }}>
          <canvas ref={subscriptionTypeChartRef}></canvas>
        </div>
      </div>

      {/* Budget vs Actual Report Chart */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Budget vs Actual Report
        </h2>
        <div className="relative" style={{ height: "300px", minHeight: "250px" }}>
          <canvas ref={budgetVsActualChartRef}></canvas>
        </div>
      </div>

      {/* Tables Row: Spend by Category (Left) and Spend by Department (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Spend by Category Table */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Spend by Category</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actual Spend
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Number of Subscriptions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {categoryRows.length === 0 ? (
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500" colSpan={3}>
                      No category data available
                    </td>
                  </tr>
                ) : (
                  categoryRows.map((row, index) => (
                    <tr key={`category-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-800">{row.category}</td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "#0891B2" }}>
                        ${row.accumulatedAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spend by Department Table */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Spend by Department</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actual Spend
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Budget
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {departmentTableRows.length === 0 ? (
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500" colSpan={3}>
                      No department data available
                    </td>
                  </tr>
                ) : (
                  departmentTableRows.map((row) => (
                    <tr key={row.team} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-800">{row.team}</td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "#0891B2" }}>
                        ${row.actual.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "#6B46C1" }}>
                        ${row.budget.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Expenditures Report Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {/* Most Expensive Subscriptions Bar Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 lg:col-span-3">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Most Expensive Subscriptions
          </h3>
          <div className="relative" style={{ height: "300px", minHeight: "250px" }}>
            <canvas ref={mostExpensiveChartRef}></canvas>
          </div>
        </div>

        {/* Usage Analysis Donut Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Usage Analysis</h3>
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <div
              className="relative flex-shrink-0 w-full max-w-[200px] sm:max-w-[250px]"
              style={{ height: "200px", minHeight: "180px" }}
            >
              <canvas ref={usageAnalysisChartRef}></canvas>
            </div>
            <div className="w-full">
              <div className="flex flex-col gap-3 items-center sm:items-start">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "#1D225D" }}
                  ></span>
                  <span className="text-sm text-gray-700">80%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "rgba(147, 51, 234, 0.4)" }}
                  ></span>
                  <span className="text-sm text-gray-700">20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financial;
