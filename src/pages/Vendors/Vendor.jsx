import Chart from "chart.js/auto";
import { usePopup } from "../../components/Popup";
import { useVendorData } from "../../hooks/useVendors";
import { useEffect, useRef, useState, useMemo } from "react";
import AddEditVendorModal from "./component/AddEditVendorModal";
import { FiSearch, FiBell, FiUser, FiChevronDown } from "react-icons/fi";

// Reuse same palette as Reports/Financial for consistency
const VENDOR_CHART_COLORS = [
  "#CCD6EB",
  "#E1FFBB",
  "#1D225D",
  "#BFF1FF",
  "#CFE1FF",
  "#D4F1F4",
  "#E1DBFE",
];
const DEPARTMENT_BAR_COLORS = ["#E1DBFE", "#BFF1FF", "#E1FFBB", "#EAECF0"];

const RECORDS_PER_PAGE = 10;

// External HTML tooltip so it's never clipped by sidebar/card
function getOrCreateTooltipEl() {
  let el = document.getElementById("vendor-chartjs-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.id = "vendor-chartjs-tooltip";
    el.style.cssText =
      "position: fixed; z-index: 9999; padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.8); color: #fff; font-size: 12px; pointer-events: none; opacity: 0; transition: opacity 0.2s; max-width: 240px;";
    document.body.appendChild(el);
  }
  return el;
}

function externalTooltipHandler(context) {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltipEl();
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = "0";
    return;
  }
  if (tooltip.body) {
    const title = (tooltip.title || []).join("");
    const body = (tooltip.body || []).map((b) => (b.lines || []).join(" ")).join("<br/>");
    tooltipEl.innerHTML = title
      ? `<div style="font-weight: bold; margin-bottom: 4px;">${title}</div><div>${body}</div>`
      : `<div>${body}</div>`;
  }
  const { left, top } = chart.canvas.getBoundingClientRect();
  const caretX = left + tooltip.caretX;
  const caretY = top + tooltip.caretY;
  tooltipEl.style.opacity = "1";
  tooltipEl.style.left = `${caretX - tooltipEl.offsetWidth - 10}px`;
  tooltipEl.style.top = `${caretY - tooltipEl.offsetHeight / 2}px`;
  const padding = 8;
  if (parseInt(tooltipEl.style.left, 10) < padding) {
    tooltipEl.style.left = `${padding}px`;
  }
  if (parseInt(tooltipEl.style.top, 10) < padding) {
    tooltipEl.style.top = `${padding}px`;
  }
  const maxTop = window.innerHeight - tooltipEl.offsetHeight - padding;
  if (parseInt(tooltipEl.style.top, 10) > maxTop) {
    tooltipEl.style.top = `${maxTop}px`;
  }
}

// Dummy data for Departmental Spend Trend bar chart
const DUMMY_DEPARTMENT_SPEND = [
  { label: "HR", value: 2800 },
  { label: "IT", value: 4300 },
  { label: "Finance", value: 200 },
  { label: "Marketing", value: 2000 },
];

export default function Vendor() {
  const { showError } = usePopup();
  const [currentPage, setCurrentPage] = useState(1);
  const [editVendor, setEditVendor] = useState(null);
  const [statusFilter, setStatusFilter] = useState("3");
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [vendorNameFilter, setVendorNameFilter] = useState("");
  const [debouncedVendorName, setDebouncedVendorName] = useState("");
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);

  const {
    data: vendorData,
    isLoading: isLoadingVendors,
    error: vendorError,
  } = useVendorData({
    status: statusFilter,
    pagenumber: currentPage,
    vendor: debouncedVendorName,
  });

  const vendors = vendorData?.vendor ?? [];
  const vendorsLengthCount = vendorData?.count ?? 0;
  const activityLineCountForVendor = Array.isArray(vendorData?.activityLineCountForVendor)
    ? vendorData.activityLineCountForVendor
    : (vendorData?.activityLineCountForVendor?.value ?? []);

  const activityCountChartRef = useRef(null);
  const amountByVendorChartRef = useRef(null);
  const departmentSpendChartRef = useRef(null);
  const activityCountChartInstanceRef = useRef(null);
  const amountByVendorChartInstanceRef = useRef(null);
  const departmentSpendChartInstanceRef = useRef(null);

  // Amount by Vendor chart data: vendors with amount > 0 (from API vendors state)
  const amountByVendorData = useMemo(() => {
    return vendors
      .filter((v) => (v.amount ?? 0) > 0)
      .map((v) => ({
        label: v.vendorName ?? "Unknown",
        value: v.amount ?? 0,
      }));
  }, [vendors]);

  // Server-side pagination: total pages from API count (e.g. 35 / 10 = 4 pages)
  const totalPages = Math.max(1, Math.ceil(vendorsLengthCount / RECORDS_PER_PAGE));

  // Activity Count donut (driven by activityLineCountForVendor: { count, vendor }[])
  useEffect(() => {
    if (!activityCountChartRef.current) return;
    const labels = activityLineCountForVendor.map((e) => e.vendor);
    const counts = activityLineCountForVendor.map((e) => e.count);
    const ctx = activityCountChartRef.current.getContext("2d");
    if (activityCountChartInstanceRef.current) {
      activityCountChartInstanceRef.current.destroy();
      activityCountChartInstanceRef.current = null;
    }
    activityCountChartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: counts,
            backgroundColor: labels.map(
              (_, i) => VENDOR_CHART_COLORS[i % VENDOR_CHART_COLORS.length]
            ),
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "70%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: externalTooltipHandler,
            callbacks: {
              label: (ctx) =>
                `${ctx.label}: ${ctx.parsed} ${ctx.parsed === 1 ? "activity" : "activities"}`,
            },
          },
        },
      },
    });
    return () => {
      if (activityCountChartInstanceRef.current) {
        activityCountChartInstanceRef.current.destroy();
        activityCountChartInstanceRef.current = null;
      }
    };
  }, [activityLineCountForVendor]);

  // Amount by Vendor donut (driven by vendors with amount > 0)
  useEffect(() => {
    if (!amountByVendorChartRef.current) return;
    const labels = amountByVendorData.map((e) => e.label);
    const values = amountByVendorData.map((e) => e.value);
    const ctx = amountByVendorChartRef.current.getContext("2d");
    if (amountByVendorChartInstanceRef.current) {
      amountByVendorChartInstanceRef.current.destroy();
      amountByVendorChartInstanceRef.current = null;
    }
    amountByVendorChartInstanceRef.current = new Chart(ctx, {
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
        cutout: "70%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: externalTooltipHandler,
            callbacks: {
              label: (ctx) => ctx.label + ": $" + (ctx.parsed || 0).toLocaleString(),
            },
          },
        },
      },
    });
    return () => {
      if (amountByVendorChartInstanceRef.current) {
        amountByVendorChartInstanceRef.current.destroy();
        amountByVendorChartInstanceRef.current = null;
      }
    };
  }, [amountByVendorData]);

  // Departmental Spend Trend bar (dummy data; chart created when canvas is visible after loading)
  useEffect(() => {
    if (isLoadingVendors || !departmentSpendChartRef.current) return;
    const ctx = departmentSpendChartRef.current.getContext("2d");
    if (departmentSpendChartInstanceRef.current) {
      departmentSpendChartInstanceRef.current.destroy();
      departmentSpendChartInstanceRef.current = null;
    }
    departmentSpendChartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: DUMMY_DEPARTMENT_SPEND.map((e) => e.label),
        datasets: [
          {
            label: "Spend",
            data: DUMMY_DEPARTMENT_SPEND.map((e) => e.value),
            backgroundColor: DUMMY_DEPARTMENT_SPEND.map(
              (_, i) => DEPARTMENT_BAR_COLORS[i % DEPARTMENT_BAR_COLORS.length]
            ),
            borderWidth: 0,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              color: "#6b7280",
              font: { size: 12 },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => "Spend: $" + (ctx.parsed?.y || 0).toLocaleString(),
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: "#6b7280", font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            max: 4500,
            grid: { color: "#f3f4f6", drawBorder: false },
            border: { display: false },
            ticks: {
              color: "#6b7280",
              font: { size: 12 },
              stepSize: 500,
              callback: (v) => (v === 0 ? "0" : v.toLocaleString()),
            },
          },
        },
      },
    });
    return () => {
      if (departmentSpendChartInstanceRef.current) {
        departmentSpendChartInstanceRef.current.destroy();
        departmentSpendChartInstanceRef.current = null;
      }
    };
  }, [isLoadingVendors]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedVendorName(vendorNameFilter);
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [vendorNameFilter]);

  useEffect(() => {
    if (vendorError) {
      showError("Unable to load vendors. Please refresh the page.");
    }
  }, [vendorError, showError]);

  return (
    <div className="bg-[#f6f7fb] p-3 sm:p-4 md:p-6 font-sans min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Table card (~2/3) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden border border-[#e9ecef] shadow-sm">
            {/* Filters + Actions (top right of table) */}
            <div className="p-3 sm:p-4 border-b border-[#e9ecef]">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <label className="text-xs sm:text-[13px] text-[#343A40] font-medium">
                      Vendor Name
                    </label>
                    <div className="flex items-center bg-white rounded-lg border border-[#e9ecef] p-2 w-full">
                      <FiSearch className="mr-2 text-[#6C757D] text-sm flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Search"
                        value={vendorNameFilter}
                        onChange={(e) => {
                          setVendorNameFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="border-none outline-none w-full text-xs sm:text-sm text-[#343A40] bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
                    <label className="text-xs sm:text-[13px] text-[#343A40] font-medium">
                      Status
                    </label>
                    <div className="flex items-center bg-white rounded-lg border border-[#e9ecef] p-2 w-full">
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="border-none outline-none w-full text-xs sm:text-sm text-[#343A40] bg-transparent cursor-pointer appearance-none"
                      >
                        <option value="3">All</option>
                        <option value="0">Active</option>
                        <option value="1">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 sm:ml-2">
                  <button
                    type="button"
                    disabled={!selectedRowId}
                    onClick={() => {
                      const row = vendors.find((v) => v.activityID === selectedRowId);
                      if (row) {
                        setEditVendor(row);
                        setShowEditVendorModal(true);
                      }
                    }}
                    className={`px-3 sm:px-4 py-2 rounded-lg border-[1.5px] text-xs sm:text-sm font-semibold transition-colors ${
                      selectedRowId
                        ? "border-[#d0d5dd] text-[#344054] bg-white hover:bg-[#F8F9FA]"
                        : "border-[#e9ecef] text-[#9CA3AF] bg-[#F8F9FA] cursor-not-allowed"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddVendorModal(true)}
                    className="px-4 py-2 rounded-lg bg-[#172B4D] text-white text-sm font-semibold hover:bg-[#0f1f3d] transition-colors"
                  >
                    Add Vendor
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#F8F9FA]">
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Vendor Name
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Account Manager Email
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Subscription Amount
                    </th>
                    <th className="text-left text-xs sm:text-[13px] font-semibold text-[#343A40] p-3 whitespace-nowrap">
                      Activity Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingVendors ? (
                    Array.from({ length: RECORDS_PER_PAGE }).map((_, idx) => (
                      <tr key={idx} className="border-b border-[#eee]">
                        <td className="p-3">
                          <div className="h-4 w-3/4 max-w-[180px] bg-[#e9ecef] rounded animate-pulse" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-2/3 max-w-[140px] bg-[#e9ecef] rounded animate-pulse" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-20 bg-[#e9ecef] rounded animate-pulse" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-16 bg-[#e9ecef] rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : vendors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-[#6C757D]">
                        <p className="text-sm font-medium text-[#343A40] mb-1">No Data available</p>
                        <p className="text-xs">Add New Vendor</p>
                      </td>
                    </tr>
                  ) : (
                    vendors.map((row) => (
                      <tr
                        key={row.activityID}
                        onClick={() => setSelectedRowId(row.activityID)}
                        onDoubleClick={() => {
                          setEditVendor(row);
                          setShowEditVendorModal(true);
                        }}
                        className={`cursor-pointer transition-colors border-b border-[#eee] hover:bg-[#f9f9ff] ${
                          selectedRowId === row.activityID
                            ? "bg-[#e8ebff] border-l-4 border-l-[#172B4D]"
                            : ""
                        }`}
                      >
                        <td className="p-3">
                          <span className="text-sm text-[#172B4D] font-medium underline cursor-pointer hover:opacity-80">
                            {row.vendorName}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-[#343A40]">{row.managerEmail || "—"}</td>
                        <td className="p-3 text-sm text-[#343A40]">
                          ${row.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-sm text-[#343A40]">
                          {row.status === 0 || String(row.status) === "0" ? "Active" : "InActive"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-end gap-2 py-3 px-3 sm:px-4 border-t border-[#e9ecef]">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoadingVendors}
                className="min-w-[32px] h-8 px-2.5 rounded-md border border-[#d0d5dd] bg-white text-[#344054] text-sm inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#eef2ff] transition-colors"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  disabled={isLoadingVendors}
                  className={`min-w-[32px] h-8 px-2.5 rounded-md border text-sm inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
                disabled={currentPage === totalPages || isLoadingVendors}
                className="min-w-[32px] h-8 px-2.5 rounded-md border border-[#d0d5dd] bg-white text-[#344054] text-sm inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#eef2ff] transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sidebar charts (~1/3) */}
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Activity Count */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e9ecef]">
            <h3 className="text-base font-semibold text-[#343A40] mb-3 sm:mb-4">Activity Count</h3>
            <div className="flex items-start gap-3">
              {isLoadingVendors || !activityLineCountForVendor?.length ? (
                <>
                  <div
                    className="flex-shrink-0 rounded-full bg-[#e9ecef] animate-pulse"
                    style={{ height: 120, width: 120 }}
                  />
                  <div className="flex-1 min-w-0 space-y-2 pr-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#e9ecef] animate-pulse flex-shrink-0" />
                        <span className="h-3.5 w-24 bg-[#e9ecef] rounded animate-pulse" />
                        <span className="h-3.5 w-8 bg-[#e9ecef] rounded animate-pulse flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="relative flex-shrink-0 overflow-visible z-10"
                    style={{ height: 120, width: 120 }}
                  >
                    <canvas ref={activityCountChartRef} />
                  </div>
                  <div className="flex-1 min-w-0 overflow-y-auto max-h-[140px] pr-1">
                    {activityLineCountForVendor.map((item, i) => (
                      <div
                        key={`${item.vendor}-${i}`}
                        className="flex items-center gap-1.5 py-0.5 mx-5 text-xs text-[#343A40]"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 ml-6"
                          style={{
                            backgroundColor: VENDOR_CHART_COLORS[i % VENDOR_CHART_COLORS.length],
                          }}
                        />
                        <span className="truncate">{item.vendor}</span>
                        <span className="text-[#6C757D] flex-shrink-0">({item.count})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Amount by Vendor */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e9ecef]">
            <h3 className="text-base font-semibold text-[#343A40] mb-3 sm:mb-4">
              Amount by Vendor
            </h3>
            <div className="flex items-start gap-3">
              {isLoadingVendors ? (
                <>
                  <div
                    className="flex-shrink-0 rounded-full bg-[#e9ecef] animate-pulse"
                    style={{ height: 120, width: 120 }}
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#e9ecef] animate-pulse flex-shrink-0" />
                        <span className="h-3.5 w-24 bg-[#e9ecef] rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="relative flex-shrink-0 overflow-visible z-10"
                    style={{ height: 120, width: 120 }}
                  >
                    <canvas ref={amountByVendorChartRef} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {amountByVendorData.map((item, i) => (
                      <div
                        key={item.label + String(item.value)}
                        className="flex items-center gap-1.5 py-0.5 text-xs text-[#343A40]"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: VENDOR_CHART_COLORS[i % VENDOR_CHART_COLORS.length],
                          }}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Departmental Spend Trend */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e9ecef]">
            <h3 className="text-base font-semibold text-[#343A40] mb-3 sm:mb-4">
              Departmental Spend Trend
            </h3>
            <div className="relative" style={{ height: 200, minHeight: 180 }}>
              {isLoadingVendors ? (
                <div className="flex items-end justify-between gap-2 h-full pt-8 pb-6">
                  {[40, 65, 45, 55].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#e9ecef] rounded-t animate-pulse min-w-[32px]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              ) : (
                <canvas ref={departmentSpendChartRef} />
              )}
            </div>
          </div>
        </div>
      </div>

      <AddEditVendorModal open={showAddVendorModal} onClose={() => setShowAddVendorModal(false)} />
      <AddEditVendorModal
        open={showEditVendorModal}
        vendor={editVendor}
        onClose={() => {
          setShowEditVendorModal(false);
          setEditVendor(null);
        }}
      />
    </div>
  );
}
