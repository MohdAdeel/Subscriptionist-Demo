import Chart from "chart.js/auto";
import { useHomeStore } from "../../stores";
import { useActivityLines } from "../../hooks";
import { handleDataProcessing } from "../../lib/utils/home";
import TotalActiveCostIcon from "../../assets/TotalActiveCost.svg";
import RenewalTimelineIcon from "../../assets/RenewalTimeline.svg";
import React, { useEffect, useMemo, useRef, useState } from "react";
import UpcomingRenewalsIcon from "../../assets/UpcomingRenewals.svg";
import RecentlyConcludedIcon from "../../assets/RecentlyConcluded.svg";
import ActiveSubscriptionsIcon from "../../assets/ActiveSubscriptions.svg";
import { CircleSkeleton, RectangleSkeleton, TextSkeleton } from "../../components/SkeletonLoader";

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

const VENDOR_CHART_COLORS = [
  "#CCD6EB",
  "#E1FFBB",
  "#1D225D",
  "#BFF1FF",
  "#CFE1FF",
  "#D4F1F4",
  "#E1DBFE",
];

const DEPARTMENT_CHART_COLORS = ["#E1DBFE", "#BFF1FF", "#E1FFBB", "#EAECF0", "#CFE1FF", "#BFF1FF"];

const UPCOMING_LABELS = ["Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026"];

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
  const { data: activityLinesData, isLoading, error } = useActivityLines();
  const FirstTwoCards = useHomeStore((state) => state.FirstTwoCards);
  const renewalTimelineCards = useHomeStore((state) => state.renewalTimelineCards);
  const RecentlyConcluded = useHomeStore((state) => state.RecentlyConcluded);
  const VendorDoughnutChartData = useHomeStore((state) => state.VendorDoughnutChartData) ?? [];
  const monthlySpendChartData = useHomeStore((state) => state.monthlySpendChartData) ?? [];
  const departmentSpendChartData = useHomeStore((state) => state.departmentSpendChartData) ?? [];
  const ActualVsBudgetData = useHomeStore((state) => state.ActualVsBudgetData) ?? [];
  const [timelineRange, setTimelineRange] = useState("12 Months");
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [maxLabelLength, setMaxLabelLength] = useState(() => getMaxLabelLength());
  const [departmentLabelLength, setDepartmentLabelLength] = useState(() =>
    getDepartmentLabelLength()
  );
  const [monthlyStartMonthIndex, setMonthlyStartMonthIndex] = useState(() => {
    const currentMonth = new Date().getMonth();
    return Math.min(currentMonth, 12 - MONTHLY_WINDOW);
  });
  const [departmentYear, setDepartmentYear] = useState(() => new Date().getFullYear());

  const vendorsChartRef = useRef(null);
  const monthlySpendChartRef = useRef(null);
  const vendorProfileChartRef = useRef(null);
  const actualVsBudgetChartRef = useRef(null);
  const upcomingRenewalChartRef = useRef(null);
  const vendorsChartInstanceRef = useRef(null);
  const departmentSpendChartRef = useRef(null);
  const monthlySpendChartInstanceRef = useRef(null);
  const vendorProfileChartInstanceRef = useRef(null);
  const actualVsBudgetChartInstanceRef = useRef(null);
  const departmentSpendChartInstanceRef = useRef(null);
  const upcomingRenewalChartInstanceRef = useRef(null);

  // Run home data processing when we're on Home and activity lines data is available
  useEffect(() => {
    if (activityLinesData != null) {
      handleDataProcessing(activityLinesData);
    }
  }, [activityLinesData]);

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
  const vendorProfile = useMemo(() => [{ label: "Strategic", value: 1 }], []);
  const upcomingRenewal = useMemo(() => [1, 1, 1, 1, 1, 1], []);

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

  const hasVendorData = !isLoading && vendorBreakdown.length > 0;
  const hasMonthlySpend = !isLoading && monthlySpendChartData.length > 0;
  const hasDepartmentSpend = !isLoading;
  const hasActualVsBudget = !isLoading;
  const hasVendorProfile = !isLoading && vendorProfile.length > 0;
  const hasUpcomingRenewal = !isLoading && upcomingRenewal.length > 0;
  const hasUpcomingTasks = !isLoading && upcomingTasks.length > 0;
  const hasOverdueTasks = !isLoading && overdueTasks.length > 0;
  const maxMonthlyStartMonthIndex = Math.max(0, 12 - MONTHLY_WINDOW);
  const canMonthlyPrev = monthlyStartMonthIndex > 0;
  const canMonthlyNext = monthlyStartMonthIndex < maxMonthlyStartMonthIndex;
  const departmentYearIndex = departmentYears.indexOf(departmentYear);
  const canDepartmentPrev = departmentYearIndex > 0;
  const canDepartmentNext =
    departmentYearIndex !== -1 && departmentYearIndex < departmentYears.length - 1;
  const departmentYearLabel =
    departmentYears.length > 0 ? `FY${String(departmentYear).slice(-2)}` : "FY--";

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

  useEffect(() => {
    if (isLoading || !vendorsChartRef.current) return;
    const labels = vendorBreakdown.map((item) => item.label);
    const values = vendorBreakdown.map((item) => item.value);
    const ctx = vendorsChartRef.current.getContext("2d");
    if (vendorsChartInstanceRef.current) {
      vendorsChartInstanceRef.current.destroy();
    }
    vendorsChartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: labels.map(
              (_, i) => VENDOR_CHART_COLORS[i % VENDOR_CHART_COLORS.length]
            ),
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "72%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.parsed}`,
            },
          },
        },
      },
    });
    return () => {
      if (vendorsChartInstanceRef.current) {
        vendorsChartInstanceRef.current.destroy();
        vendorsChartInstanceRef.current = null;
      }
    };
  }, [vendorBreakdown, isLoading]);

  useEffect(() => {
    if (isLoading || !monthlySpendChartRef.current || monthlySpendSeries.values.length === 0)
      return;
    const ctx = monthlySpendChartRef.current.getContext("2d");
    if (monthlySpendChartInstanceRef.current) {
      monthlySpendChartInstanceRef.current.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(207, 255, 147, 0.8)");
    gradient.addColorStop(1, "rgba(207, 255, 147, 0)");

    const maxValue = Math.max(...monthlySpendSeries.values);
    const minValue = Math.min(...monthlySpendSeries.values);
    const range = maxValue - minValue;
    const stepSize = range > 0 ? Math.ceil(range / 4) : 1;

    monthlySpendChartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: monthlySpendSeries.labels,
        datasets: [
          {
            label: "Monthly Spend",
            data: monthlySpendSeries.values,
            fill: true,
            backgroundColor: gradient,
            borderColor: "#AFFF4A",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#ffffff",
            pointHoverBorderColor: "#AFFF4A",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#ffffff",
            titleColor: "#000000",
            bodyColor: "#000000",
            borderColor: "#AFFF4A",
            borderWidth: 1,
            callbacks: {
              label: (tooltipItem) => `$${Number(tooltipItem.raw || 0).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#475467",
              font: { size: 12 },
              maxRotation: 0,
              minRotation: 0,
              callback: function (value) {
                const label = this.getLabelForValue(value);
                return typeof label === "string" ? label.split("\n") : label;
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
              font: { size: 12 },
              stepSize,
              maxTicksLimit: 5,
              callback: (value) => `$${value}`,
            },
            border: {
              color: "#FFFFFF",
              width: 0,
            },
          },
        },
      },
    });
    return () => {
      if (monthlySpendChartInstanceRef.current) {
        monthlySpendChartInstanceRef.current.destroy();
        monthlySpendChartInstanceRef.current = null;
      }
    };
  }, [monthlySpendSeries, isLoading]);

  useEffect(() => {
    if (isLoading || !departmentSpendChartRef.current) return;
    const ctx = departmentSpendChartRef.current.getContext("2d");
    if (departmentSpendChartInstanceRef.current) {
      departmentSpendChartInstanceRef.current.destroy();
    }
    departmentSpendChartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: departmentChartSeries.labels,
        datasets: [
          {
            label: departmentChartSeries.chartLabel,
            data: departmentChartSeries.values,
            backgroundColor: departmentChartSeries.colors,
            hoverBackgroundColor: departmentChartSeries.colors,
            borderWidth: 0,
            borderRadius: 10,
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
              maxRotation: 0,
              minRotation: 0,
              callback: function (value) {
                const label = this.getLabelForValue(value);
                return typeof label === "string" ? label.split("\n") : label;
              },
            },
            grid: { display: false },
          },
          y: {
            ticks: {
              color: "#000000",
              font: { size: 12 },
              callback: (value) => `$${Number(value).toLocaleString()}`,
              stepSize: departmentChartSeries.stepSize,
              maxTicksLimit: 5,
            },
            grid: {
              display: true,
              color: "#EAECF0",
              borderDash: [5, 5],
            },
            beginAtZero: true,
            suggestedMin: 0,
            suggestedMax: departmentChartSeries.stepSize * 5,
            border: {
              color: "#FFFFFF",
              width: 1,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (tooltipItem) => `$${Number(tooltipItem.raw || 0).toLocaleString()}`,
            },
          },
          legend: { display: false },
        },
      },
    });
    return () => {
      if (departmentSpendChartInstanceRef.current) {
        departmentSpendChartInstanceRef.current.destroy();
        departmentSpendChartInstanceRef.current = null;
      }
    };
  }, [departmentChartSeries, isLoading]);

  useEffect(() => {
    if (isLoading || !actualVsBudgetChartRef.current) return;
    const ctx = actualVsBudgetChartRef.current.getContext("2d");
    if (actualVsBudgetChartInstanceRef.current) {
      actualVsBudgetChartInstanceRef.current.destroy();
    }
    actualVsBudgetChartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: actualVsBudgetSeries.labels,
        datasets: [
          {
            label: "Budget",
            data: actualVsBudgetSeries.budgetAmounts,
            backgroundColor: "#CCD6EB",
            borderRadius: 10,
          },
          {
            label: "Actual Spend",
            data: actualVsBudgetSeries.actualAmounts,
            backgroundColor: "#E1DBFE",
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: "easeOutQuart",
        },
        animations: {
          y: {
            from: 0,
          },
        },
        plugins: {
          tooltip: {
            position: "nearest",
            backgroundColor: "#ffffff",
            titleColor: "#000000",
            bodyColor: "#000000",
            borderColor: "#cccccc",
            borderWidth: 1,
            usePointStyle: true,
            callbacks: {
              labelPointStyle: () => ({
                pointStyle: "circle",
                rotation: 0,
              }),
              label: (tooltipItem) =>
                `${tooltipItem.dataset.label}: $${Number(tooltipItem.raw || 0).toLocaleString()}`,
            },
          },
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              color: "#000000",
              font: { size: 12 },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#000000",
              font: { size: 12 },
              maxRotation: 0,
              minRotation: 0,
              callback: function (value) {
                const label = this.getLabelForValue(value);
                return typeof label === "string" ? label.split("\n") : label;
              },
            },
            grid: { display: false },
            stacked: false,
          },
          y: {
            ticks: {
              color: "#000000",
              font: { size: 12 },
              callback: (value) => `$${Number(value).toLocaleString()}`,
              stepSize: actualVsBudgetSeries.stepSize,
              maxTicksLimit: 5,
            },
            grid: {
              display: true,
              color: "#EAECF0",
              borderDash: [5, 5],
              drawBorder: false,
              drawTicks: false,
            },
            beginAtZero: true,
            suggestedMax: actualVsBudgetSeries.stepSize * 5,
          },
        },
      },
    });
    return () => {
      if (actualVsBudgetChartInstanceRef.current) {
        actualVsBudgetChartInstanceRef.current.destroy();
        actualVsBudgetChartInstanceRef.current = null;
      }
    };
  }, [actualVsBudgetSeries, isLoading]);

  useEffect(() => {
    if (isLoading || !vendorProfileChartRef.current) return;
    const ctx = vendorProfileChartRef.current.getContext("2d");
    if (vendorProfileChartInstanceRef.current) {
      vendorProfileChartInstanceRef.current.destroy();
    }
    vendorProfileChartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: vendorProfile.map((item) => item.label),
        datasets: [
          {
            data: vendorProfile.map((item) => item.value),
            backgroundColor: "#99E6FF",
            borderRadius: 12,
            maxBarThickness: 200,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#667085" } },
          y: {
            min: 0,
            max: 2,
            ticks: { stepSize: 1, color: "#667085" },
            grid: { color: "#EEF2F6" },
          },
        },
      },
    });
    return () => {
      if (vendorProfileChartInstanceRef.current) {
        vendorProfileChartInstanceRef.current.destroy();
        vendorProfileChartInstanceRef.current = null;
      }
    };
  }, [vendorProfile, isLoading]);

  useEffect(() => {
    if (isLoading || !upcomingRenewalChartRef.current) return;
    const ctx = upcomingRenewalChartRef.current.getContext("2d");
    if (upcomingRenewalChartInstanceRef.current) {
      upcomingRenewalChartInstanceRef.current.destroy();
    }
    upcomingRenewalChartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: UPCOMING_LABELS,
        datasets: [
          {
            data: upcomingRenewal,
            backgroundColor: ["#DCEBFF", "#C8DDFF", "#B8D1FF", "#9CC2FF", "#8CB7FF", "#7EAEFF"],
            borderRadius: 10,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#667085" } },
          y: {
            min: 0,
            max: 2,
            ticks: { stepSize: 1, color: "#667085" },
            grid: { color: "#EEF2F6" },
          },
        },
      },
    });
    return () => {
      if (upcomingRenewalChartInstanceRef.current) {
        upcomingRenewalChartInstanceRef.current.destroy();
        upcomingRenewalChartInstanceRef.current = null;
      }
    };
  }, [upcomingRenewal, isLoading]);

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
                  className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs text-[#344054] focus:outline-none"
                >
                  <option>12 Months</option>
                  <option>6 Months</option>
                  <option>3 Months</option>
                  <option>1 Month</option>
                </select>
              </div>
            ) : (
              <div className="mt-4 text-2xl font-semibold text-[#0F172A]">{card.value}</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#111827]">Vendors</h3>
            <div className="relative">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#E4E7EC] bg-white text-[10px] font-semibold text-[#667085] shadow-sm cursor-pointer"
                onMouseEnter={() => setHoveredInfo("Vendors")}
                onMouseLeave={() => setHoveredInfo(null)}
              >
                i
              </span>
              {hoveredInfo === "Vendors" && (
                <div className="absolute right-0 top-8 z-20 w-64 rounded-xl border border-[#E4E7EC] bg-white p-3 shadow-lg animate-fadeIn">
                  <p className="text-sm font-semibold text-[#0F172A]">Vendors</p>
                  <p className="mt-1 text-xs leading-snug text-[#475467]">{tooltipCopy.Vendors}</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4">
            {hasVendorData ? (
              <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
                <div className="h-48 w-48">
                  <canvas ref={vendorsChartRef} />
                </div>
                <div className="max-h-50 overflow-y-auto pr-2 space-y-2">
                  {vendorBreakdown.map((vendor, index) => (
                    <div
                      key={vendor.label}
                      className="flex items-center gap-6 text-xs text-[#344054]"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: VENDOR_CHART_COLORS[index % VENDOR_CHART_COLORS.length],
                        }}
                      />
                      <span className="truncate">{vendor.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <CircleSkeleton size="180px" className="bg-gray-200" />
                <div className="flex-1 space-y-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CircleSkeleton size="12px" className="bg-gray-300" />
                      <TextSkeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#111827]">Monthly Spend Trend</h3>
            <div className="flex items-center gap-2 text-[#98A2B3]">
              <button
                className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setMonthlyStartMonthIndex((prev) => Math.max(0, prev - 1))}
                disabled={!canMonthlyPrev}
              >
                &lt;
              </button>
              <button
                className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() =>
                  setMonthlyStartMonthIndex((prev) => Math.min(maxMonthlyStartMonthIndex, prev + 1))
                }
                disabled={!canMonthlyNext}
              >
                &gt;
              </button>
            </div>
          </div>
          <div className="mt-4 h-56">
            {hasMonthlySpend ? <canvas ref={monthlySpendChartRef} /> : <LineSkeleton />}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#111827]">Departmental Spend Trend</h3>
            <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
              <button
                className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => {
                  if (departmentYearIndex > 0) {
                    setDepartmentYear(departmentYears[departmentYearIndex - 1]);
                  }
                }}
                disabled={!canDepartmentPrev}
              >
                &lt;
              </button>
              <span>{departmentYearLabel}</span>
              <button
                className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => {
                  if (
                    departmentYearIndex !== -1 &&
                    departmentYearIndex < departmentYears.length - 1
                  ) {
                    setDepartmentYear(departmentYears[departmentYearIndex + 1]);
                  }
                }}
                disabled={!canDepartmentNext}
              >
                &gt;
              </button>
            </div>
          </div>
          <div className="mt-4 h-56">
            {hasDepartmentSpend ? (
              <canvas ref={departmentSpendChartRef} />
            ) : (
              <BarSkeleton bars={4} />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#111827]">Actual vs Budget</h3>
            <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
              <button className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs">&lt;</button>
              <span>FY26</span>
              <button className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs">&gt;</button>
            </div>
          </div>
          <div className="mt-4 h-56">
            {hasActualVsBudget ? <canvas ref={actualVsBudgetChartRef} /> : <BarSkeleton bars={2} />}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#111827]">Vendors by Profile</h3>
            <span className="text-xs text-[#98A2B3]">i</span>
          </div>
          <div className="mt-4 h-56">
            {hasVendorProfile ? <canvas ref={vendorProfileChartRef} /> : <BarSkeleton bars={3} />}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#111827]">Upcoming Renewal Per Month</h3>
            <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
              <button className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs">&lt;</button>
              <span>FY26</span>
              <button className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs">&gt;</button>
            </div>
          </div>
          <div className="mt-4 h-56">
            {hasUpcomingRenewal ? (
              <canvas ref={upcomingRenewalChartRef} />
            ) : (
              <BarSkeleton bars={6} />
            )}
          </div>
        </div>
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
            {hasUpcomingTasks
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
            {hasOverdueTasks
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
    </div>
  );
};

export default Home;
