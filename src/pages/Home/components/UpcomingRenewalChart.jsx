import Chart from "chart.js/auto";
import React, { useEffect, useRef } from "react";

const UPCOMING_RENEWAL_COLORS = ["#DCEBFF", "#C8DDFF", "#B8D1FF", "#9CC2FF", "#8CB7FF", "#7EAEFF"];

const UpcomingRenewalChart = ({
  upcomingRenewalSeries = { labels: [], values: [], monthKeys: [], maxValue: 0, stepSize: 1 },
  isLoading,
  selectedUpcomingRenewalKey,
  selectedUpcomingRenewalLabel,
  selectedUpcomingRenewalRows = [],
  onSelectUpcomingRenewalKey = () => {},
  onUpcomingRenewalPrev = () => {},
  onUpcomingRenewalNext = () => {},
  upcomingRenewalPeriodLabel,
  formatShortDate = () => "N/A",
  skeleton,
}) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const hasUpcomingRenewal = !isLoading;

  useEffect(() => {
    if (isLoading || !chartRef.current || selectedUpcomingRenewalKey) {
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
    const barColors = upcomingRenewalSeries.values.map(
      (_, idx) => UPCOMING_RENEWAL_COLORS[idx % UPCOMING_RENEWAL_COLORS.length]
    );
    const suggestedMax = Math.max(1, Math.ceil(upcomingRenewalSeries.maxValue * 1.1));
    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: upcomingRenewalSeries.labels,
        datasets: [
          {
            data: upcomingRenewalSeries.values,
            backgroundColor: barColors,
            hoverBackgroundColor: barColors,
            borderWidth: 0,
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
          x: {
            grid: { display: false },
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
          },
          y: {
            ticks: {
              color: "#000000",
              font: { size: 12 },
              callback: (value) => Number(value).toLocaleString(),
              maxTicksLimit: 5,
              stepSize: upcomingRenewalSeries.stepSize,
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
          },
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
          const key = upcomingRenewalSeries.monthKeys[index];
          if (key) {
            onSelectUpcomingRenewalKey(key);
          }
        },
      },
    });
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [upcomingRenewalSeries, isLoading, selectedUpcomingRenewalKey, onSelectUpcomingRenewalKey]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111827]">Upcoming Renewal Per Month</h3>
        <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
          <button
            className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs"
            onClick={onUpcomingRenewalPrev}
          >
            &lt;
          </button>
          <span>{upcomingRenewalPeriodLabel}</span>
          <button
            className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs"
            onClick={onUpcomingRenewalNext}
          >
            &gt;
          </button>
        </div>
      </div>
      {selectedUpcomingRenewalKey ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#111827]">
              Renewals for {selectedUpcomingRenewalLabel}
            </h4>
            <button
              type="button"
              className="rounded-full bg-[#1D4ED8] px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[#1E40AF]"
              onClick={() => onSelectUpcomingRenewalKey(null)}
            >
              Back to chart
            </button>
          </div>
          <div className="mt-3 max-h-56 overflow-y-auto overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F2F4F7] sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-[#667085]">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-[#667085]">Due Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-[#667085]">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F6]">
                {selectedUpcomingRenewalRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-center text-[#98A2B3]">
                      No renewals in this month.
                    </td>
                  </tr>
                ) : (
                  selectedUpcomingRenewalRows.map((row, idx) => (
                    <tr key={`${row.SubscriptionName || row.VendorName}-${idx}`}>
                      <td className="px-3 py-2 text-[#101828]">
                        {row.SubscriptionName || row.VendorName || "Unknown"}
                      </td>
                      <td className="px-3 py-2 text-[#475467]">
                        {formatShortDate(row.SubscriptionStartDate)}
                      </td>
                      <td className="px-3 py-2 text-[#475467]">
                        {row.SubscriptionFrequency || "N/A"}
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
          <div className="mt-4 h-56">
            {hasUpcomingRenewal ? <canvas ref={chartRef} /> : skeleton}
          </div>
          {hasUpcomingRenewal && (
            <p className="mt-3 text-xs text-[#98A2B3]">Click a bar to view renewals.</p>
          )}
        </>
      )}
    </div>
  );
};

export default UpcomingRenewalChart;
