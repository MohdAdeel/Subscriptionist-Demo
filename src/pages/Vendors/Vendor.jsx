import {
  getFilters,
  populateForm,
  handleStatusChange,
  SearchSubscriptionName,
  getRelationshipSubsLines,
  SearchSubscriptionNameOnBlur,
} from "../../lib/utils/Vendors";
import {
  InputSkeleton,
  ButtonSkeleton,
  TableRowSkeleton,
  TableHeaderSkeleton,
} from "../../components/SkeletonLoader";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { FiSearch, FiBell, FiCalendar, FiUser } from "react-icons/fi";

const Vendor = () => {
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

  const openModal = () => {
    setShowModal(true);
  };

  useEffect(() => {
    const tableWrapper = tableWrapperRef.current;

    setIsLoading(true);
    setIsEmpty(false);
    if (tableWrapper) {
      tableWrapper.style.minHeight = "600px";
    }

    // Page 1 ke subscriptions fetch karo - use filters object
    getRelationshipSubsLines(1, getFilters()).finally(() => {
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
      populateForm(selectedRowId);
    }
  }, [showModal]);

  // Add row selection highlighting using React state
  useEffect(() => {
    const handleRowClick = (e) => {
      const row = e.target.closest("tr");
      if (row && row.parentElement.tagName === "TBODY") {
        const subActivityLineID = row.getAttribute("data-row-id") || `row-${row.rowIndex}`;
        setSelectedRowId(subActivityLineID);
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
      row.classList.remove("bg-[#e8ebff]", "border-l-[3px]", "border-l-[#1d225d]");

      // Add selection classes if this row is selected
      if (selectedRowId === rowId) {
        row.classList.add("bg-[#e8ebff]", "border-l-[3px]", "border-l-[#1d225d]");
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
          const rowId = row.getAttribute("data-row-id") || `row-${row.rowIndex}`;

          row.classList.remove("bg-[#e8ebff]", "border-l-[3px]", "border-l-[#1d225d]");

          if (selectedRowId === rowId) {
            row.classList.add("bg-[#e8ebff]", "border-l-[3px]", "border-l-[#1d225d]");
          }
        });
      }
    });

    observer.observe(tbody, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [selectedRowId]);

  const handleDatePickerClick = () => {
    if (!showDatePicker) {
      // Reset to current month when opening
      setCurrentMonth(new Date());
    }
    setShowDatePicker(!showDatePicker);
  };

  // Calendar helper functions

  return (
    <div className="bg-[#f6f7fb] p-3 sm:p-4 md:p-6 font-sans min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <h2 className="m-0 text-lg sm:text-xl md:text-[22px] font-bold">Vendor Name</h2>
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
                <label className="text-xs sm:text-[13px] text-[#555]">Vendor Name</label>

                <div className="flex items-center bg-white rounded-lg p-2 w-full relative">
                  <FiSearch className="mr-2 text-[#999] text-sm sm:text-base flex-shrink-0" />

                  <input
                    id="Searchfeild"
                    type="text"
                    placeholder="Search"
                    className="border-none outline-none w-full text-xs sm:text-sm"
                    onBlur={(e) => {
                      SearchSubscriptionNameOnBlur(e);
                    }}
                    onKeyDown={(e) => {
                      SearchSubscriptionName(e);
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5 w-full md:flex-1 md:min-w-[150px] md:max-w-[250px]">
                <label className="text-xs sm:text-[13px] text-[#555]">Status</label>

                <div className="flex items-center bg-white rounded-lg p-2 w-full">
                  <select
                    id="Statusoptions"
                    className="border-none outline-none w-full text-xs sm:text-sm bg-transparent cursor-pointer appearance-none"
                    onChange={handleStatusChange}
                  >
                    <option value="null">All</option>
                    <option value="0">Active</option>
                    <option value="1">Inactive</option>
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
              <button className="px-3 sm:px-4 md:px-[18px] py-2 sm:py-2.5 rounded-lg sm:rounded-[10px] border-none bg-[#1d225d] text-white text-xs sm:text-sm font-semibold cursor-pointer hover:bg-[#15195a] transition-colors whitespace-nowrap w-full sm:w-auto">
                Add Vendor
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table and Charts Side by Side */}
      <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Table Section - Left Side */}
        <div className="flex-1 min-w-0">
          <div className="relative">
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
                          Vendor Name
                        </th>
                        <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                          Account Manager Email
                        </th>
                        <th className="text-left text-[10px] xs:text-xs sm:text-[13px] font-semibold text-[#1d225d] p-2 sm:p-3 bg-[#f3f4fa] relative z-[3] whitespace-nowrap">
                          Subscription Amount
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
                        <td colSpan="10" className="text-center py-12 sm:py-[60px] px-3 sm:px-5">
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
        </div>

        {/* Charts Section - Right Side */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col gap-4">
          {/* ===== Tile 1 : Activity Count ===== */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#1d225d] mb-3">Activity Count</p>

            <div className="flex gap-3">
              {/* Chart */}
              <div className="w-[120px] h-[120px] flex-shrink-0">
                <canvas id="doughnut-chart-1"></canvas>
              </div>

              {/* Legend */}
              <div
                id="chart-legend-1"
                className="flex-1 text-xs space-y-2 overflow-y-auto max-h-[120px]"
              />
            </div>
          </div>

          {/* ===== Tile 2 : Amount by Vendor ===== */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#1d225d] mb-3">Amount by Vendor</p>

            <div className="flex gap-3">
              {/* Chart */}
              <div className="w-[120px] h-[120px] flex-shrink-0">
                <canvas id="doughnut-chart-2"></canvas>
              </div>

              {/* Legend */}
              <div
                id="chart-legend-2"
                className="flex-1 text-xs space-y-2 overflow-y-auto max-h-[120px]"
              />
            </div>
          </div>

          {/* ===== Tile 3 : Departmental Spend Trend ===== */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#1d225d] mb-3">Departmental Spend Trend</p>

            <div className="h-[250px] w-full">
              <canvas id="department-spend-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vendor;
