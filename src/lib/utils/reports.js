// document.getElementById('export-standard').addEventListener('click', function () {
//   const modal = new bootstrap.Modal(document.getElementById('exportModal'));
//   modal.show();
// });
document.getElementById("downloadPDFBtn").addEventListener("click", function () {
  // Get the modal instance
  $("#exportModal").modal("hide");
  // Now call your export function
  exportToPDF();
});

document.getElementById("downloadExcelBtn").addEventListener("click", function () {
  $("#exportModal").modal("hide");

  exportToExcel(); // <-- Your Excel export logic
});

document.getElementById("downloadPDFFinancial").addEventListener("click", async function () {
  $("#exportModalFinancial").modal("hide");
  await exportFinancialToPDF();
});

document.getElementById("downloadExcelFinancial").addEventListener("click", function () {
  $("#exportModalFinancial").modal("hide");
  exportFinancialToExcel();
});

document.getElementById("downloadPDFRenewal").addEventListener("click", async function () {
  $("#exportModalRenewal").modal("hide");
  await exportRenewalToPDF();
});

document.getElementById("downloadExcelRenewal").addEventListener("click", function () {
  $("#exportModalRenewal").modal("hide");
  exportRenewalToExcel();
});

async function exportToPDF() {
  document.body.style.overflow = "hidden";
  openPopup("popup_loading");

  const exportContainer = document.getElementById("pdfExportContainer");
  exportContainer.innerHTML = "";

  const today = new Date();
  let all = deepCopyArray(subscriptionArray);
  all = all.filter(
    (subscription, index, self) =>
      index ===
      self.findIndex(
        (s) =>
          s.SubscriptionName === subscription.SubscriptionName &&
          s.SubscriptionContractAmount.Value === subscription.SubscriptionContractAmount.Value
      )
  );
  const active = all.filter((s) => new Date(s.SubscriptionEndDate) > today);
  const expired = all.filter((s) => new Date(s.SubscriptionEndDate) <= today);

  const cardBlock = document.querySelector(".Standard-Cards");
  if (cardBlock) {
    const cardClone = cardBlock.cloneNode(true);
    exportContainer.appendChild(cardClone);
  }

  const chartCanvas = document.getElementById("line-chart-gradient");
  const chartImg = document.createElement("img");
  chartImg.src = chartCanvas.toDataURL();
  chartImg.style.width = "100%";
  chartImg.style.height = "25vh";
  exportContainer.appendChild(chartImg);

  function buildSection(title, data) {
    let html = `<h2 style="margin-top: 20px;">${title}</h2>`;
    html += `<table border="1" style="width:100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th>Subscription Name</th>
          <th>Vendor Name</th>
          <th>Amount</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Frequency</th>
          <th>Status</th>
        </tr>
      </thead><tbody>`;
    data.forEach((s) => {
      html += `<tr>
        <td>${s.SubscriptionName}</td>
        <td>${s.VendorName || ""}</td>
        <td style="color: #7259F6;">$${s.SubscriptionContractAmount?.Value?.toFixed(2) || "0.00"}</td>
        <td style="color: #00C2FA;">${new Date(s.SubscriptionStartDate).toLocaleDateString()}</td>
        <td style="color: #00C2FA;">${new Date(s.SubscriptionEndDate).toLocaleDateString()}</td>
        <td>${s.SubscriptionFrequency}</td>
        <td>${new Date(s.SubscriptionEndDate) > today ? "Active" : "Inactive"}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    return html;
  }

  exportContainer.innerHTML += buildSection("All Subscriptions", all);
  exportContainer.innerHTML += buildSection("Active Subscriptions", active);
  exportContainer.innerHTML += buildSection("Expired Subscriptions", expired);

  exportContainer.style.display = "block";

  await html2pdf()
    .from(exportContainer)
    .set({
      margin: 0.5,
      filename: "standard_report.pdf",
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    })
    .save();

  exportContainer.style.display = "none";
  exportContainer.innerHTML = "";
  closePopup("popup_loading");
  document.body.style.overflow = "";
}

async function exportToExcel() {
  openPopup("popup_loading");

  const today = new Date();
  let all = deepCopyArray(subscriptionArray);

  // Remove duplicates
  all = all.filter(
    (subscription, index, self) =>
      index ===
      self.findIndex(
        (s) =>
          s.SubscriptionName === subscription.SubscriptionName &&
          s.SubscriptionContractAmount.Value === subscription.SubscriptionContractAmount.Value
      )
  );

  const active = all.filter((s) => new Date(s.SubscriptionEndDate) > today);
  const expired = all.filter((s) => new Date(s.SubscriptionEndDate) <= today);

  const toSheetData = (arr) =>
    arr.map((s) => ({
      "Activity ID": s.ActivityGuid || "",
      "Subscription Name": s.SubscriptionName || "",
      "Vendor Name": s.VendorName || "",
      "Amount ($)": s.SubscriptionContractAmount?.Value?.toFixed(2) || "0.00",
      "Start Date": s.SubscriptionStartDate
        ? new Date(s.SubscriptionStartDate).toLocaleDateString()
        : "",
      "End Date": s.SubscriptionEndDate ? new Date(s.SubscriptionEndDate).toLocaleDateString() : "",
      Frequency: s.SubscriptionFrequency || "",
      Status: new Date(s.SubscriptionEndDate) > today ? "Active" : "Inactive",
    }));

  const workbook = new ExcelJS.Workbook();
  const summarySheet = workbook.addWorksheet("Overview");

  summarySheet.properties.defaultGridLines = false;
  for (let row = 1; row <= 40; row++) {
    for (let col = 1; col <= 20; col++) {
      summarySheet.getCell(row, col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
    }
  }

  summarySheet.columns = new Array(20).fill({ width: 20 });

  // Cards
  const cardIds = ["ActiveCostid", "ActiveSubsid", "renewalcost", "completed"];
  let currentCol = 0;

  for (let id of cardIds) {
    const cardElement = document.getElementById(id)?.closest(".col");
    if (cardElement) {
      await html2canvas(cardElement).then((canvas) => {
        const imgBase64 = canvas.toDataURL("image/png").split(",")[1];
        const imageId = workbook.addImage({
          base64: imgBase64,
          extension: "png",
        });

        summarySheet.addImage(imageId, {
          tl: { col: currentCol, row: 2 },
          ext: { width: 260, height: 160 },
        });

        currentCol += 2;
      });
    } else {
      summarySheet.addRow([`${id} card not found`]);
    }
  }

  // Line Chart
  // Line Chart
  const chartCanvas = document.getElementById("line-chart-gradient");
  if (chartCanvas) {
    const chartImgBase64 = chartCanvas.toDataURL("image/png").split(",")[1];
    const chartImgId = workbook.addImage({
      base64: chartImgBase64,
      extension: "png",
    });

    // Merge to avoid cutoff, but keep alignment to left
    summarySheet.mergeCells("A12:G12");
    summarySheet.getCell("A12").value = "Subscription Tenure";
    summarySheet.getCell("A12").font = { bold: true, size: 14 };
    summarySheet.getCell("A12").alignment = { vertical: "middle", horizontal: "left" };

    // Optional: widen the columns so text doesn't wrap
    ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
      summarySheet.getColumn(col).width = 25;
    });

    // Chart just below the heading
    summarySheet.addImage(chartImgId, {
      tl: { col: 0, row: 14 },
      ext: { width: 1100, height: 450 },
    });
  } else {
    summarySheet.addRow(["Line chart not found"]);
  }

  // Reusable table sheet builder with TableStyleMedium2
  function addStyledTableSheet(workbook, title, dataArray, tableName) {
    const sheet = workbook.addWorksheet(title);
    const rows = toSheetData(dataArray);

    if (rows.length === 0) {
      sheet.addRow(["No data available"]);
      return;
    }

    const headers = Object.keys(rows[0]);
    const columns = headers.map((h) => ({ name: h }));
    const dataRows = rows.map((r) => Object.values(r));

    sheet.addTable({
      name: tableName,
      ref: "A1",
      headerRow: true,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns,
      rows: dataRows,
    });

    // Set column widths
    sheet.columns = headers.map((header, i) => {
      const maxLength = Math.max(
        header.length,
        ...dataRows.map((row) => (row[i] ? row[i].toString().length : 0))
      );
      return { width: maxLength + 5 }; // Add padding for better readability
    });

    // Apply coloring to certain columns
    const amountColIndex = headers.findIndex((h) => h === "Amount ($)");
    const startDateColIndex = headers.findIndex((h) => h === "Start Date");
    const endDateColIndex = headers.findIndex((h) => h === "End Date");

    dataRows.forEach((row, rowIndex) => {
      const excelRow = sheet.getRow(rowIndex + 2); // +1 for header, +1 for 1-based index

      if (amountColIndex !== -1)
        excelRow.getCell(amountColIndex + 1).font = { color: { argb: "FF7259F6" } };

      if (startDateColIndex !== -1)
        excelRow.getCell(startDateColIndex + 1).font = { color: { argb: "FF00C2FA" } };

      if (endDateColIndex !== -1)
        excelRow.getCell(endDateColIndex + 1).font = { color: { argb: "FF00C2FA" } };
    });
  }

  // Add data sheets with table styling
  addStyledTableSheet(workbook, "All Subscriptions", all, "AllSubscriptionsTable");
  addStyledTableSheet(workbook, "Active Subscriptions", active, "ActiveSubscriptionsTable");
  addStyledTableSheet(workbook, "Expired Subscriptions", expired, "ExpiredSubscriptionsTable");

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "standard_report.xlsx";
  link.click();

  closePopup("popup_loading");
}

async function exportRenewalToPDF() {
  document.body.style.overflow = "hidden";
  openPopup("popup_loading");

  const exportContainer = document.getElementById("pdfRenewalExportContainer");
  exportContainer.innerHTML = "";
  exportContainer.style.display = "block";

  const section = document.createElement("div");
  section.style.padding = "10px";
  section.style.fontFamily = "Arial, sans-serif";
  section.style.fontSize = "12px";

  // 1. Add Renewal Calendar section (clone full container)
  const calendarBlock = document.getElementById("renewal-calendar-report");
  if (calendarBlock) {
    const calendarClone = calendarBlock.cloneNode(true);
    calendarClone.style.marginBottom = "30px";
    section.appendChild(calendarClone);
  }

  // 3. Add Renewal Cost & Usage Evaluation chart
  const usageCanvas = document.getElementById("renewal-cost-usage-chart");
  if (usageCanvas) {
    const title = document.createElement("h3");
    title.innerText = "Renewal Cost & Usage Evaluation";
    title.style.marginTop = "30px";
    title.style.marginBottom = "10px";
    section.appendChild(title);

    const img = document.createElement("img");
    img.src = usageCanvas.toDataURL();
    img.style.width = "100%";
    img.style.height = "25vh";
    img.style.objectFit = "contain";
    img.style.display = "block";
    section.appendChild(img);
  }

  exportContainer.appendChild(section);

  const today = new Date();

  function buildSection(title, data, filterFn) {
    let filtered = data.filter(filterFn);

    filtered = filtered.filter((subscription, index, self) => {
      return (
        index ===
        self.findIndex(
          (s) =>
            s.SubscriptionName === subscription.SubscriptionName &&
            s.SubscriptionContractAmount.Value === subscription.SubscriptionContractAmount.Value
        )
      );
    });

    let html = `<h2 style="margin-top: 20px;">${title}</h2>`;
    html += `<table border="1" style="width:100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th>Subscription Name</th>
          <th>Vendor Name</th>
          <th>Amount</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Frequency</th>
          <th>Status</th>
        </tr>
      </thead><tbody>`;

    filtered.forEach((sub) => {
      html += `<tr>
        <td>${sub.SubscriptionName}</td>
        <td>${sub.VendorName || ""}</td>
        <td style="color: #7259F6;">$${sub.SubscriptionContractAmount?.Value?.toFixed(2) || "0.00"}</td>
        <td style="color: #00C2FA;">${new Date(sub.SubscriptionStartDate).toLocaleDateString()}</td>
        <td style="color: #00C2FA;">${new Date(sub.SubscriptionEndDate).toLocaleDateString()}</td>
        <td>${sub.SubscriptionFrequency || ""}</td>
        <td>${new Date(sub.SubscriptionEndDate) > today ? "Active" : "Inactive"}</td>
      </tr>`;
    });

    html += `</tbody></table>`;
    return html;
  }

  // Section 1: Subscription Nearing Renewal (future start and end dates)
  exportContainer.innerHTML += buildSection(
    "Subscription Nearing Renewal",
    nearingRenewal,
    (s) => new Date(s.SubscriptionEndDate) > today && new Date(s.SubscriptionStartDate) > today
  );

  // Section 2: Expired Subscriptions (end date <= today)
  exportContainer.innerHTML += buildSection(
    "Expired Subscriptions",
    nearingRenewal,
    (s) => new Date(s.SubscriptionEndDate) <= today
  );

  await html2pdf()
    .from(exportContainer)
    .set({
      margin: 0.5,
      filename: "renewal_report.pdf",
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    })
    .save();

  exportContainer.innerHTML = "";
  exportContainer.style.display = "none";
  document.body.style.overflow = "";
  closePopup("popup_loading");
}

async function exportRenewalToExcel() {
  openPopup("popup_loading");
  const today = new Date();

  const workbook = new ExcelJS.Workbook();

  const toSheetData = (arr) =>
    arr.map((s) => ({
      "Activity ID": s.ActivityGuid || "",
      "Subscription Name": s.SubscriptionName || "",
      "Vendor Name": s.VendorName || "",
      "Amount ($)": s.SubscriptionContractAmount?.Value?.toFixed(2) || "0.00",
      "Start Date": s.SubscriptionStartDate
        ? new Date(s.SubscriptionStartDate).toLocaleDateString()
        : "",
      "End Date": s.SubscriptionEndDate ? new Date(s.SubscriptionEndDate).toLocaleDateString() : "",
      Frequency: s.SubscriptionFrequency || "",
      Status: new Date(s.SubscriptionEndDate) > today ? "Active" : "Inactive",
    }));

  // --- Sheet 1: Summary with Calendar and Chart ---
  const summarySheet = workbook.addWorksheet("Overview", {
    properties: { tabColor: { argb: "FFFFFFFF" } }, // white tab for visual
  });
  summarySheet.columns = Array.from({ length: 16 }, () => ({ width: 20 }));

  // Set white fill to all cells to hide gridlines visually
  for (let row = 1; row <= 100; row++) {
    for (let col = 1; col <= 16; col++) {
      summarySheet.getCell(row, col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
    }
  }

  function autoFitColumns(sheet, dataRows) {
    sheet.columns.forEach((column, colIdx) => {
      let maxLength = 10; // minimum width
      for (let i = 0; i < dataRows.length; i++) {
        const cellValue = dataRows[i][colIdx];
        if (cellValue) {
          const length = cellValue.toString().length;
          if (length > maxLength) maxLength = length;
        }
      }
      column.width = maxLength + 5; // Add some padding
    });
  }

  let currentRow = 1;

  // --- A. Calendar Image ---
  const calendarBlock = document.getElementById("renewal-calendar-report");
  if (calendarBlock) {
    const calendarClone = calendarBlock.cloneNode(true);
    calendarClone.style.position = "absolute";
    calendarClone.style.top = "-9999px";
    calendarClone.style.left = "-9999px";
    document.body.appendChild(calendarClone);

    const calendarCanvas = await html2canvas(calendarClone, { scale: 2 });
    document.body.removeChild(calendarClone);

    const calendarImgBase64 = calendarCanvas.toDataURL("image/png").split(",")[1];
    const calendarImgId = workbook.addImage({
      base64: calendarImgBase64,
      extension: "png",
    });

    summarySheet.addImage(calendarImgId, {
      tl: { col: 0, row: currentRow },
      ext: { width: 1100, height: 400 },
    });

    currentRow += 24; // adjust spacing based on height
  }

  // --- B. Renewal Cost & Usage Chart ---
  const chartCanvas = document.getElementById("renewal-cost-usage-chart");
  if (chartCanvas) {
    summarySheet.getCell(`A${currentRow}`).value = "Renewal Cost & Usage Evaluation";
    summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow += 1;

    const chartBase64 = chartCanvas.toDataURL("image/png").split(",")[1];
    const chartImgId = workbook.addImage({
      base64: chartBase64,
      extension: "png",
    });

    summarySheet.addImage(chartImgId, {
      tl: { col: 0, row: currentRow },
      ext: { width: 1100, height: 350 },
    });

    currentRow += 16; // adjust spacing based on image height
  }

  // --- Sheet 2: Subscription Nearing Renewal ---
  const nearingSheet = workbook.addWorksheet("Nearing Renewal");
  const nearing = nearingRenewal
    .filter(
      (s) => new Date(s.SubscriptionEndDate) > today && new Date(s.SubscriptionStartDate) > today
    )
    .filter(
      (s, index, self) =>
        index ===
        self.findIndex(
          (sub) =>
            sub.SubscriptionName === s.SubscriptionName &&
            sub.SubscriptionContractAmount?.Value === s.SubscriptionContractAmount?.Value
        )
    );

  const nearingData = toSheetData(nearing);
  if (nearingData.length > 0) {
    const columns = Object.keys(nearingData[0]).map((key) => ({ name: key }));
    const rows = nearingData.map((obj) => Object.values(obj));

    nearingSheet.addTable({
      name: "NearingRenewalTable",
      ref: "A1",
      headerRow: true,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns,
      rows,
    });
    autoFitColumns(nearingSheet, rows);

    const amountColIndex = columns.findIndex((c) => c.name === "Amount ($)");
    const startDateColIndex = columns.findIndex((c) => c.name === "Start Date");
    const endDateColIndex = columns.findIndex((c) => c.name === "End Date");

    rows.forEach((row, rowIndex) => {
      const excelRow = nearingSheet.getRow(rowIndex + 2); // +2 to skip header (A1 is header)

      if (amountColIndex !== -1) {
        excelRow.getCell(amountColIndex + 1).font = { color: { argb: "FF7259F6" } };
      }
      if (startDateColIndex !== -1) {
        excelRow.getCell(startDateColIndex + 1).font = { color: { argb: "FF00C2FA" } };
      }
      if (endDateColIndex !== -1) {
        excelRow.getCell(endDateColIndex + 1).font = { color: { argb: "FF00C2FA" } };
      }
    });
  } else {
    nearingSheet.addRow(["No data available"]);
  }

  // --- Sheet 3: Expired Subscriptions ---
  const expiredSheet = workbook.addWorksheet("Expired Subscriptions");
  const expired = nearingRenewal
    .filter((s) => new Date(s.SubscriptionEndDate) <= today)
    .filter(
      (s, index, self) =>
        index ===
        self.findIndex(
          (sub) =>
            sub.SubscriptionName === s.SubscriptionName &&
            sub.SubscriptionContractAmount?.Value === s.SubscriptionContractAmount?.Value
        )
    );

  const expiredData = toSheetData(expired);
  if (expiredData.length > 0) {
    const columns = Object.keys(expiredData[0]).map((key) => ({ name: key }));
    const rows = expiredData.map((obj) => Object.values(obj));

    expiredSheet.addTable({
      name: "ExpiredSubscriptionsTable",
      ref: "A1",
      headerRow: true,
      style: {
        theme: "TableStyleMedium2", // You can change to any built-in theme
        showRowStripes: true,
      },
      columns,
      rows,
    });
    autoFitColumns(expiredSheet, rows);
    const amountColIndex = columns.findIndex((c) => c.name === "Amount ($)");
    const startDateColIndex = columns.findIndex((c) => c.name === "Start Date");
    const endDateColIndex = columns.findIndex((c) => c.name === "End Date");

    rows.forEach((row, rowIndex) => {
      const excelRow = expiredSheet.getRow(rowIndex + 2); // +2 to skip header

      if (amountColIndex !== -1) {
        excelRow.getCell(amountColIndex + 1).font = { color: { argb: "FF7259F6" } };
      }
      if (startDateColIndex !== -1) {
        excelRow.getCell(startDateColIndex + 1).font = { color: { argb: "FF00C2FA" } };
      }
      if (endDateColIndex !== -1) {
        excelRow.getCell(endDateColIndex + 1).font = { color: { argb: "FF00C2FA" } };
      }
    });
  } else {
    expiredSheet.addRow(["No data available"]);
  }

  // --- Final Download ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "renewal_report.xlsx";
  link.click();

  closePopup("popup_loading");
}

async function exportFinancialToPDF() {
  document.body.style.overflow = "hidden";
  openPopup("popup_loading");

  const exportContainer = document.getElementById("pdfFiancialExportContainer");
  exportContainer.innerHTML = "";
  exportContainer.style.display = "block";

  const section = document.createElement("div");
  section.style.padding = "10px";
  section.style.fontFamily = "Arial, sans-serif";
  section.style.fontSize = "12px";

  // 1. Add Charts (including custom legend charts)
  const chartIds = [
    "chart5",
    "line-chart",
    "gradient-chart",
    "most-expensive-chart",
    "doughnut-chart",
    "usage-analysis-chart",
  ];

  for (let id of chartIds) {
    const canvas = document.getElementById(id);
    if (canvas) {
      const titleElement = canvas
        .closest(".page-dashboard__listQuickStart-item")
        ?.querySelector("p");
      const titleText = titleElement?.innerText || "Chart";

      const chartBlock = document.createElement("div");
      chartBlock.style.margin = "20px 0";

      const title = document.createElement("h3");
      title.innerText = titleText;
      title.style.marginBottom = "8px";
      chartBlock.appendChild(title);

      // Special layout for doughnut charts
      if (id === "doughnut-chart" || id === "usage-analysis-chart") {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.justifyContent = "flex-start";
        wrapper.style.gap = "20px";
        wrapper.style.flexWrap = "wrap";

        // Chart image
        const img = document.createElement("img");
        img.src = canvas.toDataURL();
        img.style.width = "220px"; // smaller fixed width
        img.style.height = "175px"; // fixed height
        img.style.objectFit = "contain";
        img.style.display = "block";

        // Legend
        let legendElement = null;
        if (id === "doughnut-chart") {
          legendElement = document.getElementById("chart-legend");
        } else if (id === "usage-analysis-chart") {
          legendElement = document.getElementById("chart-legend-analysis");
        }

        const legendClone = legendElement ? legendElement.cloneNode(true) : null;
        if (legendClone) {
          legendClone.style.flex = "1";
          legendClone.style.fontSize = "12px";
        }

        wrapper.appendChild(img);
        if (legendClone) wrapper.appendChild(legendClone);

        chartBlock.appendChild(wrapper);
      } else {
        // Default chart layout
        const img = document.createElement("img");
        img.src = canvas.toDataURL();
        img.style.width = "100%";
        img.style.maxWidth = "550px";
        img.style.height = "25vh";
        img.style.display = "block";
        img.style.margin = "0 auto";
        img.style.objectFit = "contain";

        chartBlock.appendChild(img);
      }

      section.appendChild(chartBlock);
    }
  }

  // 2. Append chart section
  exportContainer.appendChild(section);

  // 4. Append tables
  exportContainer.innerHTML += buildSectionDepartment(
    "Spend By Department",
    dataOfDepartmentForShowingInPagination
  );
  exportContainer.innerHTML += buildSectionCategory(
    "Spend By Category",
    dataOfCategoryForPagination
  );

  // 5. Generate PDF
  await html2pdf()
    .from(exportContainer)
    .set({
      margin: 0.5,
      filename: "financial_report.pdf",
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    })
    .save();

  exportContainer.innerHTML = "";
  exportContainer.style.display = "none";
  document.body.style.overflow = "";
  closePopup("popup_loading");
}

function buildSectionDepartment(title, data) {
  let html = `<h2 style="margin-top: 20px;">${title}</h2>`;
  html += `<table border="1" style="width:100%; border-collapse: collapse; font-size: 12px;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th>Team</th>
        <th>Actual Spend</th>
        <th>Budget</th>
      </tr>
    </thead><tbody>`;

  data.forEach((group) => {
    const s = Array.isArray(group) && group.length > 0 ? group[0] : {};
    const team = s?.DepartmentNames?.Name || "";
    const actual = s?.SubscriptionContractAmount?.Value?.toFixed(2) || "0.00";
    const budget = s?.DepartmentNames?.Budget
      ? `$${Number(s.DepartmentNames.Budget).toFixed(2)}`
      : "$0.00";

    html += `<tr>
      <td>${team}</td>
      <td style="color: #00C2FA;">$${actual}</td>
      <td style="color: #7259F6;">${budget}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

function buildSectionCategory(title, data) {
  let html = `<h2 style="margin-top: 20px;">${title}</h2>`;
  html += `<table border="1" style="width:100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th>Category</th>
          <th>Actual Spend</th>
          <th>Number of Subscriptions</th>
        </tr>
      </thead><tbody>`;
  data.forEach((s) => {
    html += `<tr>
        <td>${s.category || ""}</td>
        <td style="color: #7259F6;">$${s.accumulatedAmount?.toFixed(2) || "0.00"}</td>
        <td>${s.count || 0}</td>
      </tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

async function exportFinancialToExcel() {
  openPopup("popup_loading");

  const workbook = new ExcelJS.Workbook();
  const chartSheet = workbook.addWorksheet("Overview");

  for (let row = 1; row <= 150; row++) {
    for (let col = 1; col <= 35; col++) {
      chartSheet.getCell(row, col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
    }
  }

  chartSheet.columns = Array(16).fill({ width: 10 });

  const chartRows = [
    [
      // Row group 1
      {
        col: 1,
        chartId: "chart5",
        legendId: null,
        title: "Spend by Department",
        width: 950,
        height: 320,
      },
      {
        col: 15,
        chartId: "doughnut-chart",
        legendId: "chart-legend",
        title: "Spend by Vendor",
        width: 320,
        height: 320,
      },
    ],
    [
      // Row group 2
      {
        col: 1,
        chartId: "line-chart",
        legendId: null,
        title: "Spend by Subscription type",
        width: 1400,
        height: 360,
      },
    ],
    [
      // Row group 3
      {
        col: 1,
        chartId: "gradient-chart",
        legendId: null,
        title: "Budget vs Actual Report",
        width: 1400,
        height: 360,
      },
    ],
    [
      // Row group 4
      {
        col: 1,
        chartId: "most-expensive-chart",
        legendId: null,
        title: "Most Expensive Subscriptions",
        width: 950,
        height: 320,
      },
      {
        col: 15,
        chartId: "usage-analysis-chart",
        legendId: "chart-legend-analysis",
        title: "Usage Analysis",
        width: 320,
        height: 320,
      },
    ],
  ];

  async function domToImageBase64(element) {
    const canvas = await html2canvas(element, { scale: 3, useCORS: true });
    return canvas.toDataURL("image/png").split(",")[1];
  }

  function autoFitColumns(sheet, dataRows) {
    sheet.columns.forEach((column, colIdx) => {
      let maxLength = 10;
      for (let i = 0; i < dataRows.length; i++) {
        const cellValue = dataRows[i][colIdx];
        if (cellValue) {
          const length = cellValue.toString().length;
          if (length > maxLength) maxLength = length;
        }
      }
      column.width = maxLength + 5;
    });
  }

  // Render charts dynamically with vertical spacing
  let currentRow = 1;
  const rowGap = 4;

  for (const chartGroup of chartRows) {
    let maxHeight = Math.max(...chartGroup.map((c) => c.height));
    //  let heightInRows = Math.ceil(maxHeight / 20); // Adjust if needed

    for (const chart of chartGroup) {
      const canvas = document.getElementById(chart.chartId);
      if (!canvas) continue;

      chartSheet.getCell(currentRow, chart.col).value = chart.title;
      chartSheet.getCell(currentRow, chart.col).font = { bold: true, size: 14 };

      const chartImage = canvas.toDataURL("image/png").split(",")[1];
      const imageId = workbook.addImage({ base64: chartImage, extension: "png" });

      chartSheet.addImage(imageId, {
        tl: { col: chart.col, row: currentRow + 1 },
        ext: { width: chart.width, height: chart.height },
      });

      if (chart.legendId) {
        const legendElement = document.getElementById(chart.legendId);
        if (legendElement) {
          const legendImage = await domToImageBase64(legendElement);
          const legendIdImg = workbook.addImage({ base64: legendImage, extension: "png" });

          let legendHeight = 300; // default
          if (chart.legendId === "chart-legend-analysis") {
            legendHeight = 150;
          }

          chartSheet.addImage(legendIdImg, {
            tl: { col: chart.col + 5, row: currentRow + 4 },
            ext: { width: 180, height: legendHeight },
          });
        }
      }
    }

    currentRow += Math.ceil(maxHeight / 15) + 1;
  }

  // --- Categories Sheet ---
  const catSheet = workbook.addWorksheet("Categories");
  const catData = dataOfCategoryForPagination.map((item) => ({
    category: item.category || "",
    spend: item.accumulatedAmount?.toFixed(2) || "0.00",
    count: item.count || 0,
  }));

  if (catData.length > 0) {
    const catColumns = [
      { name: "Category" },
      { name: "Actual Spend" },
      { name: "No. of Subscriptions" },
    ];
    const catRows = catData.map((c) => [c.category, c.spend, c.count]);

    catSheet.addTable({
      name: "CategorySpendTable",
      ref: "A1",
      headerRow: true,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: catColumns,
      rows: catRows,
    });

    catRows.forEach((_, i) => {
      const row = catSheet.getRow(i + 2);
      row.getCell(2).font = { color: { argb: "FF7259F6" } };
    });

    autoFitColumns(catSheet, catRows);
  } else {
    catSheet.addRow(["No category data"]);
  }

  // --- Departments Sheet ---
  const deptSheet = workbook.addWorksheet("Departments");
  const deptData = dataOfDepartmentForShowingInPagination.map((group) => {
    const item = Array.isArray(group) ? group[0] : group;
    return {
      team: item?.DepartmentNames?.Name || "",
      spend: item?.SubscriptionContractAmount?.Value?.toFixed(2) || "0.00",
      budget: item?.DepartmentNames?.Budget
        ? `$${Number(item.DepartmentNames.Budget).toFixed(2)}`
        : "$0.00",
    };
  });

  if (deptData.length > 0) {
    const deptColumns = [{ name: "Team" }, { name: "Actual Spend" }, { name: "Budget" }];
    const deptRows = deptData.map((d) => [d.team, d.spend, d.budget]);

    deptSheet.addTable({
      name: "DepartmentSpendTable",
      ref: "A1",
      headerRow: true,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: deptColumns,
      rows: deptRows,
    });

    deptRows.forEach((_, i) => {
      const row = deptSheet.getRow(i + 2);
      row.getCell(2).font = { color: { argb: "FF00C2FA" } };
      row.getCell(3).font = { color: { argb: "FF7259F6" } };
    });

    autoFitColumns(deptSheet, deptRows);
  } else {
    deptSheet.addRow(["No department data"]);
  }

  // Final download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "financial_report.xlsx";
  link.click();

  closePopup("popup_loading");
}

function showLoader() {
  // document.querySelector(".accordion-body").classList.add("hidden");

  document.querySelector(".Skeleton-Div").classList.remove("hidden");
}

function hideSkeletonLoader() {
  document.querySelector(".Skeleton-Div").classList.add("hidden");
  document.querySelector(".accordion-body-main").classList.remove("hidden");
}

function setRenewalChart() {
  "use strict";
  // Check if the chart already exists and destroy it to prevent memory leaks
  if (renewal) {
    renewal.destroy();
  }

  // Hardcoded data ranges for the chart
  const data = {
    // Labels for the data points on the y-axis
    labels: ["$500", "$2000"], // Reduced labels to match the data points
    datasets: [
      {
        // Data set for Security Patches
        label: "Security Patches",
        data: [
          [20, 40],
          [70, 90],
        ], // Fixed ranges for the dataset
        backgroundColor: "#AFFF4A", // Background color for the bars
      },
      {
        // Data set for AWS Networking
        label: "AWS Networking",
        data: [
          [25, 45],
          [75, 85],
        ], // Fixed ranges for the dataset
        backgroundColor: "#5A8CFF",
      },
      {
        // Data set for Google Cloud - VM
        label: "Google Cloud - VM",
        data: [
          [30, 50],
          [80, 90],
        ], // Fixed ranges for the dataset
        backgroundColor: "#00C2FA", // Background color for the bars
      },
      {
        // Data set for Monthly Subscription
        label: "Monthly Subscription",
        data: [
          [15, 35],
          [60, 80],
        ], // Fixed ranges for the dataset
        backgroundColor: "#7259F6",
      },
    ],
  };

  // Configuration for the chart
  const config = {
    type: "bar", // Type of chart
    data: data, // Data for the chart
    options: {
      responsive: true, // Make the chart responsive to window size
      maintainAspectRatio: false, // Allow height to be controlled by CSS
      indexAxis: "y", // Set index axis to y for horizontal bars
      plugins: {
        legend: {
          position: "top", // Position of the legend
          align: "end", // Align legend to the end (right side)
          labels: {
            usePointStyle: true, // Use point style for legend items
            pointStyle: "circle", // Shape of the point in legend
            padding: 20, // Padding between legend items
          },
        },
        tooltip: {
          callbacks: {
            // Customize the tooltip label
            label: function (context) {
              const range = context.raw; // Get the range from the data
              return `${context.dataset.label}: ${range[0]} - ${range[1]} %`; // Format tooltip to show range
            },
          },
        },
      },
      scales: {
        x: {
          position: "top", // Position x-axis at the top
          beginAtZero: true, // Start the x-axis at zero
          ticks: {
            // Format tick labels on the x-axis
            callback: function (value) {
              return `${value}%`; // Append percentage sign to tick labels
            },
            // Generate tick values from 500 to 4000
            values: Array.from({ length: 8 }, (_, i) => (i + 1) * 500),
          },
        },
      },
    },
  };

  // Create a new chart instance and store it in the variable
  renewal = new Chart(
    document.getElementById("renewal-cost-usage-chart"), // DOM element for the chart
    config // Chart configuration
  );
}

function setMostExpensiveChart(expensiveSubscriptions) {
  // Get the context of the canvas for the chart
  const ctx = document.getElementById("most-expensive-chart").getContext("2d");

  // Check if data is available; if not, handle the case with 'No Data Available'
  const hasData = expensiveSubscriptions && expensiveSubscriptions.length > 0;

  // Prepare labels and amounts based on the availability of data
  const departmentNames = hasData
    ? expensiveSubscriptions.map((sub) => sub.SubscriptionName)
    : ["No Data Available"];
  const departmentAmounts = hasData
    ? expensiveSubscriptions.map((sub) => sub.SubscriptionContractAmount.Value)
    : [0];

  // Destroy the existing chart instance if it exists to avoid reusing the canvas
  if (mostExpensiveChart) {
    mostExpensiveChart.destroy();
  }

  // Create a new bar chart using Chart.js
  mostExpensiveChart = new Chart(ctx, {
    type: "bar", // Set the type of chart to bar
    data: {
      labels: departmentNames, // Set the labels for the x-axis
      datasets: [
        {
          label: hasData ? "Subscription Contract Amount" : "", // Label for the dataset
          data: departmentAmounts, // Data for the chart
          backgroundColor: hasData
            ? ["#E1DBFE", "#E1FFBB", "#BFF1FF", "#CFE1FF"] // Colors for bars if data is available
            : ["rgba(0, 0, 0, 0.1)"], // Light grey color if no data
          borderWidth: 0, // No border for the bars
          borderRadius: 10, // Rounded corners for the bars
          hoverBackgroundColor: hasData
            ? ["#E1DBFE", "#E1FFBB", "#BFF1FF", "#CFE1FF"] // Hover colors for bars if data is available
            : ["rgba(0, 0, 0, 0.2)"], // Darker grey if no data on hover
        },
      ],
    },
    options: {
      responsive: true, // Make the chart responsive to window size
      maintainAspectRatio: false, // Allow height to be controlled by CSS
      scales: {
        x: {
          ticks: {
            color: "#00021D", // Color for x-axis tick labels
            font: {
              size: 12, // Font size for x-axis tick labels
            },
          },
          grid: {
            display: false, // Hide the grid lines on the x-axis
          },
        },
        y: {
          beginAtZero: true, // Start y-axis at zero
          suggestedMin: 0, // Minimum suggested value for y-axis
          // Dynamically set the max value for better visualization
          suggestedMax: Math.max(...departmentAmounts) * 1.1, // Set max value slightly above the max amount
          ticks: {
            color: "#00021D", // Color for y-axis tick labels
            font: {
              size: 12, // Font size for y-axis tick labels
            },
            callback: function (value) {
              return "$" + value.toLocaleString(); // Format numbers with commas and a dollar sign
            },
            // Limit the number of ticks to exactly 6
            maxTicksLimit: 6, // Set maximum ticks on y-axis to 6
            stepSize: Math.ceil(Math.max(...departmentAmounts) / 6), // Calculate step size based on 6 ticks
          },
          grid: {
            display: true, // Show grid lines on the y-axis
            color: "#EAECF0", // Color of the grid lines
            borderDash: [5, 5], // Dashed style for grid lines
          },
          // Set the y-axis line color to white
          border: {
            color: "#FFFFFF", // Color of the y-axis line
            width: 1, // Width of the y-axis line
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return "$" + tooltipItem.raw.toLocaleString(); // Format tooltip to add commas and a dollar sign
            },
          },
        },
        legend: {
          display: false, // Hide the legend since there's only one dataset
        },
      },
    },
  });
}
function populateCategoryTable(data) {
  // Create a deep copy of the data for pagination purposes
  dataOfCategoryForPagination = JSON.parse(JSON.stringify(data));

  // Select the tbody element of the category table
  const tbody = document.querySelector("#category-tenure table tbody");
  tbody.innerHTML = ""; // Clear existing rows in the tbody

  // Determine which records to show based on pagination
  const recordsToShow = data.slice(0, displayedRecordsCountforCategory + recordsPerPageForCategory);

  // Iterate over the records to create table rows
  recordsToShow.forEach((item) => {
    const row = document.createElement("tr"); // Create a new table row

    // Populate the row with data
    row.innerHTML = `
      <td>${item.category}</td>
      <td style="color: #7259F6;">${item.accumulatedAmount ? "$" + item.accumulatedAmount.toFixed(2) : ""}</td> <!-- Conditional dollar sign for amount -->
      <td>${item.count || ""}</td> 
    `;

    tbody.appendChild(row); // Append the new row to the tbody
  });

  // Check if there are more records to show for pagination
  if (data.length > displayedRecordsCountforCategory + recordsPerPageForCategory) {
    const showMoreRow = document.createElement("tr"); // Create a new row for the "Show More" button
    showMoreRow.innerHTML = `
      <td colspan="7" class="text-center"> <!-- Span across multiple columns for centering -->
        <button class="btn" id="ShowMorecate" onclick="showMoreRecordsforCate()">Show More</button> 
      </td>
    `;
    tbody.appendChild(showMoreRow); // Append the "Show More" row to the tbody
  }
}

function aggregateSubscriptionsByCategory(subscriptions) {
  // Step 1: Flatten the array
  const flattened = subscriptions.flat();
  // Filter the subscriptions to return only those with an end date greater than today
  const filtered = flattened.filter((subscription) => {
    const endDate = new Date(subscription.SubscriptionStartDate);
    return endDate >= startDateForDep && endDate <= endDateForDep;
  });

  // Step 2: Create a map to aggregate amounts and count subscriptions
  const categoryMap = {};

  filtered.forEach((subscription) => {
    const categoryName = subscription.SubscriptionCategory?.Name;

    if (categoryName === null) {
      return;
    }

    const amount = subscription.SubscriptionContractAmount.Value;

    // Initialize the category if it doesn't exist
    if (!categoryMap[categoryName]) {
      categoryMap[categoryName] = {
        accumulatedAmount: 0,
        count: 0,
      };
    }

    // Update accumulated amount and count
    categoryMap[categoryName].accumulatedAmount += amount;
    categoryMap[categoryName].count += 1;
  });

  // Step 3: Convert the map to an array
  const result = Object.keys(categoryMap).map((category) => ({
    category: category,
    accumulatedAmount: categoryMap[category].accumulatedAmount,
    count: categoryMap[category].count,
  }));
  const filteredSubscriptions = result.filter((subscription) => {
    const amountValue = subscription.accumulatedAmount;
    const isWithinRange =
      (filtersForFinance.amount1 === null || amountValue >= filtersForFinance.amount1) &&
      (filtersForFinance.amount2 === null || amountValue <= filtersForFinance.amount2);
    return isWithinRange;
  });
  return filteredSubscriptions;
}

function setMonthlySpendLineChart(aggregatedData) {
  // Define month labels for the x-axis
  const labels = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Initialize dataset mappings for different vendor profiles
  const datasetMapping = {
    0: createDataset("Strategic", "#7259F6"),
    1: createDataset("Tactical", "#00C2FA"),
    2: createDataset("Operational", "#AFFF4A"),
  };

  // Helper function to create a dataset
  function createDataset(label, color) {
    return {
      label: label,
      data: new Array(12).fill(0),
      borderColor: color,
      backgroundColor: "transparent",
      fill: false,
      tension: 0.4,
      pointRadius: 3,
      pointBorderColor: color,
      pointBackgroundColor: "transparent",
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "#ffffff",
      pointHoverBorderColor: color,
      borderWidth: 2,
    };
  }

  // Map month names to indices
  const monthIndexMapping = labels.reduce((acc, month, index) => {
    acc[month] = index;
    return acc;
  }, {});

  // Populate the dataset with aggregated data
  aggregatedData.forEach(({ VendorProfile, SubscriptionContractAmount, Month }) => {
    const monthIndex = monthIndexMapping[Month];
    const dataset = datasetMapping[VendorProfile];

    if (dataset && monthIndex !== undefined) {
      dataset.data[monthIndex] = SubscriptionContractAmount.Value;
    }
  });

  const datasets = Object.values(datasetMapping);

  // Calculate y-axis scale
  const maxValues = datasets.flatMap((dataset) => dataset.data);
  const maxSpend = Math.max(...maxValues);
  const minSpend = Math.min(...maxValues);
  const range = maxSpend - minSpend;
  const stepSize = range > 0 ? Math.ceil(range / 4) : 1;

  const ctx = document.getElementById("line-chart").getContext("2d");

  // Destroy the previous chart instance if it exists
  if (monthlySpendChart) {
    monthlySpendChart.destroy();
  }

  // Create a new line chart
  monthlySpendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: "#00021D",
            font: { size: 12 },
          },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#00021D",
            font: { size: 12 },
            stepSize: stepSize,
            callback: function (value) {
              return "$" + value.toLocaleString(); // Format value with commas
            },
          },
          grid: {
            display: true,
            color: "#EAECF0",
            drawBorder: true,
          },
          border: { color: "#FFFFFF", width: 1 },
        },
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            pointStyle: "circle", // Set legend point style to filled circles
            color: "#000000",
            font: {
              size: 12,
            },
            generateLabels: function (chart) {
              // Override the labels to show filled points in the legend
              const datasets = chart.data.datasets;
              return datasets.map((dataset, i) => ({
                text: dataset.label,
                fillStyle: dataset.borderColor, // Use the border color for filled legend dots
                strokeStyle: dataset.borderColor,
                lineWidth: 2,
                hidden: !chart.isDatasetVisible(i),
                index: i,
              }));
            },
          },
        },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#000000",
          bodyColor: "#000000",
          borderColor: "#7259F6",
          borderWidth: 1,
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.dataset.label + ": $" + tooltipItem.raw; // Customize tooltip label
            },
          },
        },
      },
    },
  });
}

function setGradientChart(data) {
  // Flatten the data structure to work with records directly
  const flattenedData = data.flat(); // Flattens the nested arrays

  const labels = flattenedData.map((record) =>
    record.DepartmentNames ? record.DepartmentNames.Name : "Unknown Department"
  );

  const actualSpendData = flattenedData.map((record) =>
    record.SubscriptionContractAmount ? record.SubscriptionContractAmount.Value : 0
  );

  const budgetData = flattenedData.map((record) =>
    record.DepartmentNames && record.DepartmentNames.Budget !== null
      ? record.DepartmentNames.Budget || 0
      : 0
  );

  // Calculate the max and min values from the budgetData
  const maxBudget = Math.max(...budgetData);
  const minBudget = Math.min(...budgetData);

  // Calculate step size to create 5 points (4 intervals)
  const range = maxBudget - minBudget;
  const stepSize = range > 0 ? Math.ceil(range / 4) : 1; // Divide range by 4 to get 5 ticks

  const ctx = document.getElementById("gradient-chart").getContext("2d");

  // Check if there is an existing chart and destroy it
  if (gradientChart) {
    gradientChart.destroy();
  }

  // Create lighter gradient for the background
  const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
  gradient1.addColorStop(0, "rgba(114, 89, 246, 0.5)"); // Lighter color
  gradient1.addColorStop(1, "rgba(114, 89, 246, 0)"); // Transparent

  const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
  gradient2.addColorStop(0, "rgba(0, 194, 250, 0.5)"); // Lighter color with #00C2FA
  gradient2.addColorStop(1, "rgba(0, 194, 250, 0)"); // Transparent

  // Create a new chart instance and store it in gradientChart
  gradientChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Budget",
          data: budgetData,
          borderColor: "#7259F6",
          backgroundColor: gradient1, // Use gradient for background fill
          fill: true,
          tension: 0.4,
          pointRadius: 3, // Add point radius
          pointBorderColor: "#7259F6", // Point border color
          pointBackgroundColor: "transparent", // Point background color
          pointHoverRadius: 5, // Point hover radius
          pointHoverBackgroundColor: "#ffffff", // Point hover background color
          pointHoverBorderColor: "#7259F6", // Point hover border color
          borderWidth: 2, // Border width
        },
        {
          label: "Actual Spend",
          data: actualSpendData,
          borderColor: "#00C2FA", // Set to #00C2FA
          backgroundColor: gradient2, // Use gradient for background fill
          fill: true,
          tension: 0.4,
          pointRadius: 3, // Add point radius
          pointBorderColor: "#00C2FA", // Point border color
          pointBackgroundColor: "transparent", // Point background color
          pointHoverRadius: 5, // Point hover radius
          pointHoverBackgroundColor: "#ffffff", // Point hover background color
          pointHoverBorderColor: "#00C2FA", // Point hover border color
          borderWidth: 2, // Border width
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: "#00021D", // Change x-axis text color here
            font: {
              size: 12,
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#00021D", // Change y-axis text color here
            font: {
              size: 12,
            },
            stepSize: stepSize,
            callback: function (value) {
              return "$" + value; // Format ticks with $
            },
          },
          grid: {
            display: true,
            color: "#EAECF0",
            drawBorder: true,
          },
          border: {
            color: "#FFFFFF", // Change this to white
            width: 1, // Optional: specify the width of the border
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            pointStyle: "circle", // Set legend point style to filled circles
            color: "#000000",
            font: {
              size: 12,
            },
            generateLabels: function (chart) {
              // Override the labels to show filled points in the legend
              const datasets = chart.data.datasets;
              return datasets.map((dataset, i) => ({
                text: dataset.label,
                fillStyle: dataset.borderColor, // Use the border color for filled legend dots
                strokeStyle: dataset.borderColor,
                lineWidth: 2,
                hidden: !chart.isDatasetVisible(i),
                index: i,
              }));
            },
          },
        },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#000000",
          bodyColor: "#000000",
          borderColor: "#7259F6",
          borderWidth: 1,
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.dataset.label + ": $" + tooltipItem.raw.toLocaleString();
            },
          },
        },
      },
    },
  });
}

function openPopOver() {
  const popoverContent = document.getElementById("popover-form");

  // Toggle the visibility of the popover
  if (popoverContent.style.display === "none" || popoverContent.style.display === "") {
    popoverContent.style.display = "block";
  } else {
    popoverContent.style.display = "none";
  }
}

function openPopOverRenewel() {
  const popoverContent = document.getElementById("popover-form-Renewel");

  // Toggle the visibility of the popover
  if (popoverContent.style.display === "none" || popoverContent.style.display === "") {
    popoverContent.style.display = "block";
  } else {
    popoverContent.style.display = "none";
  }
}

function openPopOverFinancial() {
  const popoverContent = document.getElementById("popover-form-Financial");

  // Toggle the visibility of the popover
  if (popoverContent.style.display === "none" || popoverContent.style.display === "") {
    popoverContent.style.display = "block";
  } else {
    popoverContent.style.display = "none";
  }
}

$(function () {
  // General function to initialize date range pickers
  function initializeDateRangePicker(inputName) {
    $('input[name="' + inputName + '"]').daterangepicker(
      {
        autoUpdateInput: false, // Prevents the input from being automatically filled
        //opens: 'left'
      },
      function (start, end, label) {
        $('input[name="' + inputName + '"]').val(
          start.format("DD.MM.YYYY") + " to " + end.format("DD.MM.YYYY")
        );
      }
    );

    // Prevent closing the popover when interacting with the date picker
    $(".daterangepicker").on("click", function (event) {
      event.stopPropagation();
    });
  }

  // Initialize all date range pickers
  initializeDateRangePicker("daterange-Financial");
  initializeDateRangePicker("daterange");
  initializeDateRangePicker("daterange-Renewel"); // New date range picker for Renewel

  // Clear date range input on tab switch
  $('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
    if ($(e.target).attr("id") === "financial-tab") {
      $('input[name="daterange-Financial"]').val(""); // Clear input field for Financial tab
    } else if ($(e.target).attr("id") === "renewal-tab") {
      $('input[name="daterange-Renewel"]').val(""); // Clear input field for Renewel tab
    } else {
      $('input[name="daterange"]').val(""); // Clear input field for other tabs
    }
  });
});

//   $(function () {
//     function initRangeSlider(minId, maxId, sliderId, minLabelClass, maxLabelClass) {
//         const rangeInputs = $(`#${minId}, #${maxId}`),
//             range = $(`#${sliderId} .progress`),
//             minLabel = $(`.${minLabelClass}`),
//             maxLabel = $(`.${maxLabelClass}`);

//         if (!rangeInputs.length || !range.length) return; // If there are no sliders, return

//         const priceGap = 10000; // Adjusted gap for better separation

//         rangeInputs.on("input", function (e) {
//             let minVal = parseInt(rangeInputs.eq(0).val());
//             let maxVal = parseInt(rangeInputs.eq(1).val());

//             if ((maxVal - minVal) < priceGap) {
//                 if ($(e.target).hasClass("range-min")) {
//                     rangeInputs.eq(0).val(maxVal - priceGap);
//                 } else {
//                     rangeInputs.eq(1).val(minVal + priceGap);
//                 }
//             } else {
//                 range.css('left', ((minVal / rangeInputs.eq(0).attr('max')) * 100) + "%");
//                 range.css('right', 100 - (maxVal / rangeInputs.eq(1).attr('max')) * 100 + "%");
//                 minLabel.text(`$${Math.round(minVal / 1000)}k`);
//                 maxLabel.text(`$${Math.round(maxVal / 1000)}k`);
//                 minLabel.css('left', ((minVal / rangeInputs.eq(0).attr('max')) * 100) + "%");
//                 maxLabel.css('right', 100 - (maxVal / rangeInputs.eq(1).attr('max')) * 100 + "%");
//             }
//         });

//         // Initial update to set the default positions correctly
//         resetSlider(rangeInputs, range, minLabel, maxLabel);
//     }

//     // Initialize both sliders
//     initRangeSlider('range-min', 'range-max', 'slider', 'value-label.min', 'value-label.max');
//     initRangeSlider('range-min-2', 'range-max-2', 'slider-2', 'value2-label.min', 'value2-label.max');
//     initRangeSlider('range-min-3', 'range-max-3', 'slider-3', 'value3-label.min', 'value3-label.max');

//     // Reset sliders on tab change
//     $('a[data-toggle="tab"]').on('shown.bs.tab', function () {
//         // Call reset function for each slider
//         resetSlider($('#range-min, #range-max'), $('#slider .progress'), $('.value-label.min'), $('.value-label.max'));
//         resetSlider($('#range-min-2, #range-max-2'), $('#slider-2 .progress'), $('.value2-label.min'), $('.value2-label.max'));
//         resetSlider($('#range-min-3, #range-max-3'), $('#slider-3 .progress'), $('.value3-label.min'), $('.value3-label.max'));
//     });
// });

$(function () {
  function initRangeSlider(minId, maxId, sliderId, minLabelClass, maxLabelClass) {
    const minInput = $(`#${minId}`);
    const maxInput = $(`#${maxId}`);
    const range = $(`#${sliderId} .progress`);
    const minLabel = $(`.${minLabelClass}`);
    const maxLabel = $(`.${maxLabelClass}`);

    if (!minInput.length || !maxInput.length || !range.length) return;

    const priceGap = 10000; // Minimum allowed gap

    function updateSlider(fromMin = false) {
      let minVal = parseInt(minInput.val());
      let maxVal = parseInt(maxInput.val());

      if (maxVal - minVal < priceGap) {
        if (fromMin) {
          minVal = maxVal - priceGap;
          minInput.val(minVal);
        } else {
          maxVal = minVal + priceGap;
          maxInput.val(maxVal);
        }
      }

      let minPercent = (minVal / parseInt(minInput.attr("max"))) * 100;
      let maxPercent = (maxVal / parseInt(maxInput.attr("max"))) * 100;

      range.css({ left: `${minPercent}%`, right: `${100 - maxPercent}%` });

      minLabel.text(`$${Math.round(minVal / 1000)}k`).css("left", `${minPercent}%`);
      maxLabel.text(`$${Math.round(maxVal / 1000)}k`).css("right", `${100 - maxPercent}%`);
    }

    function handleMinInput() {
      let minVal = parseInt(minInput.val());
      let maxVal = parseInt(maxInput.val());

      // 🚀 **New Fix**: Move both handles together when stuck
      if (maxVal - minVal < priceGap) {
        maxVal = minVal + priceGap;
        maxInput.val(maxVal);
      }

      updateSlider(true);
    }

    function handleMaxInput() {
      updateSlider(false);
    }

    minInput.on("input", handleMinInput);
    maxInput.on("input", handleMaxInput);

    updateSlider();
  }

  // Initialize both sliders
  initRangeSlider("range-min", "range-max", "slider", "value-label.min", "value-label.max");
  initRangeSlider("range-min-2", "range-max-2", "slider-2", "value2-label.min", "value2-label.max");
  initRangeSlider("range-min-3", "range-max-3", "slider-3", "value3-label.min", "value3-label.max");

  // Reset sliders on tab change
  $('a[data-toggle="tab"]').on("shown.bs.tab", function () {
    // Call reset function for each slider
    resetSlider(
      $("#range-min, #range-max"),
      $("#slider .progress"),
      $(".value-label.min"),
      $(".value-label.max")
    );
    resetSlider(
      $("#range-min-2, #range-max-2"),
      $("#slider-2 .progress"),
      $(".value2-label.min"),
      $(".value2-label.max")
    );
    resetSlider(
      $("#range-min-3, #range-max-3"),
      $("#slider-3 .progress"),
      $(".value3-label.min"),
      $(".value3-label.max")
    );
  });
});

function resetSlider(rangeInputs, range, minLabel, maxLabel) {
  // Reset to default values
  const minVal = parseInt(rangeInputs.eq(0).attr("min"));
  const maxVal = parseInt(rangeInputs.eq(1).attr("max"));

  rangeInputs.eq(0).val(minVal);
  rangeInputs.eq(1).val(maxVal);

  range.css("left", (minVal / rangeInputs.eq(0).attr("max")) * 100 + "%");
  range.css("right", 100 - (maxVal / rangeInputs.eq(1).attr("max")) * 100 + "%");
  minLabel.text(`$${Math.round(minVal / 1000)}k`);
  maxLabel.text(`$${Math.round(maxVal / 1000)}k`);
  minLabel.css("left", (minVal / rangeInputs.eq(0).attr("max")) * 100 + "%");
  maxLabel.css("right", 100 - (maxVal / rangeInputs.eq(1).attr("max")) * 100 + "%");
}

// Close popover if clicked outside of it
document.addEventListener("click", function (event) {
  const popoverContent = document.getElementById("popover-form");
  const filterButton = document.getElementById("filter");

  // Check if the click was outside the popover and the button
  if (
    !popoverContent.contains(event.target) &&
    !filterButton.contains(event.target) &&
    !isDatePickerOpen
  ) {
    // Hide the popover
    popoverContent.style.display = "none";
  }

  const popoverContentFinance = document.getElementById("popover-form-Financial");
  const filterButtonFinance = document.getElementById("filter-Finance");

  // Check if the click was outside the popover and the button
  if (
    !popoverContentFinance.contains(event.target) &&
    !filterButtonFinance.contains(event.target) &&
    !isDatePickerOpen
  ) {
    // Hide the popover
    popoverContentFinance.style.display = "none";
  }

  const popoverContentRenwel = document.getElementById("popover-form-Renewel");
  const filterButtonRenwel = document.getElementById("filter-Renewel");

  // Check if the click was outside the popover and the button
  if (
    !popoverContentRenwel.contains(event.target) &&
    !filterButtonRenwel.contains(event.target) &&
    !isDatePickerOpen
  ) {
    // Hide the popover
    popoverContentRenwel.style.display = "none";
  }
});

// Prevent closing the popover when clicking the apply or cancel buttons on the date picker
$('input[name="daterange"]').on("apply.daterangepicker", function (ev, picker) {
  $(this).val(picker.startDate.format("DD.MM.YYYY") + " to " + picker.endDate.format("DD.MM.YYYY"));
});

$('input[name="daterange"]').on("cancel.daterangepicker", function (ev, picker) {
  $(this).val("");
});

$('input[name="daterange-Financial"]').on("apply.daterangepicker", function (ev, picker) {
  $(this).val(picker.startDate.format("DD.MM.YYYY") + " to " + picker.endDate.format("DD.MM.YYYY"));
});

$('input[name="daterange-Financial"]').on("cancel.daterangepicker", function (ev, picker) {
  $(this).val("");
});

$('input[name="daterange-Renewel"]').on("apply.daterangepicker", function (ev, picker) {
  $(this).val(picker.startDate.format("DD.MM.YYYY") + " to " + picker.endDate.format("DD.MM.YYYY"));
});

$('input[name="daterange-Renewel"]').on("cancel.daterangepicker", function (ev, picker) {
  $(this).val("");
});
// Initialize a variable to hold the chart instance

let doughnutChart;

let originalChart = window.Chart; // Store original Chart.js

function loadChartJS(callback) {
  if (window.Chart && Chart.version.startsWith("2.")) {
    callback();
    return;
  }

  let script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/chart.js@2.9.4";
  script.onload = () => {
    callback();
    setTimeout(() => restoreOriginalChartJS(), 500);
  };
  document.head.appendChild(script);
}

function restoreOriginalChartJS() {
  let scripts = document.querySelectorAll('script[src*="chart.js@2.9.4"]');
  scripts.forEach((script) => script.remove());

  if (originalChart) {
    window.Chart = originalChart; // Restore original Chart.js
  }
}

function defineRoundedDoughnut() {
  if (Chart.controllers.RoundedDoughnut) return;

  Chart.defaults.RoundedDoughnut = Chart.helpers.clone(Chart.defaults.doughnut);
  Chart.controllers.RoundedDoughnut = Chart.controllers.doughnut.extend({
    draw: function (ease) {
      var ctx = this.chart.ctx;
      var easingDecimal = ease || 1;
      var arcs = this.getMeta().data;

      Chart.helpers.each(arcs, function (arc, i) {
        arc.transition(easingDecimal).draw();

        var pArc = arcs[i === 0 ? arcs.length - 1 : i - 1];
        var pColor = pArc._model.backgroundColor;

        var vm = arc._model;
        var radius = (vm.outerRadius + vm.innerRadius) / 2;
        var thickness = (vm.outerRadius - vm.innerRadius) / 2;
        var startAngle = Math.PI - vm.startAngle - Math.PI / 2;
        var angle = Math.PI - vm.endAngle - Math.PI / 2;

        ctx.save();
        ctx.translate(vm.x, vm.y);

        ctx.fillStyle = i === 0 ? vm.backgroundColor : pColor;
        ctx.beginPath();
        ctx.arc(
          radius * Math.sin(startAngle),
          radius * Math.cos(startAngle),
          thickness,
          0,
          2 * Math.PI
        );
        ctx.fill();

        ctx.fillStyle = vm.backgroundColor;
        ctx.beginPath();
        ctx.arc(radius * Math.sin(angle), radius * Math.cos(angle), thickness, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
      });
    },
  });
}

function setUsageAnalysisold() {
  "use strict"; // Enable strict mode
  // Dummy data representing vendor distribution
  openPopup("popup_loading");
  const vendorData = [
    { vendor: "80%", count: 80 }, // Vendor with 80% share
    { vendor: "20%", count: 20 }, // Vendor with 20% share
  ];

  // Prepare data for Chart.js
  const labels = vendorData.map((vendor) => vendor.vendor); // Extract vendor names for labels
  const totalData = vendorData.map((vendor) => vendor.count); // Extract counts for data

  // Colors for each segment of the doughnut chart
  const backgroundColors = [
    "#1D225D", // Color for 80%
    "#E1DBFE", // Color for 20%
  ];

  // Get the context of the canvas for the chart
  const ctx = document.getElementById("usage-analysis-chart").getContext("2d");

  // Destroy the previous chart instance if it exists to prevent memory leaks
  if (usageAnalysis) {
    usageAnalysis.destroy();
  }

  // Create the new Chart.js doughnut chart
  usageAnalysis = new Chart(ctx, {
    type: "doughnut", // Set the type of chart to doughnut
    data: {
      labels: labels, // Vendor names as labels
      datasets: [
        {
          label: "Vendor Distribution", // Dataset label
          data: totalData, // Vendor counts
          backgroundColor: backgroundColors, // Colors assigned to segments
          borderColor: backgroundColors, // Set border color to match segments
          borderWidth: 20, // Border width for the segments
        },
      ],
    },
    options: {
      responsive: true, // Make the chart responsive to window size
      maintainAspectRatio: false, // Allow height to be controlled by CSS
      cutout: "88%", // Thickness of the doughnut hole
      elements: {
        arc: {
          borderRadius: 15, // Add a larger soft border radius to segments
        },
      },
      plugins: {
        legend: {
          display: true, // Enable the default legend
          position: "right", // Set the position of the legend
          labels: {
            usePointStyle: true, // Use point style instead of rectangle for legend
            pointStyle: "circle", // Specify the point style as a circle
            padding: 20, // Padding between legend items
            generateLabels: function (chart) {
              const original = Chart.overrides.doughnut.plugins.legend.labels.generateLabels; // Store original label generation
              const labels = original.call(this, chart); // Generate labels using original method

              // Customize the size of the legend circle
              labels.forEach((label) => {
                label.pointStyle = "circle"; // Ensure the legend uses circle style
                label.hidden = chart.getDatasetMeta(label.datasetIndex).hidden; // Hide labels for hidden datasets
                label.lineWidth = 1; // Set line width for legend circle
                label.radius = 5; // Set a smaller radius for the legend circle
              });
              return labels; // Return the customized labels
            },
          },
        },
        tooltip: {
          enabled: true, // Enable tooltips on hover
          backgroundColor: "#ffffff", // Background color of tooltip
          titleColor: "#333333", // Title color of tooltip
          bodyColor: "#000000", // Body color of tooltip
          bodyFont: {
            size: 14, // Font size for tooltip body
            weight: "bold", // Font weight for tooltip body
          },
          borderColor: "#cccccc", // Border color for tooltip
          borderWidth: 1, // Border width for tooltip
          cornerRadius: 10, // Rounded corners for tooltip
          padding: 10, // Padding for tooltip content
          displayColors: false, // Do not show color box in tooltip
          callbacks: {
            label: function (tooltipItem) {
              // Customize tooltip label to show only the count
              return `${tooltipItem.label}: ${tooltipItem.raw}`; // Display vendor and count
            },
          },
        },
      },
    },
  });
}

function setUsageAnalysis() {
  "use strict"; // Enable strict mode
  defineRoundedDoughnut();

  const vendorData = [
    { vendor: "80%", count: 80 }, // Vendor with 80% share
    { vendor: "20%", count: 20 }, // Vendor with 20% share
  ];

  // Prepare data for Chart.js
  const labels = vendorData.map((vendor) => vendor.vendor); // Extract vendor names for labels
  const data = vendorData.map((vendor) => vendor.count); // Extract counts for data

  // Colors for each segment of the doughnut chart
  const backgroundColors = [
    "#1D225D", // Color for 80%
    "#E1DBFE", // Color for 20%
  ];

  // Get the context of the canvas for the chart
  const ctx = document.getElementById("usage-analysis-chart").getContext("2d");

  // Destroy the previous chart instance if it exists to prevent memory leaks
  if (usageAnalysis) {
    usageAnalysis.destroy();
  }

  // Create the new Chart.js doughnut chart
  usageAnalysis = new Chart(ctx, {
    type: "RoundedDoughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: vendorData.map((_, i) => backgroundColors[i % backgroundColors.length]),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutoutPercentage: 70,
      legend: {
        display: false, // Hide default legend
      },
    },
  });

  // Generate custom legend
  document.getElementById("chart-legend-analysis").innerHTML = usageAnalysis.generateLegend();
}

function updateChartPie(inputData) {
  defineRoundedDoughnut();

  const backgroundColors = ["#CCD6EB", "#E1FFBB", "#1D225D", "#BFF1FF", "#CFE1FF"];
  const labels = inputData.map((item) => item.vendor);
  const data = inputData.map((item) => item.count);
  const ctx = document.getElementById("doughnut-chart").getContext("2d");

  if (doughnutChart) {
    doughnutChart.destroy();
  }

  doughnutChart = new Chart(ctx, {
    type: "RoundedDoughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: inputData.map((_, i) => backgroundColors[i % backgroundColors.length]),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutoutPercentage: 70,
      legend: {
        display: false, // Hide default legend
      },
    },
  });

  // Generate custom legend
  document.getElementById("chart-legend").innerHTML = doughnutChart.generateLegend();
}

function updateChartPieold(vendorData) {
  "use strict";
  // Prepare data for Chart.js
  const labels = vendorData.map((vendor) => vendor.vendor);
  const totalData = vendorData.map((vendor) => vendor.count);

  // Colors for each segment
  const backgroundColors = ["#CCD6EB", "#E1FFBB", "#1D225D", "#BFF1FF", "#CFE1FF"];

  const ctx = document.getElementById("doughnut-chart").getContext("2d");

  // Destroy the existing chart if it exists
  if (typeof doughnutChart !== "undefined") {
    doughnutChart.destroy(); // Ensure the chart is destroyed only if it exists
  }

  // Create the new Chart.js doughnut chart
  doughnutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels, // Vendor names
      datasets: [
        {
          label: "Vendor Distribution",
          data: totalData, // Vendor counts
          backgroundColor: backgroundColors, // Assign colors
          borderColor: backgroundColors, // Set border color to match the segments
          borderWidth: 15, // Border width for the segments
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "85%", // Doughnut thickness
      elements: {
        arc: {
          borderRadius: 15, // Add a larger soft border radius to segments
        },
      },
      plugins: {
        legend: {
          display: true, // Enable the default legend
          position: "right", // Set legend position
          labels: {
            usePointStyle: true, // Use point style instead of rectangle
            pointStyle: "circle", // Specify the point style as a circle
            padding: 20,
            generateLabels: function (chart) {
              const original = Chart.overrides.doughnut.plugins.legend.labels.generateLabels;
              const labels = original.call(this, chart);

              // Customize the size of the legend circle here
              labels.forEach((label) => {
                label.pointStyle = "circle"; // Ensure it's a circle
                label.hidden = chart.getDatasetMeta(label.datasetIndex).hidden;
                label.lineWidth = 1; // Set line width if needed
                label.radius = 5; // Set a smaller radius for the legend circle
              });
              return labels;
            },
          },
        },
        tooltip: {
          enabled: true, // Enable tooltips on hover
          backgroundColor: "#ffffff",
          titleColor: "#333333",
          bodyColor: "#000000",
          bodyFont: {
            size: 14,
            weight: "bold",
          },
          borderColor: "#cccccc",
          borderWidth: 1,
          cornerRadius: 10, // Rounded corners
          padding: 10, // Padding for tooltip
          displayColors: false, // Hide color box in tooltip
          callbacks: {
            label: function (tooltipItem) {
              // Display only the count for the tooltip
              return `${tooltipItem.label}: ${tooltipItem.raw}`; // Customize tooltip label to show only count
            },
          },
        },
      },
    },
  });
}

function setUserValuesForRen(StartDate, EndDate) {
  "use strict"; // Enable strict mode
  checkonLoad = true; //set to true so that page dont load again it picks from the backup array

  startDateForRen = new Date(StartDate);
  endDateForRen = new Date(EndDate);

  var currentYear = new Date().getFullYear();

  // Check and parse StartDate
  if (StartDate) {
    var startDate = new Date(StartDate);
    var startMonth = startDate.getMonth(); // Month index (0-11)

    if (startDate.getFullYear() === currentYear) {
      startDateforRenwal = startMonth; // Current year, normal index
    } else if (startDate.getFullYear() < currentYear) {
      startDateforRenwal = startMonth - 12; // Previous years, negative index
    } else {
      startDateforRenwal = startMonth + 12; // Future years, positive index
    }
  }

  // Check and parse EndDate
  if (EndDate) {
    var endDate = new Date(EndDate);
    var endMonth = endDate.getMonth(); // Month index (0-11)

    if (endDate.getFullYear() === currentYear) {
      endDateforRenewal = endMonth; // Current year, normal index
    } else if (endDate.getFullYear() < currentYear) {
      endDateforRenewal = endMonth - 12; // Previous years, negative index
    } else {
      endDateforRenewal = endMonth + 12; // Future years, positive index
    }
  }

  //this function is used to change the start and end dates according to the given range of user if user is on secound tab it should again change the range regardless of what was previously on fisrt tab
  getMonthlySpendApi();
}

function setUserValuesForFin(StartDate, EndDate) {
  "use strict"; // Enable strict mode
  checkonLoad = true; //set to true so that page dont load again it picks from the backup array
  // Current year
  var currentYear = new Date().getFullYear();

  startDateForDep = new Date(StartDate);
  endDateForDep = new Date(EndDate);

  //we are setting dates since we need the subscription array of the first tab for the chart an the seacond tab
  // Check and parse StartDate
  if (StartDate) {
    var startDate = new Date(StartDate);
    var startMonth = startDate.getMonth(); // Month index (0-11)

    if (startDate.getFullYear() === currentYear) {
      startMonthIndex = startMonth; // Current year, normal index
    } else if (startDate.getFullYear() < currentYear) {
      startMonthIndex = startMonth - 12; // Previous years, negative index
    } else {
      startMonthIndex = startMonth + 12; // Future years, positive index
    }
  }

  // Check and parse EndDate
  if (EndDate) {
    var endDate = new Date(EndDate);
    var endMonth = endDate.getMonth(); // Month index (0-11)

    if (endDate.getFullYear() === currentYear) {
      endMonthIndex = endMonth; // Current year, normal index
    } else if (endDate.getFullYear() < currentYear) {
      endMonthIndex = endMonth - 12; // Previous years, negative index
    } else {
      endMonthIndex = endMonth + 12; // Future years, positive index
    }
  }

  getMonthlySpendApi();
}
function setUserValuesForStand(StartDate, EndDate) {
  "use strict"; // Enable strict mode
  checkonLoad = true; //set to true so that page dont load again it picks from the backup array
  // openPopup("popup_loading");
  // Current year
  var currentYear = new Date().getFullYear();

  // Check and parse StartDate
  if (StartDate) {
    var startDate = new Date(StartDate);
    var startMonth = startDate.getMonth(); // Month index (0-11)

    if (startDate.getFullYear() === currentYear) {
      startMonthIndex = startMonth; // Current year, normal index
    } else if (startDate.getFullYear() < currentYear) {
      startMonthIndex = startMonth - 12; // Previous years, negative index
    } else {
      startMonthIndex = startMonth + 12; // Future years, positive index
    }
  }

  // Check and parse EndDate
  if (EndDate) {
    var endDate = new Date(EndDate);
    var endMonth = endDate.getMonth(); // Month index (0-11)

    if (endDate.getFullYear() === currentYear) {
      endMonthIndex = endMonth; // Current year, normal index
    } else if (endDate.getFullYear() < currentYear) {
      endMonthIndex = endMonth - 12; // Previous years, negative index
    } else {
      endMonthIndex = endMonth + 12; // Future years, positive index
    }
  }

  getMonthlySpendApi();
}

function updateDepartmentChart(DepartmentData) {
  "use strict"; // Enable strict mode

  const ctx = document.getElementById("chart5").getContext("2d");

  // Destroy the existing chart instance if it exists
  if (chart5) {
    chart5.destroy();
  }

  // Check if DepartmentData is empty or invalid
  const hasValidData = DepartmentData && Array.isArray(DepartmentData) && DepartmentData.length > 0;

  // Prepare default labels and data for the case of no data
  let departmentNames = ["No Data Available"];
  let departmentAmounts = [0];
  let chartLabel = "";

  // If valid data exists, process it
  if (hasValidData) {
    departmentNames = DepartmentData.map(
      (department) => department[0]?.DepartmentNames?.Name || "Unknown"
    );

    departmentAmounts = DepartmentData.map(
      (department) => department[0]?.SubscriptionContractAmount?.Value || 0
    );

    chartLabel = "Subscription Contract Amount";
  }

  // Calculate the maximum value to determine y-axis limits
  const maxAmount = hasValidData ? Math.max(...departmentAmounts) : 0;

  // Create the chart (only one instance of Chart creation)
  chart5 = new Chart(ctx, {
    type: "bar",
    data: {
      labels: departmentNames,
      datasets: [
        {
          label: chartLabel,
          data: departmentAmounts,
          backgroundColor: hasValidData
            ? ["#E1DBFE", "#BFF1FF", "#E1FFBB", "#EAECF0", "#CFE1FF", "#BFF1FF"]
            : ["rgba(0, 0, 0, 0.1)"],
          borderWidth: 0,
          borderRadius: 10,
          hoverBackgroundColor: hasValidData
            ? ["#E1DBFE", "#BFF1FF", "#E1FFBB", "#EAECF0", "#CFE1FF", "#BFF1FF"]
            : ["rgba(0, 0, 0, 0.2)"],
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
            font: {
              size: 12,
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: "#000000",
            font: {
              size: 12,
            },
            callback: function (value) {
              return "$" + value.toLocaleString(); // Format with commas
            },
            maxTicksLimit: 6, // Limit to 6 ticks on the y-axis
            stepSize: Math.ceil(maxAmount / 6), // Set step size based on the maximum amount
          },
          grid: {
            display: true,
            color: "#EAECF0",
            borderDash: [5, 5],
          },
          beginAtZero: true,
          suggestedMin: 0,
          // Calculate suggestedMax for better visualization
          suggestedMax: Math.ceil(maxAmount * 1.1), // Adjust the max value for visibility
          border: {
            color: "#FFFFFF",
            width: 1,
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return "$" + tooltipItem.raw.toLocaleString(); // Format with commas in tooltip
            },
          },
        },
        legend: {
          display: false,
        },
      },
    },
  });
}

$(document).ready(function () {
  $(".cancelBtn").text("Clear");
  var titleContainer = document.querySelector(".title-container");
  var navbar = document.querySelector(".navbar");
  var btnElement = document.getElementById("btnn");
  var containerDiv = document.querySelector(".navbar .container");

  // Find the navbar element
  var navList = document.querySelector(".navbar-nav.weblinks");

  if (navbar) {
    navbar.style.width = "100%"; // Full width of the container
    navbar.style.maxWidth = "198rem"; // Centered max-width, approximately 1200px
    navbar.style.margin = "0 auto"; // Center the navbar within the page

    navbar.classList.add("navbar-custom");
  }

  if (navList && btnElement) {
    var listItem = document.createElement("li"); // Create a new li element
    listItem.appendChild(btnElement); // Append btnn to the new li
    listItem.style.marginRight = "38px";
    listItem.style.marginTop = "8px";

    navList.prepend(listItem); // Prepend the new li to the ul
  }

  // if (titleContainer && navbar) {
  //   // Append the titleContainer as the last child of the navbar
  //   titleContainer.style.display = "block";
  //   navbar.appendChild(titleContainer);
  // }

  if (containerDiv && titleContainer) {
    titleContainer.style.display = "block";
    containerDiv.insertBefore(titleContainer, containerDiv.firstChild);
  }

  // Apply styles to .container
  if (containerDiv) {
    containerDiv.style.padding = "32px";
    //containerDiv.style.marginLeft = "269px"
    //containerDiv.style.setProperty("margin-left", "217px", "important");
    let sidebar = document.querySelector(".sidebar");
    if (sidebar && sidebar.classList.contains("close")) {
      containerDiv.style.marginLeft = "97px";
    } else {
      containerDiv.style.marginLeft = "269px";
    }
    containerDiv.style.marginRight = "auto"; // Ensure proper centering
    containerDiv.style.display = "flex";
    containerDiv.style.alignItems = "center"; // Align content vertically
    containerDiv.style.justifyContent = "flex-start";
  }

  var navbarNav = document.querySelector(".navbar-nav");
  if (navbarNav) {
    navbarNav.style.setProperty("flex-direction", "row", "important");
  }
  var myDate = new Date(2013, 3, 25); // 2013, 25 April

  setRenewalChart();

  showLoader();

  getMonthlySpendApi();
});

function clearFiltersOnFinance() {
  "use strict";
  isFilterApplied = false; // this flag shows if filter is applied on standard report or not
  isFilterAppliedOnFinance = true; // this flag shows if filter is applied on finance report or not
  checkonLoad = false; // setting this false so that it reloads latest data
  displayedRecordsCountForDep = 0; //  used for pagination on spend by department table so when clear it should be 0
  const tableContainer = document.getElementById("table-container2"); // also remove the scroll because onload it has only few records
  tableContainer.classList.remove("scrollable");
  // Resetting all the variable to take it onload state
  startMonthIndex = 0;
  endMonthIndex = 11;
  monthlySubscription = [];
  monthlyDepartments = [];
  startDateForDep = new Date(currentYear, 0, 1);
  endDateForDep = new Date(startDateForDep.getFullYear(), 11, 31); // Months are zero-based, so 11 is December

  filtersForFinance.startDate = null;
  filtersForFinance.endDate = null;
  filtersForFinance.amount1 = null;
  filtersForFinance.amount2 = null;
  filtersForFinance.status = null;

  document.getElementById("daterangebyuser-finance").value = "";

  // Reset the categories select to the first option
  document.getElementById("categories-finance").selectedIndex = 0;

  // // Reset the price range sliders
  // document.getElementById('range-min-2').value = 0; // Reset to default value
  // document.getElementById('range-max-2').value = 800000; // Reset to default value

  // // Update the displayed values for the price range
  // document.querySelector('.value2-label.min').textContent = '$0k';
  // document.querySelector('.value2-label.max').textContent = '$798k';
  resetSlider(
    $("#range-min-2, #range-max-2"),
    $("#slider-2 .progress"),
    $(".value2-label.min"),
    $(".value2-label.max")
  );

  // Reset the tenured subscriptions select to the first option
  document.getElementById("tenured-finance").selectedIndex = 0;

  // Reset the spending forecast select to the first option
  document.getElementById("forecast-finance").selectedIndex = 0;
  //reset all the table to their onload state
  getMonthlySpendApi();
  openPopOverFinancial();
}

function clearFilters() {
  "use strict";
  // Clear the date range input

  isFilterApplied = false; // this feild tells the functions if filter is applied or not
  isFilterAppliedOnFinance = false; // this flag shows if filter is applied on finance report or not
  checkonLoad = false; // setting this false so that it reloads latest data
  // Resetting all the variable to take it onload state
  startMonthIndex = 0;
  endMonthIndex = 11;
  monthlySubscription = [];
  document.getElementById("daterangebyuser").value = "";

  // Reset the categories select to the first option
  document.getElementById("categories").selectedIndex = 0;
  resetSlider(
    $("#range-min, #range-max"),
    $("#slider .progress"),
    $(".value-label.min"),
    $(".value-label.max")
  );
  // // Reset the price range sliders
  // document.getElementById('range-min').value = 0; // Reset to default value
  // document.getElementById('range-max').value = 798000; // Reset to default value

  // // Update the displayed values for the price range
  // document.querySelector('.value-label.min').textContent = '$0k';
  // document.querySelector('.value-label.max').textContent = '$798k';

  // Reset the tenured subscriptions select to the first option
  document.getElementById("tenured").selectedIndex = 0;

  // Reset the spending forecast select to the first option
  document.getElementById("forecast").selectedIndex = 0;

  filters.startDate = null;
  filters.endDate = null;
  filters.amount1 = null;
  filters.amount2 = null;
  filters.status = null;

  //reset all the table to their onload state
  getMonthlySpendApi();
  openPopOver();
}
function clearFilterForRenewal() {
  "use strict";
  isFilterAppliedOnRenewal = false; // this flag shows functions if filter is applied on renewal tab or not

  startDateForRen = new Date();
  endDateForRen = new Date(startDateForRen.getFullYear(), 11, 31);
  //restting all the variables to onload state
  startDateforRenwal = 0;
  endDateforRenewal = 11;

  filtersforRenewal.startDate = null;
  filtersforRenewal.endDate = null;
  filtersforRenewal.amount1 = null;
  filtersforRenewal.amount2 = null;
  filtersforRenewal.status = null;

  checkonLoad = false;
  document.getElementById("daterangebyuser-renewel").value = "";
  filtersforRenewal.amount2 = null;
  filtersforRenewal.amount1 = null;
  // Reset the categories select to the first option
  document.getElementById("categories-renewel").selectedIndex = 0;

  // // Reset the price range sliders
  // document.getElementById('range-min-3').value = 0; // Reset to default value
  // document.getElementById('range-max-3').value = 800000; // Reset to default value

  // // Update the displayed values for the price range
  // document.querySelector('.value3-label.min').textContent = '$0k';
  // document.querySelector('.value3-label.max').textContent = '$798k';
  resetSlider(
    $("#range-min-3, #range-max-3"),
    $("#slider-3 .progress"),
    $(".value3-label.min"),
    $(".value3-label.max")
  );

  // Reset the tenured subscriptions select to the first option
  document.getElementById("tenured-renewel").selectedIndex = 0;

  // Reset the spending forecast select to the first option
  document.getElementById("forecast-renewel").selectedIndex = 0;

  //reset all the table to their onload state
  getMonthlySpendApi();
  openPopOverRenewel();
}
function applyFilterForRenewal() {
  "use strict";
  isFilterAppliedOnRenewal = true; // this flag shows functions if filter is applied on renewal tab or not
  isFilterApplied = false;
  // Getting user values from the filter
  var minRangeInput = document.getElementById("range-min-3");
  var maxRangeInput = document.getElementById("range-max-3");
  if (minRangeInput && maxRangeInput) {
    filtersforRenewal.amount1 = minRangeInput.value || null; // Set amount1
    filtersforRenewal.amount2 = maxRangeInput.value || null; // Set amount2
  }
  // Get date range (StartDate and EndDate)
  var daterangeInput = document.getElementById("daterangebyuser-renewel");
  if (daterangeInput && daterangeInput.value) {
    var dateParts = daterangeInput.value.split(" to ");
    filtersforRenewal.startDate = moment(dateParts[0], "DD.MM.YYYY").format("YYYY-MM-DD") || null;
    filtersforRenewal.endDate = moment(dateParts[1], "DD.MM.YYYY").format("YYYY-MM-DD") || null;
    setUserValuesForRen(filtersforRenewal.startDate, filtersforRenewal.endDate);
  } else {
    startDateForRen = new Date();
    endDateForRen = new Date(startDateForRen.getFullYear(), 11, 31);
    endDateforRenewal = 11;

    filtersforRenewal.startDate = null;
    filtersforRenewal.endDate = null;
    getMonthlySpendApi();
  }

  openPopOverRenewel();
}

function applyFiltersOnFinace() {
  "use strict";
  isFilterAppliedOnFinance = true; // this flag shows functions if filter is applied on financal tab or not
  isFilterApplied = false;
  // Getting all values from filter that user chose
  var minRangeInput = document.getElementById("range-min-2");
  var maxRangeInput = document.getElementById("range-max-2");
  if (minRangeInput && maxRangeInput) {
    filtersForFinance.amount1 = minRangeInput.value || null; // Set amount1
    filtersForFinance.amount2 = maxRangeInput.value || null; // Set amount2
  }
  // Get date range (StartDate and EndDate)
  var daterangeInput = document.getElementById("daterangebyuser-finance");
  if (daterangeInput && daterangeInput.value) {
    var dateParts = daterangeInput.value.split(" to ");
    filtersForFinance.startDate = moment(dateParts[0], "DD.MM.YYYY").format("YYYY-MM-DD") || null;
    filtersForFinance.endDate = moment(dateParts[1], "DD.MM.YYYY").format("YYYY-MM-DD") || null;
    setUserValuesForFin(filtersForFinance.startDate, filtersForFinance.endDate);
  } else {
    startMonthIndex = 0;
    endMonthIndex = 11;
    monthlySubscription = [];
    monthlyDepartments = [];
    startDateForDep = new Date(currentYear, 0, 1);
    endDateForDep = new Date(startDateForDep.getFullYear(), 11, 31); // Months are zero-based, so 11 is December

    filtersForFinance.startDate = null;
    filtersForFinance.endDate = null;
    getMonthlySpendApi();
  }
  openPopOverFinancial();
}

function applyFilters() {
  "use strict";
  isFilterApplied = true; // this flag shows functions if filter is applied on standard tab or not
  isFilterAppliedOnFinance = false;

  // Get selected range values (amount1 and Amount2) from user
  var minRangeInput = document.getElementById("range-min");
  var maxRangeInput = document.getElementById("range-max");
  if (minRangeInput && maxRangeInput) {
    filters.amount1 = minRangeInput.value || null; // Set amount1
    filters.amount2 = maxRangeInput.value || null; // Set amount2
  }
  // Get date range (StartDate and EndDate)
  var daterangeInput = document.getElementById("daterangebyuser");
  if (daterangeInput && daterangeInput.value) {
    var dateParts = daterangeInput.value.split(" to ");
    filters.startDate = moment(dateParts[0], "DD.MM.YYYY").format("YYYY-MM-DD") || null;
    filters.endDate = moment(dateParts[1], "DD.MM.YYYY").format("YYYY-MM-DD") || null;
    setUserValuesForStand(filters.startDate, filters.endDate);
  } else {
    startMonthIndex = 0;
    endMonthIndex = 11;
    monthlySubscription = [];
    filters.startDate = null;
    filters.endDate = null;
    getMonthlySpendApi();
  }

  openPopOver();
}

function deepCopyArray(array) {
  return JSON.parse(JSON.stringify(array));
}

// Function to populate the subscription table
function populateSubscriptionTable(status) {
  "use strict";

  // If this is the first time calling the function, store a copy of subscriptionArray
  loadMoreArray = deepCopyArray(subscriptionArray); // Make a shallow copy of the array
  //remove duplicated from array
  loadMoreArray = loadMoreArray.filter((subscription, index, self) => {
    return (
      index ===
      self.findIndex(
        (s) =>
          s.SubscriptionName === subscription.SubscriptionName &&
          s.SubscriptionContractAmount.Value === subscription.SubscriptionContractAmount.Value
      )
    );
  });
  const today = new Date();

  if (status !== null) {
    loadMoreArray = loadMoreArray.filter((subscription) => {
      const subscriptionEndDate = new Date(subscription.SubscriptionEndDate);

      if (status === 0) {
        // status shows on which tab is user write now
        // Filter for SubscriptionEndDate greater than today
        return subscriptionEndDate > today;
      } else {
        // Filter for SubscriptionEndDate less than or equal to today
        return subscriptionEndDate <= today;
      }
    });
  }
  var tableBody;
  if (status === 0) {
    tableBody = document.getElementById("subscriptionTableBody2");
  } else if (status === 1) {
    tableBody = document.getElementById("subscriptionTableBody3");
  } else {
    tableBody = document.getElementById("subscriptionTableBody1");
  }

  // Clear the table body before inserting new rows
  tableBody.innerHTML = "";

  // Calculate how many records to show from the loadMoreArray
  const recordsToShow = loadMoreArray.slice(0, displayedRecordsCount + recordsPerPage);

  // Loop through the subscriptions and create rows dynamically
  recordsToShow.forEach((subscription) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${subscription.SubscriptionName}</td>
      <td>${subscription.VendorName || ""}</td>
      <td style="color: #7259F6;">${subscription.SubscriptionContractAmount.Value ? "$" + subscription.SubscriptionContractAmount.Value.toFixed(2) : ""}</td> <!-- Conditional dollar sign -->
     <td style="color: #00C2FA;">${new Date(subscription.SubscriptionStartDate).toLocaleDateString()}</td>
      <td style="color: #00C2FA;"> ${new Date(subscription.SubscriptionEndDate).toLocaleDateString()}</td>
      <td>${subscription.SubscriptionFrequency}</td>
    <td>${new Date(subscription.SubscriptionEndDate) > today ? "Active" : "Inactive"}</td>
    `;

    // Append the row to the table body
    tableBody.appendChild(row);
  });

  // If there are more records to show, display the "Show More" button
  if (loadMoreArray.length > displayedRecordsCount + recordsPerPage) {
    const showMoreRow = document.createElement("tr");
    showMoreRow.innerHTML = `
      <td colspan="7" class="text-center">
        <button class="btn" id="ShowMore" onclick="showMoreRecords(${status})">Show More</button> 
      </td>
    `;
    tableBody.appendChild(showMoreRow);
  }
}

function showMoreRecordsforCate() {
  // Increase the count of displayed records
  displayedRecordsCountforCategory += recordsPerPageForCategory;

  // Repopulate the table with more records
  populateCategoryTable(dataOfCategoryForPagination);
  const tableContainer = document.getElementById("table-container5");
  tableContainer.classList.add("scrollable");
}

function showMoreRecordsForDep() {
  // Increase the count of displayed records
  displayedRecordsCountForDep += recordsPerPageForDep;

  // Repopulate the table with more records
  fillDepartmentTable(dataOfDepartmentForShowingInPagination);
  const tableContainer = document.getElementById("table-container2");
  tableContainer.classList.add("scrollable");
}

function showMoreRecordsForRenw() {
  // Increase the count of displayed records
  displayedRecordsCountForRen += recordsPerPageForRen;

  // Repopulate the table with more records
  setSubscriptionNearingRenTable(nearingRenewal);
  const tableContainer = document.getElementById("table-container4");
  tableContainer.classList.add("scrollable");
}
// Function to handle "Show More" button click
function showMoreRecords(status) {
  // Increase the count of displayed records
  displayedRecordsCount += recordsPerPage;

  // Repopulate the table with more records
  populateSubscriptionTable(status);
  const tableContainer = document.getElementById("myTabContent");
  tableContainer.classList.add("scrollable");
}

function renewPageNumber(status) {
  //currentPage = 1; // Increment the page number
  // subscriptionArray = [];
  loadMoreArray = deepCopyArray(subscriptionArray); //when tab changes it should copy orignal array again
  displayedRecordsCount = 0;
  const tableContainer = document.getElementById("myTabContent"); // first time only 5 records are returned therfore it should not be scrollable
  tableContainer.classList.add("scrollable");
  populateSubscriptionTable(status);
}
function parseFrequency(frequencyString) {
  // Extract digits from the frequencyString using a regular expression
  const digits = parseInt(frequencyString.match(/\d+/)[0]);
  return digits;
}

function generateSimilarRecordsByYearForDepartment(record) {
  "use strict";
  var startDate = new Date(record.SubscriptionStartDate);
  var endDate = new Date(record.SubscriptionEndDate);
  var RenewalDate = new Date(record.NextDueDate);
  //  var digit =
  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return [];
  }
  if (startDate.getFullYear() === 1) {
    return [];
  }

  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();
  var tempdate = new Date(startDate);
  var today = new Date();
  var yearDifference = endYear - startYear;
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setFullYear(endDateForComparison.getFullYear() + yearDifference);
  endDateForComparison.setDate(endDate.getDate());
  if (RenewalDate >= startDate && RenewalDate < endDate) {
    while (startDate.getFullYear() < endDateForComparison.getFullYear()) {
      var subscriptionAmount =
        record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

      var newRecord = {
        SubscriptionStartDate: tempdate, // Convert date to ISO format
        SubscriptionEndDate: record.SubscriptionEndDate,
        ActivityGuid: record.ActivityId,
        SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
        SubscriptionContractAmount: {
          Value: subscriptionAmount,
        },
        SubscriptionName: record.SubscriptionName,
        DepartmentNames: {
          Name: record.DepartmentNames.Name,
          Budget: record.DepartmentNames.Budget?.Value ?? "",
        },
      };

      monthlyDepartments.push(newRecord);

      startDate.setFullYear(startDate.getFullYear() + frequency);

      tempdate = new Date(startDate);
    }
  }
}

function generateSimilarRecordsbyYear(record) {
  "use strict"; // Enable strict mode for this function

  var endDate = new Date(record.SubscriptionEndDate);
  var startDate = new Date(record.SubscriptionStartDate);

  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return [];
  }

  if (startDate.getFullYear() === 1) {
    return [];
  }

  var currentdate = new Date();
  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();
  var yearDifference = endYear - startYear;

  var endDateForComparison = new Date(startDate);
  endDateForComparison.setFullYear(endDateForComparison.getFullYear() + yearDifference);
  endDateForComparison.setDate(endDate.getDate());
  var tempdate = new Date(startDate);

  // Loop from startDate to endDate with frequency as the increment
  while (startDate.getFullYear() < endDateForComparison.getFullYear()) {
    var subscriptionAmount =
      record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

    var newRecord = {
      SubscriptionStartDate: tempdate, // Convert date to ISO format
      VendorName: record.VendorName,
      status: record.status, // Convert date to ISO format
      VendorProfile: record.VendorProfile,
      ActivityGuid: record.ActivityId,
      //"ReminderInterval": record.reminderInterval,
      SubscriptionEndDate: record.SubscriptionEndDate,
      SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
      SubscriptionContractAmount: {
        Value: subscriptionAmount,
      },
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: {
        Name: record.DepartmentNames.Name,
      },
    };

    monthlySubscription.push(newRecord);
    //newRecords.push(newRecord);
    // }

    startDate.setFullYear(startDate.getFullYear() + frequency);

    tempdate = new Date(startDate);
  }
}

function generateSimilarRecordsbyMonthforDepartment(record) {
  "use strict"; // Enable strict mode for this function

  var startDate = new Date(record.SubscriptionStartDate);
  var endDate = new Date(record.SubscriptionEndDate);
  var RenewalDate = new Date(record.NextDueDate);
  //  var digit =
  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return [];
  }
  if (startDate.getFullYear() === 1) {
    return [];
  }

  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();
  var tempdate = new Date(startDate);
  var today = new Date();
  var monthDifference = (endYear - startYear) * 12 + (endMonth - startMonth);
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setMonth(endDateForComparison.getMonth() + monthDifference);
  endDateForComparison.setDate(endDate.getDate());
  if (RenewalDate >= startDate && RenewalDate < endDate) {
    while (startDate < endDateForComparison) {
      if (
        startDate.getFullYear() === endDateForComparison.getFullYear() &&
        startDate.getMonth() === endDateForComparison.getMonth()
      ) {
        break; // Exit loop if year and month match
      }

      var subscriptionAmount =
        record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

      var newRecord = {
        SubscriptionStartDate: tempdate, // Convert date to ISO format
        SubscriptionEndDate: record.SubscriptionEndDate,
        ActivityGuid: record.ActivityId,
        SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
        SubscriptionContractAmount: {
          Value: subscriptionAmount,
        },
        SubscriptionName: record.SubscriptionName,
        DepartmentNames: {
          Name: record.DepartmentNames.Name,
          Budget: record.DepartmentNames.Budget?.Value ?? "",
        },
      };

      monthlyDepartments.push(newRecord);

      startDate.setMonth(startDate.getMonth() + frequency);
      tempdate = new Date(startDate);
    }
  }
}

function generateSimilarRecordsbyMonth(record) {
  "use strict"; // Enable strict mode for this function

  var endDate = new Date(record.SubscriptionEndDate);
  var startDate = new Date(record.SubscriptionStartDate);

  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return [];
  }
  if (startDate.getFullYear() === 1) {
    return [];
  }
  // var currentdate= new Date()    ;
  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();
  var monthDifference = (endYear - startYear) * 12 + (endMonth - startMonth);

  var tempdate = new Date(startDate);
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setMonth(endDateForComparison.getMonth() + monthDifference);
  endDateForComparison.setDate(endDate.getDate());
  //  && startDate.getMonth() != endDate.getMonth()
  // Loop from startDate to endDate with frequency as the increment
  while (startDate <= endDateForComparison) {
    if (
      startDate.getFullYear() === endDateForComparison.getFullYear() &&
      startDate.getMonth() === endDateForComparison.getMonth()
    ) {
      break; // Exit loop if year and month match
    }

    var subscriptionAmount =
      record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

    var newRecord = {
      SubscriptionStartDate: tempdate,
      status: record.status, // Convert date to ISO format
      VendorProfile: record.VendorProfile,
      ActivityGuid: record.ActivityId,
      //"ReminderInterval": record.reminderInterval,
      VendorName: record.VendorName,
      SubscriptionEndDate: record.SubscriptionEndDate,
      SubscriptionFrequency: record.SubscriptionFrequency, // Append the frequency to the original value
      SubscriptionContractAmount: {
        Value: subscriptionAmount,
      },
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: {
        Name: record.DepartmentNames.Name,
      },
    };

    monthlySubscription.push(newRecord);

    startDate.setMonth(startDate.getMonth() + frequency);
    tempdate = new Date(startDate);
  }
}

// Global array to store modified objects
function mapVendorProfileNames() {
  vendorProfileCounts.forEach((profile) => {
    profile.VendorProfile = vendorProfileMap[profile.VendorProfile];
  });
}

function processVendorProfiles() {
  "use strict"; // Enable strict mode for this function

  let profileMap = new Map();

  // Iterate through the SubscriptionJSon array
  SubscriptionJSon.forEach((subArray) => {
    subArray.forEach((subscription) => {
      // Check if the subscription object has a VendorProfile
      let vendorProfile = subscription.VendorProfile;
      if (vendorProfile !== null) {
        // Increment the count for this VendorProfile
        if (profileMap.has(vendorProfile)) {
          profileMap.set(vendorProfile, profileMap.get(vendorProfile) + 1);
        } else {
          profileMap.set(vendorProfile, 1);
        }
      }
    });
  });

  // Convert the map to an array of objects with count and VendorProfile attributes
  vendorProfileCounts = Array.from(profileMap, ([VendorProfile, count]) => ({
    VendorProfile,
    count,
  }));
  mapVendorProfileNames();

  // Log the vendorProfileCounts array
}

function filterMonthlySubsinRange() {
  const startDate = new Date(currentDate.getFullYear(), startMonthIndex, 1); // January 1st
  const endDate = new Date(currentDate.getFullYear(), endMonthIndex + 1, 0); // December 31st

  var tempMonthly = [];

  monthlySubscription.forEach(function (record) {
    var subscriptionstartDate = new Date(record.SubscriptionStartDate);

    // Filter records that fall within the full year range
    if (subscriptionstartDate >= startDate && subscriptionstartDate <= endDate) {
      tempMonthly.push(record);
    }
  });

  monthlySubscription = tempMonthly;
}

function removeObjectsWithSameTime(array) {
  "use strict"; // Enable strict mode for this function

  for (let i = 0; i < array.length; i++) {
    let subArray = array[i];
    for (let j = 0; j < subArray.length; j++) {
      let record = subArray[j];
      let startDate = new Date(record.SubscriptionStartDate);
      let endDate = new Date(record.SubscriptionEndDate);
      if (startDate.getTime() === endDate.getTime()) {
        // Remove the object from the array
        subArray.splice(j, 1);
        j--; // Adjust the index after removal
      }
    }
  }
  // return array;
}

function countByVendorName(data) {
  "use strict"; // Enable strict mode for this function

  const result = {};

  // Loop through each array (group) of subscriptions
  data.forEach((subscriptions) => {
    // Loop through each subscription in the group
    subscriptions.forEach((subscription) => {
      // Only count if status is 0
      if (subscription.status === 0) {
        // If vendor already exists in the result, increment the count
        if (result[subscription.VendorName]) {
          result[subscription.VendorName]++;
        } else {
          // If vendor does not exist, add it with count 1
          result[subscription.VendorName] = 1;
        }
      }
    });
  });

  // Convert result to array format as requested
  const finalArray = Object.keys(result).map((vendorName) => ({
    vendor: vendorName,
    count: result[vendorName],
  }));

  // updateChartPieold(finalArray);

  loadChartJS(() => {
    window.updateChartPie = updateChartPie;
    window.setUsageAnalysis = setUsageAnalysis;
    // Now that Chart.js is loaded, initialize the chart
    updateChartPie(finalArray);
    setUsageAnalysis();
  });
}
var dateAppended = false;
let renewal; // Declare a variable to hold the chart instance
//let doughnutChart;
var dataOfCategoryForPagination = [];
let chart5; // Declare chart variable outside the function to access it later
let isDatePickerOpen = false;
var isFilterApplied = false;
var subscription;
var subsActivityLines;
var subscriptionArray = [];
var dataOfDepartmentForShowingInPagination = [];
let gradientChart; // Declare a variable to hold the chart instance

let monthlySpendChart; // Declare a variable to hold the chart instance
// Declare a global variable to hold the chart instance
let usageAnalysis;
let mostExpensiveChart = null;
var currentPage = 1;
let startMonthIndex;
let endMonthIndex;
var vendorProfileCounts = [];
var checkonloadforFinance = true; // this flag is set to set spend by subs tye and most expensive on load of page
const vendorProfileMap = {
  0: "Strategic",
  1: "Tactical",
  2: "Operational",
};
// Initialize the start and end month indices
const currentDate = new Date();
// var Departmentdays;
const rangeValues = [1, 3, 6, 12];

var departmentSliderValue = new Date(
  new Date().getFullYear() + 1,
  new Date().getMonth(),
  new Date().getDate()
);
// Create a date for January 1, 2024
const currentDates = new Date();
const currentYear = currentDates.getFullYear();
var startDateForDep = new Date(currentYear, 0, 1);

var endDateForDep = new Date(startDateForDep.getFullYear(), 11, 31); // Months are zero-based, so 11 is December
const financialYearElement = document.getElementById("financialyear");

var startDateForRen = new Date();
var endDateForRen = new Date(startDateForRen.getFullYear(), 11, 31);

startMonthIndex = 0; // January
endMonthIndex = 11; // December

var startDateforRenwal = 0;
var endDateforRenewal = 11;

let filters = {
  startDate: null,
  endDate: null,
  amount1: null,
  amount2: null,
  status: null,
};
let filtersforRenewal = {
  startDate: null,
  endDate: null,
  amount1: null,
  amount2: null,
  status: null,
};
let filtersForFinance = {
  startDate: null,
  endDate: null,
  amount1: null,
  amount2: null,
  status: null,
};
var isFilterApplied = false;
var isFilterAppliedOnFinance = false;
var isFilterAppliedOnRenewal = false;
let displayedRecordsCount = 0;
const recordsPerPage = 5; // Number of records to show per page
let displayedRecordsCountForDep = 0;
const recordsPerPageForDep = 4;
var displayedRecordsCountForExpired = 0;
var recordsPerPageForExp = 5;
var displayedRecordsCountForRen = 0;
var recordsPerPageForRen = 4;
var displayedRecordsCountforCategory = 0;
var recordsPerPageForCategory = 5;
let loadMoreArray = [];

var monthlySubscription = [];
var monthlyDepartments = [];
var SubscriptionJSon = [];
var SubscriptionJSonBackup = [];
var VendorProfilearr = [];
var checkonLoad = false;
var monthlyRenewal = [];
var nearingRenewal = [];
// Custom popover styles (add these to your CSS)
const styles = `
    .custom-popover {
        position: absolute;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 4px;
        z-index: 1000;
    }
       .popover-content {
        padding: 10px; /* Padding around the content */
        margin: -10px; /* Negative margin to offset the padding */
        font-size: 12px; /* Adjust this value to your desired font size */
         border: 0.5px solid #ccc;
        border-radius: 7px;
    }
`;
const styleSheet = document.createElement("style");
let chartInstance = null; // Declare a global variable to store the chart instance
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
function groupByVendorName(data) {
  const groupedData = [];

  data.forEach((item) => {
    // Find the existing group based on VendorName
    let existingGroup = groupedData.find((group) => group[0]?.VendorName === item.VendorName);

    // If group exists, push item into that group
    if (existingGroup) {
      existingGroup.push(item);
    } else {
      // If no group exists, create a new group
      groupedData.push([item]);
    }
  });

  return groupedData;
}
//Blob Approach
//   function getMonthlySpendApi() {
//     "use strict"; // Enable strict mode

//     var ilojcDiv = document.getElementById("ilojc");
//     var accountId = "{{primaryAccountId}}";
//     var dateUpdated = "{{DateUpdated}}";
//     var vendorData = [];
//     var lastFormattedDate;

//     if (checkonLoad == false) {
//         var contactId = "{{ contactId }}";

//         // Reset data
//         SubscriptionJSonBackup = [];
//         SubscriptionJSon = [];
//         monthlySubscription = [];
//         monthlyRenewal = [];
//         nearingRenewal = [];

//        // fetchAndDisplayLastUpdateDate(accountId, "btnn");

//         var url = `https://deveussubscriptionp9cad.blob.core.windows.net/devblobcontainer/${accountId}.json`;
//         var xhr = new XMLHttpRequest();
//         xhr.withCredentials = true;

//         xhr.addEventListener("readystatechange", function () {
//             if (this.readyState === 4) {
//                 if (this.status === 200) {
//                     try {
//                         const originalData = JSON.parse(this.responseText);
//                         const transformedData = groupByVendorName(originalData.lines);
//                         SubscriptionJSonBackup = transformedData;
//                         SubscriptionJSon = JSON.parse(JSON.stringify(SubscriptionJSonBackup));
//                         countByVendorName(SubscriptionJSon);
//                         modifySubscriptionsWithChartLimit();
//                         modifyDepartmentChartLimit();
//                         modifyRenewalSubscriptionsWithChartLimit();
//                         processVendorProfiles();
//                         var sortedSubscriptions = modifyRenewalCalendarReport(SubscriptionJSon);
//                         var categorizedSubscriptions = categorizeSubscriptionsByUrgency(sortedSubscriptions);
//                         initializeCalendar(categorizedSubscriptions);

//                         if (checkonloadforFinance == true) {
//                             const mostExpensiveSubscriptions = aggregateSubscriptionsByName(subscriptionArray);
//                             setMostExpensiveChart(mostExpensiveSubscriptions);
//                             const aggregatedByVendorProfile = aggregateByVendorProfileAndMonth(subscriptionArray);
//                             setMonthlySpendLineChart(aggregatedByVendorProfile);
//                             var subsbyCategory = aggregateSubscriptionsByCategory(SubscriptionJSon);
//                             populateCategoryTable(subsbyCategory);
//                             checkonloadforFinance = false;
//                             const body = document.body;
//                             body.style.zoom = "101%";
//                             setTimeout(() => {
//                                 body.style.zoom = "100%";
//                             }, 100);
//                             hideSkeletonLoader()
//                            // closePopup("popup_loading");
//                             ilojcDiv.style.display = "block"; // Show the div again
//                         }
//                     } catch (e) {
//                         console.error("Error parsing JSON data:", e);
//                     }
//                 } else if (this.status === 404) {
//                     console.error("Blob file does not exist at the specified URL:", url);
//                     hideSkeletonLoader()
//                     //closePopup("popup_loading");
//                 } else {
//                     console.error("Error retrieving data. Status:", this.status, this.statusText);
//                 }
//             }
//         });

//         xhr.open("GET", url);
//         xhr.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
//         xhr.send();
//     } else {
//         SubscriptionJSon = JSON.parse(JSON.stringify(SubscriptionJSonBackup));
//         monthlySubscription = [];
//         monthlyDepartments = [];
//         monthlyRenewal = [];
//         nearingRenewal = [];
//         modifySubscriptionsWithChartLimit();
//         modifyDepartmentChartLimit();
//         modifyRenewalSubscriptionsWithChartLimit();
//         var sortedSubscriptions = modifyRenewalCalendarReport(SubscriptionJSon);
//         var categorizedSubscriptions = categorizeSubscriptionsByUrgency(sortedSubscriptions);
//         initializeCalendar(categorizedSubscriptions);
//         hideSkeletonLoader()
//         //closePopup("popup_loading");
//     }
// }

//Azure Function Approach
function getMonthlySpendApi() {
  "use strict";

  const accountId = window.APP_CONFIG.primaryAccountId;
  const dateUpdated = window.APP_CONFIG.dateUpdated;
  const contactId = window.APP_CONFIG.contactId;

  // Validate values
  if (!contactId || contactId === "") {
    console.error("Contact ID is empty");
    showErrorMessage("Contact ID not available. Please ensure you're properly logged in.");
    return;
  }
  // Ensure Azure services are available
  ensureAzureServices();

  var ilojcDiv = document.getElementById("ilojc");
  var vendorData = [];
  var lastFormattedDate;

  if (checkonLoad == false) {
    // Reset data
    SubscriptionJSonBackup = [];
    SubscriptionJSon = [];
    monthlySubscription = [];
    monthlyRenewal = [];
    nearingRenewal = [];

    // Call Azure Function
    if (typeof baseUrlService !== "undefined" && typeof azureKeyService !== "undefined") {
      // Use Azure Function
      callGetActivityLinesAzureFunction(contactId)
        .then((originalData) => {
          handleActivityLinesSuccess(originalData, accountId, ilojcDiv);
        })
        .catch((azureError) => {
          console.error("Azure Function call failed:", azureError);
          handleActivityLinesError(ilojcDiv);
        });
    } else {
      console.error("Azure services not available");
      handleActivityLinesError(ilojcDiv);
    }
  } else {
    // Use cached data
    SubscriptionJSon = JSON.parse(JSON.stringify(SubscriptionJSonBackup));
    monthlySubscription = [];
    monthlyDepartments = [];
    monthlyRenewal = [];
    nearingRenewal = [];
    modifySubscriptionsWithChartLimit();
    modifyDepartmentChartLimit();
    modifyRenewalSubscriptionsWithChartLimit();
    var sortedSubscriptions = modifyRenewalCalendarReport(SubscriptionJSon);
    var categorizedSubscriptions = categorizeSubscriptionsByUrgency(sortedSubscriptions);
    initializeCalendar(categorizedSubscriptions);
    hideSkeletonLoader();
  }
}

// Azure Function call for GetActivityLinesByContactId
async function callGetActivityLinesAzureFunction(contactId) {
  try {
    // Double-check that services are available
    if (typeof baseUrlService === "undefined" || typeof azureKeyService === "undefined") {
      throw new Error("Azure services are not available");
    }

    // Get Azure Function key and base URL
    const [baseUrl, funcKey] = await Promise.all([
      baseUrlService.getBaseUrl(),
      azureKeyService.getAzureFunctionKey(),
    ]);

    // Construct the Azure Function URL with contactId as parameter
    const azureFunctionUrl = `${baseUrl}/GetActivityLinesByContactId?contactId=${contactId}`;

    console.log("Calling Azure Function to get activity lines...");

    // Make the API call
    const response = await fetch(azureFunctionUrl, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": funcKey,
        "Cache-Control": "no-cache, no-store, max-age=0",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("DATA_NOT_FOUND");
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Azure Function call successful");
    return result;
  } catch (error) {
    console.error("Azure Function call failed:", error);
    throw error;
  }
}

// Handle successful response
function handleActivityLinesSuccess(originalData, accountId, ilojcDiv) {
  try {
    console.log("Processing activity lines data:", originalData);

    // Extract lines from response - handle different response structures
    var lines;

    if (originalData && Array.isArray(originalData)) {
      // Response is directly an array
      lines = originalData;
      console.log("Response is direct array, length:", lines.length);
    } else if (originalData.lines && Array.isArray(originalData.lines)) {
      // Azure Function format with "lines" property
      lines = originalData.lines;
      console.log("Found lines array, length:", lines.length);
    } else if (originalData.ActivityLines && Array.isArray(originalData.ActivityLines)) {
      // Alternative Azure Function format
      lines = originalData.ActivityLines;
      console.log("Found ActivityLines array, length:", lines.length);
    } else if (originalData.value && Array.isArray(originalData.value)) {
      // OData format
      lines = originalData.value;
    } else {
      // Unknown format - try to extract any array property
      const arrayKeys = Object.keys(originalData).filter((key) => Array.isArray(originalData[key]));
      if (arrayKeys.length > 0) {
        lines = originalData[arrayKeys[0]];
      } else {
        console.error("No array found in response. Available keys:", Object.keys(originalData));
        throw new Error("No activity lines array found in response");
      }
    }

    if (!lines || !Array.isArray(lines)) {
      console.error("Lines is not an array:", lines);
      throw new Error("Activity lines data is not in expected array format");
    }

    // Transform Azure Function response
    const transformedLines = transformAzureResponseToBlobFormat(lines);

    // Continue with original processing logic
    const transformedData = groupByVendorName(transformedLines);
    SubscriptionJSonBackup = transformedData;
    SubscriptionJSon = JSON.parse(JSON.stringify(SubscriptionJSonBackup));
    countByVendorName(SubscriptionJSon);
    modifySubscriptionsWithChartLimit();
    modifyDepartmentChartLimit();
    modifyRenewalSubscriptionsWithChartLimit();
    processVendorProfiles();
    var sortedSubscriptions = modifyRenewalCalendarReport(SubscriptionJSon);
    var categorizedSubscriptions = categorizeSubscriptionsByUrgency(sortedSubscriptions);
    initializeCalendar(categorizedSubscriptions);

    if (checkonloadforFinance == true) {
      const mostExpensiveSubscriptions = aggregateSubscriptionsByName(subscriptionArray);
      setMostExpensiveChart(mostExpensiveSubscriptions);
      const aggregatedByVendorProfile = aggregateByVendorProfileAndMonth(subscriptionArray);
      setMonthlySpendLineChart(aggregatedByVendorProfile);
      var subsbyCategory = aggregateSubscriptionsByCategory(SubscriptionJSon);
      populateCategoryTable(subsbyCategory);
      checkonloadforFinance = false;
      const body = document.body;
      body.style.zoom = "101%";
      setTimeout(() => {
        body.style.zoom = "100%";
      }, 100);
      hideSkeletonLoader();
      ilojcDiv.style.display = "block"; // Show the div again
    }
  } catch (e) {
    console.error("Error processing activity lines data:", e);
    handleActivityLinesError(ilojcDiv);
  }
}

// Enhanced transformation function with better error handling
function transformAzureResponseToBlobFormat(azureLines) {
  if (!azureLines || !Array.isArray(azureLines)) {
    console.error("azureLines is not an array:", azureLines);
    return [];
  }

  try {
    return azureLines.map((line, index) => {
      try {
        // Map Azure Function field names to expected blob format field names
        const transformedLine = {
          // Map field names based on Azure response structure
          AccountId: line.AccountId,
          ActivityId: line.ActivityId,
          ActivityCreatedOn: line.ActivityCreatedOn,
          SubscriptionCreatedOn: line.SubscriptionCreatedOn,
          VendorName: line.VendorName,
          status: line.status,
          VendorProfile: line.VendorProfile,
          LastDueDate: line.LastDueDate,
          NextDueDate: line.NextDueDate,
          InitiationDate: line.InitiationDate,
          SubscriptionEndDate: line.SubscriptionEndDate,
          SubscriptionStartDate: line.SubscriptionStartDate,
          SubscriptionFrequency: line.SubscriptionFrequency,
          SubscriptionContractAmount: line.SubscriptionContractAmount,
          SubscriptionName: line.SubscriptionName,
          SubscriptionCategory: { Name: line.SubscriptionCategory?.Name },
          DepartmentNames: line.DepartmentNames,

          // Ensure amount value is properly extracted
          Amount:
            line.SubscriptionContractAmount?.Value || line.Amount || line.SubscriptionAmount || 0,

          // Add any other fields that existing functions expect
          DepartmentName: line.DepartmentNames?.Name || line.DepartmentName,
          DepartmentBudget: line.DepartmentNames?.Budget?.Value || line.DepartmentBudget,
        };

        return transformedLine;
      } catch (lineError) {
        console.error(`Error transforming line ${index}:`, lineError, line);
      }
    });
  } catch (error) {
    console.error("Error in transformAzureResponseToBlobFormat:", error);
    return [];
  }
}

// Handle error response (common for both methods)
function handleActivityLinesError(ilojcDiv) {
  console.error("Error retrieving activity lines data");
  hideSkeletonLoader();
  if (ilojcDiv) {
    ilojcDiv.style.display = "block";
  }
}

// Ensure Azure services are available
function ensureAzureServices() {
  if (typeof baseUrlService === "undefined") {
    console.warn("baseUrlService not found, initializing locally");
    try {
      window.baseUrlService = new BaseUrlService();
    } catch (e) {
      console.error("Failed to initialize baseUrlService:", e);
    }
  }
  if (typeof azureKeyService === "undefined") {
    console.warn("azureKeyService not found, initializing locally");
    try {
      window.azureKeyService = new AzureKeyService();
    } catch (e) {
      console.error("Failed to initialize azureKeyService:", e);
    }
  }
}

function modifyRenewalSubscriptionsWithChartLimit() {
  "use strict"; // Enable strict mode

  // Remove duplicate objects based on their time properties
  removeObjectsWithSameTime(SubscriptionJSon);

  // Iterate through each subscription array in SubscriptionJSon
  SubscriptionJSon.forEach(function (subArray) {
    // Loop through each record in the subArray
    subArray.forEach(function (record) {
      // Process only if SubscriptionFrequency is valid and not empty
      if (record.SubscriptionFrequency && record.SubscriptionFrequency.trim() !== "") {
        // Check if the subscription frequency is monthly or contains 'Months'
        if (
          record.SubscriptionFrequency.includes("Monthly") ||
          record.SubscriptionFrequency.includes("Months")
        ) {
          // Generate similar records for monthly renewals
          generateSimilarRecordsbyMonthforRenewal(record);
        }
        // Check if the subscription frequency is yearly or contains 'Years'
        else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          // Generate similar records for yearly renewals
          generateSimilarRecordsbyYearforRenewal(record);
        }
      }
    });
  });

  // Merge all records by month for renewal processing
  mergeRecordsByMonthforRenewal();

  // Close the loading popup after processing is complete
  // closePopup("popup_loading");
}

function generateSimilarRecordsbyMonthforRenewal(record) {
  "use strict"; // Enable strict mode

  // Parse the subscription end and start dates
  var endDate = new Date(record.SubscriptionEndDate);
  var startDate = new Date(record.SubscriptionStartDate);

  // Parse the subscription frequency to get the number of months
  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if the frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return []; // Return an empty array if frequency is invalid
  }

  // Check for an unrealistic year value (e.g., year 1)
  if (startDate.getFullYear() === 1) {
    return []; // Return an empty array if the start year is not valid
  }

  // Initialize year and month variables for calculations
  var startYear = startDate.getFullYear();
  var startMonth = startDate.getMonth();
  var endYear = endDate.getFullYear();
  var endMonth = endDate.getMonth();

  // Calculate the total month difference between start and end dates
  var monthDifference = (endYear - startYear) * 12 + (endMonth - startMonth);

  // Create temporary date objects for looping
  var tempDate = new Date(startDate);
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setMonth(endDateForComparison.getMonth() + monthDifference);
  endDateForComparison.setDate(endDate.getDate());

  // Loop from startDate to endDate with frequency as the increment
  while (startDate <= endDateForComparison) {
    // Exit loop if year and month match the end comparison date
    if (
      startDate.getFullYear() === endDateForComparison.getFullYear() &&
      startDate.getMonth() === endDateForComparison.getMonth()
    ) {
      break; // Exit loop if year and month match
    }

    // Get the subscription amount, defaulting to 0 if null
    var subscriptionAmount =
      record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

    // Create a new record for the monthly renewal
    var newRecord = {
      SubscriptionStartDate: tempDate,
      status: record.status, // Retain the original status
      VendorProfile: record.VendorProfile,
      ActivityGuid: record.ActivityId,
      // "ReminderInterval": record.reminderInterval,
      VendorName: record.VendorName,
      SubscriptionEndDate: record.SubscriptionEndDate,
      SubscriptionFrequency: record.SubscriptionFrequency, // Retain the original frequency
      SubscriptionContractAmount: {
        Value: subscriptionAmount,
      },
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: {
        Name: record.DepartmentNames.Name,
      },
    };

    // Push the new record into the monthlyRenewal array
    monthlyRenewal.push(newRecord);

    // Increment the start date by the frequency
    startDate.setMonth(startDate.getMonth() + frequency);
    tempDate = new Date(startDate); // Update the temporary date
  }
}

function generateSimilarRecordsbyYearforRenewal(record) {
  "use strict"; // Enable strict mode

  // Parse the subscription end and start dates
  var endDate = new Date(record.SubscriptionEndDate);
  var startDate = new Date(record.SubscriptionStartDate);

  // Parse the subscription frequency to determine the increment in years
  var frequency = parseFrequency(record.SubscriptionFrequency);

  // Check if the frequency is a valid number
  if (isNaN(frequency) || frequency == 0) {
    return []; // Return an empty array if frequency is invalid
  }

  // Check for an unrealistic year value (e.g., year 1)
  if (startDate.getFullYear() === 1) {
    return []; // Return an empty array if the start year is not valid
  }

  // Initialize year variables for calculations
  var startYear = startDate.getFullYear();
  var endYear = endDate.getFullYear();
  var yearDifference = endYear - startYear;

  // Create a comparison date by adding the year difference to the start date
  var endDateForComparison = new Date(startDate);
  endDateForComparison.setFullYear(endDateForComparison.getFullYear() + yearDifference);
  endDateForComparison.setDate(endDate.getDate()); // Set to the same day of the month

  // Initialize a temporary date for generating new records
  var tempDate = new Date(startDate);

  // Loop from startDate to endDate with frequency as the increment
  while (startDate.getFullYear() < endDateForComparison.getFullYear()) {
    // Get the subscription amount, defaulting to 0 if null
    var subscriptionAmount =
      record.SubscriptionContractAmount !== null ? record.SubscriptionContractAmount.Value : 0;

    // Create a new record for the yearly renewal
    var newRecord = {
      SubscriptionStartDate: tempDate, // Keep the original start date
      VendorName: record.VendorName,
      status: record.status, // Retain the original status
      VendorProfile: record.VendorProfile,
      ActivityGuid: record.ActivityId,
      // "ReminderInterval": record.reminderInterval,
      SubscriptionEndDate: record.SubscriptionEndDate,
      SubscriptionFrequency: record.SubscriptionFrequency, // Retain the original frequency
      SubscriptionContractAmount: {
        Value: subscriptionAmount,
      },
      SubscriptionName: record.SubscriptionName,
      DepartmentNames: {
        Name: record.DepartmentNames.Name,
      },
    };

    // Push the new record into the monthlyRenewal array
    monthlyRenewal.push(newRecord);

    // Increment the start date by the frequency (in years)
    startDate.setFullYear(startDate.getFullYear() + frequency);

    // Update the temporary date to match the new start date
    tempDate = new Date(startDate);
  }
}

function mergeRecordsByMonthforRenewal() {
  "use strict"; // Enable strict mode

  // Filter monthly subscriptions within a specific range for renewal
  filterMonthlySubsinRangeForRenewal();

  // Create a deep copy of the monthlyRenewal array for nearing renewal processing
  nearingRenewal = JSON.parse(JSON.stringify(monthlyRenewal));

  // Set the nearing renewal subscriptions in the corresponding table
  setSubscriptionNearingRenTable(nearingRenewal);

  // Fill the table with expired subscriptions
  fillExpiredSubscriptionsTable(nearingRenewal);
}

function filterMonthlySubsinRangeForRenewal() {
  "use strict"; // Enable strict mode

  // Define the start and end dates for filtering monthly subscriptions
  const startDate = new Date(currentDate.getFullYear(), startDateforRenwal, 1); // Start date: January 1st of the current year
  const endDate = new Date(currentDate.getFullYear(), endDateforRenewal + 1, 0); // End date: December 31st of the current year

  // Temporary array to hold filtered monthly subscriptions
  var tempMonthly = [];

  // Iterate through each record in the monthlyRenewal array
  monthlyRenewal.forEach(function (record) {
    var subscriptionStartDate = new Date(record.SubscriptionStartDate); // Convert subscription start date to Date object

    // Check if the subscription start date is within the specified range
    if (subscriptionStartDate >= startDate && subscriptionStartDate <= endDate) {
      // Keep the record if the date is within the specified range
      tempMonthly.push(record);
    }
  });

  // Update the monthlyRenewal array to only include the filtered records
  monthlyRenewal = tempMonthly;
}

function fillExpiredSubscriptionsTable(subscriptions) {
  "use strict"; // Enable strict mode

  // Create a deep copy of the subscriptions array to avoid modifying the original data
  let expiredSubscriptions = deepCopyArray(subscriptions);

  // Remove duplicate subscriptions based on SubscriptionName and SubscriptionContractAmount
  expiredSubscriptions = expiredSubscriptions.filter((subscription, index, self) => {
    return (
      index ===
      self.findIndex(
        (s) =>
          s.SubscriptionName === subscription.SubscriptionName &&
          s.SubscriptionContractAmount.Value === subscription.SubscriptionContractAmount.Value
      )
    );
  });

  const today = new Date(); // Get the current date

  // Filter subscriptions to keep only those that are expired
  expiredSubscriptions = expiredSubscriptions.filter((subscription) => {
    return new Date(subscription.SubscriptionEndDate) <= today;
  });

  // Further filter subscriptions based on the specified amount range
  const filteredSubscriptions = expiredSubscriptions.filter((subscription) => {
    const amountValue = subscription.SubscriptionContractAmount.Value;
    const isWithinRange =
      (filtersforRenewal.amount1 === null || amountValue >= filtersforRenewal.amount1) &&
      (filtersforRenewal.amount2 === null || amountValue <= filtersforRenewal.amount2);
    return isWithinRange;
  });

  // Limit the records to show based on specified counts
  const recordsToShow = filteredSubscriptions.slice(
    0,
    displayedRecordsCountForExpired + recordsPerPageForExp
  );
  const tbody = document.getElementById("expiredsub");
  tbody.innerHTML = ""; // Clear existing rows in the table

  // Populate the table with the filtered records
  recordsToShow.forEach((subscription) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${subscription.SubscriptionName}</td>
            <td style="color: #7259F6;">${subscription.SubscriptionContractAmount.Value ? "$" + subscription.SubscriptionContractAmount.Value.toFixed(2) : ""}</td> <!-- Conditional dollar sign -->
            <td style="color: #00C2FA;">${new Date(subscription.SubscriptionStartDate).toLocaleDateString()}</td>
            <td style="color: #00C2FA;">${new Date(subscription.SubscriptionEndDate).toLocaleDateString()}</td>
            <td>${subscription.SubscriptionFrequency}</td>            
            <td>${subscription.status === 0 ? "Active" : "Inactive"}</td>
        `;

    tbody.appendChild(row); // Append the new row to the table body
  });

  // Show "Show More" button if there are more records to display
  if (expiredSubscriptions.length > displayedRecordsCountForExpired + recordsPerPageForExp) {
    const showMoreRow = document.createElement("tr");
    showMoreRow.innerHTML = `
            <td colspan="7" class="text-center">
                <button class="btn" id="ShowMoreforexp" onclick="showMoreRecordsForExp()">Show More</button> 
            </td>
        `;
    tbody.appendChild(showMoreRow); // Append the "Show More" button row
  }
}

function showMoreRecordsForExp() {
  "use strict"; // Enable strict mode

  // Increase the count of displayed records for expired subscriptions
  displayedRecordsCountForExpired += recordsPerPageForExp;

  // Repopulate the table with more records based on updated count
  fillExpiredSubscriptionsTable(nearingRenewal);

  // Add a scrollable class to the table container to enable scrolling
  const tableContainer = document.getElementById("table-container3");
  tableContainer.classList.add("scrollable");
}

function fillDepartmentTable(data) {
  "use strict"; // Enable strict mode

  // Create a deep copy of the provided data to avoid mutating the original data
  dataOfDepartmentForShowingInPagination = JSON.parse(JSON.stringify(data));

  const tbody = document.getElementById("departmentTableBody");
  tbody.innerHTML = ""; // Clear existing rows in the department table

  // Determine the records to show based on pagination parameters
  const recordsToShow = data.slice(0, displayedRecordsCountForDep + recordsPerPageForDep);

  // Loop through the subscriptions and populate the table
  recordsToShow.forEach((subscriptions) => {
    subscriptions.forEach((subscription) => {
      const team = subscription.DepartmentNames.Name; // Extract team name
      const actualSpend = subscription.SubscriptionContractAmount.Value; // Extract actual spend
      const budget =
        subscription.DepartmentNames.Budget !== null ? subscription.DepartmentNames.Budget : ""; // Extract budget, if available

      // Create a new table row and populate it with data
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${team}</td>
                <td style="color: #00C2FA;">${actualSpend ? "$" + actualSpend : ""}</td> <!-- Conditional dollar sign -->
                <td style="color: #7259F6;">${budget ? "$" + budget : ""}</td>
            `;
      tbody.appendChild(row); // Append the row to the table body
    });
  });

  // Show "Show More" button if there are more records to display
  if (data.length > displayedRecordsCountForDep + recordsPerPageForDep) {
    const showMoreRow = document.createElement("tr");
    showMoreRow.innerHTML = `
            <td colspan="7" class="text-center">
                <button class="btn" id="ShowMorefordep" onclick="showMoreRecordsForDep()">Show More</button> 
            </td>
        `;
    tbody.appendChild(showMoreRow); // Append the "Show More" button
  }
}

function setSubscriptionNearingRenTable(subscriptions) {
  "use strict"; // Enable strict mode

  // Create a deep copy of the subscriptions data to avoid mutating the original
  let subscriptionData = deepCopyArray(subscriptions);

  var today = new Date(); // Get the current date

  // Filter out subscriptions that have already ended
  subscriptionData = subscriptionData.filter((subscription) => {
    const endDate = new Date(subscription.SubscriptionEndDate);
    return endDate > today; // Keep only future subscriptions
  });

  var todayForRen = new Date();
  var endOfYear = null;

  // Determine the date range for filtering renewals
  if (filtersforRenewal.startDate == null && filtersforRenewal.endDate == null) {
    endOfYear = new Date(todayForRen.getFullYear(), 11, 31); // Default to December 31st of the current year
  } else {
    todayForRen = new Date(filtersforRenewal.startDate);
    endOfYear = new Date(filtersforRenewal.endDate); // Set end of year based on filter
  }

  // Filter subscriptions to keep those starting within the specified range
  subscriptionData = subscriptionData.filter((subscription) => {
    const startdate = new Date(subscription.SubscriptionStartDate);
    return startdate > todayForRen && startdate <= endOfYear; // Keep subscriptions starting after today and before the end date
  });

  // Remove duplicate subscriptions based on SubscriptionName and SubscriptionContractAmount
  subscriptionData = subscriptionData.filter((subscription, index, self) => {
    return (
      index ===
      self.findIndex(
        (s) =>
          s.SubscriptionName === subscription.SubscriptionName &&
          s.SubscriptionContractAmount.Value === subscription.SubscriptionContractAmount.Value
      )
    );
  });

  const tbody = document.getElementById("Nearingrenewal");
  tbody.innerHTML = ""; // Clear any existing content

  // Determine the records to show based on pagination parameters
  const recordsToShow = subscriptionData.slice(
    0,
    displayedRecordsCountForRen + recordsPerPageForRen
  );
  recordsToShow.forEach((subscription) => {
    const row = document.createElement("tr");

    // Populate the row with subscription data
    row.innerHTML = `
            <td>${subscription.SubscriptionName}</td>
            <td style="color: #7259F6;">${subscription.SubscriptionContractAmount.Value ? "$" + subscription.SubscriptionContractAmount.Value.toFixed(2) : ""}</td> <!-- Conditional dollar sign -->
            <td style="color: #00C2FA;">${new Date(subscription.SubscriptionStartDate).toLocaleDateString()}</td>
            <td style="color: #00C2FA;">${new Date(subscription.SubscriptionEndDate).toLocaleDateString()}</td>
            <td>${subscription.SubscriptionFrequency}</td>
            <td>${subscription.status === 0 ? "Active" : "Inactive"}</td>
        `;

    tbody.appendChild(row); // Append the row to the table body
  });

  // If there are more records to show, display the "Show More" button
  if (subscriptionData.length > displayedRecordsCountForRen + recordsPerPageForRen) {
    const showMoreRow = document.createElement("tr");
    showMoreRow.innerHTML = `
            <td colspan="7" class="text-center">
                <button class="btn" id="ShowMorerenw" onclick="showMoreRecordsForRenw()">Show More</button> 
            </td>
        `;
    tbody.appendChild(showMoreRow); // Append the "Show More" button
  }
}

function modifyRenewalCalendarReport(subscriptions) {
  "use strict"; // Enable strict mode

  // Flatten the array of subscriptions if it's nested
  const flattened = subscriptions.flat();

  // Sort the flattened array by SubscriptionEndDate in ascending order
  const sorted = flattened.sort((a, b) => {
    const dateA = new Date(a.SubscriptionEndDate);
    const dateB = new Date(b.SubscriptionEndDate);
    return dateA - dateB; // Sort in ascending order
  });

  const today = new Date(); // Get the current date

  // Filter the subscriptions to return only those with an end date within the specified range
  const filtered = sorted.filter((subscription) => {
    const endDate = new Date(subscription.SubscriptionEndDate);
    return endDate >= startDateForRen && endDate <= endDateForRen; // Keep subscriptions in the specified date range
  });

  // Further filter subscriptions based on the specified amount range
  // const filteredSubscriptions = filtered.filter(subscription => {
  //     const amountValue = subscription.SubscriptionContractAmount.Value;
  //     const isWithinRange = (filtersforRenewal.amount1 === null || amountValue >= filtersforRenewal.amount1) &&
  //         (filtersforRenewal.amount2 === null || amountValue <= filtersforRenewal.amount2);
  //     return isWithinRange; // Keep subscriptions within the specified amount range
  // });
  const filteredSubscriptions = filtered.filter((subscription) => {
    if (
      !subscription.SubscriptionContractAmount ||
      subscription.SubscriptionContractAmount.Value == null
    ) {
      return false; // Exclude subscriptions with null or missing SubscriptionContractAmount
    }

    const amountValue = subscription.SubscriptionContractAmount.Value;
    const isWithinRange =
      (filtersforRenewal.amount1 === null || amountValue >= filtersforRenewal.amount1) &&
      (filtersforRenewal.amount2 === null || amountValue <= filtersforRenewal.amount2);

    return isWithinRange;
  });

  return filteredSubscriptions; // Return the filtered subscriptions
}

function categorizeSubscriptionsByUrgency(subscriptions) {
  "use strict"; // Enable strict mode

  const today = new Date(startDateForRen); // Get the current date based on the provided start date

  // Create variables for date thresholds: 1 month, 3 months, and 6 months from today
  const oneMonthLater = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const threeMonthsLater = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
  const sixMonthsLater = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());

  // Initialize an object to categorize subscriptions by urgency
  const urgencyCategories = {
    veryUrgent: [], // For subscriptions ending within 1 month
    urgent: [], // For subscriptions ending within 1 to 3 months
    notUrgent: [], // For subscriptions ending within 3 to 6 months
  };

  // Iterate through each subscription and categorize them based on their end date
  subscriptions.forEach((subscription) => {
    const endDate = new Date(subscription.SubscriptionEndDate); // Get the end date of the subscription

    // Categorize based on the defined urgency thresholds
    if (endDate <= oneMonthLater) {
      urgencyCategories.veryUrgent.push(subscription); // Very urgent subscriptions
    } else if (endDate <= threeMonthsLater) {
      urgencyCategories.urgent.push(subscription); // Urgent subscriptions
    } else if (endDate <= sixMonthsLater) {
      urgencyCategories.notUrgent.push(subscription); // Not urgent subscriptions
    }
  });

  return urgencyCategories; // Return the categorized subscriptions
}

// Extracted calendar functionality into a separate function
function formatDate(date) {
  let day = date.getDate().toString().padStart(2, "0");
  let month = (date.getMonth() + 1).toString().padStart(2, "0");
  let year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

// Calendar initialization function
function initializeCalendar(categorizedSubscriptions) {
  "use strict"; // Enable strict mode

  let currentMonth1 = startDateForRen.getMonth(); // Get the month of the starting date
  let currentYear1 = startDateForRen.getFullYear(); // Get the year of the starting date
  let currentMonth2 = (currentMonth1 + 1) % 12; // Calculate the next month
  let currentYear2 = currentMonth1 === 11 ? currentYear1 + 1 : currentYear1; // Handle year transition

  // Build urgentDates dynamically from categorizedSubscriptions
  const urgentDates = {
    veryUrgent: categorizedSubscriptions.veryUrgent.map((sub) =>
      formatDate(new Date(sub.SubscriptionEndDate))
    ),
    urgent: categorizedSubscriptions.urgent.map((sub) =>
      formatDate(new Date(sub.SubscriptionEndDate))
    ),
    notUrgent: categorizedSubscriptions.notUrgent.map((sub) =>
      formatDate(new Date(sub.SubscriptionEndDate))
    ),
  };

  // Create a custom popover element for displaying subscription details
  const customPopover = document.createElement("div");
  customPopover.className = "custom-popover";
  customPopover.style.display = "none"; // Initially hidden
  document.body.appendChild(customPopover);

  function initCalendars() {
    // Render calendars for the current and next month
    renderCalendar(currentMonth1, currentYear1, "#month-year-1");
    renderCalendar(currentMonth2, currentYear2, "#month-year-2");
    updateArrowVisibility(); // Update arrow visibility based on current date
  }

  function renderCalendar(month, year, monthYearId) {
    const monthYearLabel = $(monthYearId).closest(".col-md-6").find(".month-year");
    const weekdays = $(monthYearId).closest(".col-md-6").find(".calendar_weekdays");
    const content = $(monthYearId).closest(".col-md-6").find(".calendar_content");

    // Set the month-year label
    monthYearLabel.text(
      new Date(year, month).toLocaleString("default", { month: "long" }) + " " + year
    );
    weekdays.empty(); // Clear existing weekdays
    content.empty(); // Clear existing calendar content

    // Define weekday names and render them
    const weekdayNames = ["S", "M", "T", "W", "T", "F", "S"];
    weekdayNames.forEach((day) => {
      weekdays.append(`<div>${day}</div>`);
    });

    const firstDay = new Date(year, month, 1).getDay(); // Get the first day of the month
    const totalDays = new Date(year, month + 1, 0).getDate(); // Get total days in the month

    // Render blank days for the first week
    for (let i = 0; i < firstDay; i++) {
      content.append(`<div class="blank"></div>`); // Blank day element
    }

    // Render the days of the month with custom popovers for highlighted days
    for (let day = 1; day <= totalDays; day++) {
      const dateString = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      let urgencyClass = "";
      let subscriptionDetails = "";

      // Find matching subscription for the date and set urgency class
      let matchingSubscription = null;
      categorizedSubscriptions.veryUrgent.forEach((sub) => {
        if (formatDate(new Date(sub.SubscriptionEndDate)) === dateString) {
          urgencyClass = "very-urgent";
          matchingSubscription = sub;
        }
      });
      categorizedSubscriptions.urgent.forEach((sub) => {
        if (formatDate(new Date(sub.SubscriptionEndDate)) === dateString) {
          urgencyClass = "urgent";
          matchingSubscription = sub;
        }
      });
      categorizedSubscriptions.notUrgent.forEach((sub) => {
        if (formatDate(new Date(sub.SubscriptionEndDate)) === dateString) {
          urgencyClass = "not-urgent";
          matchingSubscription = sub;
        }
      });

      // If there's a matching subscription, build the popover content
      if (matchingSubscription) {
        const frequency = matchingSubscription.SubscriptionFrequency || "N/A"; // Default if undefined
        const amount = matchingSubscription.SubscriptionContractAmount?.Value || 0; // Default to 0 if undefined

        subscriptionDetails = `
                    <strong>Subscription Name:</strong> ${matchingSubscription.SubscriptionName}<br>
                    <strong>Frequency:</strong> ${frequency}<br>
                    <strong>Contract Amount:</strong> $${amount.toFixed(2)}<br>
                    <strong>End Date:</strong> ${new Date(matchingSubscription.SubscriptionEndDate).toLocaleDateString()}<br>
                `;
      }

      // Add the day element, attaching the custom popover if it's a highlighted day
      const dayElement = $(
        `<div class="${urgencyClass}"${matchingSubscription ? ` data-popover-content="${subscriptionDetails}"` : ""}>${day}</div>`
      );
      content.append(dayElement); // Append the day element to the calendar content
    }

    // Initialize custom popovers for highlighted days
    $("[data-popover-content]")
      .on("mouseenter", function () {
        const content = $(this).data("popover-content");
        createCustomPopover($(this), content);
      })
      .on("mouseleave", function () {
        $(".custom-popover").remove(); // Remove popover on mouse leave
      });
  }

  function createCustomPopover(element, content) {
    // Remove any existing popovers
    $(".custom-popover").remove();

    // Create custom popover element with a wrapper for padding
    const popover = $(
      '<div class="custom-popover"><div class="popover-content">' + content + "</div></div>"
    );

    // Append to body for positioning
    $("body").append(popover);

    // Positioning the popover
    const offset = element.offset();
    const elementHeight = element.outerHeight();
    const popoverWidth = popover.outerWidth();

    // Adjust this value to reduce the gap
    const gap = 5; // Set the desired gap (e.g., 5px)

    // Set position of the popover
    popover.css({
      top: offset.top - popover.outerHeight() - gap, // Reduce gap here
      left: offset.left + element.outerWidth() / 2 - popoverWidth / 2, // Center it horizontally
    });

    // Optional: Add a fade-in effect
    popover.fadeIn(200);
  }

  function updateArrowVisibility() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const isCurrentMonth1 =
      currentYear1 === today.getFullYear() && currentMonth1 === today.getMonth();
    const isCurrentMonth2 =
      currentYear2 === today.getFullYear() && currentMonth2 === today.getMonth();

    // Hide left arrow if the first month is the current month
    if (isCurrentMonth1) {
      // $('.switch-left').hide();
      $(".switch-left").css({
        "pointer-events": "none", // Disable click events
        opacity: "0.5", // Change opacity to make it look disabled
      });
    } else {
      $(".switch-left").css({
        "pointer-events": "auto", // Enable click events
        opacity: "1", // Full opacity
      });
    }

    const sixMonthsAhead = new Date(currentYear, currentMonth + 5);
    const secondMonthDate = new Date(currentYear2, currentMonth2);
    // Hide right arrow if the second month is the current month

    if (isCurrentMonth2 || secondMonthDate >= sixMonthsAhead) {
      $(".switch-right").css({
        "pointer-events": "none", // Disable click events
        opacity: "0.5", // Change opacity to make it look disabled
      });
    } else {
      $(".switch-right").css({
        "pointer-events": "auto", // Enable click events
        opacity: "1", // Full opacity
      });
    }
  }

  // Event listeners for switching months
  $(".switch-left").click(function () {
    // Decrease the month by 1 and re-render calendars
    currentMonth1--;
    currentMonth2--;
    if (currentMonth1 < 0) {
      currentMonth1 = 11;
      currentYear1--;
    }
    if (currentMonth2 < 0) {
      currentMonth2 = 11;
      currentYear2--;
    }
    initCalendars(); // Re-initialize calendars
  });

  $(".switch-right").click(function () {
    // Increase the month by 1 and re-render calendars
    currentMonth1++;
    currentMonth2++;
    if (currentMonth1 > 11) {
      currentMonth1 = 0;
      currentYear1++;
    }
    if (currentMonth2 > 11) {
      currentMonth2 = 0;
      currentYear2++;
    }
    initCalendars(); // Re-initialize calendars
  });

  // Initial rendering of calendars
  initCalendars();
}

function modifySubscriptionsWithChartLimit() {
  "use strict"; // Enable strict mode

  // Remove objects with the same time (assuming this function handles duplicates)
  removeObjectsWithSameTime(SubscriptionJSon);

  // Loop through the SubscriptionJSon array
  SubscriptionJSon.forEach(function (subArray) {
    // Loop through each record in the subArray
    subArray.forEach(function (record) {
      // Check if SubscriptionFrequency exists and is not empty
      if (record.SubscriptionFrequency && record.SubscriptionFrequency.trim() !== "") {
        if (
          record.SubscriptionFrequency.includes("Monthly") ||
          record.SubscriptionFrequency.includes("Months")
        ) {
          generateSimilarRecordsbyMonth(record);
        } else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsbyYear(record);
        }
      }
    });
  });

  // Merge records by month
  mergeRecordsByMonth();
}

function modifyDepartmentChartLimit() {
  "use strict"; // Enable strict mode

  // Ensure the data is filtered properly
  removeObjectsWithSameTime(SubscriptionJSon);

  SubscriptionJSon.forEach(function (subArray) {
    // Loop through each record in the subArray
    subArray.forEach(function (record) {
      // Process only if SubscriptionFrequency is valid
      if (record.SubscriptionFrequency && record.SubscriptionFrequency.trim() !== "") {
        if (
          record.SubscriptionFrequency.includes("Monthly") ||
          record.SubscriptionFrequency.includes("Months")
        ) {
          generateSimilarRecordsbyMonthforDepartment(record);
        } else if (
          record.SubscriptionFrequency.includes("Yearly") ||
          record.SubscriptionFrequency.includes("Years")
        ) {
          generateSimilarRecordsByYearForDepartment(record);
        }
      }
    });
  });

  mergeRecordsBymonthForDepartment();
  //closePopup("popup_loading");
}

// filtering records that are in range of given dates
function filterMonthlySubsinRangeForDepartment() {
  "use strict"; // Enable strict mode

  const Today = new Date();

  var tempDepartments = [];

  monthlyDepartments.forEach(function (record, index) {
    var subscriptionstartDate = new Date(record.SubscriptionStartDate);

    if (subscriptionstartDate >= startDateForDep && subscriptionstartDate <= endDateForDep) {
      // Keep the record if the end date is within the specified range
      tempDepartments.push(record);
    }
  });
  monthlyDepartments = tempDepartments;
}

function mergeRecordsBymonthForDepartment() {
  "use strict"; // Enable strict mode
  // Create an object to store merged records
  let mergedRecords = {};

  filterMonthlySubsinRangeForDepartment();

  monthlyDepartments.forEach((record) => {
    if (record && record.DepartmentNames.Name) {
      // Extract the month from the SubscriptionnextDate
      const departmentName = record.DepartmentNames.Name; // If the monthKey exists in mergedRecords, accumulate the value
      if (mergedRecords.hasOwnProperty(departmentName)) {
        mergedRecords[departmentName].SubscriptionContractAmount.Value +=
          record.SubscriptionContractAmount.Value;
      } else {
        // Otherwise, create a new entry in mergedRecords
        mergedRecords[departmentName] = { ...record };
      }
    }
  });
  var mergedArray = Object.values(mergedRecords).map((record) => [record]);
  if (isFilterAppliedOnFinance === true) {
    // if user applied any filter then based of amount filter it otherwise on load no need
    mergedArray = mergedArray.map((innerArray) =>
      innerArray.filter((subscription) => {
        var contractAmount = subscription.SubscriptionContractAmount.Value;
        return (
          contractAmount >= filtersForFinance.amount1 && contractAmount <= filtersForFinance.amount2
        );
      })
    );
  }
  updateDepartmentChart(mergedArray);
  fillDepartmentTable(mergedArray);
  setGradientChart(mergedArray);
  var subsbyCategory = aggregateSubscriptionsByCategory(SubscriptionJSon);
  populateCategoryTable(subsbyCategory);
}

function aggregateSubscriptionsByName(subscriptionArray) {
  "use strict"; // Enable strict mode

  let subscriptionAmounts = {};
  subscriptionArray = subscriptionArray.filter((subscription) => subscription.status !== 1);

  // Aggregate amounts by SubscriptionName and SubscriptionContractAmount.Value
  subscriptionArray.forEach((record) => {
    if (
      record &&
      record.SubscriptionName &&
      record.SubscriptionContractAmount &&
      record.SubscriptionContractAmount.Value !== undefined
    ) {
      const name = record.SubscriptionName;
      const amount = record.SubscriptionContractAmount.Value;

      // Create a unique key using both SubscriptionName and SubscriptionContractAmount.Value
      const key = `${name}_${amount}`;

      if (!subscriptionAmounts[key]) {
        subscriptionAmounts[key] = {
          SubscriptionName: name,
          SubscriptionContractAmount: { Value: 0 },
        };
      }
      subscriptionAmounts[key].SubscriptionContractAmount.Value += amount;
    }
  });

  // Convert the aggregated amounts object to an array
  const aggregatedArray = Object.values(subscriptionAmounts);

  // Sort the array by SubscriptionContractAmount in descending order
  aggregatedArray.sort(
    (a, b) => b.SubscriptionContractAmount.Value - a.SubscriptionContractAmount.Value
  );

  // Return the top four subscriptions
  return aggregatedArray.slice(0, 4);
}

function aggregateByVendorProfileAndMonth(records) {
  "use strict"; // Enable strict mode

  // Helper function to get the month name from a date string
  function getMonthName(dateString) {
    const date = new Date(dateString);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[date.getUTCMonth()]; // Using getUTCMonth ensures the correct month index
  }

  // Object to hold aggregated records
  let aggregatedRecords = {};

  // Iterate through the subscription records
  records.forEach((record) => {
    // Destructure necessary values from the record
    const { VendorProfile, SubscriptionContractAmount, SubscriptionStartDate } = record;

    // Check if VendorProfile and SubscriptionContractAmount are valid
    if (
      VendorProfile !== null &&
      VendorProfile !== undefined &&
      SubscriptionContractAmount &&
      SubscriptionStartDate
    ) {
      // Get the month name from the SubscriptionStartDate
      const monthName = getMonthName(SubscriptionStartDate);

      // Create a unique key combining VendorProfile and monthName
      const key = `${VendorProfile}-${monthName}`;

      // Initialize the entry if it doesn't exist
      if (!aggregatedRecords[key]) {
        aggregatedRecords[key] = {
          VendorProfile: VendorProfile,
          SubscriptionContractAmount: { Value: 0 },
          Month: monthName,
        };
      }

      // Accumulate the subscription contract amount
      aggregatedRecords[key].SubscriptionContractAmount.Value += SubscriptionContractAmount.Value;
    }
  });

  // Convert aggregatedRecords object back to an array
  const aggregatedArray = Object.values(aggregatedRecords);

  // Return the aggregated array
  return aggregatedArray;
}

function mergeRecordsByMonth() {
  "use strict"; // Enable strict mode

  // Create an object to store merged records
  let mergedRecords = {};

  filterMonthlySubsinRange(); // Filtering subscriptions that are in range for, say, on load 12 months
  subscriptionArray = JSON.parse(JSON.stringify(monthlySubscription));

  // I need subscriptionArray for the chart's expensive subscription, but that is on another tab. On load, I called that function separately,
  // but after applying the filter, I need this array again. Therefore, up to this point, I am creating an array and calling the expensive chart function from here if the filter is applied.
  if (isFilterAppliedOnFinance == true) {
    subscriptionArray = filterSubscriptionsforFinance(subscriptionArray);
    const mostExpensiveSubscriptions = aggregateSubscriptionsByName(subscriptionArray);
    setMostExpensiveChart(mostExpensiveSubscriptions);
    const aggregatedByVendorProfile = aggregateByVendorProfileAndMonth(subscriptionArray);
    setMonthlySpendLineChart(aggregatedByVendorProfile);
    return; // No need to do the next task that will set data on the first tab
  }

  var activeTab = document.querySelector("#myTab .nav-link.active");
  var status = null;

  // Store the ID of the active tab in a variable
  var activeTabId = activeTab ? activeTab.id : null;
  if (activeTabId == "tab3-tab") {
    status = 1;
  } else if (activeTabId == "tab2-tab") {
    status = 0;
  }

  // Merging records into one array based on their similar months
  monthlySubscription.forEach((record) => {
    if (record && record.SubscriptionStartDate) {
      // Extract the month from the SubscriptionStartDate
      const monthKey = record.SubscriptionStartDate.getMonth();
      // If the monthKey exists in mergedRecords, accumulate the value
      if (mergedRecords.hasOwnProperty(monthKey)) {
        mergedRecords[monthKey].SubscriptionContractAmount.Value +=
          record.SubscriptionContractAmount.Value;
      } else {
        // Otherwise, create a new entry in mergedRecords
        mergedRecords[monthKey] = { ...record };
      }
    }
  });

  // Convert mergedRecords object back to an array of arrays
  const mergedArray = Object.values(mergedRecords).map((record) => [record]);
  let flattenedArray = mergedArray.flat();
  if (checkonLoad == true) {
    flattenedArray = filterSubscriptions(flattenedArray);
  }

  populateSubscriptionTable(status);
  setStandardReportCards(subscriptionArray);
  setMonthlySpendChart(flattenedArray, "next-x-months");
}

function filterSubscriptions(flattenedArray) {
  "use strict"; // Enable strict mode

  // Ensure Amount1 and Amount2 are numbers
  var minRangeInput = document.getElementById("range-min");
  var maxRangeInput = document.getElementById("range-max");
  if (minRangeInput && maxRangeInput) {
    filters.amount1 = minRangeInput.value || null; // Set Amount1
    filters.amount2 = maxRangeInput.value || null; // Set Amount2
  }
  const minAmount = parseFloat(filters.amount1);
  const maxAmount = parseFloat(filters.amount2);

  // Filter the flattenedArray based on SubscriptionContractAmount
  const filteredArray = flattenedArray.filter((subscription) => {
    const contractAmount = subscription.SubscriptionContractAmount.Value;
    return contractAmount >= minAmount && contractAmount <= maxAmount;
  });
  if (filteredArray.length == 0) {
    subscriptionArray = []; // This only happens if the chart has no data
  }
  return filteredArray;
}

function filterSubscriptionsforFinance(flattenedArray) {
  "use strict"; // Enable strict mode

  // Ensure amount1 and amount2 are numbers
  var minRangeInput = document.getElementById("range-min-2");
  var maxRangeInput = document.getElementById("range-max-2");
  if (minRangeInput && maxRangeInput) {
    filtersForFinance.amount1 = minRangeInput.value || null; // Set amount1
    filtersForFinance.amount2 = maxRangeInput.value || null; // Set amount2
  }
  const minAmount = parseFloat(filtersForFinance.amount1);
  const maxAmount = parseFloat(filtersForFinance.amount2);

  // Filter the flattenedArray based on SubscriptionContractAmount
  const filteredArray = flattenedArray.filter((subscription) => {
    const contractAmount = subscription.SubscriptionContractAmount.Value;
    return contractAmount >= minAmount && contractAmount <= maxAmount;
  });
  if (filteredArray.length == 0) {
    subscriptionArray = []; // This only happens if the chart has no data
  }
  return filteredArray;
}

// Setting Subscription Tenure chart
function setMonthlySpendChart(MonthlySpend, Opretorformonths) {
  "use strict"; // Enable strict mode

  let labels = [];
  let totalData = [];
  // For the first time it will be for 12 months, then according to the user range
  for (let i = startMonthIndex; i <= endMonthIndex; i++) {
    let adjustedMonthIndex = ((i % 12) + 12) % 12;

    let year;
    const yDate = new Date(currentDate.getFullYear(), i, 1);
    year = yDate.getFullYear();

    let month = new Date(year, adjustedMonthIndex, 1);
    labels.push(month.toLocaleString("default", { month: "short", year: "numeric" }));

    const monthData = MonthlySpend.find((item) => {
      const itemDate = new Date(item.SubscriptionStartDate);
      const itemMonth = new Date(itemDate.getFullYear(), itemDate.getMonth(), 1);
      const adjustedMonth = new Date(year, adjustedMonthIndex, 1);
      return itemMonth.getTime() === adjustedMonth.getTime();
    });

    if (monthData) {
      totalData.push(monthData.SubscriptionContractAmount.Value);
    } else {
      totalData.push(0);
    }
  }

  const ctx = document.getElementById("line-chart-gradient").getContext("2d");

  // Destroy the previous chart instance if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(114, 89, 246, 0.3)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  // Calculate the max and min values from the totalData
  const maxValue = Math.max(...totalData);
  const minValue = Math.min(...totalData);

  // Determine the step size for four ticks (dividing range by 3)
  const range = maxValue - minValue;
  const stepSize = range > 0 ? Math.ceil(range / 3) : 1; // Divide range by 3 to get 4 ticks (including min)

  // Create a new chart instance and store it in the global variable
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Monthly Spend",
          data: totalData,
          fill: true,
          backgroundColor: gradient,
          borderColor: "#7259F6",
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "#7259F6",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#475467",
            font: {
              size: 12,
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
            font: {
              size: 12,
            },
            stepSize: stepSize,
            callback: function (value) {
              return "$" + value; // Prefix y-axis ticks with $
            },
          },
          // Set the y-axis line color to white
          border: {
            color: "#FFFFFF", // Change this to white
            width: 0, // Optional: specify the width of the border
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#000000",
          bodyColor: "#000000",
          borderColor: "#7259F6",
          borderWidth: 1,
          callbacks: {
            label: function (tooltipItem) {
              return "$" + tooltipItem.raw.toLocaleString();
            },
          },
        },
      },
    },
  });
}

function setStandardReportCards(arraySubs) {
  "use strict"; // Enable strict mode
  var today = new Date();
  // Filter subscriptions which are not expired
  arraySubs = arraySubs.filter((subscription) => {
    const endDate = new Date(subscription.SubscriptionEndDate);
    return endDate > today;
  });

  var todayForRen = new Date();
  var endOfYear = null;
  if (filters.startDate == null && filters.endDate == null) {
    endOfYear = new Date(todayForRen.getFullYear(), 11, 31); // December 31st of the current year
  } else {
    todayForRen = new Date(filters.startDate);
    endOfYear = new Date(filters.endDate);
  }

  // Calculate amount for active subscriptions
  const totalContractAmount = arraySubs.reduce((sum, subscription) => {
    return sum + (subscription.SubscriptionContractAmount?.Value || 0);
  }, 0);

  // Calculate the renewal amount
  const totalContractAmountFuture = arraySubs.reduce((sum, subscription) => {
    const startdate = new Date(subscription.SubscriptionStartDate);
    return startdate >= todayForRen && startdate <= endOfYear
      ? sum + (subscription.SubscriptionContractAmount?.Value || 0)
      : sum;
  }, 0);

  // Remove duplicates
  const uniqueSubscriptions = arraySubs.filter((subscription, index, self) => {
    return index === self.findIndex((s) => s.SubscriptionName === subscription.SubscriptionName);
  });
  var ActiveCount = uniqueSubscriptions.length;
  var spanElement = document.querySelector("#ActiveCostid span");
  spanElement.textContent = totalContractAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  document.querySelector("#ActiveSubsid span").textContent = ActiveCount;

  document.getElementById("renewalcost").querySelector("span").textContent =
    totalContractAmountFuture.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
}

(function (webapi, $) {
  function safeAjax(ajaxOptions) {
    var deferredAjax = $.Deferred();

    shell
      .getTokenDeferred()
      .done(function (token) {
        // add headers for AJAX
        if (!ajaxOptions.headers) {
          $.extend(ajaxOptions, {
            headers: {
              __RequestVerificationToken: token,
            },
          });
        } else {
          ajaxOptions.headers["__RequestVerificationToken"] = token;
        }
        $.ajax(ajaxOptions)
          .done(function (data, textStatus, jqXHR) {
            validateLoginSession(data, textStatus, jqXHR, deferredAjax.resolve);
          })
          .fail(deferredAjax.reject); //AJAX
      })
      .fail(function () {
        deferredAjax.rejectWith(this, arguments); // on token failure pass the token AJAX and args
      });

    return deferredAjax.promise();
  }
  webapi.safeAjax = safeAjax;
})((window.webapi = window.webapi || {}), jQuery);
