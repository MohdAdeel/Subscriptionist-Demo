import Chart from "chart.js/auto";
import { useState, useEffect, useRef } from "react";
import { FiInfo, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  getRenewalData,
  getExpiredSubscriptions,
  getRenewalCostsData,
} from "../../../lib/api/reports/reportsApi";

const RenewalAndExpiration = ({ formatCurrency, formatDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [showMore, setShowMore] = useState(false);
  const renewalCostsChartRef = useRef(null);
  const renewalCostsChartInstanceRef = useRef(null);

  const renewalData = [
    {
      id: 1,
      name: "Activity Line console 11223",
      subscriptionAmount: 10101.0,
      startDate: "2026-03-13",
      endDate: "2026-12-13",
      paymentFrequency: "2 Months",
      activityStatus: "Inactive",
    },
    {
      id: 2,
      name: "now 1234 56565",
      subscriptionAmount: 60.0,
      startDate: "2026-02-03",
      endDate: "2026-09-02",
      paymentFrequency: "1 Monthly",
      activityStatus: "Active",
    },
    {
      id: 3,
      name: "Azure DevOps Basic3",
      subscriptionAmount: 50.0,
      startDate: "2026-02-03",
      endDate: "2026-09-02",
      paymentFrequency: "1 Monthly",
      activityStatus: "Active",
    },
    {
      id: 4,
      name: "Azure DevOps Basic5",
      subscriptionAmount: 50.0,
      startDate: "2026-02-04",
      endDate: "2026-09-03",
      paymentFrequency: "1 Monthly",
      activityStatus: "Active",
    },
  ];

  const displayedData = showMore ? renewalData : renewalData.slice(0, 3);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = (date) => {
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const days = [];
    const monthNames = [
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

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <div
          key={day}
          className="h-8 flex items-center justify-center text-sm text-gray-700"
        >
          {day}
        </div>
      );
    }

    return (
      <div>
        <div className="text-lg font-semibold text-gray-800 mb-4">
          {monthNames[date.getMonth()]} {date.getFullYear()}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={index}
              className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const getNextMonth = () => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  };

  const expiredData = [
    {
      id: 1,
      name: "Gamma Platform",
      subscriptionAmount: 18500.0,
      startDate: "2025-11-15",
      endDate: "2026-11-14",
      paymentFrequency: "12 Monthly",
      status: "Expired",
    },
    {
      id: 2,
      name: "Epsilon Suite",
      subscriptionAmount: 22000.0,
      startDate: "2025-10-01",
      endDate: "2026-09-30",
      paymentFrequency: "12 Monthly",
      status: "Expired",
    },
    {
      id: 3,
      name: "Legacy Service",
      subscriptionAmount: 15000.0,
      startDate: "2025-09-01",
      endDate: "2026-08-31",
      paymentFrequency: "12 Monthly",
      status: "Expired",
    },
  ];

  useEffect(() => {
    if (renewalCostsChartRef.current && !renewalCostsChartInstanceRef.current) {
      const ctx = renewalCostsChartRef.current.getContext("2d");

      renewalCostsChartInstanceRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["$500", "$2000"],
          datasets: [
            {
              label: "Security Patches",
              data: [15, 16],
              backgroundColor: "#93C5FD",
              borderWidth: 0,
            },
            {
              label: "AWS Networking",
              data: [17, 10],
              backgroundColor: "#3B82F6",
              borderWidth: 0,
            },
            {
              label: "Google Cloud - VM",
              data: [17, 11],
              backgroundColor: "#0EA5E9",
              borderWidth: 0,
            },
            {
              label: "Monthly Subscription",
              data: [17, 20],
              backgroundColor: "#8B5CF6",
              borderWidth: 0,
            },
          ],
        },
        options: {
          indexAxis: "y", // Horizontal bar chart
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
              beginAtZero: true,
              max: 90,
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
                stepSize: 10,
                callback: function (value) {
                  return value + "%";
                },
              },
            },
            y: {
              grid: {
                display: false,
              },
              border: {
                display: false,
              },
              ticks: {
                color: "#6b7280",
                font: {
                  size: 12,
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (renewalCostsChartInstanceRef.current) {
        renewalCostsChartInstanceRef.current.destroy();
        renewalCostsChartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Renewal Calendar Report */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Renewal Calendar Report
        </h2>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-shrink-0">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Values:
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#E1DBFE" }}
                ></span>
                <span className="text-sm text-gray-700">Not Urgent</span>
                <button className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-auto">
                  <FiInfo className="w-3 h-3 text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#9333EA" }}
                ></span>
                <span className="text-sm text-gray-700">Urgently</span>
                <button className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-auto">
                  <FiInfo className="w-3 h-3 text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#6B21A8" }}
                ></span>
                <span className="text-sm text-gray-700">Very Urgently</span>
                <button className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-auto">
                  <FiInfo className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderCalendar(currentMonth)}
              {renderCalendar(getNextMonth())}
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Analysis Report */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Renewal Analysis Report
        </h2>
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Subscription Nearing Renewal
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#EAECF0] sticky top-0 z-10">
                <tr>
                  <th className="px-4 sm:px-6 py-3 pt-6 text-left text-xs sm:text-sm font-medium text-gray-700">
                    Name
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
                {displayedData.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-800">
                      {subscription.name}
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
          {renewalData.length > 3 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowMore(!showMore)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              >
                Show More
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Renewal costs and usage evaluation
        </h3>
        <div
          className="relative"
          style={{ height: "300px", minHeight: "250px" }}
        >
          <canvas ref={renewalCostsChartRef}></canvas>
        </div>
      </div>
      {/* Expired Subscription Report */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Expired Subscription Report
        </h2>
        <div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#EAECF0] sticky top-0 z-10">
                <tr>
                  <th className="px-4 sm:px-6 py-3 pt-6 text-left text-xs sm:text-sm font-medium text-gray-700">
                    Name
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
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expiredData.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-800">
                      {subscription.name}
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
                      {subscription.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalAndExpiration;
