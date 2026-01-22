import {
  FiX,
  FiBell,
  FiUser,
  FiUpload,
  FiFilter,
  FiSearch,
  FiDownload,
  FiCalendar,
} from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Financial from "./components/Financial";
import { useActivityLines } from "../../hooks";
import { useReportsPageStore } from "../../stores";
import { useState, useEffect, useRef } from "react";
import StandardReports from "./components/StandardReports";
import RenewalAndExpiration from "./components/RenewalAndExpiration";
import { TableSkeleton, ChartSkeleton, KPICardSkeleton } from "../../components/SkeletonLoader";

const Report = () => {
  // React Query handles caching, deduplication, and loading state
  const { isLoading, error } = useActivityLines();

  // Get store data for PDF export
  const TopCards = useReportsPageStore((state) => state.TopCards);
  const subscriptionTableData = useReportsPageStore((state) => state.subscriptionTableData);
  const spendByDepartmentChartData = useReportsPageStore(
    (state) => state.spendByDepartmentChartData
  );
  const vendorCountData = useReportsPageStore((state) => state.vendorCountData);
  const categorySummary = useReportsPageStore((state) => state.categorySummary);
  const nearingRenewalData = useReportsPageStore((state) => state.nearingRenewalData);
  const expiredSubscriptionsData = useReportsPageStore((state) => state.expiredSubscriptionsData);
  const categorizedSubscriptions = useReportsPageStore((state) => state.categorizedSubscriptions);

  const [activeTab, setActiveTab] = useState("standard");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const MIN_HIGH_SPEND = 0;
  const MAX_HIGH_SPEND = 800000;
  const [highSpendValue, setHighSpendValue] = useState(MAX_HIGH_SPEND);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateRangeText, setDateRangeText] = useState("");
  const datePickerRef = useRef(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Refs for PDF export
  const standardReportsRef = useRef(null);
  const financialRef = useRef(null);
  const renewalRef = useRef(null);
  const standardChartRef = useRef(null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target) &&
        !event.target.closest("[data-date-input]")
      ) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);

  const handleDatePickerClick = () => {
    if (!showDatePicker) {
      setCurrentMonth(new Date());
    }
    setShowDatePicker(!showDatePicker);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForDisplay = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}/${year}`;
  };

  const isDateInRange = (date, start, end) => {
    if (!start || !end) return false;
    const checkDate = new Date(date);
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    return checkDate >= startDateObj && checkDate <= endDateObj;
  };

  const isSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const handleDateClick = (day, month, year) => {
    const clickedDate = new Date(year, month, day);

    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (clickedDate < startDate) {
        setStartDate(clickedDate);
        setEndDate(null);
      } else {
        setEndDate(clickedDate);
      }
    }
  };

  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      const formattedRange = `${formatDateForDisplay(
        startDate
      )} - ${formatDateForDisplay(endDate)}`;
      setDateRangeText(formattedRange);
      setShowDatePicker(false);
    }
  };

  const handleClearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setDateRangeText("");
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const renderCalendar = (monthDate) => {
    const daysInMonth = getDaysInMonth(monthDate);
    const firstDay = getFirstDayOfMonth(monthDate);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    const monthName = monthDate.toLocaleString("default", { month: "long" });
    const days = [];
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="flex-1 min-w-[260px]">
        <div className="text-center mb-3">
          <h3 className="m-0 text-sm font-semibold text-[#1d225d]">
            {monthName} {year}
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[11px] font-semibold text-gray-500 py-1 uppercase"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square bg-transparent"></div>;
            }

            const date = new Date(year, month, day);
            const isToday = isSameDate(date, today);
            const isStart = startDate && isSameDate(date, startDate);
            const isEnd = endDate && isSameDate(date, endDate);
            const isInRange = isDateInRange(date, startDate, endDate);

            let dayClass =
              "aspect-square flex items-center justify-center text-xs font-medium text-gray-700 cursor-pointer rounded-md transition-all duration-200";
            if (isToday) dayClass += " bg-blue-50 text-blue-900 font-semibold";
            if (isStart) dayClass += " bg-[#1d225d] text-white font-semibold rounded-r-none";
            if (isEnd) dayClass += " bg-[#1d225d] text-white font-semibold rounded-l-none";
            if (isInRange && !isStart && !isEnd)
              dayClass += " bg-[#e8ebff] text-[#1d225d] font-semibold";
            if (!isStart && !isEnd && !isInRange && !isToday)
              dayClass += " bg-white hover:bg-gray-100";

            return (
              <div key={day} className={dayClass} onClick={() => handleDateClick(day, month, year)}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + 1);
    return next;
  };

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to load reports</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const handleExportToPDF = async () => {
    setIsExporting(true);

    try {
      let fileName = "Report";

      // Create PDF document
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper function to format currency
      const formatValue = (value) => {
        const numericValue = value === null || value === undefined ? 0 : Number(value);
        if (Number.isNaN(numericValue)) return "$0.00";
        return (
          "$" +
          numericValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      };

      // Helper function to format date
      const formatPdfDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US");
      };

      const formatDateKey = (value) => {
        if (!value) return null;
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const buildHighlightedDatesMap = (categorized) => {
        const map = new Map();
        Object.entries(categorized || {}).forEach(([category, subscriptions]) => {
          (subscriptions || []).forEach((subscription) => {
            const dateKey = formatDateKey(subscription.SubscriptionEndDate);
            if (!dateKey) return;
            const existing = map.get(dateKey) ?? [];
            existing.push({ subscription, category });
            map.set(dateKey, existing);
          });
        });
        return map;
      };

      const getCalendarStartMonth = (highlightedMap) => {
        const dates = Array.from(highlightedMap.keys())
          .map((dateKey) => new Date(dateKey))
          .filter((date) => !Number.isNaN(date.getTime()))
          .sort((a, b) => a - b);
        if (dates.length > 0) {
          const first = dates[0];
          return new Date(first.getFullYear(), first.getMonth(), 1);
        }
        return new Date();
      };

      // Helper function to check if we need a new page
      const checkNewPage = (requiredHeight) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Helper function to draw a card
      const drawCard = (x, y, width, height, bgColor, title, value) => {
        // Draw background
        pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
        pdf.roundedRect(x, y, width, height, 3, 3, "F");

        // Draw title
        pdf.setFontSize(10);
        pdf.setTextColor(75, 85, 99);
        pdf.text(title, x + 8, y + 15);

        // Draw value
        pdf.setFontSize(18);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont(undefined, "bold");
        pdf.text(value, x + 8, y + 30);
        pdf.setFont(undefined, "normal");
      };

      // Helper function to add a table using autoTable
      const addTable = (title, headers, data) => {
        checkNewPage(20);

        // Add title
        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont(undefined, "bold");
        pdf.text(title, margin, yPosition);
        pdf.setFont(undefined, "normal");
        yPosition += 8;

        if (data.length === 0) {
          pdf.setFontSize(10);
          pdf.setTextColor(107, 114, 128);
          pdf.text("No data available", margin, yPosition + 5);
          yPosition += 15;
          return;
        }

        // Use autoTable for clean tables
        autoTable(pdf, {
          startY: yPosition,
          head: [headers],
          body: data,
          margin: { left: margin, right: margin },
          headStyles: {
            fillColor: [234, 236, 240],
            textColor: [55, 65, 81],
            fontStyle: "bold",
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [55, 65, 81],
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          columnStyles: {
            2: { textColor: [124, 58, 237] }, // Amount column - purple
            3: { textColor: [8, 145, 178] }, // Start Date column - cyan
            4: { textColor: [8, 145, 178] }, // End Date column - cyan
          },
        });

        yPosition = pdf.lastAutoTable.finalY + 15;
      };

      // Helper function to add chart image
      const addChartImage = (title, canvas) => {
        if (!canvas) return;

        checkNewPage(80);

        // Add title
        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont(undefined, "bold");
        pdf.text(title, margin, yPosition);
        pdf.setFont(undefined, "normal");
        yPosition += 5;

        // Add chart image
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = 60;

        pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      };

      const addDonutChartWithLegend = (title, canvas, legendItems) => {
        if (!canvas) return;

        const chartSize = 50;
        const rowHeight = 5.5;
        const maxVisibleItems = 10;
        const items = legendItems.slice(0, maxVisibleItems);
        const remainingCount = legendItems.length - items.length;
        const legendRows = items.length + (remainingCount > 0 ? 1 : 0);
        const sectionHeight = Math.max(chartSize, legendRows * rowHeight);

        checkNewPage(sectionHeight + 12);

        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont(undefined, "bold");
        pdf.text(title, margin, yPosition);
        pdf.setFont(undefined, "normal");
        yPosition += 6;

        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", margin, yPosition, chartSize, chartSize);

        const legendX = margin + chartSize + 10;
        let legendY = yPosition + 4;

        pdf.setFontSize(9);
        items.forEach((item) => {
          pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
          pdf.circle(legendX + 2, legendY + 2, 1.7, "F");
          pdf.setTextColor(55, 65, 81);
          pdf.text(item.label, legendX + 6, legendY + 3);
          legendY += rowHeight;
        });

        if (remainingCount > 0) {
          pdf.setTextColor(107, 114, 128);
          pdf.text(`+${remainingCount} more`, legendX + 6, legendY + 3);
        }

        yPosition += sectionHeight + 12;
      };

      const addRenewalCalendarReport = () => {
        const highlightedDatesMap = buildHighlightedDatesMap(categorizedSubscriptions);
        const calendarStartDate = getCalendarStartMonth(highlightedDatesMap);
        const nextMonthDate = new Date(
          calendarStartDate.getFullYear(),
          calendarStartDate.getMonth() + 1,
          1
        );

        const categoryColors = {
          notUrgent: { fill: [225, 219, 254], text: [55, 65, 81] },
          urgent: { fill: [147, 51, 234], text: [255, 255, 255] },
          veryUrgent: { fill: [107, 33, 168], text: [255, 255, 255] },
        };

        const categoryLabels = {
          notUrgent: "Not Urgent",
          urgent: "Urgently",
          veryUrgent: "Very Urgently",
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

        const drawCalendar = (date, startX, startY, width) => {
          const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
          const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const totalCells = firstDay + totalDays;
          const rows = Math.ceil(totalCells / 7);

          const titleHeight = 6;
          const weekHeight = 5;
          const cellHeight = 7;
          const cellWidth = width / 7;

          pdf.setFontSize(10);
          pdf.setTextColor(31, 41, 55);
          pdf.setFont(undefined, "bold");
          pdf.text(`${monthNames[date.getMonth()]} ${date.getFullYear()}`, startX, startY + 4);
          pdf.setFont(undefined, "normal");

          let cursorY = startY + titleHeight;
          pdf.setFontSize(8);
          pdf.setTextColor(107, 114, 128);
          weekdayNames.forEach((day, index) => {
            pdf.text(day, startX + index * cellWidth + cellWidth / 2, cursorY + 3, {
              align: "center",
            });
          });

          cursorY += weekHeight;
          let cellIndex = 0;

          for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < 7; col += 1) {
              const x = startX + col * cellWidth;
              const y = cursorY + row * cellHeight;
              const dayNumber = cellIndex - firstDay + 1;
              const isValidDay = dayNumber > 0 && dayNumber <= totalDays;

              if (isValidDay) {
                const dateKey = formatDateKey(
                  new Date(Date.UTC(date.getFullYear(), date.getMonth(), dayNumber))
                );
                const highlights = highlightedDatesMap.get(dateKey);
                const category = highlights ? highlights[0]?.category : null;
                const colors = category ? categoryColors[category] : null;

                if (colors) {
                  pdf.setFillColor(colors.fill[0], colors.fill[1], colors.fill[2]);
                  pdf.roundedRect(x + 0.4, y + 0.4, cellWidth - 0.8, cellHeight - 0.8, 1, 1, "F");
                } else {
                  pdf.setDrawColor(229, 231, 235);
                  pdf.rect(x + 0.4, y + 0.4, cellWidth - 0.8, cellHeight - 0.8);
                }

                pdf.setFontSize(8);
                if (colors) {
                  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
                } else {
                  pdf.setTextColor(75, 85, 99);
                }
                pdf.text(String(dayNumber), x + cellWidth / 2, y + cellHeight / 2 + 2.2, {
                  align: "center",
                });
              }

              cellIndex += 1;
            }
          }

          return titleHeight + weekHeight + rows * cellHeight;
        };

        checkNewPage(120);

        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont(undefined, "bold");
        pdf.text("Renewal Calendar Report", margin, yPosition);
        pdf.setFont(undefined, "normal");
        yPosition += 7;

        const legendItems = [
          { label: "Not Urgent", color: [225, 219, 254] },
          { label: "Urgently", color: [147, 51, 234] },
          { label: "Very Urgently", color: [107, 33, 168] },
        ];

        let legendX = margin;
        const legendY = yPosition;
        legendItems.forEach((item) => {
          pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
          pdf.circle(legendX + 2, legendY + 2, 2, "F");
          pdf.setFontSize(9);
          pdf.setTextColor(75, 85, 99);
          pdf.text(item.label, legendX + 6, legendY + 3);
          legendX += 45;
        });
        yPosition += 10;

        const calendarGap = 8;
        const calendarWidth = (pageWidth - margin * 2 - calendarGap) / 2;
        const calendarTop = yPosition;

        const leftHeight = drawCalendar(calendarStartDate, margin, calendarTop, calendarWidth);
        const rightHeight = drawCalendar(
          nextMonthDate,
          margin + calendarWidth + calendarGap,
          calendarTop,
          calendarWidth
        );

        yPosition = calendarTop + Math.max(leftHeight, rightHeight) + 8;

        const highlightRows = Array.from(highlightedDatesMap.entries())
          .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
          .flatMap(([dateKey, details]) =>
            (details || []).map(({ subscription, category }) => [
              formatPdfDate(dateKey),
              subscription.SubscriptionName || "Unknown",
              categoryLabels[category] || category,
              subscription.SubscriptionFrequency || "N/A",
              formatValue(subscription.SubscriptionContractAmount?.Value ?? 0),
            ])
          )
          .slice(0, 10);

        if (highlightRows.length > 0) {
          pdf.setFontSize(12);
          pdf.setTextColor(31, 41, 55);
          pdf.setFont(undefined, "bold");
          pdf.text("Highlighted Renewal Dates", margin, yPosition);
          pdf.setFont(undefined, "normal");
          yPosition += 6;

          autoTable(pdf, {
            startY: yPosition,
            head: [["Date", "Subscription", "Category", "Frequency", "Amount"]],
            body: highlightRows,
            margin: { left: margin, right: margin },
            headStyles: {
              fillColor: [234, 236, 240],
              textColor: [55, 65, 81],
              fontStyle: "bold",
              fontSize: 9,
            },
            bodyStyles: {
              fontSize: 9,
              textColor: [55, 65, 81],
            },
            alternateRowStyles: {
              fillColor: [249, 250, 251],
            },
          });

          yPosition = pdf.lastAutoTable.finalY + 12;
        } else {
          pdf.setFontSize(9);
          pdf.setTextColor(107, 114, 128);
          pdf.text("No highlighted renewal dates available.", margin, yPosition + 5);
          yPosition += 12;
        }
      };

      if (activeTab === "standard") {
        fileName = "Standard_Reports";

        // Add title
        pdf.setFontSize(20);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont(undefined, "bold");
        pdf.text("Standard Reports", margin, yPosition);
        pdf.setFont(undefined, "normal");
        yPosition += 15;

        // Draw KPI Cards (2x2 grid)
        const cardWidth = (pageWidth - margin * 2 - 10) / 2;
        const cardHeight = 35;

        // Card colors (RGB)
        const colors = [
          { r: 212, g: 241, b: 244 }, // Teal
          { r: 191, g: 241, b: 255 }, // Blue
          { r: 225, g: 255, b: 187 }, // Green
          { r: 207, g: 225, b: 255 }, // Purple
        ];

        // Row 1
        drawCard(
          margin,
          yPosition,
          cardWidth,
          cardHeight,
          colors[0],
          "Total Active Cost",
          formatValue(TopCards.totalContractAmount)
        );
        drawCard(
          margin + cardWidth + 10,
          yPosition,
          cardWidth,
          cardHeight,
          colors[1],
          "Active Subscriptions",
          String(TopCards.ActiveCount)
        );
        yPosition += cardHeight + 8;

        // Row 2
        drawCard(
          margin,
          yPosition,
          cardWidth,
          cardHeight,
          colors[2],
          "Upcoming Renewal",
          formatValue(TopCards.totalContractAmountFuture)
        );
        drawCard(
          margin + cardWidth + 10,
          yPosition,
          cardWidth,
          cardHeight,
          colors[3],
          "Cost Savings Identified",
          "0"
        );
        yPosition += cardHeight + 15;

        // Add Monthly Spend Chart
        const chartCanvas = standardReportsRef.current?.querySelector("canvas");
        addChartImage("Monthly Spend", chartCanvas);

        // Filter subscriptions
        const allSubscriptions = subscriptionTableData || [];
        const activeSubscriptions = allSubscriptions.filter((s) => s.activityStatus === "Active");
        const expiredSubscriptions = allSubscriptions.filter((s) => s.activityStatus === "Expired");

        // Table headers
        const headers = [
          "Subscription Name",
          "Vendor Name",
          "Amount",
          "Start Date",
          "End Date",
          "Frequency",
          "Status",
        ];

        // All Subscriptions Table
        const allData = allSubscriptions.map((s) => [
          s.subscriptionName || "",
          s.vendorName || "",
          formatValue(s.subscriptionAmount),
          formatPdfDate(s.startDate),
          formatPdfDate(s.endDate),
          s.paymentFrequency || "",
          s.activityStatus || "",
        ]);
        addTable("All Subscriptions", headers, allData);

        // Active Subscriptions Table
        const activeData = activeSubscriptions.map((s) => [
          s.subscriptionName || "",
          s.vendorName || "",
          formatValue(s.subscriptionAmount),
          formatPdfDate(s.startDate),
          formatPdfDate(s.endDate),
          s.paymentFrequency || "",
          s.activityStatus || "",
        ]);
        addTable("Active Subscriptions", headers, activeData);

        // Expired Subscriptions Table
        const expiredData = expiredSubscriptions.map((s) => [
          s.subscriptionName || "",
          s.vendorName || "",
          formatValue(s.subscriptionAmount),
          formatPdfDate(s.startDate),
          formatPdfDate(s.endDate),
          s.paymentFrequency || "",
          s.activityStatus || "",
        ]);
        addTable("Expired Subscriptions", headers, expiredData);
      } else if (activeTab === "financial") {
        fileName = "Financial_Reports";

        // Add title
        pdf.setFontSize(20);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont(undefined, "bold");
        pdf.text("Financial Reports", margin, yPosition);
        pdf.setFont(undefined, "normal");
        yPosition += 15;

        // Get all chart canvases
        const chartCanvases = financialRef.current?.querySelectorAll("canvas") || [];
        const chartTitles = [
          "Spend by Department",
          "Spend by Subscription Type",
          "Budget vs Actual Report",
          "Most Expensive Subscriptions",
        ];

        const vendorLegendItems = (vendorCountData || []).map((entry, index) => {
          const label = entry.vendor ?? entry.name ?? entry.vendorName ?? "Unknown vendor";
          const colors = [
            [204, 214, 235],
            [225, 255, 187],
            [29, 34, 93],
            [191, 241, 255],
            [207, 225, 255],
            [212, 241, 244],
            [225, 219, 254],
            [29, 34, 93],
            [8, 145, 178],
            [204, 214, 235],
            [225, 219, 254],
          ];
          const color = colors[index % colors.length];
          return { label, color };
        });

        // Spend by Department (index 0)
        addChartImage(chartTitles[0], chartCanvases[0]);

        // Spend by Vendor (index 1)
        addDonutChartWithLegend("Spend by Vendor", chartCanvases[1], vendorLegendItems);

        // Spend by Subscription Type (index 2)
        addChartImage(chartTitles[1], chartCanvases[2]);

        // Budget vs Actual (index 3)
        addChartImage(chartTitles[2], chartCanvases[3]);

        // Most Expensive Subscriptions (index 4)
        addChartImage(chartTitles[3], chartCanvases[4]);

        // Usage Analysis (index 5)
        const usageLegendItems = [
          { label: "80%", color: [29, 34, 93] },
          { label: "20%", color: [212, 173, 247] },
        ];
        addDonutChartWithLegend("Usage Analysis", chartCanvases[5], usageLegendItems);

        // Spend by Category Table
        const categoryHeaders = ["Category", "Actual Spend", "Number of Subscriptions"];
        const categoryData = (categorySummary || []).map((row) => [
          row.category || "",
          formatValue(row.accumulatedAmount),
          String(row.count || 0),
        ]);
        addTable("Spend by Category", categoryHeaders, categoryData);

        // Spend by Department Table
        const deptHeaders = ["Team", "Actual Spend", "Budget"];
        const deptData = (spendByDepartmentChartData || [])
          .flat()
          .filter(Boolean)
          .map((record) => [
            record?.department ?? record?.name ?? record?.DepartmentNames?.Name ?? "Unknown",
            formatValue(
              record?.value ?? record?.amount ?? record?.SubscriptionContractAmount?.Value ?? 0
            ),
            formatValue(
              Number(
                record?.DepartmentNames?.Budget?.Value ??
                  record?.DepartmentNames?.Budget ??
                  record?.budget ??
                  0
              ) || 0
            ),
          ]);
        addTable("Spend by Department", deptHeaders, deptData);
      } else if (activeTab === "renewal") {
        fileName = "Renewal_Expiration_Reports";

        // Add title
        pdf.setFontSize(20);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont(undefined, "bold");
        pdf.text("Renewal & Expiration Reports", margin, yPosition);
        pdf.setFont(undefined, "normal");
        yPosition += 15;

        // Renewal Calendar Report
        addRenewalCalendarReport();

        // Add Chart
        const chartCanvas = renewalRef.current?.querySelector("canvas");
        addChartImage("Renewal Costs and Usage Evaluation", chartCanvas);

        // Nearing Renewal Table
        const renewalHeaders = ["Name", "Amount", "Start Date", "End Date", "Frequency", "Status"];
        const renewalTableData = (nearingRenewalData || []).map((row) => [
          row.SubscriptionName || row.name || "Unknown",
          formatValue(row.SubscriptionContractAmount?.Value ?? row.subscriptionAmount ?? 0),
          formatPdfDate(row.SubscriptionStartDate || row.startDate),
          formatPdfDate(row.SubscriptionEndDate || row.endDate),
          row.SubscriptionFrequency || row.paymentFrequency || "N/A",
          row.status === 0 ? "Active" : row.activityStatus || "Inactive",
        ]);
        addTable("Subscriptions Nearing Renewal", renewalHeaders, renewalTableData);

        // Expired Subscriptions Table
        const expiredHeaders = ["Name", "Amount", "Start Date", "End Date", "Frequency", "Status"];
        const expiredTableData = (expiredSubscriptionsData || []).map((row) => [
          row.SubscriptionName || "Unknown",
          formatValue(row.SubscriptionContractAmount?.Value ?? 0),
          formatPdfDate(row.SubscriptionStartDate),
          formatPdfDate(row.SubscriptionEndDate),
          row.SubscriptionFrequency || "N/A",
          "Expired",
        ]);
        addTable("Expired Subscriptions", expiredHeaders, expiredTableData);
      }

      // Save PDF
      pdf.save(`${fileName}_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToExcel = () => {
    console.log("here is activeTab", activeTab);
    console.log("Export to Excel");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="relative w-[90%] max-w-sm rounded-[32px] bg-white px-6 py-8 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
              onClick={() => setShowExportModal(false)}
            >
              <FiX className="h-4 w-4 text-gray-600" />
            </button>
            <h2 className="text-center text-xl font-semibold text-slate-900">
              Choose Export Format
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              <button
                className="rounded-full bg-[#7C57FF] px-3 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6b43ff] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  handleExportToPDF();
                  setShowExportModal(false);
                }}
                disabled={isExporting}
              >
                {isExporting ? "Exporting..." : "Export to PDF"}
              </button>
              <div className="flex items-center justify-center text-xs font-semibold text-gray-400">
                OR
              </div>
              <button
                className="rounded-full bg-[#9BF52F] px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-[#8de700] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  handleExportToExcel();
                  setShowExportModal(false);
                }}
                disabled={isExporting}
              >
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Reports Dashboard</h1>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="text-xs sm:text-sm text-gray-500">
            {isLoading ? "Loading..." : "Last Update 29 days ago"}
          </span>
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiBell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <FiSearch className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Test Subcriptionist Invitation
            </span>
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6 sm:gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("standard")}
            className={`pb-3 px-1 text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === "standard"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Standard Reports
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`pb-3 px-1 text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === "financial"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Financial
          </button>
          <button
            onClick={() => setActiveTab("renewal")}
            className={`pb-3 px-1 text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === "renewal"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Renewal and Expiration
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors text-sm font-medium ${
            isFilterOpen
              ? "border-blue-300 text-blue-600 bg-white shadow-[0_0_15px_rgba(59,130,246,0.2)] ring-1 ring-blue-200"
              : "border-gray-300 hover:bg-gray-50 text-gray-700"
          }`}
        >
          <FiFilter className="w-4 h-4" />
          Filters
        </button>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
            <FiUpload className="w-4 h-4" />
            Share
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1D225D] text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium shadow-sm"
            onClick={() => setShowExportModal(true)}
          >
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Standard Reports Tab Content */}
      {activeTab === "standard" &&
        (isLoading ? (
          <div className="space-y-6">
            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <KPICardSkeleton bgColor="bg-[#D4F1F4]" />
              <KPICardSkeleton bgColor="bg-[#BFF1FF]" />
              <KPICardSkeleton bgColor="bg-[#E1FFBB]" />
              <KPICardSkeleton bgColor="bg-[#CFE1FF]" />
            </div>

            {/* Chart Skeleton */}
            <ChartSkeleton />

            {/* Table Skeleton */}
            <TableSkeleton rows={5} columns={7} showTabs={true} />
          </div>
        ) : (
          <div ref={standardReportsRef}>
            <StandardReports formatCurrency={formatCurrency} formatDate={formatDate} />
          </div>
        ))}

      {/* Financial Tab Content */}
      {activeTab === "financial" &&
        (isLoading ? (
          <div className="space-y-6">
            {/* Top Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <ChartSkeleton className="lg:col-span-3" />
              <ChartSkeleton height="200px" className="lg:col-span-1" />
            </div>

            {/* Line Chart Skeleton */}
            <ChartSkeleton />

            {/* Budget vs Actual Skeleton */}
            <ChartSkeleton />

            {/* Tables Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TableSkeleton rows={4} columns={1} />
              <TableSkeleton rows={4} columns={1} />
            </div>

            {/* Bottom Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <ChartSkeleton className="lg:col-span-3" />
              <ChartSkeleton height="200px" className="lg:col-span-1" />
            </div>
          </div>
        ) : (
          <div ref={financialRef}>
            <Financial />
          </div>
        ))}

      {/* Renewal and Expiration Tab Content */}
      {activeTab === "renewal" &&
        (isLoading ? (
          <div className="space-y-6">
            {/* Calendar Report Skeleton */}
            <ChartSkeleton />

            {/* Renewal Analysis Report Skeleton */}
            <TableSkeleton rows={5} columns={1} />

            {/* Chart Skeleton */}
            <ChartSkeleton />

            {/* Expired Subscription Report Skeleton */}
            <TableSkeleton rows={4} columns={1} />
          </div>
        ) : (
          <div ref={renewalRef}>
            <RenewalAndExpiration formatCurrency={formatCurrency} formatDate={formatDate} />
          </div>
        ))}

      {isFilterOpen && (
        <div
          className="absolute inset-0  z-50 px-4 py-10"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsFilterOpen(false)}
        >
          <div
            className="absolute top-60 left-75 w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_20px_40px_-18px_rgba(17,24,39,0.35)] ring-1 ring-black/5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Filters</h2>
              <button
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Close filters"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Date Range</label>
                <div
                  className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 relative"
                  data-date-input
                >
                  <FiCalendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Select Date Range"
                    onClick={handleDatePickerClick}
                    value={dateRangeText}
                    className="w-full text-sm text-gray-700 outline-none placeholder:text-gray-400 cursor-pointer"
                    readOnly
                  />
                  {showDatePicker && (
                    <div
                      className="absolute left-0 mt-3 top-full w-[min(680px,calc(100vw-3rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-xl z-50"
                      ref={datePickerRef}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                        <button
                          className="bg-gray-100 border-none w-8 h-8 rounded-lg text-lg text-[#1d225d] flex items-center justify-center transition-all duration-200 hover:bg-gray-200"
                          onClick={() => navigateMonth(-1)}
                          aria-label="Previous month"
                        >
                          ‹
                        </button>
                        <div className="text-center">
                          <h3 className="m-0 text-sm font-semibold text-[#1d225d]">
                            Select Date Range
                          </h3>
                          <p className="m-0 text-[11px] text-gray-500">
                            {!startDate
                              ? "Select start date"
                              : !endDate
                                ? "Select end date"
                                : "Date range selected"}
                          </p>
                        </div>
                        <button
                          className="bg-gray-100 border-none w-8 h-8 rounded-lg text-lg text-[#1d225d] flex items-center justify-center transition-all duration-200 hover:bg-gray-200"
                          onClick={() => navigateMonth(1)}
                          aria-label="Next month"
                        >
                          ›
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        {renderCalendar(currentMonth)}
                        {renderCalendar(getNextMonth())}
                      </div>
                      <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          {startDate && (
                            <span className="px-2 py-1 bg-gray-100 rounded-md border border-gray-200">
                              {formatDateForDisplay(startDate)}
                            </span>
                          )}
                          {startDate && endDate && <span className="text-gray-400">–</span>}
                          {endDate && (
                            <span className="px-2 py-1 bg-gray-100 rounded-md border border-gray-200">
                              {formatDateForDisplay(endDate)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 flex-1 sm:flex-none"
                            onClick={handleClearDateRange}
                          >
                            Clear
                          </button>
                          <button
                            className="px-3 py-2 rounded-lg text-xs font-medium bg-[#1d225d] text-white hover:bg-[#161a4c] flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleApplyDateRange}
                            disabled={!startDate || !endDate}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Categories</label>
                <select className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none">
                  <option>All</option>
                  <option>Category 1</option>
                  <option>Category 2</option>
                  <option>Category 3</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">High-Spend Vendors</label>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatCurrency(MIN_HIGH_SPEND)}</span>
                    <span className="text-xs text-gray-500">{formatCurrency(highSpendValue)}</span>
                  </div>
                  <input
                    type="range"
                    min={MIN_HIGH_SPEND}
                    max={MAX_HIGH_SPEND}
                    step={5000}
                    value={highSpendValue}
                    onChange={(event) => setHighSpendValue(Number(event.target.value))}
                    className="mt-2 w-full accent-[#1D225D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tenured Subscription</label>
                <select className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none">
                  <option>Default</option>
                  <option>Less than 1 year</option>
                  <option>1-3 years</option>
                  <option>3+ years</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Spending Forecast</label>
                <select className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none">
                  <option>All</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button className="text-sm font-medium text-gray-500 hover:text-gray-700">
                  Clear Filters
                </button>
                <button className="rounded-lg bg-[#1D225D] px-4 py-2 text-sm font-medium text-white hover:bg-[#161A4C]">
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
