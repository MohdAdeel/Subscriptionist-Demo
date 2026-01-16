import TimeIcon from "../../assets/Time.svg";
import FrameIcon from "../../assets/Frame.svg";
import ProfileImg from "../../assets/Image.jpg";
import OverdueIcon from "../../assets/Overdue.svg";
import { useEffect, useRef, useState, useCallback } from "react";
import TotalActiveCostIcon from "../../assets/TotalActiveCost.svg";
import RenewalTimelineIcon from "../../assets/RenewalTimeline.svg";
import UpcomingRenewalsIcon from "../../assets/UpcomingRenewals.svg";
import RecentlyConcludedIcon from "../../assets/RecentlyConcluded.svg";
import ActiveSubscriptionsIcon from "../../assets/ActiveSubscriptions.svg";
import { CardSkeleton, ChartSkeleton } from "../../components/SkeletonLoader";

// Lazy load heavy utility modules - these contain Chart.js and are large (~400KB total)
// They are only needed AFTER the API data is fetched
const loadChartUtils = () =>
  Promise.all([
    import("../../lib/utils/monthlySpendUtils"),
    import("../../lib/utils/budgetdata"),
    import("../../lib/utils/departmentdata"),
    import("../../lib/utils/vendorprofile"),
    import("../../lib/utils/vendordata"),
    import("../../lib/utils/renewalchartdata"),
  ]);

// Store loaded modules for reuse
let chartModules = null;
let chartModulesPromise = null;

const getChartModules = () => {
  if (chartModules) return Promise.resolve(chartModules);
  if (chartModulesPromise) return chartModulesPromise;

  chartModulesPromise = loadChartUtils().then(
    ([
      monthlySpendUtils,
      budgetdata,
      departmentdata,
      vendorprofile,
      vendordata,
      renewalchartdata,
    ]) => {
      chartModules = {
        GetMonthlySpentrend: monthlySpendUtils.GetMonthlySpentrend,
        updateSubscriptionAmount: monthlySpendUtils.updateSubscriptionAmount,
        monthlyDataProcessing: monthlySpendUtils.handleDataProcessing,
        GetBudgetTrend: budgetdata.GetBudgetTrend,
        budgetDataProcessing: budgetdata.handleDataProcessing,
        handleDataProcessing: departmentdata.handleDataProcessing,
        GetDepartmentSpentrend: departmentdata.GetDepartmentSpentrend,
        handleVendorProcessingData: vendorprofile.handleDataProcessing,
        handleVendorDataChart: vendordata.handleDataProcessing,
        Getrenewal: renewalchartdata.Getrenewal,
        handleRenewalChartData: renewalchartdata.handleDataProcessing,
      };
      return chartModules;
    }
  );

  return chartModulesPromise;
};

export default function Home() {
  const currentYear = new Date().getFullYear();
  const activityDataRef = useRef(null);
  const departmentChartRef = useRef(null); // For chart5 - Department Chart
  const vendorProfileChartRef = useRef(null); // For chart6 - Vendor Profile Chart
  const renewalChartRef = useRef(null); // For chart3 - Renewal Chart

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for renewal date management (replaces window.startDateforRenwal)
  const [renewalStartDate, setRenewalStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });

  const cards = [
    {
      title: "Total Active Cost",
      value: "$0",
      icon: TotalActiveCostIcon,
      bg: "#E1DBFE",
      info: "Monetary value of current active subscriptions",
      id: "ActiveCostid",
    },
    {
      title: "Active Subscriptions",
      value: "0",
      icon: ActiveSubscriptionsIcon,
      bg: "#CFE1FF",
      info: "Number of current active subscriptions",
      id: "ActiveSubsid",
    },
  ];

  const card = [
    {
      title: "Renewal Timeline",
      value: "0",
      icon: RenewalTimelineIcon,
      info: "Number of subscriptions with near-term renewal dates.",
      bg: "#BFF1FF",
      id: "renewalTimeline",
    },
    {
      title: "Upcoming Renewals",
      value: "$0",
      icon: UpcomingRenewalsIcon,
      bg: "#E1FFBB",
      info: "This Total reflect your renewal amount from the current month to the specified timeline end month, detault is 12 months",
      id: "renewalcost",
    },
    {
      title: "Recently Concluded",
      value: "0",
      icon: RecentlyConcludedIcon,
      bg: "#CCD6EB",
      info: "Number of subscriptions expired during the last 12 months",
      id: "completed",
    },
  ];

  const financialYear = `FY${currentYear.toString().slice(-2)}`;

  const upcomingTasks = [
    {
      title: "Task-1 Complete project report",
      status: "Pending",
      date: "Today - 16 Sep",
      statusColor: "bg-orange-100 text-orange-600",
    },
    {
      title: "Task-2 Follow up with client",
      status: "In Progress",
      date: "Due: Nov 1, 2024",
      statusColor: "bg-sky-100 text-sky-600",
    },
    {
      title: "Task-3 Prepare presentation",
      status: "In Progress",
      date: "Due: Nov 3, 2024",
      statusColor: "bg-sky-100 text-sky-600",
    },
  ];

  const overdueTasks = [
    {
      title: "Task-1 Submit quarterly review",
      status: "Pending",
      date: "Overdue: Oct 10, 2024",
      statusColor: "bg-orange-100 text-orange-600",
    },
    {
      title: "Task-2 Client feedback call",
      status: "Overdue",
      date: "Overdue: Oct 15, 2024",
      statusColor: "bg-red-100 text-red-600",
    },
  ];

  const processAllCharts = useCallback(async (activityData) => {
    if (!activityData) return;

    // Lazy load chart modules only when we have data
    const modules = await getChartModules();

    // Use requestAnimationFrame to ensure DOM is ready for chart rendering
    requestAnimationFrame(() => {
      // Double check with a small delay to ensure all DOM elements are mounted
      setTimeout(() => {
        try {
          // Process charts that don't require specific refs first
          modules.handleVendorDataChart(activityData);
          modules.budgetDataProcessing(activityData);
          modules.monthlyDataProcessing(activityData);

          // Process department chart with its specific ref
          if (departmentChartRef.current) {
            modules.handleDataProcessing(activityData);
          } else {
            // Fallback: try again after a short delay
            setTimeout(() => {
              if (departmentChartRef.current) {
                modules.handleDataProcessing(activityData);
              }
            }, 200);
          }

          // Process vendor profile chart with its specific ref
          if (vendorProfileChartRef.current) {
            modules.handleVendorProcessingData(
              activityData,
              vendorProfileChartRef
            );
          } else {
            // Fallback: try again after a short delay
            setTimeout(() => {
              if (vendorProfileChartRef.current) {
                modules.handleVendorProcessingData(
                  activityData,
                  vendorProfileChartRef
                );
              }
            }, 200);
          }

          // Process renewal chart
          const renewalCanvas =
            renewalChartRef.current || document.getElementById("chart3");
          if (renewalCanvas) {
            modules.handleRenewalChartData(activityData, renewalCanvas);
          } else {
            // Fallback: try again after a short delay
            setTimeout(() => {
              const canvas = document.getElementById("chart3");
              if (canvas) {
                modules.handleRenewalChartData(activityData, canvas);
              }
            }, 200);
          }
        } catch (err) {
          // Chart rendering errors are handled silently to allow partial functionality
        }
      }, 150);
    });
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      if (activityDataRef.current) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Lazy load the API module
        const { getActivity } = await import(
          "../../lib/api/activityLine/activityLine"
        );
        const activityData = await getActivity();
        activityDataRef.current = activityData;
        processAllCharts(activityData);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [processAllCharts]);

  // Handler for renewal navigation (replaces window.Getrenewal)
  const handleRenewalNavigation = useCallback(async (action) => {
    const modules = await getChartModules();
    if (typeof modules.Getrenewal === "function") {
      modules.Getrenewal(action);
      // Update state to trigger re-render
      setRenewalStartDate((prev) => {
        const newDate = new Date(prev);
        if (action === "next-x-months") {
          newDate.setMonth(newDate.getMonth() + 6);
        } else if (action === "last-x-months") {
          newDate.setMonth(newDate.getMonth() - 6);
        }
        return newDate;
      });
    }
  }, []);

  // Check if renewal left arrow should be disabled
  const isRenewalLeftArrowDisabled =
    renewalStartDate.getMonth() === new Date().getMonth() &&
    renewalStartDate.getFullYear() === new Date().getFullYear();

  if (error) {
    return (
      <div className="flex-1 bg-[#F6F7FB] min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F6F7FB] min-h-screen p-6">
      {/* Styles for dynamically generated legend items */}
      <style>{`
        #chart-legend ul li {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
          font-size: 11px;
        }
        #chart-legend ul li span {
          border-radius: 50%;
          width: 12px;
          height: 12px;
          display: inline-block;
          margin-right: 10px;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-[#0B0B3B]">Welcome Jane!</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {isLoading ? "Loading..." : "Last Update 10 min ago"}
          </span>
          <img
            src={ProfileImg}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {isLoading
          ? // Loading skeleton for cards
            [...cards, ...card].map((cardItem) => (
              <CardSkeleton
                key={cardItem.id}
                bgColor={cardItem.bg}
                showDropdown={cardItem.title === "Renewal Timeline"}
              />
            ))
          : // Actual cards with data
            [...cards, ...card].map((cardItem) => (
              <div
                key={cardItem.id}
                className="rounded-xl p-4 flex flex-col justify-between"
                style={{ backgroundColor: cardItem.bg }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={cardItem.icon}
                      alt={cardItem.title}
                      className="w-6 h-6"
                    />
                    <h5 className="text-sm font-semibold m-0">
                      {cardItem.title}
                    </h5>
                  </div>

                  {cardItem.info && (
                    <span title={cardItem.info} className="cursor-pointer">
                      <img src={FrameIcon} alt="Info" className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {cardItem.title === "Renewal Timeline" && (
                  <select
                    id="renewalDropdown"
                    className="text-xs mt-2"
                    defaultValue="4"
                    onChange={async (e) => {
                      const value = e.target.value;
                      const modules = await getChartModules();
                      if (
                        typeof modules.updateSubscriptionAmount === "function"
                      ) {
                        modules.updateSubscriptionAmount(value);
                      }
                    }}
                  >
                    <option value="4">12 Months</option>
                    <option value="3">6 Months</option>
                    <option value="2">3 Months</option>
                    <option value="1">1 Month</option>
                  </select>
                )}

                <div className="mt-3 text-3xl font-bold">
                  <div id={cardItem.id}>
                    <span>{cardItem.value}</span>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {isLoading ? (
          // Loading skeleton for charts
          <>
            <ChartSkeleton
              key="chart-skeleton-1"
              height="160px"
              className="h-[260px]"
            />
            <ChartSkeleton
              key="chart-skeleton-2"
              height="160px"
              className="h-[260px]"
            />
            <ChartSkeleton
              key="chart-skeleton-3"
              height="160px"
              className="h-[260px]"
            />
            <ChartSkeleton
              key="chart-skeleton-4"
              height="160px"
              className="h-[260px]"
            />
            <ChartSkeleton
              key="chart-skeleton-5"
              height="160px"
              className="h-[260px]"
            />
            <ChartSkeleton
              key="chart-skeleton-6"
              height="160px"
              className="h-[260px]"
            />
          </>
        ) : (
          <>
            {/* Vendor Chart */}
            <div className="bg-white rounded-xl p-3 h-[260px] flex flex-col overflow-hidden">
              <a
                data-id="usage-analysis"
                id="usageanalysis"
                className="relative block h-full flex flex-col"
              >
                <div className="flex-shrink-0 mb-2">
                  <p className="text-sm font-semibold mb-2">Vendors</p>
                  <span
                    className="info-tiles"
                    data-popover="All Active Vendors"
                  ></span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="flex items-center justify-center w-full">
                    <div className="w-full h-[150px] mx-auto ml-3 flex-shrink-0">
                      <canvas
                        id="doughnut-chart"
                        className="w-full h-full"
                      ></canvas>
                    </div>
                    <div
                      className="w-[40%] max-w-[200px] flex flex-col justify-center items-start flex-shrink-0"
                      id="chart-legend"
                    >
                      <ul className="list-none p-0 w-full overflow-y-auto max-h-[150px]"></ul>
                    </div>
                  </div>
                </div>
              </a>
            </div>

            {/* Monthly Spend */}
            <div className="bg-white rounded-xl p-4 flex flex-col mb-2 shadow-sm h-[260px]">
              <a
                data-id="Performance"
                id="performance"
                className="flex flex-col p-0 bg-transparent shadow-none flex-none h-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold mb-2 text-[#0B0B3B]">
                    Monthly Spend Trendings
                  </p>

                  <div
                    className="flex items-center mb-2 gap-3"
                    id="MonthlySpend"
                  >
                    <i
                      className="fas fa-chevron-left text-sm opacity-80 cursor-pointer hover:opacity-100"
                      onClick={async () => {
                        const modules = await getChartModules();
                        modules.GetMonthlySpentrend("last-x-months");
                      }}
                    ></i>
                    <i
                      className="fas fa-chevron-right text-sm opacity-80 cursor-pointer hover:opacity-100"
                      onClick={async () => {
                        const modules = await getChartModules();
                        modules.GetMonthlySpentrend("next-x-months");
                      }}
                    ></i>
                  </div>
                </div>

                <div className="flex-1 min-h-[180px]">
                  <canvas className="w-full h-full" id="chart2"></canvas>
                </div>
              </a>
            </div>

            {/* Department Chart */}
            <div className="bg-white rounded-xl p-4 h-[260px] flex flex-col mb-2 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold mb-2 text-[#0B0B3B]">
                  Departmental Spend Trend
                </h2>

                <div className="flex items-center justify-center gap-3 text-xs mb-2">
                  <button
                    id="leftarrowdep"
                    className="opacity-80 bg-transparent border-none cursor-pointer text-sm hover:opacity-100"
                    onClick={async () => {
                      const modules = await getChartModules();
                      modules.GetDepartmentSpentrend("last-x-months");
                    }}
                  >
                    ◀
                  </button>

                  <span
                    id="financialyear"
                    className="font-medium text-[#0B0B3B]"
                  >
                    {financialYear}
                  </span>

                  <button
                    id="rightarrowdep"
                    className="opacity-80 bg-transparent border-none cursor-pointer text-sm hover:opacity-100"
                    onClick={async () => {
                      const modules = await getChartModules();
                      modules.GetDepartmentSpentrend("next-x-months");
                    }}
                  >
                    ▶
                  </button>
                </div>
              </div>

              <div className="flex-1 h-[180px]">
                <canvas
                  id="chart5"
                  ref={departmentChartRef}
                  className="w-full h-full"
                ></canvas>
              </div>
            </div>

            {/* Actual vs Budget */}
            <div className="bg-white rounded-xl p-4 flex flex-col mb-2 shadow-sm h-[260px]">
              <a
                data-id="Compliance"
                id="compliance"
                className="flex flex-col p-0 bg-transparent shadow-none flex-none h-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold mb-2 text-[#0B0B3B]">
                    Actual vs Budget
                  </p>

                  <div
                    className="flex items-center mb-2 gap-3"
                    id="BudgetDepartment"
                  >
                    <i
                      className="fas fa-chevron-left text-sm opacity-50 pointer-events-none"
                      id="leftarrowbudget"
                      style={{ marginRight: "15px" }}
                      onClick={async () => {
                        const modules = await getChartModules();
                        modules.GetBudgetTrend("last-x-months");
                      }}
                    ></i>

                    <span
                      id="financialyearbudget"
                      className="block text-[10px]"
                    ></span>

                    <i
                      className="fas fa-chevron-right text-sm opacity-80 cursor-pointer hover:opacity-100"
                      id="rightarrowbudget"
                      style={{ marginLeft: "15px" }}
                      onClick={async () => {
                        const modules = await getChartModules();
                        modules.GetBudgetTrend("next-x-months");
                      }}
                    ></i>
                  </div>
                </div>

                <div className="flex-1 min-h-[180px]">
                  <canvas className="w-full h-full" id="chartBudget"></canvas>
                </div>
              </a>
            </div>

            {/* Vendors by Profile */}
            <div
              className="bg-white rounded-xl p-4 h-[260px] flex flex-col shadow-sm"
              id="compliance"
            >
              <h2 className="text-sm font-semibold mb-2 text-[#0B0B3B]">
                Vendors by Profile
              </h2>

              <div className="flex items-center justify-center gap-4 text-xs mb-2">
                <span>{financialYear}</span>
              </div>

              <div className="flex-1 h-[180px] relative" id="vendorprofile">
                <canvas
                  id="chart6"
                  ref={vendorProfileChartRef}
                  className="w-full h-full"
                ></canvas>
              </div>
            </div>

            {/* Upcoming Renewal */}
            <div
              className="bg-white rounded-xl p-4 h-[260px] flex flex-col shadow-sm"
              id="upcomingRenewal"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold mb-2 text-[#0B0B3B]">
                  Upcoming Renewal Per Month
                </h2>

                <div className="flex items-center justify-center gap-4 text-xs mb-2">
                  <i
                    id="leftarrowRen"
                    className="fas fa-chevron-left text-sm"
                    style={{
                      opacity: isRenewalLeftArrowDisabled ? 0.5 : 1,
                      pointerEvents: isRenewalLeftArrowDisabled
                        ? "none"
                        : "auto",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      !isRenewalLeftArrowDisabled &&
                      handleRenewalNavigation("last-x-months")
                    }
                    aria-label="Previous renewal period"
                  />

                  <span id="financialyearRen">
                    FY{renewalStartDate.getFullYear().toString().slice(-2)}
                  </span>

                  <i
                    id="rightarrowRen"
                    className="fas fa-chevron-right text-sm cursor-pointer"
                    onClick={() => handleRenewalNavigation("next-x-months")}
                    aria-label="Next renewal period"
                  />
                </div>
              </div>

              <div className="flex-1 h-[180px] relative" id="renewalcontainer">
                <canvas
                  id="chart3"
                  ref={renewalChartRef}
                  className="w-full h-full"
                ></canvas>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl p-6 h-[340px] shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-green-100">
              <img src={TimeIcon} alt="Upcoming" className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-[#0B0B3B]">
              My Upcoming Tasks
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-3">
            {upcomingTasks.map((task) => (
              <div
                key={task.title}
                className="flex items-center justify-between border-b border-gray-200 pb-4 mb-5"
              >
                <p className="w-[45%] text-base font-medium text-[#0B0B3B]">
                  {task.title}
                </p>
                <span
                  className={`text-sm px-4 py-1.5 rounded-full font-medium ${task.statusColor}`}
                >
                  {task.status}
                </span>
                <span className="text-sm text-gray-500">{task.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white rounded-xl p-6 h-[340px] shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-indigo-100">
              <img src={OverdueIcon} alt="Overdue" className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-[#0B0B3B]">
              Overdue Tasks
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-3">
            {overdueTasks.map((task) => (
              <div
                key={task.title}
                className="flex items-center justify-between border-b border-gray-200 pb-4 mb-5"
              >
                <p className="w-[45%] text-base font-medium text-[#0B0B3B]">
                  {task.title}
                </p>
                <span
                  className={`text-sm px-4 py-1.5 rounded-full font-medium ${task.statusColor}`}
                >
                  {task.status}
                </span>
                <span className="text-sm text-gray-500">{task.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
