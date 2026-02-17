import Chart from "chart.js/auto";
import React, { useEffect, useRef, useState } from "react";

const VendorProfileChart = ({
  vendorProfileSeries = {
    labels: [],
    values: [],
    colors: [],
    maxValue: 0,
    stepSize: 1,
    hasValidData: false,
  },
  isLoading,
  selectedVendorProfileKey,
  selectedVendorProfileRows = [],
  onSelectVendorProfileKey = () => {},
  formatShortDate = () => "N/A",
  skeleton,
}) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [hoveredInfo, setHoveredInfo] = useState(false);
  const hasVendorProfile = !isLoading && vendorProfileSeries.hasValidData;

  useEffect(() => {
    if (isLoading || !chartRef.current || selectedVendorProfileKey) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }
    const ctx = chartRef.current.getContext("2d");
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    const suggestedMax = vendorProfileSeries.hasValidData
      ? Math.max(1, Math.ceil(vendorProfileSeries.maxValue * 1.1))
      : 1;
    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: vendorProfileSeries.labels,
        datasets: [
          {
            label: vendorProfileSeries.hasValidData ? "Vendor Profile Counts" : "",
            data: vendorProfileSeries.values,
            backgroundColor: vendorProfileSeries.colors,
            hoverBackgroundColor: vendorProfileSeries.colors,
            borderWidth: 0,
            borderRadius: 10,
            maxBarThickness: 200,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (tooltipItem) => Number(tooltipItem.raw || 0).toLocaleString(),
            },
          },
          legend: { display: false },
        },
        onHover: (event, elements) => {
          const target = event?.native?.target;
          if (target) {
            target.style.cursor = elements.length ? "pointer" : "default";
          }
        },
        onClick: (event, elements) => {
          if (!elements?.length) return;
          const index = elements[0].index;
          const label = vendorProfileSeries.labels[index];
          if (label) onSelectVendorProfileKey(label);
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#000000", font: { size: 12 } },
          },
          y: {
            ticks: {
              color: "#000000",
              font: { size: 12 },
              callback: (value) => Number(value).toLocaleString(),
              maxTicksLimit: 6,
              stepSize: vendorProfileSeries.stepSize,
            },
            grid: {
              display: true,
              color: "#EAECF0",
              borderDash: [5, 5],
              drawBorder: false,
              drawTicks: false,
            },
            beginAtZero: true,
            suggestedMin: 0,
            suggestedMax,
            border: { color: "#FFFFFF", width: 1 },
          },
        },
      },
    });
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [vendorProfileSeries, isLoading, selectedVendorProfileKey, onSelectVendorProfileKey]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111827]">Vendors by Profile</h3>
        <div className="relative">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#E4E7EC] bg-white text-[10px] font-semibold text-[#667085] shadow-sm cursor-pointer"
            onMouseEnter={() => setHoveredInfo(true)}
            onMouseLeave={() => setHoveredInfo(false)}
          >
            i
          </span>
          {hoveredInfo && (
            <div className="absolute right-0 top-8 z-20 w-72 rounded-xl border border-[#E4E7EC] bg-white p-3 shadow-lg animate-fadeIn">
              <p className="text-sm font-semibold text-[#0F172A]">Vendors by Profile</p>
              <p className="mt-1 text-xs leading-snug text-[#475467]">
                Vendors categorized upon initial setup based on categories
              </p>
            </div>
          )}
        </div>
      </div>
      {selectedVendorProfileKey ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#111827]">
              Subscriptions for {selectedVendorProfileKey}
            </h4>
            <button
              type="button"
              className="rounded-full bg-[#1D4ED8] px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[#1E40AF]"
              onClick={() => onSelectVendorProfileKey(null)}
            >
              Back to chart
            </button>
          </div>
          <div className="mt-3 max-h-56 overflow-y-auto overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F2F4F7] sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-[#667085]">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-[#667085]">Start Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-[#667085]">End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F6]">
                {selectedVendorProfileRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-center text-[#98A2B3]">
                      No subscriptions in this profile.
                    </td>
                  </tr>
                ) : (
                  selectedVendorProfileRows.map((row, idx) => (
                    <tr key={`${row.SubscriptionName || row.VendorName}-${idx}`}>
                      <td className="px-3 py-2 text-[#101828]">
                        {row.SubscriptionName || row.VendorName || "Unknown"}
                      </td>
                      <td className="px-3 py-2 text-[#475467]">
                        {formatShortDate(row.SubscriptionStartDate)}
                      </td>
                      <td className="px-3 py-2 text-[#475467]">
                        {formatShortDate(row.SubscriptionEndDate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 h-56">{hasVendorProfile ? <canvas ref={chartRef} /> : skeleton}</div>
          {hasVendorProfile && (
            <p className="mt-3 text-xs text-[#98A2B3]">Click a bar to view subscriptions.</p>
          )}
        </>
      )}
    </div>
  );
};

export default VendorProfileChart;
