import Chart from "chart.js/auto";
import { FiRefreshCw, FiInfo } from "react-icons/fi";
import { useReportsPageStore } from "../../../stores";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";

const StandardReports = ({ formatCurrency, formatDate }) => {
  const formatTopCardValue = (value) => {
    const numericValue = value === null || value === undefined ? 0 : Number(value);
    if (Number.isNaN(numericValue)) return "0";
    return numericValue.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  //   const formatTopCardValue = (value) => {
  //   const numericValue =
  //     value === null || value === undefined ? 0 : Number(value);
  //   if (Number.isNaN(numericValue)) return "0";
  //   return numericValue.toLocaleString("en-IN", {
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 2,
  //   });
  // };

  const TopCards = useReportsPageStore((state) => state.TopCards);
  const monthlySpendChartData = useReportsPageStore((state) => state.monthlySpendChartData);
  const subscriptionTableData = useReportsPageStore((state) => state.subscriptionTableData);
  const activeSubscriptionTab = useReportsPageStore((state) => state.activeSubscriptionTab);
  const setActiveSubscriptionTab = useReportsPageStore((state) => state.setActiveSubscriptionTab);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const tabButtonsRef = useRef({});
  const tabsContainerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Memoized function to create gradient
  const createGradient = useCallback((ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(114, 89, 246, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    return gradient;
  }, []);

  // Calculate step size for y-axis ticks
  const calculateStepSize = useCallback((data) => {
    if (!data || data.length === 0) return 1;
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue;
    return range > 0 ? Math.ceil(range / 3) : 1;
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    const labels = monthlySpendChartData.labels;
    const data = monthlySpendChartData.data;

    // Destroy previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    // Don't create chart if there's no data
    if (!labels.length || !data.length) return;

    const gradient = createGradient(ctx);
    const stepSize = calculateStepSize(data);

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Monthly Spend",
            data: data,
            fill: true,
            backgroundColor: gradient,
            borderColor: "#7259F6",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#ffffff",
            pointHoverBorderColor: "#7259F6",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#475467",
              font: {
                size: 12,
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
              font: {
                size: 12,
              },
              stepSize: stepSize,
              callback: function (value) {
                return "$" + value.toLocaleString();
              },
            },
            border: {
              color: "#FFFFFF",
              width: 0,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#ffffff",
            titleColor: "#000000",
            bodyColor: "#000000",
            borderColor: "#7259F6",
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

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [monthlySpendChartData, createGradient, calculateStepSize]);

  // Filter subscriptions based on active tab using useMemo for performance
  const filteredSubscriptions = useMemo(() => {
    if (!subscriptionTableData || subscriptionTableData.length === 0) {
      return [];
    }

    return subscriptionTableData.filter((sub) => {
      if (activeSubscriptionTab === "all") return true;
      if (activeSubscriptionTab === "active") return sub.activityStatus === "Active";
      if (activeSubscriptionTab === "expired") return sub.activityStatus === "Expired";
      return true;
    });
  }, [subscriptionTableData, activeSubscriptionTab]);

  // Update indicator position when tab changes
  useEffect(() => {
    const activeButton = tabButtonsRef.current[activeSubscriptionTab];
    const container = tabsContainerRef.current;

    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [activeSubscriptionTab]);

  // Handle tab change with animation
  const handleTabChange = useCallback(
    (tab) => {
      if (tab === activeSubscriptionTab) return;
      setActiveSubscriptionTab(tab);
    },
    [setActiveSubscriptionTab, activeSubscriptionTab]
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {/* Total Active Cost */}
        <div className="bg-[#D4F1F4] rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiRefreshCw className="w-6 h-6 text-teal-600" />
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <FiInfo className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Active Cost</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">
            ${formatTopCardValue(TopCards.totalContractAmount)}
          </p>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-[#BFF1FF] rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiRefreshCw className="w-6 h-6 text-blue-600" />
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <FiInfo className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Active Subscriptions</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{TopCards.ActiveCount}</p>
        </div>

        {/* Upcoming Renewal */}
        <div className="bg-[#E1FFBB] rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiRefreshCw className="w-6 h-6 text-yellow-600" />
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <FiInfo className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Upcoming Renewal</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">
            ${formatTopCardValue(TopCards.totalContractAmountFuture)}
          </p>
        </div>

        {/* Cost Savings Identified */}
        <div className="bg-[#CFE1FF] rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiRefreshCw className="w-6 h-6 text-purple-600" />
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <FiInfo className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Cost Savings Identified</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">0</p>
        </div>
      </div>

      {/* Monthly Spend Chart */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Monthly Spend
        </h2>
        <div className="relative" style={{ height: "300px", minHeight: "250px" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Subscription Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {/* Table Tabs */}
        <div className="border-b border-gray-200 px-4 sm:px-6 pt-4">
          <div ref={tabsContainerRef} className="relative flex gap-6 sm:gap-8 overflow-x-auto">
            {/* Animated sliding indicator */}
            <div
              className="absolute bottom-0 h-0.5 bg-indigo-700 transition-all duration-300 ease-in-out"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />

            <button
              ref={(el) => (tabButtonsRef.current["all"] = el)}
              onClick={() => handleTabChange("all")}
              className={`relative pb-3 px-1 text-sm sm:text-base font-medium transition-all duration-300 whitespace-nowrap ${
                activeSubscriptionTab === "all"
                  ? "text-gray-900 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Subscriptions
            </button>
            <button
              ref={(el) => (tabButtonsRef.current["active"] = el)}
              onClick={() => handleTabChange("active")}
              className={`relative pb-3 px-1 text-sm sm:text-base font-medium transition-all duration-300 whitespace-nowrap ${
                activeSubscriptionTab === "active"
                  ? "text-gray-900 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Active Subscriptions
            </button>
            <button
              ref={(el) => (tabButtonsRef.current["expired"] = el)}
              onClick={() => handleTabChange("expired")}
              className={`relative pb-3 px-1 text-sm sm:text-base font-medium transition-all duration-300 whitespace-nowrap ${
                activeSubscriptionTab === "expired"
                  ? "text-gray-900 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Expired Subscriptions
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="max-h-[600px] overflow-y-auto overflow-x-hidden">
          <div key={activeSubscriptionTab} className="animate-fadeIn">
            <table className="w-full">
              <thead className="bg-[#EAECF0] sticky top-0 z-10">
                <tr>
                  <th className="px-4 sm:px-6 py-3 pt-6 text-left text-xs sm:text-sm font-medium text-gray-700">
                    Subscription Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 pt-6 text-left text-xs sm:text-sm font-medium text-gray-700">
                    Vendor Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 pt-6 text-left text-xs sm:text-sm font-medium text-gray-700">
                    Subscription Amount
                  </th>
                  <th className="px-4 sm:px-6 py-3 pt-6 text-left text-xs sm:text-sm font-medium text-gray-700">
                    Start Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 pt-6 text-left text-xs sm:text-sm font-medium text-gray-700">
                    End Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 pt-6 text-left text-xs sm:text-sm font-medium text-gray-700">
                    Payment Frequency
                  </th>
                  <th className="px-4 sm:px-6 py-3 pt-6 text-left text-xs sm:text-sm font-medium text-gray-700">
                    Activity Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubscriptions.length === 0 ? (
                  <tr className="animate-fadeIn">
                    <td colSpan={7} className="px-4 sm:px-6 py-12 text-center">
                      <p className="text-gray-500 text-sm">
                        {activeSubscriptionTab === "all"
                          ? "No subscriptions found"
                          : activeSubscriptionTab === "active"
                            ? "No active subscriptions found"
                            : "No expired subscriptions found"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((subscription, index) => (
                    <tr
                      key={`${activeSubscriptionTab}-${subscription.id}-${index}`}
                      className="table-row-enter hover:bg-gray-50 transition-colors"
                      style={{
                        animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
                      }}
                    >
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-800">
                        {subscription.subscriptionName}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-800">
                        {subscription.vendorName}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 text-sm font-medium"
                        style={{ color: "#6B46C1" }}
                      >
                        {formatCurrency(subscription.subscriptionAmount)}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 text-sm font-medium"
                        style={{ color: "#0891B2" }}
                      >
                        {formatDate(subscription.startDate)}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 text-sm font-medium"
                        style={{ color: "#0891B2" }}
                      >
                        {formatDate(subscription.endDate)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-800">
                        {subscription.paymentFrequency}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-800">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            subscription.activityStatus === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {subscription.activityStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default StandardReports;
