import Chart from "chart.js/auto";
import React, { useEffect, useRef } from "react";

const MonthlySpendChart = ({
  monthlySpendSeries = { labels: [], values: [] },
  isLoading,
  hasMonthlySpend,
  canMonthlyPrev,
  canMonthlyNext,
  onMonthlyPrev = () => {},
  onMonthlyNext = () => {},
  skeleton,
}) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (isLoading || !chartRef.current || monthlySpendSeries.values.length === 0) return;
    const ctx = chartRef.current.getContext("2d");
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(207, 255, 147, 0.8)");
    gradient.addColorStop(1, "rgba(207, 255, 147, 0)");

    const maxValue = Math.max(...monthlySpendSeries.values);
    const minValue = Math.min(...monthlySpendSeries.values);
    const range = maxValue - minValue;
    const stepSize = range > 0 ? Math.ceil(range / 4) : 1;

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: monthlySpendSeries.labels,
        datasets: [
          {
            label: "Monthly Spend",
            data: monthlySpendSeries.values,
            fill: true,
            backgroundColor: gradient,
            borderColor: "#AFFF4A",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#ffffff",
            pointHoverBorderColor: "#AFFF4A",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#ffffff",
            titleColor: "#000000",
            bodyColor: "#000000",
            borderColor: "#AFFF4A",
            borderWidth: 1,
            callbacks: {
              label: (tooltipItem) => `$${Number(tooltipItem.raw || 0).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#475467",
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
            grid: {
              display: true,
              color: "#EAECF0",
              borderDash: [5, 5],
            },
            ticks: {
              color: "#475467",
              font: { size: 12 },
              stepSize,
              maxTicksLimit: 5,
              callback: (value) => `$${value}`,
            },
            border: {
              color: "#FFFFFF",
              width: 0,
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
  }, [monthlySpendSeries, isLoading]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111827]">Monthly Spend Trend</h3>
        <div className="flex items-center gap-2 text-[#98A2B3]">
          <button
            className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onMonthlyPrev}
            disabled={!canMonthlyPrev}
          >
            &lt;
          </button>
          <button
            className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onMonthlyNext}
            disabled={!canMonthlyNext}
          >
            &gt;
          </button>
        </div>
      </div>
      <div className="mt-4 h-56">{hasMonthlySpend ? <canvas ref={chartRef} /> : skeleton}</div>
    </div>
  );
};

export default MonthlySpendChart;
