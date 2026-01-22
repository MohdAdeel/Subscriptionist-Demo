import Chart from "chart.js/auto";
import { useMemo, useState, useEffect, useRef } from "react";
import { useReportsPageStore } from "../../../stores";
import { FiInfo, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const RenewalAndExpiration = ({
  formatCurrency,
  formatDate,
  renewalCostsChartRef: externalRenewalCostsChartRef,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [showMore, setShowMore] = useState(false);
  const internalRenewalCostsChartRef = useRef(null);
  const renewalCostsChartRef = externalRenewalCostsChartRef ?? internalRenewalCostsChartRef;
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

  const categorizedSubscriptions = useReportsPageStore((state) => state.categorizedSubscriptions);
  const nearingRenewalData = useReportsPageStore((state) => state.nearingRenewalData);
  const expiredSubscriptionsData = useReportsPageStore((state) => state.expiredSubscriptionsData);
  const [hoveredDateDetails, setHoveredDateDetails] = useState(null);

  const getStatusLabel = (status) => {
    if (status === 0) return "Active";
    if (status === 1) return "Expired";
    return "Inactive";
  };

  const expirationRows = useMemo(() => {
    return (expiredSubscriptionsData ?? []).map((subscription) => ({
      id: subscription.ActivityGuid ?? subscription.SubscriptionName,
      name: subscription.SubscriptionName ?? "Unknown",
      amount: subscription.SubscriptionContractAmount?.Value ?? 0,
      startDate: subscription.SubscriptionStartDate,
      endDate: subscription.SubscriptionEndDate,
      paymentFrequency: subscription.SubscriptionFrequency ?? "N/A",
      status: subscription.status === 0 ? "Active" : "Inactive",
    }));
  }, [expiredSubscriptionsData]);

  const renewalRows = useMemo(() => {
    const source = nearingRenewalData?.length ? nearingRenewalData : renewalData;
    return source.map((item, index) => {
      const name = item.SubscriptionName ?? item.name ?? "Unknown";
      const amount =
        item.SubscriptionContractAmount?.Value !== undefined
          ? item.SubscriptionContractAmount.Value
          : (item.subscriptionAmount ?? 0);
      const startDate = item.SubscriptionStartDate ?? item.startDate;
      const endDate = item.SubscriptionEndDate ?? item.endDate;
      const paymentFrequency = item.SubscriptionFrequency ?? item.paymentFrequency ?? "N/A";
      const activityStatus =
        typeof item.status === "number"
          ? getStatusLabel(item.status)
          : (item.activityStatus ?? "Inactive");

      return {
        id: item.ActivityGuid ?? item.id ?? `${name}-${index}`,
        name,
        subscriptionAmount: amount,
        startDate,
        endDate,
        paymentFrequency,
        activityStatus,
      };
    });
  }, [nearingRenewalData, renewalData]);

  const displayedData = showMore ? renewalRows : renewalRows.slice(0, 3);

  const formatDateKey = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const urgencyStyles = {
    veryUrgent: "bg-purple-100 text-purple-800 border border-purple-300",
    urgent: "bg-orange-100 text-orange-800 border border-orange-300",
    notUrgent: "bg-slate-100 text-slate-800 border border-slate-300",
  };

  const weekdayNames = ["S", "M", "T", "W", "T", "F", "S"];
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

  const highlightedDates = useMemo(() => {
    const map = new Map();
    Object.entries(categorizedSubscriptions || {}).forEach(([category, subscriptions]) => {
      subscriptions.forEach((subscription) => {
        const dateKey = formatDateKey(subscription.SubscriptionEndDate);
        if (!dateKey) return;
        const existing = map.get(dateKey) ?? [];
        existing.push({ subscription, category });
        map.set(dateKey, existing);
      });
    });
    return map;
  }, [categorizedSubscriptions]);

  const renderCalendar = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-8" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const currentDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), day));
      const dateKey = formatDateKey(currentDay);
      const highlights = highlightedDates.get(dateKey);
      const urgencyClass = highlights ? urgencyStyles[highlights[0].category] : "";

      cells.push(
        <div
          key={`${dateKey}-${day}`}
          className={`h-8 flex items-center justify-center text-sm rounded ${urgencyClass}`}
          onMouseEnter={() =>
            highlights && setHoveredDateDetails({ date: dateKey, details: highlights })
          }
          onMouseLeave={() => highlights && setHoveredDateDetails(null)}
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
          {weekdayNames.map((weekday, index) => (
            <div
              key={`${weekday}-${index}`}
              className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>
    );
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getNextMonth = () => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  };

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
            <div className="text-sm font-medium text-gray-700 mb-3">Values:</div>
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
            <div className="mt-4">
              {hoveredDateDetails ? (
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-1">
                    Subscriptions expiring on {formatDate(hoveredDateDetails.date)}
                  </p>
                  <ul className="space-y-1">
                    {hoveredDateDetails.details.map(({ subscription, category }, index) => (
                      <li
                        key={`${subscription.ActivityId}-${index}`}
                        className="rounded px-2 py-1 text-xs font-medium leading-tight"
                      >
                        <span className="block text-gray-900">{subscription.SubscriptionName}</span>
                        <span className="block text-gray-500">
                          {category} · {subscription.SubscriptionFrequency || "N/A"} · $
                          {(subscription.SubscriptionContractAmount?.Value || 0).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Hover over a highlighted date to see subscription details.
                </p>
              )}
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
                  <tr key={subscription.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-800">{subscription.name}</td>
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
          {renewalRows.length > 3 && (
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
        <div className="relative" style={{ height: "300px", minHeight: "250px" }}>
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
                {expirationRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                      No expired subscriptions available.
                    </td>
                  </tr>
                ) : (
                  expirationRows.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-800">
                        {subscription.name}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 text-sm font-medium"
                        style={{ color: "#6B46C1" }}
                      >
                        {formatCurrency(subscription.amount)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalAndExpiration;
