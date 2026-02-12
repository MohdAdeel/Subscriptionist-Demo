import {
  InputSkeleton,
  ButtonSkeleton,
  TableHeaderSkeleton,
} from "../../components/SkeletonLoader";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDepartments,
  useSubscriptionData,
  usePopulateEditForm,
  checkSubscriptionExistance,
  SUBSCRIPTION_DATA_QUERY_KEY,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionActivityLineMutation,
} from "../../hooks/useSubscriptions";
import { usePopup } from "../../components/Popup";
import AddSubscriptionModal from "./components/AddSubscriptionModal";
import EditSubscriptionModal from "./components/EditSubscriptionModal";
import BudgetManagementModal from "./components/BudgetManagementModal";
import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { FiSearch, FiBell, FiCalendar, FiUser, FiChevronDown, FiTrash2 } from "react-icons/fi";

// Dates that are past or within ~30 days are shown in red
const isDateCritical = (dateStr) => {
  if (!dateStr) return false;
  const parts = dateStr.split(".");
  if (parts.length !== 3) return false;
  const [day, month, year] = parts.map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return date <= thirtyDaysFromNow;
};

const RECORDS_PER_PAGE = 8;

/** Format ISO date string to DD.MM.YYYY for table display */
function formatApiDateToDisplay(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return "";
  }
}

/** Map API ActivityLines + Subscriptions to table row shape (camelCase, formatted dates) */
function mapActivityLinesToTableRows(result) {
  const activityLines = result?.ActivityLines ?? [];
  const subscriptions = result?.Subscriptions ?? [];
  const vendorBySubscriptionId = {};
  subscriptions.forEach((sub) => {
    const id = sub?.SubscriptionId != null ? String(sub.SubscriptionId).trim() : "";
    if (id) vendorBySubscriptionId[id] = sub.VendorName ?? "";
  });

  return activityLines.map((activity) => {
    const subscriptionId =
      activity?.SubscriptionActivityId != null
        ? String(activity.SubscriptionActivityId).trim()
        : "";
    const vendorName = activity?.VendorName ?? vendorBySubscriptionId[subscriptionId] ?? "";

    const lastDue = activity?.LastDueDate;
    const nextDue = activity?.NextDueDate;
    const startDate = activity?.SubscriptionStartDate;
    const endDate = activity?.SubscriptionEndDate;

    return {
      id:
        activity?.SubscriptionActivityLineId ?? activity?.SubscriptionActivityId ?? subscriptionId,
      subscriptionName: activity?.SubscriptionName ?? "",
      vendorName,
      amount: activity?.SubscriptionAmount ?? null,
      department: activity?.DepartmentName ?? "",
      startDate: formatApiDateToDisplay(startDate),
      endDate: formatApiDateToDisplay(endDate),
      paymentFrequency: activity?.SubscriptionFrequency ?? "",
      lastDueDate: formatApiDateToDisplay(lastDue),
      nextDueDate: formatApiDateToDisplay(nextDue),
      activityStatus:
        activity?.Status === 0 ||
        activity?.Status === "0" ||
        String(activity?.Status).toLowerCase() === "active"
          ? "Active"
          : "Inactive",
    };
  });
}

const Subscription = () => {
  const { showSuccess, showError, showWarning } = usePopup();
  const datePickerRef = useRef(null);
  const vendorDropdownRef = useRef(null);
  const vendorSearchInputRef = useRef(null);
  const [endDate, setEndDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("3");
  const [dateRangeText, setDateRangeText] = useState("");
  const [goToPageInput, setGoToPageInput] = useState("");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [appliedEndDate, setAppliedEndDate] = useState(null);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [appliedStartDate, setAppliedStartDate] = useState(null);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [subscriptionNameFilter, setSubscriptionNameFilter] = useState("");
  const [debouncedSubscriptionName, setDebouncedSubscriptionName] = useState("");

  const hasAppliedDateRange = appliedStartDate && appliedEndDate;
  const {
    data: subscriptionResult,
    isLoading,
    error: subscriptionError,
  } = useSubscriptionData({
    status: statusFilter,
    pagenumber: currentPage,
    vendorName: vendorFilter && vendorFilter !== "All" ? vendorFilter : null,
    subsciptionActivityline: debouncedSubscriptionName.trim() || null,
    startdate: hasAppliedDateRange ? formatDateForDisplay(appliedStartDate) : null,
    enddate: hasAppliedDateRange ? formatDateForDisplay(appliedEndDate) : null,
  });

  const { data: departmentsData = [] } = useDepartments();
  const departments = Array.isArray(departmentsData) ? departmentsData : [];

  const {
    data: editFormData,
    isLoading: isLoadingEditForm,
    isFetching: isFetchingEditForm,
    refetch: refetchEditForm,
  } = usePopulateEditForm(showEditModal && selectedRowId ? selectedRowId : null, {
    enabled: showEditModal && !!selectedRowId,
  });

  const queryClient = useQueryClient();
  const updateMutation = useUpdateSubscriptionMutation();
  const deleteMutation = useDeleteSubscriptionActivityLineMutation();
  const isSavingEdit = updateMutation.isPending;
  const isDeletingSubscription = deleteMutation.isPending;

  const totalCount = Number(subscriptionResult?.TotalCount) ?? 0;
  const ActivityLines = mapActivityLinesToTableRows(subscriptionResult ?? {});

  const vendorOptions = useMemo(() => {
    const unique = new Set();
    ActivityLines.forEach((row) => {
      const name = row.vendorName ? String(row.vendorName).trim() : "";
      if (name) unique.add(name);
    });
    return ["All", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [ActivityLines]);

  const filteredVendorOptions = useMemo(() => {
    const term = vendorSearchTerm.trim().toLowerCase();
    if (!term) return vendorOptions;
    return vendorOptions.filter((vendor) => vendor.toLowerCase().includes(term));
  }, [vendorOptions, vendorSearchTerm]);

  const handleVendorSelect = (vendor) => {
    setVendorFilter(vendor);
    setIsVendorDropdownOpen(false);
    setVendorSearchTerm("");
  };

  useEffect(() => {
    if (!isVendorDropdownOpen) return;
    const handleClickOutside = (event) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setIsVendorDropdownOpen(false);
        setVendorSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVendorDropdownOpen]);

  useEffect(() => {
    if (isVendorDropdownOpen && vendorSearchInputRef.current) {
      vendorSearchInputRef.current.focus();
    }
  }, [isVendorDropdownOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSubscriptionName(subscriptionNameFilter);
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [subscriptionNameFilter]);

  const openEditModal = useCallback(() => {
    if (selectedRowId) setShowEditModal(true);
  }, [selectedRowId]);

  // Refetch edit form data when modal opens so modal shows latest data, not cached
  useEffect(() => {
    if (showEditModal && selectedRowId) {
      refetchEditForm();
    }
  }, [showEditModal, selectedRowId, refetchEditForm]);

  const handleRowClick = useCallback((id) => {
    setSelectedRowId(id);
  }, []);

  const handleRowDoubleClick = useCallback((id) => {
    setSelectedRowId(id);
    setShowEditModal(true);
  }, []);

  // totalPages from API totalCount: ceil(totalCount / 8) e.g. 28/8 => 4 pages
  const totalPages = Math.max(1, Math.ceil(Number(totalCount) / RECORDS_PER_PAGE));

  const handleDatePickerClick = useCallback(() => {
    setShowDatePicker((prev) => {
      if (!prev) setCurrentMonth(new Date());
      return !prev;
    });
  }, []);
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
              dayClass +=
                " text-gray-300 cursor-not-allowed bg-gray-100/80 opacity-60 hover:opacity-60 hover:scale-100";
            if (isToday) dayClass += " bg-blue-50 border-blue-500 text-blue-900 font-bold";
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
  const getNextMonth = useCallback(() => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + 1);
    return next;
  }, [currentMonth]);

  const nextMonthDate = useMemo(() => getNextMonth(), [getNextMonth]);
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
      const formattedRange = `${formatDateForDisplay(
        startDate
      )} - ${formatDateForDisplay(endDate)}`;
      setDateRangeText(formattedRange);
      setAppliedStartDate(startDate);
      setAppliedEndDate(endDate);
      setShowDatePicker(false);
    }
  };

  const handleClearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setAppliedStartDate(null);
    setAppliedEndDate(null);
    setDateRangeText("");
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleGoToPage = (e) => {
    e.preventDefault();
    const num = parseInt(goToPageInput, 10);
    if (num >= 1 && num <= totalPages) {
      setCurrentPage(num);
      setGoToPageInput("");
    }
  };

  useEffect(() => {
    if (subscriptionError) {
      showError("Unable to load subscriptions. Please refresh the page.");
    }
  }, [subscriptionError, showError]);

  const handleUpdateSubscription = useCallback(
    async (formData) => {
      if (!formData) return;
      const subscriptionName = formData.subsname;
      const subscriptionActivityId = formData.activityLineId;
      try {
        const result = await checkSubscriptionExistance(subscriptionName, subscriptionActivityId);
        const value = result?.value;
        const hasDuplicate = Array.isArray(value) && value.length > 0;
        if (hasDuplicate) {
          showWarning("A subscription with this name already exists.");
          return;
        }
        await updateMutation.mutateAsync(formData);
        showSuccess("Subscription updated successfully.");
        setShowEditModal(false);
      } catch (err) {
        console.error("Subscription check or update failed:", err);
        showError("Unable to save subscription. Please try again.");
        setShowEditModal(false);
      }
    },
    [updateMutation, showSuccess, showError, showWarning]
  );

  const handleAddSuccess = useCallback(() => {
    showSuccess("Subscription added successfully.");
    setShowAddModal(false);
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_DATA_QUERY_KEY });
  }, [queryClient, showSuccess]);

  const openDeleteConfirm = useCallback((row) => {
    setDeleteConfirm({
      rowId: row.id,
      displayName: row.subscriptionName || "this subscription",
    });
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm?.rowId) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.rowId);
      closeDeleteConfirm();
      showSuccess("Subscription deleted successfully.");
      setSelectedRowId(null);
    } catch (err) {
      console.error("Delete failed:", err);
      showError(err?.message || "Unable to delete subscription. Please try again.");
    }
  }, [deleteConfirm?.rowId, deleteMutation, closeDeleteConfirm, showSuccess, showError]);

  return (
    <div className="bg-[#f6f7fb] p-3 sm:p-4 md:p-6 font-sans min-h-screen">
      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 sm:gap-5 px-3 sm:px-4 md:px-5 mb-4 sm:mb-6 w-full">
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
              {/* Subscription Name */}
              <div className="flex flex-col gap-1.5 w-full md:flex-1 md:min-w-[150px] md:max-w-[250px]">
                <label className="text-xs sm:text-[13px] text-[#343A40] font-medium">
                  Subscription Name
                </label>
                <div className="flex items-center bg-white rounded-lg border border-[#e9ecef] p-2 w-full">
                  <FiSearch className="mr-2 text-[#6C757D] text-sm sm:text-base flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={subscriptionNameFilter}
                    onChange={(e) => setSubscriptionNameFilter(e.target.value)}
                    className="border-none outline-none w-full text-xs sm:text-sm text-[#343A40] bg-transparent"
                  />
                </div>
              </div>
              {/* Due Date */}
              <div className="flex flex-col gap-1.5 w-full md:flex-1 md:min-w-[150px] md:max-w-[250px]">
                <label className="text-xs sm:text-[13px] text-[#555]">Due Date</label>
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
                    value={dateRangeText}
                    readOnly
                    className="border-none outline-none w-full text-xs sm:text-sm pl-0 cursor-pointer min-w-0"
                  />
                  {showDatePicker && (
                    <>
                      <div
                        className="fixed inset-0 z-[999] bg-black/20"
                        aria-hidden
                        onClick={() => setShowDatePicker(false)}
                      />
                      <div
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-xl shadow-xl z-[1000] w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[700px] p-4 sm:p-6 max-w-[calc(100vw-2rem)] sm:max-w-[90vw] max-h-[90vh] overflow-y-auto"
                        ref={datePickerRef}
                        onClick={(e) => e.stopPropagation()}
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
                        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-4 sm:mb-5 overflow-x-auto">
                          {renderCalendar(currentMonth)}
                          {renderCalendar(nextMonthDate)}
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
                    </>
                  )}
                </div>
              </div>
              {/* Vendor Name */}
              <div className="flex flex-col gap-1.5 w-full md:flex-1 md:min-w-[150px] md:max-w-[250px]">
                <label className="text-xs sm:text-[13px] text-[#343A40] font-medium">
                  Vendor Name
                </label>
                <div ref={vendorDropdownRef} className="relative w-full z-30">
                  <button
                    type="button"
                    onClick={() => setIsVendorDropdownOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between bg-white rounded-lg border border-[#e9ecef] p-2 text-xs sm:text-sm text-[#343A40]"
                  >
                    <span className="truncate">{vendorFilter || "All"}</span>
                    <FiChevronDown
                      className={`ml-2 h-4 w-4 text-[#6C757D] transition-transform duration-200 ${
                        isVendorDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isVendorDropdownOpen && (
                    <div className="absolute z-40 mt-2 w-full rounded-lg border border-[#e9ecef] bg-white shadow-xl overflow-visible">
                      <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            ref={vendorSearchInputRef}
                            type="text"
                            placeholder="Search vendors..."
                            value={vendorSearchTerm}
                            onChange={(e) => setVendorSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1f2a7c]/40 focus:border-[#1f2a7c] outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        {filteredVendorOptions.length > 0 ? (
                          filteredVendorOptions.map((vendor) => (
                            <button
                              key={vendor}
                              type="button"
                              onClick={() => handleVendorSelect(vendor)}
                              className={`w-full text-left px-4 py-3 text-xs sm:text-sm hover:bg-gray-50 transition-colors ${
                                vendorFilter === vendor
                                  ? "bg-[#1f2a7c]/5 text-[#1f2a7c] font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              {vendor}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-xs sm:text-sm text-gray-500">
                            No vendors found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Status */}
              <div className="flex flex-col gap-1.5 w-full md:flex-1 md:min-w-[150px] md:max-w-[250px]">
                <label className="text-xs sm:text-[13px] text-[#343A40] font-medium">Status</label>
                <div className="flex items-center bg-white rounded-lg border border-[#e9ecef] p-2 w-full">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-none outline-none w-full text-xs sm:text-sm text-[#343A40] bg-transparent cursor-pointer appearance-none"
                  >
                    <option value="3">All</option>
                    <option value="0">Active</option>
                    <option value="1">Inactive</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-start sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto sm:flex-shrink-0">
          {isLoading ? (
            <div className="flex flex-row gap-2 sm:gap-3 flex-wrap">
              <ButtonSkeleton count={3} />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={openEditModal}
                disabled={!selectedRowId}
                className={`px-3 sm:px-4 md:px-[18px] py-2 sm:py-2.5 rounded-lg border-[1.5px] text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  selectedRowId
                    ? "border-[#172B4D] text-[#172B4D] bg-transparent hover:bg-[#172B4D] hover:text-white"
                    : "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBudgetModal(true);
                  setBudgetData(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#172B4D] text-white text-sm font-semibold hover:bg-[#0f1f3d] transition-colors"
              >
                Budget Management
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-lg bg-[#172B4D] text-white text-sm font-semibold hover:bg-[#0f1f3d] transition-colors"
              >
                Add Subscription
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 sm:mt-6 px-3 sm:px-4 md:px-5">
        <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden border border-[#e9ecef] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse h-[400px] min-w-[900px]">
              {isLoading ? (
                <TableHeaderSkeleton columns={10} />
              ) : (
                <thead>
                  <tr className="bg-[#F8F9FA]">
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Subscription Name
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Vendor Name
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Subscription Amount
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Department
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Start Date
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      End Date
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Payment Frequency
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Last Due Date
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Next Due Date
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Activity Status
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-[#eee]">
                      {Array.from({ length: 10 }).map((_, colIdx) => (
                        <td key={colIdx} className="p-3">
                          <span className="inline-block h-3.5 w-4/5 max-w-[100px] rounded bg-gray-200 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : ActivityLines.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-[#6C757D]">
                      <p className="text-sm font-medium text-[#343A40] mb-1">
                        No subscriptions found
                      </p>
                      <p className="text-xs">
                        Add a new subscription using the &quot;Add Subscription&quot; button to get
                        started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  ActivityLines.map((row) => (
                    <tr
                      key={row.id}
                      data-row-id={row.id}
                      onClick={() => handleRowClick(row.id)}
                      onDoubleClick={() => handleRowDoubleClick(row.id)}
                      className={`cursor-pointer transition-colors border-b border-[#eee] hover:bg-[#f9f9ff] ${
                        selectedRowId === row.id ? "bg-[#e8ebff] border-l-4 border-l-[#172B4D]" : ""
                      }`}
                    >
                      <td className="p-3 text-sm text-[#343A40]">{row.subscriptionName}</td>
                      <td className="p-3 text-sm text-[#343A40]">{row.vendorName}</td>
                      <td className="p-3 text-sm text-[#5B6B9E]">
                        {row.amount != null ? `$${row.amount.toLocaleString()}` : ""}
                      </td>
                      <td className="p-3 text-sm text-[#343A40]">{row.department}</td>
                      <td className="p-3 text-sm text-[#007BFF]">{row.startDate}</td>
                      <td className="p-3 text-sm text-[#007BFF]">{row.endDate}</td>
                      <td className="p-3 text-sm text-[#343A40]">{row.paymentFrequency}</td>
                      <td
                        className="p-3 text-sm"
                        style={{
                          color: isDateCritical(row.lastDueDate) ? "#DC3545" : "#007BFF",
                        }}
                      >
                        {row.lastDueDate}
                      </td>
                      <td
                        className="p-3 text-sm"
                        style={{
                          color: isDateCritical(row.nextDueDate) ? "#DC3545" : "#007BFF",
                        }}
                      >
                        {row.nextDueDate}
                      </td>
                      <td className="p-3 text-sm text-[#343A40]">
                        <span className="inline-flex items-center gap-6">
                          {row.activityStatus}
                          {selectedRowId === row.id && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteConfirm(row);
                              }}
                              className="p-1 rounded text-[#DC3545] hover:bg-red-50 transition-colors"
                              aria-label="Delete subscription"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 sm:py-4 mt-2 sm:mt-3">
          <form onSubmit={handleGoToPage} className="flex items-center gap-2">
            <span className="text-sm text-[#343A40]">Go to #</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={goToPageInput !== "" ? goToPageInput : String(currentPage)}
              onChange={(e) => setGoToPageInput(e.target.value)}
              className="w-14 h-8 px-2 rounded border border-[#d0d5dd] text-sm text-[#343A40] focus:outline-none focus:border-[#172B4D]"
            />
            <span className="text-sm text-[#343A40]">Page</span>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md border border-[#d0d5dd] bg-white text-[#344054] text-sm font-medium hover:bg-[#F8F9FA] transition-colors"
            >
              Go
            </button>
          </form>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="min-w-[32px] h-8 px-2.5 rounded-md border border-[#d0d5dd] bg-white text-[#344054] text-sm inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#eef2ff] transition-colors"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`min-w-[32px] h-8 px-2.5 rounded-md border text-sm inline-flex items-center justify-center transition-colors ${
                  currentPage === page
                    ? "bg-[#172B4D] text-white border-[#172B4D]"
                    : "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#eef2ff]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="min-w-[32px] h-8 px-2.5 rounded-md border border-[#d0d5dd] bg-white text-[#344054] text-sm inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#eef2ff] transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddSubscriptionModal
        open={showAddModal}
        setOpen={setShowAddModal}
        departments={departments}
        onAddSuccess={handleAddSuccess}
      />
      <EditSubscriptionModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        editFormData={editFormData}
        departments={departments}
        onSave={handleUpdateSubscription}
        isSaving={isSavingEdit}
        isLoadingForm={isLoadingEditForm || isFetchingEditForm}
      />
      <BudgetManagementModal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} />

      {/* Confirm Delete subscription modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && closeDeleteConfirm()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-subscription-confirm-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b border-[#e9ecef]">
              <h2
                id="delete-subscription-confirm-title"
                className="text-lg font-bold text-[#343A40]"
              >
                Confirm Delete
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#343A40]">
                Are you sure you want to delete <strong>{deleteConfirm.displayName}</strong>? This
                action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-6 pt-4">
                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  disabled={isDeletingSubscription}
                  className="px-4 py-2 rounded-lg border border-[#e9ecef] text-[#343A40] text-sm font-semibold bg-white hover:bg-[#F8F9FA] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeletingSubscription}
                  className="px-4 py-2 rounded-lg bg-[#DC3545] text-white text-sm font-semibold hover:bg-[#c82333] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDeletingSubscription ? "Deleting…" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
