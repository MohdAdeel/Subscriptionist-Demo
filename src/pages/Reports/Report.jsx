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
import { useActivityLines } from "../../hooks";
import Financial from "./components/Financial";
import { useState, useEffect, useRef } from "react";
import StandardReports from "./components/StandardReports";
import RenewalAndExpiration from "./components/RenewalAndExpiration";
import { TableSkeleton, ChartSkeleton, KPICardSkeleton } from "../../components/SkeletonLoader";

const Report = () => {
  // React Query handles caching, deduplication, and loading state
  const { isLoading, error } = useActivityLines();

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
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
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1D225D] text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium shadow-sm">
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
          <StandardReports formatCurrency={formatCurrency} formatDate={formatDate} />
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
          <Financial />
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
          <RenewalAndExpiration formatCurrency={formatCurrency} formatDate={formatDate} />
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
