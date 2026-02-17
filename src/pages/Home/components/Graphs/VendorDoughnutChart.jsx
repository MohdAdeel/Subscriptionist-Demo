import Chart from "chart.js/auto";
import React, { useEffect, useRef } from "react";
import { CircleSkeleton, TextSkeleton } from "../../../../components/SkeletonLoader";

const VENDOR_CHART_COLORS = [
  "#CCD6EB",
  "#E1FFBB",
  "#1D225D",
  "#BFF1FF",
  "#CFE1FF",
  "#D4F1F4",
  "#E1DBFE",
];

const VendorDoughnutChart = ({
  vendorBreakdown = [],
  isLoading,
  hoveredInfo,
  onHoverInfoChange = () => {},
  vendorTooltipText,
}) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const hasVendorData = !isLoading && vendorBreakdown.length > 0;

  useEffect(() => {
    if (isLoading || !chartRef.current) return;
    const labels = vendorBreakdown.map((item) => item.label);
    const values = vendorBreakdown.map((item) => item.value);
    const ctx = chartRef.current.getContext("2d");
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    chartInstanceRef.current = new Chart(ctx, {
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
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [vendorBreakdown, isLoading]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
      <style>{`
        .vendor-chart-legend-scroll {
          scrollbar-width: thin;
          scrollbar-color: #1D225D #EEF2F6;
        }
        .vendor-chart-legend-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .vendor-chart-legend-scroll::-webkit-scrollbar-track {
          background: #EEF2F6;
          border-radius: 3px;
        }
        .vendor-chart-legend-scroll::-webkit-scrollbar-thumb {
          background: #1D225D;
          border-radius: 3px;
        }
        .vendor-chart-legend-scroll::-webkit-scrollbar-thumb:hover {
          background: #15195a;
        }
      `}</style>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111827]">Vendors</h3>
        <div className="relative">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#E4E7EC] bg-white text-[10px] font-semibold text-[#667085] shadow-sm cursor-pointer"
            onMouseEnter={() => onHoverInfoChange("Vendors")}
            onMouseLeave={() => onHoverInfoChange(null)}
          >
            i
          </span>
          {hoveredInfo === "Vendors" && (
            <div className="absolute right-0 top-8 z-20 w-64 rounded-xl border border-[#E4E7EC] bg-white p-3 shadow-lg animate-fadeIn">
              <p className="text-sm font-semibold text-[#0F172A]">Vendors</p>
              <p className="mt-1 text-xs leading-snug text-[#475467]">{vendorTooltipText}</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4">
        {hasVendorData ? (
          <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
            <div className="h-48 w-48">
              <canvas ref={chartRef} />
            </div>
            <div className="vendor-chart-legend-scroll max-h-50 overflow-y-auto pr-2 space-y-2">
              {vendorBreakdown.map((vendor, index) => (
                <div key={vendor.label} className="flex items-center gap-6 text-xs text-[#344054]">
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
  );
};

export default VendorDoughnutChart;
