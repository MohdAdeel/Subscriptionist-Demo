import { useActivityLines } from "../../hooks";
import { useAuthStore, useHomeStore } from "../../stores";
import React, { useEffect, useMemo, useState } from "react";
import AddSubscription from "./components/pages/AddSubscription";
import AddOrganization from "./components/pages/AddOrgnaization";
import AddAccountModal from "./components/Models/AddAccountModal";
import TotalActiveCostIcon from "../../assets/TotalActiveCost.svg";
import RenewalTimelineIcon from "../../assets/RenewalTimeline.svg";
import { RectangleSkeleton } from "../../components/SkeletonLoader";
import UpcomingRenewalsIcon from "../../assets/UpcomingRenewals.svg";
import { populateAccountModal } from "../../lib/api/Account/Account";
import MonthlySpendChart from "./components/Graphs/MonthlySpendChart";
import RecentlyConcludedIcon from "../../assets/RecentlyConcluded.svg";
import VendorProfileChart from "./components/Graphs/VendorProfileChart";
import ActualVsBudgetChart from "./components/Graphs/ActualVsBudgetChart";
import VendorDoughnutChart from "./components/Graphs/VendorDoughnutChart";
import ActiveSubscriptionsIcon from "../../assets/ActiveSubscriptions.svg";
import DepartmentSpendChart from "./components/Graphs/DepartmentSpendChart";
import UpcomingRenewalChart from "./components/Graphs/UpcomingRenewalChart";
import DashboardSkeletonLoader from "./components/HomeLoader/DashboardSkeletonLoader";
import { calculateSubscriptionAmount, handleDataProcessing } from "../../lib/utils/home";

const BarSkeleton = ({ bars = 6, heights }) => {
  const presetHeights = heights ?? [35, 60, 55, 72, 50, 66];
  const items = Array.from({ length: bars }).map(
    (_, idx) => presetHeights[idx % presetHeights.length]
  );
  return (
    <div className="h-full flex items-end gap-3 animate-pulse">
      {items.map((h, idx) => (
        <div
          key={idx}
          className="flex-1 rounded-md bg-gray-200"
          style={{ height: `${h}%`, minWidth: "16px" }}
        />
      ))}
    </div>
  );
};

const LineSkeleton = () => (
  <div className="h-full w-full rounded-lg bg-gray-200 animate-pulse relative overflow-hidden">
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.25))",
      }}
    />
  </div>
);

const CARD_COLORS = ["#E8E4FF", "#D9E8FF", "#D2F3FF", "#E5FCD5", "#D8DEEE"];

const VENDOR_PROFILE_COLORS = ["#93E8FF", "#BFF1FF", "#00C2FA"];

const DEPARTMENT_CHART_COLORS = ["#E1DBFE", "#BFF1FF", "#E1FFBB", "#EAECF0", "#CFE1FF", "#BFF1FF"];

const UPCOMING_WINDOW_MONTHS = 6;
const UPCOMING_HALF_FIRST = 0;
const UPCOMING_HALF_LAST = 1;

const MONTHLY_WINDOW = 7;

const getMaxLabelLength = () => {
  if (typeof window === "undefined") {
    return 10;
  }
  const screenWidth = window.innerWidth;
  if (screenWidth > 1200) return 10;
  if (screenWidth > 768) return 8;
  return 5;
};

const getDepartmentLabelLength = () => {
  if (typeof window === "undefined") {
    return 15;
  }
  const screenWidth = window.innerWidth;
  if (screenWidth > 1200) return 15;
  if (screenWidth > 768) return 10;
  return 6;
};

const breakLongMonthNames = (name, maxLength) => {
  if (!name || name.length <= maxLength) return name;
  const words = name.split(" ");
  let currentLine = "";
  const result = [];

  words.forEach((word) => {
    if ((currentLine + word).length <= maxLength) {
      currentLine += `${word} `;
    } else {
      result.push(currentLine.trim());
      currentLine = `${word} `;
    }
  });

  result.push(currentLine.trim());
  return result.join("\n");
};

const toSafeDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

const Home = () => {
  const { data: activityLinesData, isLoading } = useActivityLines();
  const FirstTwoCards = useHomeStore((state) => state.FirstTwoCards);
  const renewalTimelineCards = useHomeStore((state) => state.renewalTimelineCards);
  const RecentlyConcluded = useHomeStore((state) => state.RecentlyConcluded);
  const VendorDoughnutChartData = useHomeStore((state) => state.VendorDoughnutChartData) ?? [];
  const vendorProfileCounts = useHomeStore((state) => state.vendorProfileCounts) ?? [];
  const VendorProfileChartData = useHomeStore((state) => state.VendorProfileChartData) ?? {};
  const monthlySpendChartData = useHomeStore((state) => state.monthlySpendChartData) ?? [];
  const departmentSpendChartData = useHomeStore((state) => state.departmentSpendChartData) ?? [];
  const ActualVsBudgetData = useHomeStore((state) => state.ActualVsBudgetData) ?? [];
  const upcomingRenewalRecords = useHomeStore((state) => state.upcomingRenewalRecords) ?? [];
  const [timelineRange, setTimelineRange] = useState("4");
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [maxLabelLength, setMaxLabelLength] = useState(() => getMaxLabelLength());
  const [departmentLabelLength, setDepartmentLabelLength] = useState(() =>
    getDepartmentLabelLength()
  );
  const userAuth = useAuthStore((state) => state.userAuth);
  const userAuthLoading = useAuthStore((state) => state.userAuthLoading);

  const [monthlyStartMonthIndex, setMonthlyStartMonthIndex] = useState(() => {
    const currentMonth = new Date().getMonth();
    return Math.min(currentMonth, 12 - MONTHLY_WINDOW);
  });
  const [departmentYear, setDepartmentYear] = useState(() => new Date().getFullYear());
  const [upcomingRenewalYear, setUpcomingRenewalYear] = useState(() => new Date().getFullYear());
  const [upcomingRenewalHalf, setUpcomingRenewalHalf] = useState(() =>
    new Date().getMonth() < 6 ? UPCOMING_HALF_FIRST : UPCOMING_HALF_LAST
  );
  const [selectedUpcomingRenewalKey, setSelectedUpcomingRenewalKey] = useState(null);
  const [selectedVendorProfileKey, setSelectedVendorProfileKey] = useState(null);
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [accountModalInitialData, setAccountModalInitialData] = useState(null);
  const [isAddAccountButtonDisabled, setIsAddAccountButtonDisabled] = useState(false);

  // Run home data processing when we're on Home and activity lines data is available
  useEffect(() => {
    if (activityLinesData != null) {
      handleDataProcessing(activityLinesData);
    }
  }, [activityLinesData]);

  useEffect(() => {
    if (!activityLinesData) return;
    const { setRenewalTimelineCards } = useHomeStore.getState();
    const result = calculateSubscriptionAmount(timelineRange);
    setRenewalTimelineCards(result.upcomingRenewalAmount, result.renewalTimelineCount);
  }, [activityLinesData, timelineRange]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => {
      setMaxLabelLength(getMaxLabelLength());
      setDepartmentLabelLength(getDepartmentLabelLength());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatCurrency = (n) =>
    Number(n).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatShortDate = (value) => {
    const date = toSafeDate(value);
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const kpiCards = [
    {
      title: "Total Active Cost",
      value: formatCurrency(FirstTwoCards?.totalContractAmount ?? 0),
      icon: TotalActiveCostIcon,
    },
    {
      title: "Active Subscriptions",
      value: FirstTwoCards?.ActiveCount ?? 0,
      icon: ActiveSubscriptionsIcon,
    },
    {
      title: "Renewal Timeline",
      value: renewalTimelineCards?.renewalTimelineCount ?? 0,
      icon: RenewalTimelineIcon,
    },
    {
      title: "Upcoming Renewal",
      value: formatCurrency(renewalTimelineCards?.upcomingRenewalAmount ?? 0),
      icon: UpcomingRenewalsIcon,
    },
    { title: "Recently Concluded", value: RecentlyConcluded ?? 0, icon: RecentlyConcludedIcon },
  ];

  const tooltipCopy = {
    "Total Active Cost": "Monetary value of current active subscriptions",
    "Active Subscriptions": "Number of current active subscriptions",
    "Renewal Timeline": "Number of subscriptions with near-term renewal dates",
    "Upcoming Renewal":
      "This total reflects your renewal amount from the current month to the specified timeline end month, default is 12 months",
    "Recently Concluded": "Number of subscriptions expired during the last 12 months",
    Vendors: "All Active Vendors",
  };

  // Vendor doughnut: use store data from home.js (vendor + count); map to label/value for chart
  const vendorBreakdown = useMemo(
    () =>
      VendorDoughnutChartData.map((item) => ({
        label: item.vendor,
        value: item.count,
      })),
    [VendorDoughnutChartData]
  );

  const monthlyDataStats = useMemo(() => {
    const dates = monthlySpendChartData
      .map((item) => toSafeDate(item.SubscriptionStartDate))
      .filter(Boolean);
    if (dates.length === 0) return null;
    const months = dates.map((date) => date.getMonth());
    const year = dates.reduce(
      (max, date) => Math.max(max, date.getFullYear()),
      dates[0].getFullYear()
    );
    return { minMonth: Math.min(...months), year };
  }, [monthlySpendChartData]);

  useEffect(() => {
    if (!monthlyDataStats) return;
    const maxStart = Math.max(0, 12 - MONTHLY_WINDOW);
    const nextStart = Math.min(monthlyDataStats.minMonth, maxStart);
    setMonthlyStartMonthIndex((prev) => (prev === nextStart ? prev : nextStart));
  }, [monthlyDataStats]);

  const monthlySpendByMonth = useMemo(() => {
    const map = new Map();
    monthlySpendChartData.forEach((item) => {
      const date = toSafeDate(item.SubscriptionStartDate);
      if (!date) return;
      const key = getMonthKey(date);
      const value = item.SubscriptionContractAmount?.Value || 0;
      map.set(key, (map.get(key) || 0) + value);
    });
    return map;
  }, [monthlySpendChartData]);

  const monthlySpendSeries = useMemo(() => {
    const labels = [];
    const values = [];
    const year = monthlyDataStats?.year ?? new Date().getFullYear();
    for (let i = 0; i < MONTHLY_WINDOW; i += 1) {
      const monthIndex = monthlyStartMonthIndex + i;
      if (monthIndex > 11) break;
      const date = new Date(year, monthIndex, 1);
      const label = date.toLocaleString("default", { month: "short", year: "numeric" });
      labels.push(breakLongMonthNames(label, maxLabelLength));
      values.push(monthlySpendByMonth.get(getMonthKey(date)) ?? 0);
    }
    return { labels, values };
  }, [monthlyDataStats, monthlySpendByMonth, monthlyStartMonthIndex, maxLabelLength]);

  const departmentRecords = useMemo(
    () =>
      (departmentSpendChartData ?? []).flatMap((entry) => {
        if (Array.isArray(entry)) {
          return entry[0] ? [entry[0]] : [];
        }
        return entry ? [entry] : [];
      }),
    [departmentSpendChartData]
  );

  const departmentYears = useMemo(() => {
    const years = new Set();
    departmentRecords.forEach((record) => {
      const date = toSafeDate(record.SubscriptionStartDate);
      if (date) years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [departmentRecords]);

  useEffect(() => {
    if (departmentYears.length === 0) return;
    const latestYear = departmentYears[departmentYears.length - 1];
    setDepartmentYear((prev) => (departmentYears.includes(prev) ? prev : latestYear));
  }, [departmentYears]);

  const departmentYearRecords = useMemo(() => {
    if (departmentYears.length === 0) return [];
    return departmentRecords.filter((record) => {
      const date = toSafeDate(record.SubscriptionStartDate);
      return date && date.getFullYear() === departmentYear;
    });
  }, [departmentRecords, departmentYear, departmentYears]);

  const departmentChartSeries = useMemo(() => {
    const hasValidData = departmentYearRecords.length > 0;
    const labels = hasValidData
      ? departmentYearRecords.map((department) =>
          breakLongMonthNames(department?.DepartmentNames?.Name || "Unknown", departmentLabelLength)
        )
      : ["No Data Available"];
    const values = hasValidData
      ? departmentYearRecords.map(
          (department) => department?.SubscriptionContractAmount?.Value || 0
        )
      : [0];
    const maxAmount = hasValidData ? Math.max(...values) : 0;
    const stepSize = Math.max(1, Math.ceil(maxAmount / 5));
    const colors = hasValidData
      ? values.map((_, idx) => DEPARTMENT_CHART_COLORS[idx % DEPARTMENT_CHART_COLORS.length])
      : ["rgba(0, 0, 0, 0.1)"];

    return {
      labels,
      values,
      colors,
      stepSize,
      hasValidData,
      chartLabel: hasValidData ? "Subscription Contract Amount" : "",
    };
  }, [departmentYearRecords, departmentLabelLength]);
  const actualVsBudgetRecords = useMemo(
    () =>
      (ActualVsBudgetData ?? []).flatMap((entry) => {
        if (Array.isArray(entry)) {
          return entry[0] ? [entry[0]] : [];
        }
        return entry ? [entry] : [];
      }),
    [ActualVsBudgetData]
  );

  const actualVsBudgetSeries = useMemo(() => {
    const hasValidData = actualVsBudgetRecords.length > 0;
    const labels = hasValidData
      ? actualVsBudgetRecords.map((dept) =>
          breakLongMonthNames(dept?.DepartmentNames?.Name || "Unknown", departmentLabelLength)
        )
      : ["No Data Available"];
    const actualAmounts = hasValidData
      ? actualVsBudgetRecords.map((dept) => dept?.SubscriptionContractAmount?.Value || 0)
      : [0];
    const budgetAmounts = hasValidData
      ? actualVsBudgetRecords.map((dept) => dept?.BudgetAmount?.Value || 0)
      : [0];
    const maxAmount = hasValidData ? Math.max(...actualAmounts, ...budgetAmounts) : 0;
    const stepSize = Math.max(1, Math.ceil(maxAmount / 5));

    return {
      labels,
      actualAmounts,
      budgetAmounts,
      stepSize,
      hasValidData,
    };
  }, [actualVsBudgetRecords, departmentLabelLength]);

  const upcomingRenewalSeries = useMemo(() => {
    const byMonth = new Map();
    const records = Array.isArray(upcomingRenewalRecords) ? upcomingRenewalRecords : [];
    const year = upcomingRenewalYear ?? new Date().getFullYear();
    const startMonth = upcomingRenewalHalf === UPCOMING_HALF_FIRST ? 0 : UPCOMING_WINDOW_MONTHS;
    records.forEach((record) => {
      const date = toSafeDate(record.SubscriptionStartDate);
      if (!date || date.getFullYear() !== year) return;
      const key = getMonthKey(date);
      if (byMonth.has(key)) {
        byMonth.get(key).push(record);
      } else {
        byMonth.set(key, [record]);
      }
    });

    const labels = [];
    const values = [];
    const monthKeys = [];

    for (let i = 0; i < UPCOMING_WINDOW_MONTHS; i += 1) {
      const date = new Date(year, startMonth + i, 1);
      const label = date.toLocaleString("default", { month: "short", year: "numeric" });
      const key = getMonthKey(date);
      labels.push(breakLongMonthNames(label, maxLabelLength));
      values.push(byMonth.get(key)?.length ?? 0);
      monthKeys.push(key);
    }

    const maxValue = values.length > 0 ? Math.max(...values) : 0;
    const stepSize = Math.max(1, Math.ceil(maxValue / 6));

    return { labels, values, monthKeys, byMonth, maxValue, stepSize };
  }, [upcomingRenewalRecords, upcomingRenewalYear, upcomingRenewalHalf, maxLabelLength]);

  const vendorProfileSeries = useMemo(() => {
    const hasValidData = vendorProfileCounts.length > 0;
    const labels = hasValidData
      ? vendorProfileCounts.map((profile) => profile?.VendorProfile || "Unknown")
      : ["No Data Available"];
    const values = hasValidData ? vendorProfileCounts.map((profile) => profile?.count || 0) : [0];
    const maxValue = hasValidData ? Math.max(...values) : 0;
    const stepSize = Math.max(1, Math.ceil(maxValue / 6));
    const colors = hasValidData
      ? values.map((_, idx) => VENDOR_PROFILE_COLORS[idx % VENDOR_PROFILE_COLORS.length])
      : ["rgba(0, 0, 0, 0.1)"];

    return { labels, values, colors, maxValue, stepSize, hasValidData };
  }, [vendorProfileCounts]);

  const vendorProfileDataMap = useMemo(() => {
    if (Array.isArray(VendorProfileChartData)) {
      const defaultLabel = vendorProfileCounts[0]?.VendorProfile;
      return defaultLabel ? { [defaultLabel]: VendorProfileChartData } : {};
    }
    return VendorProfileChartData && typeof VendorProfileChartData === "object"
      ? VendorProfileChartData
      : {};
  }, [VendorProfileChartData, vendorProfileCounts]);

  const upcomingTasks = useMemo(
    () => [
      { title: "Complete project report", status: "Pending", due: "Today - 16 Sep" },
      { title: "Follow up with client", status: "In Progress", due: "Due: Nov 1, 2024" },
      { title: "Prepare presentation", status: "In Progress", due: "Due: Nov 3, 2024" },
      { title: "Review team progress", status: "Pending", due: "Due: Nov 5, 2024" },
    ],
    []
  );

  const overdueTasks = useMemo(
    () => [
      { title: "Submit quarterly review", status: "Pending", due: "Overdue: Oct 10, 2024" },
      { title: "Client feedback call", status: "Overdue", due: "Overdue: Oct 15, 2024" },
      { title: "Update project milestones", status: "Overdue", due: "Overdue: Oct 18, 2024" },
      { title: "Approve budget proposal", status: "Overdue", due: "Overdue: Oct 22, 2024" },
    ],
    []
  );

  const hasMonthlySpend = !isLoading && monthlySpendChartData.length > 0;
  const hasDepartmentSpend = !isLoading;
  const hasActualVsBudget = !isLoading;
  const hasUpcomingTasks = !isLoading && upcomingTasks.length > 0;
  const hasOverdueTasks = !isLoading && overdueTasks.length > 0;
  const upcomingRenewalYearLabel = `FY${String(upcomingRenewalYear).slice(-2)}`;
  const upcomingRenewalHalfLabel =
    upcomingRenewalHalf === UPCOMING_HALF_FIRST ? "Jan-Jun" : "Jul-Dec";
  const upcomingRenewalPeriodLabel = `${upcomingRenewalYearLabel} · ${upcomingRenewalHalfLabel}`;

  const handleUpcomingRenewalPrev = () => {
    if (upcomingRenewalHalf === UPCOMING_HALF_LAST) {
      setUpcomingRenewalHalf(UPCOMING_HALF_FIRST);
    } else {
      setUpcomingRenewalYear((prev) => prev - 1);
      setUpcomingRenewalHalf(UPCOMING_HALF_LAST);
    }
  };

  const handleUpcomingRenewalNext = () => {
    if (upcomingRenewalHalf === UPCOMING_HALF_FIRST) {
      setUpcomingRenewalHalf(UPCOMING_HALF_LAST);
    } else {
      setUpcomingRenewalYear((prev) => prev + 1);
      setUpcomingRenewalHalf(UPCOMING_HALF_FIRST);
    }
  };

  const handleOpenAddAccountModal = async () => {
    setIsAddAccountButtonDisabled(true);
    try {
      const data = await populateAccountModal();
      setAccountModalInitialData(data ?? null);
    } catch (e) {
      setAccountModalInitialData(null);
    }
    setAddAccountModalOpen(true);
  };

  const selectedUpcomingRenewalLabel = useMemo(() => {
    if (!selectedUpcomingRenewalKey) return "";
    const [year, month] = selectedUpcomingRenewalKey.split("-").map(Number);
    if (Number.isNaN(year) || Number.isNaN(month)) return "";
    const date = new Date(year, month, 1);
    return date.toLocaleString("default", { month: "short", year: "numeric" });
  }, [selectedUpcomingRenewalKey]);

  const selectedUpcomingRenewalRows = useMemo(() => {
    if (!selectedUpcomingRenewalKey) return [];
    const rows = upcomingRenewalSeries.byMonth.get(selectedUpcomingRenewalKey) ?? [];
    return [...rows].sort((a, b) => {
      const aDate = toSafeDate(a.SubscriptionStartDate)?.getTime() ?? 0;
      const bDate = toSafeDate(b.SubscriptionStartDate)?.getTime() ?? 0;
      return aDate - bDate;
    });
  }, [selectedUpcomingRenewalKey, upcomingRenewalSeries]);

  const selectedVendorProfileRows = useMemo(() => {
    if (!selectedVendorProfileKey) return [];
    const rows = vendorProfileDataMap[selectedVendorProfileKey] ?? [];
    const filtered = rows.filter(
      (row) => toSafeDate(row.SubscriptionStartDate) && toSafeDate(row.SubscriptionEndDate)
    );
    return [...filtered].sort((a, b) => {
      const aDate = toSafeDate(a.SubscriptionStartDate)?.getTime() ?? 0;
      const bDate = toSafeDate(b.SubscriptionStartDate)?.getTime() ?? 0;
      return aDate - bDate;
    });
  }, [selectedVendorProfileKey, vendorProfileDataMap]);

  useEffect(() => {
    if (!selectedUpcomingRenewalKey) return;
    if (!upcomingRenewalSeries.monthKeys.includes(selectedUpcomingRenewalKey)) {
      setSelectedUpcomingRenewalKey(null);
    }
  }, [selectedUpcomingRenewalKey, upcomingRenewalSeries.monthKeys]);

  useEffect(() => {
    if (!selectedVendorProfileKey) return;
    if (Array.isArray(VendorProfileChartData)) return;
    if (
      !VendorProfileChartData ||
      typeof VendorProfileChartData !== "object" ||
      !(selectedVendorProfileKey in VendorProfileChartData)
    ) {
      setSelectedVendorProfileKey(null);
    }
  }, [selectedVendorProfileKey, VendorProfileChartData]);
  const maxMonthlyStartMonthIndex = Math.max(0, 12 - MONTHLY_WINDOW);
  const canMonthlyPrev = monthlyStartMonthIndex > 0;
  const canMonthlyNext = monthlyStartMonthIndex < maxMonthlyStartMonthIndex;
  const departmentYearIndex = departmentYears.indexOf(departmentYear);
  const canDepartmentPrev = departmentYearIndex > 0;
  const canDepartmentNext =
    departmentYearIndex !== -1 && departmentYearIndex < departmentYears.length - 1;
  const departmentYearLabel =
    departmentYears.length > 0 ? `FY${String(departmentYear).slice(-2)}` : "FY--";

  const hasAccount = !!userAuth?.accountid;
  const isDraftAccount = userAuth?.bpfstage === "draft";
  const isDataLoading = userAuthLoading || isLoading;

  // Extract activity lines array - backend may return [], { activityLinesData: [] }, { ActivityLines: [] }, etc.
  const activityLinesArray = (() => {
    if (activityLinesData == null) return [];
    if (Array.isArray(activityLinesData)) return activityLinesData;
    const arr =
      activityLinesData.activityLinesData ??
      activityLinesData.lines ??
      activityLinesData.ActivityLines ??
      activityLinesData.value;
    return Array.isArray(arr) ? arr : [];
  })();

  const isEmptyActivity =
    hasAccount && !isDataLoading && activityLinesData != null && activityLinesArray.length === 0;

  const renderStatusPill = (status) => {
    const palette = {
      Pending: { bg: "#FDE9D6", text: "#C07A32" },
      "In Progress": { bg: "#BDEFFF", text: "#0A6F8A" },
      Overdue: { bg: "#FAD9D9", text: "#B43D3D" },
    };
    const { bg, text } = palette[status] || palette.Pending;
    return (
      <span
        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: bg, color: text }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="w-full p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, index) => (
          <div
            key={card.title}
            className="rounded-2xl p-4 shadow-sm border border-white/60"
            style={{ backgroundColor: CARD_COLORS[index % CARD_COLORS.length] }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70">
                  <img src={card.icon} alt="" className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-[#111827]">{card.title}</span>
              </div>
              <div className="relative">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/70 bg-white/80 text-[10px] font-semibold text-[#667085] shadow-sm cursor-pointer"
                  onMouseEnter={() => setHoveredInfo(card.title)}
                  onMouseLeave={() => setHoveredInfo(null)}
                >
                  i
                </span>
                {hoveredInfo === card.title && (
                  <div className="absolute right-0 top-8 z-20 w-72 rounded-xl border border-[#E4E7EC] bg-white p-3 shadow-lg animate-fadeIn">
                    <p className="text-sm font-semibold text-[#0F172A]">{card.title}</p>
                    <p className="mt-1 text-xs leading-snug text-[#475467]">
                      {tooltipCopy[card.title]}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {isLoading ? (
              <div className="mt-4 space-y-3">
                <div className="h-6 w-16 rounded bg-white/70 animate-pulse" />
                {card.title === "Renewal Timeline" ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-8 w-20 rounded bg-white/70 animate-pulse" />
                    <div className="h-9 w-28 rounded bg-white animate-pulse border border-white/70" />
                  </div>
                ) : (
                  <div className="h-8 w-24 rounded bg-white/70 animate-pulse" />
                )}
              </div>
            ) : card.title === "Renewal Timeline" ? (
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-2xl font-semibold text-[#0F172A]">{card.value}</div>
                <select
                  value={timelineRange}
                  onChange={(event) => setTimelineRange(event.target.value)}
                  className="rounded-lg border border-[#D0D5DD] bg-transparent px-3 py-1.5 text-xs text-[#344054] focus:outline-none"
                >
                  <option value="4">12 Months</option>
                  <option value="3">6 Months</option>
                  <option value="2">3 Months</option>
                  <option value="1">1 Month</option>
                </select>
              </div>
            ) : (
              <div className="mt-4 text-2xl font-semibold text-[#0F172A]">{card.value}</div>
            )}
          </div>
        ))}
      </div>

      {isDataLoading ? (
        <DashboardSkeletonLoader />
      ) : !hasAccount || isDraftAccount ? (
        <AddOrganization
          onAddClick={handleOpenAddAccountModal}
          isDisabled={isAddAccountButtonDisabled}
        />
      ) : isEmptyActivity ? (
        <AddSubscription />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <VendorDoughnutChart
              vendorBreakdown={vendorBreakdown}
              isLoading={userAuthLoading || isLoading}
              hoveredInfo={hoveredInfo}
              onHoverInfoChange={setHoveredInfo}
              vendorTooltipText={tooltipCopy.Vendors}
            />
            <MonthlySpendChart
              monthlySpendSeries={monthlySpendSeries}
              isLoading={userAuthLoading || isLoading}
              hasMonthlySpend={hasMonthlySpend}
              canMonthlyPrev={canMonthlyPrev}
              canMonthlyNext={canMonthlyNext}
              onMonthlyPrev={() => setMonthlyStartMonthIndex((prev) => Math.max(0, prev - 1))}
              onMonthlyNext={() =>
                setMonthlyStartMonthIndex((prev) => Math.min(maxMonthlyStartMonthIndex, prev + 1))
              }
              skeleton={<LineSkeleton />}
            />
            <DepartmentSpendChart
              departmentChartSeries={departmentChartSeries}
              isLoading={userAuthLoading || isLoading}
              hasDepartmentSpend={hasDepartmentSpend}
              departmentYearLabel={departmentYearLabel}
              canDepartmentPrev={canDepartmentPrev}
              canDepartmentNext={canDepartmentNext}
              onDepartmentPrev={() => {
                if (departmentYearIndex > 0) {
                  setDepartmentYear(departmentYears[departmentYearIndex - 1]);
                }
              }}
              onDepartmentNext={() => {
                if (
                  departmentYearIndex !== -1 &&
                  departmentYearIndex < departmentYears.length - 1
                ) {
                  setDepartmentYear(departmentYears[departmentYearIndex + 1]);
                }
              }}
              skeleton={<BarSkeleton bars={4} />}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <ActualVsBudgetChart
              actualVsBudgetSeries={actualVsBudgetSeries}
              isLoading={userAuthLoading || isLoading}
              hasActualVsBudget={hasActualVsBudget}
              skeleton={<BarSkeleton bars={2} />}
            />
            <VendorProfileChart
              vendorProfileSeries={vendorProfileSeries}
              isLoading={userAuthLoading || isLoading}
              selectedVendorProfileKey={selectedVendorProfileKey}
              selectedVendorProfileRows={selectedVendorProfileRows}
              onSelectVendorProfileKey={setSelectedVendorProfileKey}
              formatShortDate={formatShortDate}
              skeleton={<BarSkeleton bars={3} />}
            />
            <UpcomingRenewalChart
              upcomingRenewalSeries={upcomingRenewalSeries}
              isLoading={userAuthLoading || isLoading}
              selectedUpcomingRenewalKey={selectedUpcomingRenewalKey}
              selectedUpcomingRenewalLabel={selectedUpcomingRenewalLabel}
              selectedUpcomingRenewalRows={selectedUpcomingRenewalRows}
              onSelectUpcomingRenewalKey={setSelectedUpcomingRenewalKey}
              onUpcomingRenewalPrev={handleUpcomingRenewalPrev}
              onUpcomingRenewalNext={handleUpcomingRenewalNext}
              upcomingRenewalPeriodLabel={upcomingRenewalPeriodLabel}
              formatShortDate={formatShortDate}
              skeleton={<BarSkeleton bars={6} />}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#DFFFC1] text-[#0F172A]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3 className="text-lg font-semibold text-[#111827]">My Upcoming Tasks</h3>
              </div>
              <div className="mt-4 divide-y divide-[#EEF2F6]">
                {hasUpcomingTasks && !userAuthLoading
                  ? upcomingTasks.map((task, idx) => (
                      <div
                        key={task.title}
                        className={`flex items-center justify-between py-3 ${idx === 0 ? "pt-0" : ""}`}
                      >
                        <div className="text-sm font-medium text-[#111827]">{task.title}</div>
                        <div className="flex items-center gap-4">
                          {renderStatusPill(task.status)}
                          <span className="text-sm text-[#6B7280]">{task.due}</span>
                        </div>
                      </div>
                    ))
                  : Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between py-3 ${idx === 0 ? "pt-0" : ""}`}
                      >
                        <RectangleSkeleton className="h-4 w-56" />
                        <div className="flex items-center gap-4">
                          <RectangleSkeleton className="h-6 w-20 rounded-full" />
                          <RectangleSkeleton className="h-4 w-32" />
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E4F3] text-[#0F172A]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 4 3 9l9 5 9-5-9-5Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 15l9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 13v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3 className="text-lg font-semibold text-[#111827]">Overdue Tasks</h3>
              </div>
              <div className="mt-4 divide-y divide-[#EEF2F6]">
                {hasOverdueTasks && !userAuthLoading
                  ? overdueTasks.map((task, idx) => (
                      <div
                        key={task.title}
                        className={`flex items-center justify-between py-3 ${idx === 0 ? "pt-0" : ""}`}
                      >
                        <div className="text-sm font-medium text-[#111827]">{task.title}</div>
                        <div className="flex items-center gap-4">
                          {renderStatusPill(task.status)}
                          <span className="text-sm text-[#6B7280]">{task.due}</span>
                        </div>
                      </div>
                    ))
                  : Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between py-3 ${idx === 0 ? "pt-0" : ""}`}
                      >
                        <RectangleSkeleton className="h-4 w-56" />
                        <div className="flex items-center gap-4">
                          <RectangleSkeleton className="h-6 w-20 rounded-full" />
                          <RectangleSkeleton className="h-4 w-32" />
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </>
      )}
      <AddAccountModal
        open={addAccountModalOpen}
        onClose={() => {
          setAddAccountModalOpen(false);
          setAccountModalInitialData(null);
          setIsAddAccountButtonDisabled(false);
        }}
        initialData={accountModalInitialData}
      />
    </div>
  );
};

export default Home;
