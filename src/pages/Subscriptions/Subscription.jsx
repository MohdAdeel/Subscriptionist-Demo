import "./Subscription.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiCalendar, FiUser } from "react-icons/fi";
import {
  // applyFilters,
  // callgetBudgetData,
  populateForm,
  getRelationshipSubsLines,
} from "../../lib/utils/subscriptions";

const SubscriptionInventory = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [descriptionCount, setDescriptionCount] = useState(0);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const skeletonRef = useRef(null);
  const datePickerRef = useRef(null);
  const tableWrapperRef = useRef(null);

  const handleDescriptionChange = (e) => {
    setDescriptionCount(e.target.value.length);
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  useEffect(() => {
    const skeletonEl = skeletonRef.current;
    const tableWrapper = tableWrapperRef.current;

    setIsLoading(true);
    setIsEmpty(false);
    skeletonEl?.classList.remove("hidden");
    tableWrapper?.classList.add("loading");

    // Page 1 ke subscriptions fetch karo
    getRelationshipSubsLines(1, {}).finally(() => {
      skeletonEl?.classList.add("hidden");
      tableWrapper?.classList.remove("loading");
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
      populateForm(); // ✅ ab modal render ho chuka hota hai
    }
  }, [showModal]);

  // Add row selection highlighting
  useEffect(() => {
    const handleRowClick = (e) => {
      const row = e.target.closest("tr");
      if (row && row.parentElement.tagName === "TBODY") {
        // Remove previous selection
        const tbody = document.getElementById("subscription-grid-body");
        if (tbody) {
          const allRows = tbody.querySelectorAll("tr");
          allRows.forEach((r) => r.classList.remove("selected-row"));
        }
        // Add selection to clicked row
        row.classList.add("selected-row");
        setSelectedRowId(row.getAttribute("data-row-id") || row.rowIndex);
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

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target) &&
        !event.target.closest(".date-input-box")
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
      <div className="calendar-month">
        <div className="calendar-month-header">
          <h3>
            {monthName} {year}
          </h3>
        </div>
        <div className="calendar-weekdays">
          {weekDays.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-days">
          {days.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="calendar-day empty"
                ></div>
              );
            }

            const date = new Date(year, month, day);
            const isToday = isSameDate(date, today);
            const isStart = startDate && isSameDate(date, startDate);
            const isEnd = endDate && isSameDate(date, endDate);
            const isInRange = isDateInRange(date, startDate, endDate);
            const isPast = date < today;

            let dayClass = "calendar-day";
            if (isPast) dayClass += " past";
            if (isToday) dayClass += " today";
            if (isStart) dayClass += " start-date";
            if (isEnd) dayClass += " end-date";
            if (isInRange && !isStart && !isEnd) dayClass += " in-range";

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
    <div className="inventory-wrapper">
      {/* Header */}
      <div className="inventory-header">
        <div className="header-left">
          <h2>Subscription Inventory</h2>
        </div>

        <div className="header-right">
          <span className="last-update">Last Update 21 days ago</span>
          <FiBell className="icon" />
          <div className="profile-circle">
            <FiUser className="profile-icon" />
          </div>
          <span className="profile-text">Test Subscriptionist Invitation</span>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="filters-actions-container">
        {/* Filters */}
        <div className="filters">
          {isLoading ? (
            <>
              <div className="filter-skeleton">
                <div className="skeleton-label"></div>
                <div className="skeleton-input"></div>
              </div>
              <div className="filter-skeleton">
                <div className="skeleton-label"></div>
                <div className="skeleton-input"></div>
              </div>
              <div className="filter-skeleton">
                <div className="skeleton-label"></div>
                <div className="skeleton-input"></div>
              </div>
              <div className="filter-skeleton">
                <div className="skeleton-label"></div>
                <div className="skeleton-input"></div>
              </div>
            </>
          ) : (
            <>
              <div className="filter">
                <label>Subscription Name</label>
                <div className="input-box">
                  <FiSearch className="input-icon" />
                  <input type="text" placeholder="Search" />
                </div>
              </div>

              <div className="filter">
                <label>Due Date</label>
                <div
                  className="input-box date-input-box"
                  style={{ position: "relative" }}
                >
                  <FiCalendar className="input-icon" />
                  <input
                    id="datePicker"
                    type="text"
                    placeholder="Select Date Range"
                    name="datefilter"
                    onClick={handleDatePickerClick}
                    readOnly
                    style={{ cursor: "pointer" }}
                  />
                  {showDatePicker && (
                    <div
                      className="large-date-range-picker"
                      ref={datePickerRef}
                    >
                      <div className="calendar-header">
                        <button
                          className="calendar-nav-btn"
                          onClick={() => navigateMonth(-1)}
                          aria-label="Previous month"
                        >
                          ‹
                        </button>
                        <div className="calendar-header-title">
                          <h3>Select Date Range</h3>
                          <p className="calendar-instruction">
                            {!startDate
                              ? "Select start date"
                              : !endDate
                              ? "Select end date"
                              : "Date range selected"}
                          </p>
                        </div>
                        <button
                          className="calendar-nav-btn"
                          onClick={() => navigateMonth(1)}
                          aria-label="Next month"
                        >
                          ›
                        </button>
                        <button
                          className="calendar-close-btn"
                          onClick={() => setShowDatePicker(false)}
                          aria-label="Close"
                        >
                          ×
                        </button>
                      </div>
                      <div className="calendar-container">
                        {renderCalendar(currentMonth)}
                        {renderCalendar(getNextMonth())}
                      </div>
                      <div className="calendar-footer">
                        <div className="selected-dates-display">
                          {startDate && (
                            <div className="selected-date-item">
                              <span className="date-label">Start:</span>
                              <span className="date-value">
                                {formatDateForDisplay(startDate)}
                              </span>
                            </div>
                          )}
                          {endDate && (
                            <div className="selected-date-item">
                              <span className="date-label">End:</span>
                              <span className="date-value">
                                {formatDateForDisplay(endDate)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="calendar-actions">
                          <button
                            className="btn-clear"
                            onClick={handleClearDateRange}
                          >
                            Clear
                          </button>
                          <button
                            className="btn-apply"
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

              <div className="filter">
                <label>Vendor Name</label>
                <div className="input-box">
                  <select id="Vendoroptions">
                    <option>All</option>
                  </select>
                </div>
              </div>

              <div className="filter">
                <label>Status</label>
                <div className="input-box">
                  <select id="Statusoptions">
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
        <div className="actions">
          {isLoading ? (
            <>
              <div className="skeleton-button"></div>
              <div className="skeleton-button"></div>
              <div className="skeleton-button"></div>
            </>
          ) : (
            <>
              <button
                className={`btn-outline edit-btn ${selectedRowId ? "active" : "inactive"}`}
                onClick={() => {
                  if (selectedRowId) {
                    console.log("Edit button clicked");
                    openModal();
                  }
                }}
                disabled={!selectedRowId}
              >
                Edit
              </button>

              <button
                className="btn-primary"
                onClick={() => navigate("/budget-management")}
              >
                Budget Management
              </button>
              <button className="btn-primary">Add Subscription</button>
            </>
          )}
        </div>
      </div>

      {/* Table (Backend renders rows via JS) */}
      <div className="table-container">
        <div className="table-wrapper" ref={tableWrapperRef}>
          <div className="subscription-skeleton hidden" ref={skeletonRef}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div className="subscription-skeleton-row" key={idx}>
                <span className="subscription-skeleton-bar short"></span>
                <span className="subscription-skeleton-bar"></span>
                <span className="subscription-skeleton-bar wide"></span>
                <span className="subscription-skeleton-bar"></span>
                <span className="subscription-skeleton-bar short"></span>
              </div>
            ))}
          </div>

          {/* Add id="Subscriptions" here */}
          <table id="Subscriptions" className="subscription-table">
            <thead className={isLoading ? "skeleton-header" : ""}>
              <tr>
                <th>
                  {isLoading ? (
                    <span className="skeleton-header-bar"></span>
                  ) : (
                    "Subscription Name"
                  )}
                </th>
                <th>
                  {isLoading ? (
                    <span className="skeleton-header-bar"></span>
                  ) : (
                    "Vendor Name"
                  )}
                </th>
                <th>
                  {isLoading ? (
                    <span className="skeleton-header-bar"></span>
                  ) : (
                    "Subscription Amount"
                  )}
                </th>
                <th>
                  {isLoading ? (
                    <span className="skeleton-header-bar"></span>
                  ) : (
                    "Department"
                  )}
                </th>
                <th>
                  {isLoading ? (
                    <span className="skeleton-header-bar"></span>
                  ) : (
                    "Start Date"
                  )}
                </th>
                <th>
                  {isLoading ? (
                    <span className="skeleton-header-bar"></span>
                  ) : (
                    "End Date"
                  )}
                </th>
                <th>
                  {isLoading ? (
                    <span className="skeleton-header-bar"></span>
                  ) : (
                    "Payment Frequency"
                  )}
                </th>
                <th>
                  {isLoading ? (
                    <span className="skeleton-header-bar"></span>
                  ) : (
                    "Last Due Date"
                  )}
                </th>
                <th>
                  {isLoading ? (
                    <span className="skeleton-header-bar"></span>
                  ) : (
                    "Next Due Date"
                  )}
                </th>
                <th>
                  {isLoading ? (
                    <span className="skeleton-header-bar"></span>
                  ) : (
                    "Activity Status"
                  )}
                </th>
              </tr>
            </thead>
            <tbody id="subscription-grid-body">
              {/* Rows injected by JS */}
              {!isLoading && isEmpty && (
                <tr>
                  <td colSpan="10" className="empty-state">
                    <div className="empty-state-content">
                      <p>No subscriptions available</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Backend pagination */}
        <div id="paginationid" className="pagination-wrapper"></div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-dialog modal-xl">
            <div className="modal-content" id="formcontentid">
              {/* HEADER */}
              <div className="modal-header">
                <h5 className="modal-title">Edit Subscription</h5>
                <button className="btn-close" onClick={closeModal}>
                  ×
                </button>
              </div>

              {/* BODY */}
              <div className="modal-body">
                <form>
                  <div className="row">
                    {/* LEFT COLUMN */}
                    <div className="col-left">
                      <div className="form-group lock">
                        <i className="fa fa-lock" />
                        <label>Subscription Activity ID</label>
                        <input
                          id="editActivityID"
                          className="form-control readonlyBackground"
                          readOnly
                        />
                      </div>

                      <div className="form-group">
                        <label>Subscription Name</label>
                        <input
                          id="editSubscriptionName"
                          maxLength="87"
                          className="form-control"
                        />
                      </div>

                      <div className="form-group">
                        <label>Subscription Contract Amount</label>
                        <input
                          id="editContractAmount"
                          type="number"
                          step="0.01"
                          className="form-control"
                          onBlur={() =>
                            window.checkAndFormatDecimal?.(editContractAmount)
                          }
                          onInput={() =>
                            window.checkAndRemoveError?.(editContractAmount)
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          id="editDescription"
                          maxLength="2000"
                          rows="4"
                          className="form-control"
                          onChange={handleDescriptionChange}
                        />
                        <small className="text-muted d-flex justify-content-end">
                          <span id="editDescriptionCounter">
                            {descriptionCount}
                          </span>
                          /2000
                        </small>
                      </div>

                      {["editStartDate", "editEndDate", "editLastDueDate"].map(
                        (id) => (
                          <div className="form-group date-container" key={id}>
                            <label>
                              {id
                                .replace("edit", "")
                                .replace(/([A-Z])/g, " $1")}
                            </label>
                            <input
                              type="date"
                              id={id}
                              className="form-control"
                              onClick={() => window.openDatePicker?.(id)}
                            />
                            <img src="/calender_icon.png" alt="calendar" />
                          </div>
                        )
                      )}

                      <div className="form-group">
                        <label>Subscription Frequency Number</label>
                        <input
                          id="editFrequencyNumber"
                          type="number"
                          className="form-control"
                        />
                      </div>

                      <div className="form-group">
                        <label>Subscription Frequency Unit</label>
                        <select id="editFrequencyUnit" className="form-control">
                          <option value="null">Select</option>
                          <option value="664160002">Months</option>
                          <option value="664160003">Years</option>
                        </select>
                      </div>

                      <div className="form-group lock">
                        <i className="fa fa-lock" />
                        <label>Subscription Frequency</label>
                        <input
                          id="editSubscriptionFrequency"
                          className="form-control readonlyBackground"
                          readOnly
                        />
                      </div>

                      <div className="form-group lock">
                        <i className="fa fa-lock" />
                        <label>Activity Status</label>
                        <input
                          id="editActivityStatus"
                          className="form-control readonlyBackground"
                          readOnly
                        />
                      </div>

                      {/* Missing numeric fields */}
                      <div className="form-group">
                        <label htmlFor="editNumLicenses">
                          Number of Licenses
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100000"
                          className="form-control integer-only"
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

                      <div className="form-group">
                        <label htmlFor="editNumUsers">
                          Number of Current Users
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100000"
                          className="form-control integer-only"
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
                        className="form-group"
                        style={{ height: "63px", marginTop: "15px" }}
                      >
                        <label>Do you require a partner for renewal?</label>
                        <div style={{ marginTop: "10px" }}>
                          <label className="radio-inline">
                            <input
                              type="radio"
                              name="requirePartner"
                              value="true"
                              id="editRequirePartnerId"
                            />{" "}
                            Yes
                          </label>
                          <label className="radio-inline">
                            <input
                              type="radio"
                              name="requirePartner"
                              value="false"
                              id="editRequirePartnernoId"
                            />{" "}
                            No
                          </label>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Is it Auto Renew Contract?</label>
                        <br />
                        <div>
                          <label className="radio-inline">
                            <input
                              type="radio"
                              className="readonlyBackground"
                              disabled
                              name="autoRenewContract"
                              value="true"
                              id="autorenewyesView"
                            />{" "}
                            Yes
                          </label>
                          <label className="radio-inline">
                            <input
                              type="radio"
                              className="readonlyBackground"
                              disabled
                              name="autoRenewContract"
                              value="false"
                              id="autoRenewNoView"
                            />{" "}
                            No
                          </label>
                        </div>
                      </div>

                      <div className="form-group lock">
                        <i className="fa fa-lock"></i>
                        <label htmlFor="nextDueDate">Next Due Date</label>
                        <br />
                        <label className="labels" id="nextDueDateView"></label>
                      </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="col-right">
                      <div className="form-group lock">
                        <i className="fa fa-lock" />
                        <label>Subscription Activity</label>
                        <input
                          id="editSubscriptionActivity"
                          className="form-control readonlyBackground"
                          readOnly
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          Subscription Department
                          <span className="required">*</span>
                        </label>
                        <div className="custom-select" id="departmentWrapper2">
                          <div className="select-box" id="departmentSelect2">
                            <span className="optionName">
                              Select Department
                            </span>
                            <i className="arrow-down" />
                          </div>
                          <div className="options-container">
                            <input
                              className="search-input"
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
                        <div className="form-group lock" key={id}>
                          <i className="fa fa-lock" />
                          <label>
                            {id.replace("edit", "").replace(/([A-Z])/g, " $1")}
                          </label>
                          <input
                            id={id}
                            className="form-control readonlyBackground"
                            readOnly
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button className="btn cancel-btn" onClick={closeModal}>
                  Close
                </button>
                <button
                  className="btn submit-btn"
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
