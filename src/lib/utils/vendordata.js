import Chart from "chart.js/auto";
import { groupByVendorName } from "./sharedUtils";
import { countByVendorName } from "./countByVendorName";
import { destroyChart, getExistingChart, getElementById } from "./sharedUtils";

/**
 * State manager for vendor data
 */
class VendorDataState {
  constructor() {
    this.subscriptionJSon = [];
    this.subscriptionJSonBackup = [];
    this.chartInstance = null;
  }
}

const state = new VendorDataState();

/**
 * Defines rounded doughnut chart plugin for Chart.js
 */
function defineRoundedDoughnut() {
  if (Chart.registry.plugins.get("RoundedDoughnut")) return;

  Chart.register({
    id: "RoundedDoughnut",
    afterDatasetDraw(chart, args) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(args.index);

      meta.data.forEach((arc) => {
        const p = arc.getProps(
          ["x", "y", "startAngle", "endAngle", "outerRadius", "innerRadius"],
          true
        );

        const r = (p.outerRadius + p.innerRadius) / 2;
        const t = (p.outerRadius - p.innerRadius) / 2;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = arc.options.backgroundColor;

        ctx.beginPath();
        ctx.arc(
          r * Math.sin(p.startAngle),
          r * Math.cos(p.startAngle),
          t,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
          r * Math.sin(p.endAngle),
          r * Math.cos(p.endAngle),
          t,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
      });
    },
  });
}

/**
 * Updates the doughnut chart with vendor data
 */
function updateChartPie(inputData) {
  defineRoundedDoughnut();

  const backgroundColors = [
    "#CCD6EB",
    "#E1FFBB",
    "#1D225D",
    "#BFF1FF",
    "#CFE1FF",
  ];

  const canvas = getElementById("doughnut-chart");
  if (!canvas) {
    setTimeout(() => updateChartPie(inputData), 50);
    return;
  }

  // Destroy existing chart
  destroyChart(state.chartInstance);
  const existingChart = getExistingChart(canvas);
  destroyChart(existingChart);

  state.chartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: inputData.map((x) => x.vendor),
      datasets: [
        {
          data: inputData.map((x) => x.count),
          backgroundColor: inputData.map(
            (_, i) => backgroundColors[i % backgroundColors.length]
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
      },
    },
    plugins: ["RoundedDoughnut"],
  });

  // Update legend
  const legend = getElementById("chart-legend");
  if (legend) {
    legend.innerHTML = `
      <ul>
        ${inputData
          .map(
            (x, i) =>
              `<li>
                <span style="background:${
                  backgroundColors[i % backgroundColors.length]
                }"></span>
                ${x.vendor}
              </li>`
          )
          .join("")}
      </ul>
    `;
  }
}

/**
 * Main data processing function
 */
export function handleDataProcessing(originalData) {
  const lines = Array.isArray(originalData?.lines)
    ? originalData.lines
    : Array.isArray(originalData)
    ? originalData
    : [];

  if (lines.length === 0) return;

  const transformedData = groupByVendorName(lines);
  state.subscriptionJSonBackup = transformedData;
  state.subscriptionJSon = JSON.parse(JSON.stringify(transformedData));

  const vendorCounts = countByVendorName(state.subscriptionJSon);
  updateChartPie(vendorCounts);

  return {
    subscriptionJSon: state.subscriptionJSon,
    vendorCounts,
  };
}
