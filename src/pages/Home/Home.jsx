import "./Home.css";
import { useEffect, useRef, useState, useCallback } from "react";

// Static assets - these are small and needed immediately
import TimeIcon from "../../assets/Time.svg";
import FrameIcon from "../../assets/Frame.svg";
import ProfileImg from "../../assets/Image.jpg";
import OverdueIcon from "../../assets/Overdue.svg";
import TotalActiveCostIcon from "../../assets/TotalActiveCost.svg";
import RenewalTimelineIcon from "../../assets/RenewalTimeline.svg";
import UpcomingRenewalsIcon from "../../assets/UpcomingRenewals.svg";
import RecentlyConcludedIcon from "../../assets/RecentlyConcluded.svg";
import ActiveSubscriptionsIcon from "../../assets/ActiveSubscriptions.svg";

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
  const CONTACT_ID = "f0983e34-d2c5-ee11-9079-00224827e0df";
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
      sub: "12 months",
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
          console.error("Error processing charts:", err);
          // Don't set error state for chart rendering issues, just log them
          // The charts might still work partially
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
        console.error("Error loading activity data:", err);
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
      <div className="dashboard-cards-grid">
        {isLoading
          ? // Loading skeleton for cards
            [...cards, ...card].map((cardItem) => (
              <div
                key={cardItem.id}
                className="dashboard-card skeleton-card"
                style={{ backgroundColor: cardItem.bg }}
              >
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <div className="skeleton-icon"></div>
                    <div className="skeleton-text skeleton-title"></div>
                  </div>
                  <div className="skeleton-icon-small"></div>
                </div>

                {cardItem.title === "Renewal Timeline" && (
                  <div className="skeleton-select"></div>
                )}

                <div className="dashboard-card-value">
                  <div className="skeleton-text skeleton-value"></div>
                </div>
              </div>
            ))
          : // Actual cards with data
            [...cards, ...card].map((cardItem) => (
              <div
                key={cardItem.id}
                className="dashboard-card"
                style={{ backgroundColor: cardItem.bg }}
              >
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <img
                      src={cardItem.icon}
                      alt={cardItem.title}
                      className="dashboard-card-icon"
                    />
                    <h5>{cardItem.title}</h5>
                  </div>

                  {cardItem.info && (
                    <span title={cardItem.info} className="dashboard-card-info">
                      <img
                        src={FrameIcon}
                        alt="Info"
                        className="dashboard-card-info-icon"
                      />
                    </span>
                  )}
                </div>

                {cardItem.title === "Renewal Timeline" && (
                  <select
                    id="renewalDropdown"
                    className="dashboard-card-select mt-2"
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

                <div className="dashboard-card-value">
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
            <div className="vendor-chart-card skeleton-chart">
              <div className="skeleton-chart-header">
                <div className="skeleton-text skeleton-chart-title"></div>
              </div>
              <div className="skeleton-chart-content"></div>
            </div>
            <div className="monthly-spend-card skeleton-chart">
              <div className="skeleton-chart-header">
                <div className="skeleton-text skeleton-chart-title"></div>
                <div className="skeleton-arrows"></div>
              </div>
              <div className="skeleton-chart-content"></div>
            </div>
            <div className="department-chart-card skeleton-chart">
              <div className="skeleton-chart-header">
                <div className="skeleton-text skeleton-chart-title"></div>
                <div className="skeleton-arrows"></div>
              </div>
              <div className="skeleton-chart-content"></div>
            </div>
            <div className="monthly-spend-card skeleton-chart">
              <div className="skeleton-chart-header">
                <div className="skeleton-text skeleton-chart-title"></div>
                <div className="skeleton-arrows"></div>
              </div>
              <div className="skeleton-chart-content"></div>
            </div>
            <div className="dashboard-listQuickStart-item skeleton-chart">
              <div className="skeleton-chart-header">
                <div className="skeleton-text skeleton-chart-title"></div>
              </div>
              <div className="skeleton-chart-content"></div>
            </div>
            <div className="dashboard-listQuickStart-item skeleton-chart">
              <div className="skeleton-chart-header">
                <div className="skeleton-text skeleton-chart-title"></div>
                <div className="skeleton-arrows"></div>
              </div>
              <div className="skeleton-chart-content"></div>
            </div>
          </>
        ) : (
          <>
            {/* Vendor Chart */}
            <div className="vendor-chart-card">
              <a
                data-id="usage-analysis"
                className="page-dashboard__listQuickStart-item"
                id="usageanalysis"
                style={{ position: "relative" }}
              >
                <p>Vendors</p>
                <span
                  className="info-tiles"
                  data-popover="All Active Vendors"
                ></span>

                <div className="chart-wrapper">
                  <div className="chart-container">
                    <canvas id="doughnut-chart"></canvas>
                  </div>
                  <div className="legend-container" id="chart-legend"></div>
                </div>
              </a>
            </div>

            {/* Monthly Spend */}
            <div className="monthly-spend-card">
              <a
                data-id="Performance"
                className="monthly-spend-inner"
                id="performance"
              >
                <div className="monthly-spend-header">
                  <p className="monthly-spend-title">Monthly Spend Trendings</p>

                  <div className="monthly-spend-arrows" id="MonthlySpend">
                    <i
                      className="fas fa-chevron-left arrow"
                      onClick={async () => {
                        const modules = await getChartModules();
                        modules.GetMonthlySpentrend("last-x-months");
                      }}
                    ></i>
                    <i
                      className="fas fa-chevron-right arrow"
                      onClick={async () => {
                        const modules = await getChartModules();
                        modules.GetMonthlySpentrend("next-x-months");
                      }}
                    ></i>
                  </div>
                </div>

                <div className="monthly-spend-chart">
                  <canvas className="chart" id="chart2"></canvas>
                </div>
              </a>
            </div>

            {/* Department Chart */}
            <div className="department-chart-card">
              <div className="department-chart-header">
                <h2>Departmental Spend Trend</h2>

                <div className="department-chart-controls">
                  <button
                    id="leftarrowdep"
                    onClick={async () => {
                      const modules = await getChartModules();
                      modules.GetDepartmentSpentrend("last-x-months");
                    }}
                  >
                    ◀
                  </button>

                  <span id="financialyear">{financialYear}</span>

                  <button
                    id="rightarrowdep"
                    onClick={async () => {
                      const modules = await getChartModules();
                      modules.GetDepartmentSpentrend("next-x-months");
                    }}
                  >
                    ▶
                  </button>
                </div>
              </div>

              <div className="department-chart-container">
                <canvas id="chart5" ref={departmentChartRef}></canvas>
              </div>
            </div>

            {/* Actual vs Budget */}
            <div className="monthly-spend-card">
              <a
                data-id="Compliance"
                className="monthly-spend-inner"
                id="compliance"
              >
                <div className="monthly-spend-header">
                  <p className="monthly-spend-title">Actual vs Budget</p>

                  <div className="monthly-spend-arrows" id="BudgetDepartment">
                    <i
                      className="fas fa-chevron-left arrow"
                      id="leftarrowbudget"
                      style={{
                        marginRight: "15px",
                        opacity: 0.5,
                        pointerEvents: "none",
                      }}
                      onClick={async () => {
                        const modules = await getChartModules();
                        modules.GetBudgetTrend("last-x-months");
                      }}
                    ></i>

                    <span
                      id="financialyearbudget"
                      style={{ display: "block", fontSize: "10px" }}
                    ></span>

                    <i
                      className="fas fa-chevron-right arrow"
                      id="rightarrowbudget"
                      style={{ marginLeft: "15px" }}
                      onClick={async () => {
                        const modules = await getChartModules();
                        modules.GetBudgetTrend("next-x-months");
                      }}
                    ></i>
                  </div>
                </div>

                <div className="monthly-spend-chart">
                  <canvas className="chart" id="chartBudget"></canvas>
                </div>
              </a>
            </div>

            {/* Vendors by Profile */}
            <div className="dashboard-listQuickStart-item" id="compliance">
              <h2>Vendors by Profile</h2>

              <div className="dashboard-flex dashboard-justify-center dashboard-gap-16 dashboard-text-xs dashboard-mb-8">
                <span>{financialYear}</span>
              </div>

              <div className="dashboard-chart-container" id="vendorprofile">
                <canvas id="chart6" ref={vendorProfileChartRef}></canvas>
              </div>
            </div>

            {/* Upcoming Renewal */}
            <div className="dashboard-listQuickStart-item" id="upcomingRenewal">
              <div className="dashboard-header">
                <h2>Upcoming Renewal Per Month</h2>

                <div className="dashboard-flex dashboard-justify-center dashboard-gap-16 dashboard-text-xs dashboard-mb-8">
                  <i
                    id="leftarrowRen"
                    className="fas fa-chevron-left arrow"
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
                    className="fas fa-chevron-right arrow"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleRenewalNavigation("next-x-months")}
                    aria-label="Next renewal period"
                  />
                </div>
              </div>

              <div className="dashboard-chart-container" id="renewalcontainer">
                <canvas id="chart3" ref={renewalChartRef}></canvas>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tasks */}
      <div className="tasks-grid">
        {/* Upcoming Tasks */}
        <div className="task-card">
          <div className="task-header">
            <div className="task-icon upcoming">
              <img src={TimeIcon} alt="Upcoming" />
            </div>
            <h2>My Upcoming Tasks</h2>
          </div>

          <div className="task-list">
            {upcomingTasks.map((task) => (
              <div key={task.title} className="task-row">
                <p className="task-title">{task.title}</p>
                <span className={`task-status ${task.statusColor}`}>
                  {task.status}
                </span>
                <span className="task-date">{task.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="task-card">
          <div className="task-header">
            <div className="task-icon overdue">
              <img src={OverdueIcon} alt="Overdue" />
            </div>
            <h2>Overdue Tasks</h2>
          </div>

          <div className="task-list">
            {overdueTasks.map((task) => (
              <div key={task.title} className="task-row">
                <p className="task-title">{task.title}</p>
                <span className={`task-status ${task.statusColor}`}>
                  {task.status}
                </span>
                <span className="task-date">{task.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
