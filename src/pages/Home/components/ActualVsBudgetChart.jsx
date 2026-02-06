import Chart from "chart.js/auto";
import React, { useEffect, useRef } from "react";

const ActualVsBudgetChart = ({
  actualVsBudgetSeries = { labels: [], budgetAmounts: [], actualAmounts: [], stepSize: 1 },
  isLoading,
  hasActualVsBudget,
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
        labels: actualVsBudgetSeries.labels,
        datasets: [
          {
            label: "Budget",
            data: actualVsBudgetSeries.budgetAmounts,
            backgroundColor: "#CCD6EB",
            borderRadius: 10,
          },
          {
            label: "Actual Spend",
            data: actualVsBudgetSeries.actualAmounts,
            backgroundColor: "#E1DBFE",
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: "easeOutQuart",
        },
        animations: {
          y: {
            from: 0,
          },
        },
        plugins: {
          tooltip: {
            position: "nearest",
            backgroundColor: "#ffffff",
            titleColor: "#000000",
            bodyColor: "#000000",
            borderColor: "#cccccc",
            borderWidth: 1,
            usePointStyle: true,
            callbacks: {
              labelPointStyle: () => ({
                pointStyle: "circle",
                rotation: 0,
              }),
              label: (tooltipItem) =>
                `${tooltipItem.dataset.label}: $${Number(tooltipItem.raw || 0).toLocaleString()}`,
            },
          },
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              color: "#000000",
              font: { size: 12 },
            },
          },
        },
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
            stacked: false,
          },
          y: {
            ticks: {
              color: "#000000",
              font: { size: 12 },
              callback: (value) => `$${Number(value).toLocaleString()}`,
              stepSize: actualVsBudgetSeries.stepSize,
              maxTicksLimit: 5,
            },
            grid: {
              display: true,
              color: "#EAECF0",
              borderDash: [5, 5],
              drawBorder: false,
              drawTicks: false,
            },
            beginAtZero: true,
            suggestedMax: actualVsBudgetSeries.stepSize * 5,
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
  }, [actualVsBudgetSeries, isLoading]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111827]">Actual vs Budget</h3>
        <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
          <button className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs">&lt;</button>
          <span>FY26</span>
          <button className="h-6 w-6 rounded-full border border-[#E4E7EC] text-xs">&gt;</button>
        </div>
      </div>
      <div className="mt-4 h-56">{hasActualVsBudget ? <canvas ref={chartRef} /> : skeleton}</div>
    </div>
  );
};

export default ActualVsBudgetChart;
