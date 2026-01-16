import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const Financial = () => {
  const departmentChartRef = useRef(null);
  const departmentChartInstanceRef = useRef(null);
  const vendorChartRef = useRef(null);
  const vendorChartInstanceRef = useRef(null);
  const subscriptionTypeChartRef = useRef(null);
  const subscriptionTypeChartInstanceRef = useRef(null);
  const budgetVsActualChartRef = useRef(null);
  const budgetVsActualChartInstanceRef = useRef(null);
  const mostExpensiveChartRef = useRef(null);
  const mostExpensiveChartInstanceRef = useRef(null);
  const usageAnalysisChartRef = useRef(null);
  const usageAnalysisChartInstanceRef = useRef(null);

  // Department Bar Chart
  useEffect(() => {
    if (departmentChartRef.current && !departmentChartInstanceRef.current) {
      const ctx = departmentChartRef.current.getContext("2d");

      departmentChartInstanceRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Marketing", "Finance"],
          datasets: [
            {
              label: "Spend by Department",
              data: [60606, 2020],
              backgroundColor: ["rgb(147, 51, 234)", "rgb(34, 211, 238)"],
              borderWidth: 0,
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
              max: 80808,
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
                stepSize: 20202,
                callback: function (value) {
                  return "$" + value.toLocaleString();
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (departmentChartInstanceRef.current) {
        departmentChartInstanceRef.current.destroy();
        departmentChartInstanceRef.current = null;
      }
    };
  }, []);

  // Vendor Donut Chart
  useEffect(() => {
    if (vendorChartRef.current && !vendorChartInstanceRef.current) {
      const ctx = vendorChartRef.current.getContext("2d");

      const vendorData = [
        { vendor: "Test Subscription", value: 15000 },
        { vendor: "new vendor1", value: 25000 },
        { vendor: "test", value: 20000 },
        { vendor: "test consol;e2", value: 12000 },
        { vendor: "test new 4", value: 10000 },
        { vendor: "test new 5", value: 8000 },
        { vendor: "test 11", value: 6000 },
        { vendor: "subscription new22", value: 18000 },
        { vendor: "new 2323", value: 5000 },
        { vendor: "Test Vendor", value: 4000 },
        { vendor: "Test New Azure", value: 3000 },
      ];

      const backgroundColors = [
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

      vendorChartInstanceRef.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: vendorData.map((x) => x.vendor),
          datasets: [
            {
              data: vendorData.map((x) => x.value),
              backgroundColor: vendorData.map(
                (_, i) => backgroundColors[i % backgroundColors.length]
              ),
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
    }

    return () => {
      if (vendorChartInstanceRef.current) {
        vendorChartInstanceRef.current.destroy();
        vendorChartInstanceRef.current = null;
      }
    };
  }, []);

  // Subscription Type Line Chart
  useEffect(() => {
    if (
      subscriptionTypeChartRef.current &&
      !subscriptionTypeChartInstanceRef.current
    ) {
      const ctx = subscriptionTypeChartRef.current.getContext("2d");

      subscriptionTypeChartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: [
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
          ],
          datasets: [
            {
              label: "Strategic",
              data: [
                10312, 0, 10312, 0, 10312, 0, 10312, 0, 10312, 0, 10312, 0,
              ],
              borderColor: "rgb(147, 51, 234)",
              backgroundColor: "rgba(147, 51, 234, 0.1)",
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: "rgb(147, 51, 234)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
            {
              label: "Tactical",
              data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              borderColor: "rgb(34, 211, 238)",
              backgroundColor: "rgba(34, 211, 238, 0.1)",
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: "rgb(34, 211, 238)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
            {
              label: "Operational",
              data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              borderColor: "rgb(34, 197, 94)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: "rgb(34, 197, 94)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
              align: "end",
              labels: {
                usePointStyle: true,
                padding: 15,
                font: {
                  size: 12,
                },
              },
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
                display: true,
                color: "#e5e7eb",
              },
              ticks: {
                color: "#6b7280",
                font: {
                  size: 12,
                },
              },
            },
            y: {
              beginAtZero: true,
              max: 12000,
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
                stepSize: 2578,
                callback: function (value) {
                  return "$" + value.toLocaleString();
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (subscriptionTypeChartInstanceRef.current) {
        subscriptionTypeChartInstanceRef.current.destroy();
        subscriptionTypeChartInstanceRef.current = null;
      }
    };
  }, []);

  // Budget vs Actual Area Chart
  useEffect(() => {
    if (
      budgetVsActualChartRef.current &&
      !budgetVsActualChartInstanceRef.current
    ) {
      const ctx = budgetVsActualChartRef.current.getContext("2d");

      budgetVsActualChartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Marketing", "Finance"],
          datasets: [
            {
              label: "Budget",
              data: [120000, 72000],
              borderColor: "rgb(147, 51, 234)",
              backgroundColor: "rgba(147, 51, 234, 0.2)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: "rgb(147, 51, 234)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
            {
              label: "Actual Spend",
              data: [60606, 880],
              borderColor: "rgb(34, 211, 238)",
              backgroundColor: "rgba(34, 211, 238, 0.2)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: "rgb(34, 211, 238)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
              align: "end",
              labels: {
                usePointStyle: true,
                padding: 15,
                font: {
                  size: 12,
                },
              },
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
                display: true,
                color: "#e5e7eb",
              },
              ticks: {
                color: "#6b7280",
                font: {
                  size: 12,
                },
              },
            },
            y: {
              beginAtZero: true,
              max: 120000,
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
                stepSize: 12000,
                callback: function (value) {
                  return "$" + value.toLocaleString();
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (budgetVsActualChartInstanceRef.current) {
        budgetVsActualChartInstanceRef.current.destroy();
        budgetVsActualChartInstanceRef.current = null;
      }
    };
  }, []);

  // Most Expensive Subscriptions Bar Chart
  useEffect(() => {
    if (
      mostExpensiveChartRef.current &&
      !mostExpensiveChartInstanceRef.current
    ) {
      const ctx = mostExpensiveChartRef.current.getContext("2d");

      mostExpensiveChartInstanceRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: [
            "Activity Line console 11223",
            "now 1234 56565",
            "Azure DevOps Basic3",
            "Azure DevOps Basic5",
          ],
          datasets: [
            {
              label: "Most Expensive Subscriptions",
              data: [60000, 0, 0, 0],
              backgroundColor: "rgba(147, 51, 234, 0.6)",
              borderColor: "rgb(147, 51, 234)",
              borderWidth: 0,
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
              max: 80808,
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
                stepSize: 20202,
                callback: function (value) {
                  return "$" + value.toLocaleString();
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (mostExpensiveChartInstanceRef.current) {
        mostExpensiveChartInstanceRef.current.destroy();
        mostExpensiveChartInstanceRef.current = null;
      }
    };
  }, []);

  // Usage Analysis Donut Chart
  useEffect(() => {
    if (
      usageAnalysisChartRef.current &&
      !usageAnalysisChartInstanceRef.current
    ) {
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Spend by Department Bar Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 lg:col-span-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
            Spend by Department
          </h2>
          <div
            className="relative"
            style={{ height: "300px", minHeight: "250px" }}
          >
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
                {[
                  { vendor: "Test Subscription", color: "#CCD6EB" },
                  { vendor: "new vendor1", color: "#E1FFBB" },
                  { vendor: "test", color: "#1D225D" },
                  { vendor: "test consol;e2", color: "#BFF1FF" },
                  { vendor: "test new 4", color: "#CFE1FF" },
                  { vendor: "test new 5", color: "#D4F1F4" },
                  { vendor: "test 11", color: "#E1DBFE" },
                  { vendor: "subscription new22", color: "#1D225D" },
                  { vendor: "new 2323", color: "#0891B2" },
                  { vendor: "Test Vendor", color: "#CCD6EB" },
                  { vendor: "Test New Azure", color: "#E1DBFE" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-gray-700 truncate">
                      {item.vendor}
                    </span>
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
        <div
          className="relative"
          style={{ height: "300px", minHeight: "250px" }}
        >
          <canvas ref={subscriptionTypeChartRef}></canvas>
        </div>
      </div>

      {/* Budget vs Actual Report Chart */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Budget vs Actual Report
        </h2>
        <div
          className="relative"
          style={{ height: "300px", minHeight: "250px" }}
        >
          <canvas ref={budgetVsActualChartRef}></canvas>
        </div>
      </div>

      {/* Tables Row: Spend by Category (Left) and Spend by Department (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Category Table */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Spend by Category
          </h3>
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
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-800">
                    Pay-as-You-Go Subscription
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-medium"
                    style={{ color: "#0891B2" }}
                  >
                    $101.00
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Spend by Department Table */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Spend by Department
          </h3>
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
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-800">Marketing</td>
                  <td
                    className="px-4 py-3 text-sm font-medium"
                    style={{ color: "#0891B2" }}
                  >
                    $60,606
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-medium"
                    style={{ color: "#6B46C1" }}
                  >
                    $120,000
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-800">Finance</td>
                  <td
                    className="px-4 py-3 text-sm font-medium"
                    style={{ color: "#0891B2" }}
                  >
                    $880
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-medium"
                    style={{ color: "#6B46C1" }}
                  >
                    $72,000
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Expenditures Report Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Most Expensive Subscriptions Bar Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 lg:col-span-3">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Most Expensive Subscriptions
          </h3>
          <div
            className="relative"
            style={{ height: "300px", minHeight: "250px" }}
          >
            <canvas ref={mostExpensiveChartRef}></canvas>
          </div>
        </div>

        {/* Usage Analysis Donut Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Usage Analysis
          </h3>
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
