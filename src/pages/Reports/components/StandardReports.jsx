import Chart from "chart.js/auto";
import { useEffect, useRef, useState } from "react";
import { FiRefreshCw, FiInfo } from "react-icons/fi";

const StandardReports = ({
  kpiData,
  subscriptionData,
  formatCurrency,
  formatDate,
}) => {
  const [subscriptionTableTab, setSubscriptionTableTab] = useState("all");
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (chartRef.current && !chartInstanceRef.current) {
      const ctx = chartRef.current.getContext("2d");

      const chartData = {
        labels: [
          "Jan 2026",
          "Feb 2026",
          "Mar 2026",
          "Apr 2026",
          "May 2026",
          "Jun 2026",
          "Jul 2026",
          "Aug 2026",
          "Sep 2026",
          "Oct 2026",
          "Nov 2026",
          "Dec 2026",
        ],
        datasets: [
          {
            label: "Subscription Tenure",
            data: [
              31137, 10379, 31137, 10379, 31137, 10379, 31137, 10379, 31137,
              10379, 31137, 10379,
            ],
            borderColor: "rgb(147, 51, 234)",
            backgroundColor: "rgba(147, 51, 234, 0.15)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: "rgb(147, 51, 234)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointHoverRadius: 6,
          },
        ],
      };

      chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: chartData,
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
              titleFont: {
                size: 14,
                weight: "bold",
              },
              bodyFont: {
                size: 13,
              },
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
              suggestedMax: 35000,
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
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  const filteredSubscriptions = subscriptionData.filter((sub) => {
    if (subscriptionTableTab === "all") return true;
    if (subscriptionTableTab === "active")
      return sub.activityStatus === "Active";
    if (subscriptionTableTab === "expired")
      return sub.activityStatus === "Expired";
    return false;
  });

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
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Total Active Cost
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">
            {formatCurrency(kpiData.totalActiveCost)}
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
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Active Subscriptions
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">
            {kpiData.activeSubscriptions}
          </p>
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
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Upcoming Renewal
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">
            {formatCurrency(kpiData.upcomingRenewal)}
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
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Cost Savings Identified
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">
            {formatCurrency(kpiData.costSavingsIdentified)}
          </p>
        </div>
      </div>

      {/* Subscription Tenure Chart */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Subscription Tenure
        </h2>
        <div
          className="relative"
          style={{ height: "300px", minHeight: "250px" }}
        >
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Subscription Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {/* Table Tabs */}
        <div className="border-b border-gray-200 px-4 sm:px-6 pt-4">
          <div className="flex gap-6 sm:gap-8 overflow-x-auto">
            <button
              onClick={() => setSubscriptionTableTab("all")}
              className={`pb-3 px-1 text-sm sm:text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
                subscriptionTableTab === "all"
                  ? "border-indigo-700 text-gray-900 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              All Subscriptions
            </button>
            <button
              onClick={() => setSubscriptionTableTab("active")}
              className={`pb-3 px-1 text-sm sm:text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
                subscriptionTableTab === "active"
                  ? "border-indigo-700 text-gray-900 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Active Subscriptions
            </button>
            <button
              onClick={() => setSubscriptionTableTab("expired")}
              className={`pb-3 px-1 text-sm sm:text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
                subscriptionTableTab === "expired"
                  ? "border-indigo-700 text-gray-900 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Expired Subscriptions
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="max-h-[600px] overflow-y-auto overflow-x-hidden">
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
              {filteredSubscriptions.map((subscription) => (
                <tr
                  key={subscription.id}
                  className="hover:bg-gray-50 transition-colors"
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
                    {subscription.activityStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default StandardReports;
