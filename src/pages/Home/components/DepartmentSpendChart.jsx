import Chart from "chart.js/auto";
import React, { useEffect, useRef } from "react";

const DepartmentSpendChart = ({
  departmentChartSeries = {
    labels: [],
    values: [],
    colors: [],
    stepSize: 1,
    chartLabel: "",
  },
  isLoading,
  hasDepartmentSpend,
  departmentYearLabel,
  canDepartmentPrev,
  canDepartmentNext,
  onDepartmentPrev = () => {},
  onDepartmentNext = () => {},
  skeleton,
}) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (isLoading || !chartRef.current) return;
    const ctx = chartRef.current.getContext("2d");
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: departmentChartSeries.labels,
        datasets: [
          {
            label: departmentChartSeries.chartLabel,
            data: departmentChartSeries.values,
            backgroundColor: departmentChartSeries.colors,
            hoverBackgroundColor: departmentChartSeries.colors,
            borderWidth: 0,
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
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
            grid: { display: false },
          },
          y: {
            ticks: {
              color: "#000000",
              font: { size: 12 },
              callback: (value) => `$${Number(value).toLocaleString()}`,
              stepSize: departmentChartSeries.stepSize,
              maxTicksLimit: 5,
            },
            grid: {
              display: true,
              color: "#EAECF0",
              borderDash: [5, 5],
            },
            beginAtZero: true,
            suggestedMin: 0,
            suggestedMax: departmentChartSeries.stepSize * 5,
            border: {
              color: "#FFFFFF",
              width: 1,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (tooltipItem) => `$${Number(tooltipItem.raw || 0).toLocaleString()}`,
            },
          },
          legend: { display: false },
        },
      },
    });
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [departmentChartSeries, isLoading]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111827]">Departmental Spend Trend</h3>
        <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
          <button
            className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onDepartmentPrev}
            disabled={!canDepartmentPrev}
          >
            &lt;
          </button>
          <span>{departmentYearLabel}</span>
          <button
            className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onDepartmentNext}
            disabled={!canDepartmentNext}
          >
            &gt;
          </button>
        </div>
      </div>
      <div className="mt-4 h-56">{hasDepartmentSpend ? <canvas ref={chartRef} /> : skeleton}</div>
    </div>
  );
};

export default DepartmentSpendChart;
