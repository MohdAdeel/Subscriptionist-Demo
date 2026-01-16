import {
  populateForm,
  getRelationshipSubsLines,
} from "../../lib/utils/subscriptions";
import {
  InputSkeleton,
  ButtonSkeleton,
  TableRowSkeleton,
  TableHeaderSkeleton,
} from "../../components/SkeletonLoader";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { FiSearch, FiBell, FiCalendar, FiUser } from "react-icons/fi";

const SubscriptionInventory = () => {
  const navigate = useNavigate();
  const skeletonRef = useRef(null);
  const datePickerRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const [endDate, setEndDate] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [descriptionCount, setDescriptionCount] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDescriptionChange = (e) => {
    setDescriptionCount(e.target.value.length);
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  useEffect(() => {
    const tableWrapper = tableWrapperRef.current;

    setIsLoading(true);
    setIsEmpty(false);
    if (tableWrapper) {
      tableWrapper.style.minHeight = "600px";
    }

    // Page 1 ke subscriptions fetch karo
    getRelationshipSubsLines(1, {}).finally(() => {
      if (tableWrapper) {
        tableWrapper.style.minHeight = "";
      }
      setIsLoading(false);

      // Check if table is empty
      const tbody = document.getElementById("subscription-grid-body");
      if (tbody) {
        const rows = tbody.querySelectorAll("tr");
        setIsEmpty(rows.length === 0);
      }
    });
  }, []);

  // Monitor for empty state when rows are dynamically added/removed
  useEffect(() => {
    const checkEmptyState = () => {
      const tbody = document.getElementById("subscription-grid-body");
      if (tbody && !isLoading) {
        const rows = tbody.querySelectorAll("tr");
        setIsEmpty(rows.length === 0);
      }
    };

    const observer = new MutationObserver(checkEmptyState);
    const tbody = document.getElementById("subscription-grid-body");

    if (tbody) {
      observer.observe(tbody, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [isLoading]);

  useEffect(() => {
    if (showModal) {
      populateForm();
    }
  }, [showModal]);

  // Add row selection highlighting using React state
  useEffect(() => {
    const handleRowClick = (e) => {
      const row = e.target.closest("tr");
      if (row && row.parentElement.tagName === "TBODY") {
        const rowId = row.getAttribute("data-row-id") || `row-${row.rowIndex}`;
        setSelectedRowId(rowId);
      }
    };

    const tbody = document.getElementById("subscription-grid-body");
    if (tbody) {
      tbody.addEventListener("click", handleRowClick);
    }

    return () => {
      if (tbody) {
        tbody.removeEventListener("click", handleRowClick);
      }
    };
  }, []);

  // Apply selected styling based on React state
  useEffect(() => {
    const tbody = document.getElementById("subscription-grid-body");
    if (!tbody) return;

    const allRows = tbody.querySelectorAll("tr");
    allRows.forEach((row) => {
      const rowId = row.getAttribute("data-row-id") || `row-${row.rowIndex}`;

      // Remove all selection classes
      row.classList.remove(
        "bg-[#e8ebff]",
        "border-l-[3px]",
        "border-l-[#1d225d]"
      );

      // Add selection classes if this row is selected
      if (selectedRowId === rowId) {
        row.classList.add(
          "bg-[#e8ebff]",
          "border-l-[3px]",
          "border-l-[#1d225d]"
        );
      }
    });
  }, [selectedRowId]);

  // Watch for dynamically added rows and apply selection state
  useEffect(() => {
    const tbody = document.getElementById("subscription-grid-body");
    if (!tbody) return;

    const observer = new MutationObserver(() => {
      // Re-apply selection when new rows are added
      if (selectedRowId) {
        const allRows = tbody.querySelectorAll("tr");
        allRows.forEach((row) => {
          const rowId =
            row.getAttribute("data-row-id") || `row-${row.rowIndex}`;

          row.classList.remove(
            "bg-[#e8ebff]",
            "border-l-[3px]",
            "border-l-[#1d225d]"
          );

          if (selectedRowId === rowId) {
            row.classList.add(
              "bg-[#e8ebff]",
              "border-l-[3px]",
              "border-l-[#1d225d]"
            );
          }
        });
      }
    });

    observer.observe(tbody, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [selectedRowId]);

  // Close date picker when clicking outside
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
      // Reset to current month when opening
      setCurrentMonth(new Date());
    }
    setShowDatePicker(!showDatePicker);
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate < today) return; // Don't allow past dates

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(clickedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      // Select end date
      if (clickedDate < startDate) {
        // If clicked date is before start date, make it the new start date
        setStartDate(clickedDate);
        setEndDate(null);
      } else {
        setEndDate(clickedDate);
      }
    }
  };

  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      const datePickerInput = document.getElementById("datePicker");
      const formattedRange = `${formatDateForDisplay(
        startDate
      )} - ${formatDateForDisplay(endDate)}`;
      if (datePickerInput) {
        datePickerInput.value = formattedRange;
        datePickerInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
      setShowDatePicker(false);
    }
  };

  const handleClearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    const datePickerInput = document.getElementById("datePicker");
    if (datePickerInput) {
      datePickerInput.value = "";
    }
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
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="flex-1 min-w-0">
        <div className="text-center mb-3 sm:mb-4">
          <h3 className="m-0 text-sm sm:text-base md:text-lg font-semibold text-[#1d225d]">
            {monthName} {year}
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] xs:text-xs font-semibold text-gray-600 py-1 sm:py-2 px-0.5 sm:px-1 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square cursor-default bg-transparent border-none"
                ></div>
              );
            }

            const date = new Date(year, month, day);
            const isToday = isSameDate(date, today);
            const isStart = startDate && isSameDate(date, startDate);
            const isEnd = endDate && isSameDate(date, endDate);
            const isInRange = isDateInRange(date, startDate, endDate);
            const isPast = date < today;

            let dayClass =
              "aspect-square flex items-center justify-center text-[10px] xs:text-xs sm:text-sm font-medium text-gray-700 cursor-pointer rounded sm:rounded-lg transition-all duration-200 relative bg-white border border-transparent";
            if (isPast)
              dayClass += " text-gray-300 cursor-not-allowed bg-gray-50";
            if (isToday)
              dayClass += " bg-blue-50 border-blue-500 text-blue-900 font-bold";
            if (isStart)
              dayClass +=
                " bg-gradient-to-br from-[#1d225d] to-[#3b4b8a] text-white font-bold border-[#1d225d] shadow-md z-[3] rounded-r-none";
            if (isEnd)
              dayClass +=
                " bg-gradient-to-br from-[#1d225d] to-[#3b4b8a] text-white font-bold border-[#1d225d] shadow-md z-[3] rounded-l-none";
            if (isInRange && !isStart && !isEnd)
              dayClass +=
                " bg-gradient-to-br from-[#e8ebff] to-[#d4d9ff] text-[#1d225d] font-semibold border-[#a5b4fc] relative z-[1]";
            if (!isPast && !isStart && !isEnd && !isInRange && !isToday)
              dayClass += " hover:bg-gray-100 hover:scale-110 hover:z-[2]";

            return (
              <div
                key={day}
                className={dayClass}
                onClick={() => !isPast && handleDateClick(day, month, year)}
              >
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

  return (
    <div className="bg-[#f6f7fb] p-3 sm:p-4 md:p-6 font-sans min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <h2 className="m-0 text-lg sm:text-xl md:text-[22px] font-bold">
            Subscription Inventory
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-[10px] xs:text-xs sm:text-[13px] text-[#8b8b8b] order-1 sm:order-none">
            Last Update 21 days ago
          </span>
          <FiBell className="text-lg sm:text-xl cursor-pointer order-2 sm:order-none" />
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] rounded-full flex items-center justify-center order-3 sm:order-none">
            <FiUser className="text-white text-base sm:text-lg" />
          </div>
          <span className="text-xs sm:text-sm font-medium order-4 sm:order-none truncate max-w-[180px] xs:max-w-[250px] sm:max-w-none">
            Test Subscriptionist Invitation
          </span>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 sm:gap-5 px-3 sm:px-4 md:px-5 mb-4 sm:mb-6 w-full overflow-x-hidden">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:flex-wrap gap-3 sm:gap-4 flex-1 w-full min-w-0 mb-0">
          {isLoading ? (
            <>
              <InputSkeleton />
              <InputSkeleton />
              <InputSkeleton />
              <InputSkeleton />
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 w-full md:flex-1 md:min-w-[150px] md:max-w-[250px]">
                <label className="text-xs sm:text-[13px] text-[#555]">
                  Subscription Name
                </label>
                <div className="flex items-center bg-white rounded-lg p-2 w-full relative">
                  <FiSearch className="mr-2 text-[#999] text-sm sm:text-base flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="border-none outline-none w-full text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full md:flex-1 md:min-w-[150px] md:max-w-[250px]">
                <label className="text-xs sm:text-[13px] text-[#555]">
                  Due Date
                </label>
                <div
                  className="flex items-center bg-white rounded-lg p-2 w-full relative"
                  data-date-input
                >
                  <FiCalendar className="mr-2 text-[#999] text-sm sm:text-base flex-shrink-0" />
                  <input
                    id="datePicker"
                    type="text"
                    placeholder="Select Date Range"
                    name="datefilter"
                    onClick={handleDatePickerClick}
                    readOnly
                    className="border-none outline-none w-full text-xs sm:text-sm pl-0 cursor-pointer min-w-0"
                  />
                  {showDatePicker && (
                    <div
                      className="fixed sm:absolute top-[50%] sm:top-[calc(100%+8px)] left-1/2 sm:left-0 transform -translate-x-1/2 sm:transform-none bg-white border border-gray-300 rounded-xl shadow-xl z-[1000] w-[95vw] sm:w-auto sm:min-w-[700px] p-4 sm:p-6 max-w-[95vw] sm:max-w-[90vw]"
                      ref={datePickerRef}
                    >
                      <div className="flex items-center justify-between mb-4 sm:mb-5 pb-3 sm:pb-4 border-b-2 border-gray-200 relative gap-2 sm:gap-3">
                        <button
                          className="bg-gray-100 border-none w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] rounded-lg text-xl sm:text-2xl text-[#1d225d] cursor-pointer flex items-center justify-center transition-all duration-200 font-bold flex-shrink-0 hover:bg-gray-200 hover:scale-105"
                          onClick={() => navigateMonth(-1)}
                          aria-label="Previous month"
                        >
                          ‹
                        </button>
                        <div className="flex-1 text-center min-w-0 px-1">
                          <h3 className="m-0 mb-1 text-base sm:text-lg md:text-xl font-bold text-[#1d225d]">
                            Select Date Range
                          </h3>
                          <p className="m-0 text-[11px] sm:text-xs md:text-[13px] text-gray-600 font-medium">
                            {!startDate
                              ? "Select start date"
                              : !endDate
                              ? "Select end date"
                              : "Date range selected"}
                          </p>
                        </div>
                        <button
                          className="bg-gray-100 border-none w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] rounded-lg text-xl sm:text-2xl text-[#1d225d] cursor-pointer flex items-center justify-center transition-all duration-200 font-bold flex-shrink-0 hover:bg-gray-200 hover:scale-105"
                          onClick={() => navigateMonth(1)}
                          aria-label="Next month"
                        >
                          ›
                        </button>
                        <button
                          className="bg-transparent border-none text-2xl sm:text-[28px] text-gray-600 cursor-pointer p-0 w-7 h-7 sm:w-8 sm:h-8 min-w-[28px] sm:min-w-[32px] flex items-center justify-center leading-none rounded-md transition-all duration-200 flex-shrink-0 hover:bg-gray-100 hover:text-[#1d225d]"
                          onClick={() => setShowDatePicker(false)}
                          aria-label="Close"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-4 sm:mb-5">
                        {renderCalendar(currentMonth)}
                        {renderCalendar(getNextMonth())}
                      </div>
                      <div className="pt-3 sm:pt-4 border-t-2 border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="flex flex-col xs:flex-row gap-3 sm:gap-5 flex-1">
                          {startDate && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                                Start:
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-[#1d225d] py-1.5 px-2 sm:px-3 bg-[#f3f4fa] rounded-md border border-gray-200 break-words">
                                {formatDateForDisplay(startDate)}
                              </span>
                            </div>
                          )}
                          {endDate && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                                End:
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-[#1d225d] py-1.5 px-2 sm:px-3 bg-[#f3f4fa] rounded-md border border-gray-200 break-words">
                                {formatDateForDisplay(endDate)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0">
                          <button
                            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer border-none transition-all duration-200 flex-1 sm:flex-none sm:min-w-[100px] bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-px hover:shadow-sm"
                            onClick={handleClearDateRange}
                          >
                            Clear
                          </button>
                          <button
                            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer border-none transition-all duration-200 flex-1 sm:flex-none sm:min-w-[100px] bg-gradient-to-br from-[#1d225d] to-[#3b4b8a] text-white shadow-sm hover:from-[#15195a] hover:to-[#2d3a6f] hover:-translate-y-px hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

              <div className="flex flex-col gap-1.5 w-full md:flex-1 md:min-w-[150px] md:max-w-[250px]">
                <label className="text-xs sm:text-[13px] text-[#555]">
                  Vendor Name
                </label>
                <div className="flex items-center bg-white rounded-lg p-2 w-full">
                  <select
                    id="Vendoroptions"
                    className="border-none outline-none w-full text-xs sm:text-sm bg-transparent cursor-pointer appearance-none"
                  >
                    <option>All</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full md:flex-1 md:min-w-[150px] md:max-w-[250px]">
                <label className="text-xs sm:text-[13px] text-[#555]">
                  Status
                </label>
                <div className="flex items-center bg-white rounded-lg p-2 w-full">
                  <select
                    id="Statusoptions"
                    className="border-none outline-none w-full text-xs sm:text-sm bg-transparent cursor-pointer appearance-none"
                  >
                    <option>All</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-start sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto sm:flex-shrink-0">
          {isLoading ? (
            <div className="flex flex-row gap-2 sm:gap-3 flex-wrap">
              <ButtonSkeleton count={3} />
            </div>
          ) : (
            <>
              <button
                className={`px-3 sm:px-4 md:px-[18px] py-2 sm:py-2.5 rounded-lg sm:rounded-[10px] border-[1.5px] text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap w-full sm:w-auto ${
                  selectedRowId
                    ? "border-[#1d225d] text-[#1d225d] bg-transparent opacity-100 shadow-sm hover:bg-[#1d225d] hover:text-white hover:shadow-md hover:-translate-y-px"
                    : "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                }`}
                onClick={() => {
                  if (selectedRowId) {
                    openModal();
                  }
                }}
                disabled={!selectedRowId}
              >
                Edit
              </button>

              <button
                className="px-3 sm:px-4 md:px-[18px] py-2 sm:py-2.5 rounded-lg sm:rounded-[10px] border-none bg-[#1d225d] text-white text-xs sm:text-sm font-semibold cursor-pointer hover:bg-[#15195a] transition-colors whitespace-nowrap w-full sm:w-auto"
                onClick={() => navigate("/budget-management")}
              >
                <span className="hidden sm:inline">Budget Management</span>
                <span className="sm:hidden">Budget</span>
              </button>
              <button className="px-3 sm:px-4 md:px-[18px] py-2 sm:py-2.5 rounded-lg sm:rounded-[10px] border-none bg-[#1d225d] text-white text-xs sm:text-sm font-semibold cursor-pointer hover:bg-[#15195a] transition-colors whitespace-nowrap w-full sm:w-auto">
                Add Subscription
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table (Backend renders rows via JS) */}
      <div className="mt-4 sm:mt-6 md:mt-8 relative">
        <div
          className="relative bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 overflow-hidden transition-[min-height] duration-300"
          ref={tableWrapperRef}
        >
          <div
            className={`absolute inset-0 z-[2] pointer-events-none flex flex-col gap-4 p-4 pt-[60px] bg-gradient-to-b from-white/85 via-white/90 to-white/95 justify-start ${
              isLoading ? "" : "hidden"
            }`}
            ref={skeletonRef}
          >
            {Array.from({ length: 8 }).map((_, idx) => (
              <TableRowSkeleton key={idx} columns={5} />
            ))}
          </div>

          {/* Add id="Subscriptions" here */}
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table
              id="Subscriptions"
              className="subscription-table w-full border-collapse min-w-[800px] sm:min-w-full"
            >
              {isLoading ? (
                <TableHeaderSkeleton columns={10} />
              ) : (
                <thead>
                  <tr>
                    <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                      Subscription Name
                    </th>
                    <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                      Vendor Name
                    </th>
                    <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                      Subscription Amount
                    </th>
                    <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                      Department
                    </th>
                    <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                      Start Date
                    </th>
                    <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                      End Date
                    </th>
                    <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                      Payment Frequency
                    </th>
                    <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                      Last Due Date
                    </th>
                    <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                      Next Due Date
                    </th>
                    <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                      Activity Status
                    </th>
                  </tr>
                </thead>
              )}
              <tbody
                id="subscription-grid-body"
                className="[&_tr]:cursor-pointer [&_tr]:transition-colors [&_tr]:duration-200 [&_tr:hover]:bg-[#f9f9ff] [&_tr.bg-\[#e8ebff\]_hover]:!bg-[#dde2ff] [&_td]:p-3 [&_td]:text-sm [&_td]:border-b [&_td]:border-[#eee]"
              >
                {/* Rows injected by JS */}
                {!isLoading && isEmpty && (
                  <tr>
                    <td
                      colSpan="10"
                      className="text-center py-12 sm:py-[60px] px-3 sm:px-5"
                    >
                      <div className="flex flex-col items-center justify-center text-gray-600">
                        <p className="m-0 text-sm sm:text-base font-medium">
                          No subscriptions available
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Backend pagination */}
        <div
          id="paginationid"
          className="flex items-center justify-end gap-1 sm:gap-1.5 py-2 sm:py-3 px-2 sm:px-4 bg-[#f4f6fb] rounded-lg mt-2 sm:mt-3 font-['Segoe_UI',sans-serif] w-full sm:w-fit sm:ml-auto overflow-x-auto [&_a]:min-w-[32px] [&_a]:h-8 [&_a]:px-[10px] [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_a]:rounded-md [&_a]:border [&_a]:border-[#d0d5dd] [&_a]:bg-white [&_a]:text-[#344054] [&_a]:no-underline [&_a]:text-[13px] [&_a]:cursor-pointer [&_a]:transition-all [&_a]:duration-200 [&_a]:hover:bg-[#eef2ff] [&_span]:min-w-[32px] [&_span]:h-8 [&_span]:px-[10px] [&_span]:inline-flex [&_span]:items-center [&_span]:justify-center [&_span]:rounded-md [&_span]:border [&_span]:border-[#d0d5dd] [&_span]:bg-white [&_span]:text-[#344054] [&_span]:text-[13px] [&_.active]:bg-[#0b1cff] [&_.active]:text-white [&_.active]:border-[#0b1cff] [&_a.active]:bg-[#0b1cff] [&_a.active]:text-white [&_a.active]:border-[#0b1cff] [&_span.active]:bg-[#0b1cff] [&_span.active]:text-white [&_span.active]:border-[#0b1cff] [&_span.current]:bg-[#0b1cff] [&_span.current]:text-white [&_span.current]:border-[#0b1cff] [&_.disabled]:opacity-50 [&_.disabled]:pointer-events-none [&_.disabled]:cursor-not-allowed [&_a.disabled]:opacity-50 [&_a.disabled]:pointer-events-none [&_a.disabled]:cursor-not-allowed"
        ></div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex justify-center items-center z-[1000] p-3 sm:p-4 md:p-6">
          <div className="bg-white rounded-lg sm:rounded-[14px] w-full max-w-[1200px] max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="flex flex-col h-full" id="formcontentid">
              {/* HEADER */}
              <div className="p-3 sm:p-4 md:p-[18px_28px] border-b border-gray-200 flex justify-between items-center gap-3 sm:gap-4">
                <h5 className="text-base sm:text-lg font-semibold text-slate-900 m-0 flex-1">
                  Edit Subscription
                </h5>
                <button
                  className="border-none bg-transparent text-2xl sm:text-[28px] cursor-pointer text-gray-600 p-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center leading-none rounded-md transition-all duration-200 flex-shrink-0 hover:bg-gray-100 hover:text-[#1d225d]"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>

              {/* BODY */}
              <div className="p-3 sm:p-4 md:p-[22px_28px] overflow-y-auto flex-1 max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
                <form>
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-7">
                    {/* LEFT COLUMN */}
                    <div className="flex-1 lg:border-r lg:border-gray-200 lg:pr-4 md:lg:pr-7">
                      <div className="mb-3.5 relative">
                        <i className="fa fa-lock absolute left-2 sm:left-3 top-[37px] text-xs sm:text-sm text-gray-400" />
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Subscription Activity ID
                        </label>
                        <input
                          id="editActivityID"
                          className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 pl-8 sm:pl-[34px] bg-gray-100 cursor-not-allowed"
                          readOnly
                        />
                      </div>

                      <div className="mb-3.5 relative">
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Subscription Name
                        </label>
                        <input
                          id="editSubscriptionName"
                          maxLength="87"
                          className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]"
                        />
                      </div>

                      <div className="mb-3.5 relative">
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Subscription Contract Amount
                        </label>
                        <input
                          id="editContractAmount"
                          type="number"
                          step="0.01"
                          className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]"
                          onBlur={() =>
                            window.checkAndFormatDecimal?.(editContractAmount)
                          }
                          onInput={() =>
                            window.checkAndRemoveError?.(editContractAmount)
                          }
                        />
                      </div>

                      <div className="mb-3.5 relative">
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Description
                        </label>
                        <textarea
                          id="editDescription"
                          maxLength="2000"
                          rows="4"
                          className="h-auto resize-none py-1.5 px-2 sm:px-2.5 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]"
                          onChange={handleDescriptionChange}
                        />
                        <small className="text-[10px] sm:text-xs text-gray-500 flex justify-end">
                          <span id="editDescriptionCounter">
                            {descriptionCount}
                          </span>
                          /2000
                        </small>
                      </div>

                      {["editStartDate", "editEndDate", "editLastDueDate"].map(
                        (id) => (
                          <div className="mb-3.5 relative" key={id}>
                            <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                              {id
                                .replace("edit", "")
                                .replace(/([A-Z])/g, " $1")}
                            </label>
                            <input
                              type="date"
                              id={id}
                              className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 pl-8 sm:pl-10 cursor-pointer focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]"
                              onClick={() => window.openDatePicker?.(id)}
                            />
                            <img
                              src="/calender_icon.png"
                              alt="calendar"
                              className="absolute left-2 sm:left-3 top-[37px] w-4 h-4 sm:w-[18px] sm:h-[18px] pointer-events-none"
                            />
                          </div>
                        )
                      )}

                      <div className="mb-3.5 relative">
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Subscription Frequency Number
                        </label>
                        <input
                          id="editFrequencyNumber"
                          type="number"
                          className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]"
                        />
                      </div>

                      <div className="mb-3.5 relative">
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Subscription Frequency Unit
                        </label>
                        <select
                          id="editFrequencyUnit"
                          className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]"
                        >
                          <option value="null">Select</option>
                          <option value="664160002">Months</option>
                          <option value="664160003">Years</option>
                        </select>
                      </div>

                      <div className="mb-3.5 relative">
                        <i className="fa fa-lock absolute left-2 sm:left-3 top-[37px] text-xs sm:text-sm text-gray-400" />
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Subscription Frequency
                        </label>
                        <input
                          id="editSubscriptionFrequency"
                          className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 pl-8 sm:pl-[34px] bg-gray-100 cursor-not-allowed"
                          readOnly
                        />
                      </div>

                      <div className="mb-3.5 relative">
                        <i className="fa fa-lock absolute left-2 sm:left-3 top-[37px] text-xs sm:text-sm text-gray-400" />
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Activity Status
                        </label>
                        <input
                          id="editActivityStatus"
                          className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 pl-8 sm:pl-[34px] bg-gray-100 cursor-not-allowed"
                          readOnly
                        />
                      </div>

                      {/* Missing numeric fields */}
                      <div className="mb-3.5 relative">
                        <label
                          htmlFor="editNumLicenses"
                          className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block"
                        >
                          Number of Licenses
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100000"
                          className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]"
                          pattern="^-?\d{1,12}(\.\d{0,2})?$"
                          onKeyPress={(e) =>
                            e.currentTarget.value.length === 12 &&
                            e.preventDefault()
                          }
                          onInput={() =>
                            window.checkAndRemoveError?.(editNumLicenses)
                          }
                          onBlur={() =>
                            window.checkAndRemoveErrorifnotvalid?.(
                              editNumLicenses
                            )
                          }
                          id="editNumLicenses"
                          placeholder="Enter Number of Licenses"
                        />
                      </div>

                      <div className="mb-3.5 relative">
                        <label
                          htmlFor="editNumUsers"
                          className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block"
                        >
                          Number of Current Users
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100000"
                          className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 focus:border-[#7259f6] focus:outline-none focus:shadow-[0_0_0_1px_#7259f6]"
                          pattern="^-?\d{1,12}(\.\d{0,2})?$"
                          onKeyPress={(e) =>
                            e.currentTarget.value.length === 12 &&
                            e.preventDefault()
                          }
                          onInput={() =>
                            window.checkAndRemoveError?.(editNumUsers)
                          }
                          onBlur={() =>
                            window.checkAndRemoveErrorifnotvalid?.(editNumUsers)
                          }
                          id="editNumUsers"
                          placeholder="Enter Number of Current Users"
                        />
                      </div>

                      {/* Radio buttons */}
                      <div
                        className="mb-3.5 relative"
                        style={{ minHeight: "63px", marginTop: "15px" }}
                      >
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Do you require a partner for renewal?
                        </label>
                        <div className="mt-2.5 flex flex-wrap gap-3 sm:gap-4">
                          <label className="inline-flex items-center gap-1.5">
                            <input
                              type="radio"
                              name="requirePartner"
                              value="true"
                              id="editRequirePartnerId"
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                            />
                            <span className="text-xs sm:text-sm">Yes</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5">
                            <input
                              type="radio"
                              name="requirePartner"
                              value="false"
                              id="editRequirePartnernoId"
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                            />
                            <span className="text-xs sm:text-sm">No</span>
                          </label>
                        </div>
                      </div>

                      <div className="mb-3.5 relative">
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Is it Auto Renew Contract?
                        </label>
                        <div className="mt-2.5 flex flex-wrap gap-3 sm:gap-4">
                          <label className="inline-flex items-center gap-1.5">
                            <input
                              type="radio"
                              className="bg-gray-100 cursor-not-allowed w-3.5 h-3.5 sm:w-4 sm:h-4"
                              disabled
                              name="autoRenewContract"
                              value="true"
                              id="autorenewyesView"
                            />
                            <span className="text-xs sm:text-sm">Yes</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5">
                            <input
                              type="radio"
                              className="bg-gray-100 cursor-not-allowed w-3.5 h-3.5 sm:w-4 sm:h-4"
                              disabled
                              name="autoRenewContract"
                              value="false"
                              id="autoRenewNoView"
                            />
                            <span className="text-xs sm:text-sm">No</span>
                          </label>
                        </div>
                      </div>

                      <div className="mb-3.5 relative">
                        <i className="fa fa-lock absolute left-2 sm:left-3 top-[37px] text-xs sm:text-sm text-gray-400"></i>
                        <label
                          htmlFor="nextDueDate"
                          className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block"
                        >
                          Next Due Date
                        </label>
                        <label
                          className="labels block mt-2 text-xs sm:text-sm"
                          id="nextDueDateView"
                        ></label>
                      </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex-1 lg:pl-4 xl:pl-7">
                      <div className="mb-3.5 relative">
                        <i className="fa fa-lock absolute left-2 sm:left-3 top-[37px] text-xs sm:text-sm text-gray-400" />
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Subscription Activity
                        </label>
                        <input
                          id="editSubscriptionActivity"
                          className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 pl-8 sm:pl-[34px] bg-gray-100 cursor-not-allowed"
                          readOnly
                        />
                      </div>

                      <div className="mb-3.5 relative">
                        <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                          Subscription Department
                          <span className="text-red-600 ml-1">*</span>
                        </label>
                        <div
                          className="relative [&.active>div:last-child]:block"
                          id="departmentWrapper2"
                        >
                          <div
                            className="h-9 sm:h-10 border border-gray-300 rounded-md flex items-center justify-between px-2 sm:px-3 cursor-pointer bg-white"
                            id="departmentSelect2"
                          >
                            <span className="text-xs sm:text-sm text-gray-700">
                              Select Department
                            </span>
                            <i className="border-solid border-gray-600 border-t-0 border-r-2 border-b-2 border-l-0 p-[2px] sm:p-[3px] rotate-45" />
                          </div>
                          <div className="absolute w-full max-h-[220px] bg-white border border-gray-300 rounded-md mt-1.5 overflow-y-auto hidden z-20">
                            <input
                              className="search-input w-full py-2 px-2 sm:px-2.5 text-xs sm:text-[13px] border-none border-b border-gray-200"
                              placeholder="Search..."
                            />
                          </div>
                        </div>
                      </div>

                      {[
                        "editSubactivityID",
                        "activityLineID",
                        "editVendorName",
                        "editSubscriptionAmount",
                        "editLastUpdated",
                        "editAccount",
                        "editAccountManagerName",
                        "editAccountManagerEmail",
                        "editAccountManagerPhone",
                      ].map((id) => (
                        <div className="mb-3.5 relative" key={id}>
                          <i className="fa fa-lock absolute left-2 sm:left-3 top-[37px] text-xs sm:text-sm text-gray-400" />
                          <label className="text-xs sm:text-[13px] font-medium text-slate-900 mb-1.5 block">
                            {id.replace("edit", "").replace(/([A-Z])/g, " $1")}
                          </label>
                          <input
                            id={id}
                            className="h-9 sm:h-10 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-900 w-full box-border py-1.5 px-2 sm:px-2.5 pl-8 sm:pl-[34px] bg-gray-100 cursor-not-allowed"
                            readOnly
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              {/* FOOTER */}
              <div className="p-3 sm:p-4 md:p-[18px_28px] border-t border-gray-200 flex flex-col xs:flex-row justify-center gap-2 sm:gap-3">
                <button
                  className="w-full xs:w-[140px] h-10 sm:h-[42px] rounded-lg bg-white border border-gray-300 text-sm sm:text-base font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={closeModal}
                >
                  Close
                </button>
                <button
                  className="w-full xs:w-[180px] h-10 sm:h-[42px] rounded-lg bg-[#1b1f6a] text-white text-sm sm:text-base font-semibold cursor-pointer hover:bg-[#15195a] transition-colors"
                  onClick={() => window.updateActivityLine?.()}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionInventory;
