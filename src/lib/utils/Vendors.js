let filters = {
  status: 0,
  subscriptionName: null,
};

// Export getter function for filters
export function getFilters() {
  return filters;
}
let totalpagecount = 0;
let totalSubsBudgetpagecount = 0;
var subscriptionArray = [];
var currentStart = 1; // Starting page number for the current page range
var currentEnd = 4; // Ending page number for the current page range
var flag = false;

function renderDepartmentSpendChart() {
  if (!window.Chart) {
    console.warn("Chart.js is not loaded yet");
    return;
  }

  const canvas = document.getElementById("department-spend-chart");
  if (!canvas) {
    console.warn("Canvas element 'department-spend-chart' not found");
    return;
  }
  const ctx = canvas.getContext("2d");

  const dummyLabels = ["HR", "IT", "Finance", "Marketing"];
  const dummyData = [3000, 4500, 1500, 2000];
  const hasValidData = dummyData.some((val) => val > 0);
  const stepSize = 1000;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: dummyLabels,
      datasets: [
        {
          label: "Spend",
          data: dummyData,
          backgroundColor: hasValidData
            ? ["#E1DBFE", "#BFF1FF", "#E1FFBB", "#EAECF0"]
            : ["rgba(0, 0, 0, 0.1)"],
          borderWidth: 0,
          borderRadius: 10,
          hoverBackgroundColor: hasValidData
            ? ["#E1DBFE", "#BFF1FF", "#E1FFBB", "#EAECF0"]
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
            color: "#000",
            font: { size: 12 },
            maxRotation: 0,
            minRotation: 0,
            callback: function (value) {
              return this.getLabelForValue(value).split("\n");
            },
          },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: "#000",
            font: { size: 12 },
            callback: (value) => "$" + value.toLocaleString(),
            stepSize: stepSize,
            maxTicksLimit: 5,
          },
          grid: {
            display: true,
            color: "#EAECF0",
            borderDash: [5, 5],
          },
          beginAtZero: true,
          suggestedMin: 0,
          suggestedMax: stepSize * 5,
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (tooltipItem) => "$" + tooltipItem.raw.toLocaleString(),
          },
        },
        legend: { display: false },
      },
    },
  });
}

// Call this after the chart tile is in the DOM

function renderVendorPieChart({ canvasId, legendId, dataArray, labelKey, valueKey }) {
  if (!window.Chart) {
    console.warn("Chart.js is not loaded yet");
    return null;
  }

  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`Canvas element '${canvasId}' not found`);
    return null;
  }

  defineRoundedDoughnut();

  const backgroundColors = ["#CCD6EB", "#E1FFBB", "#1D225D", "#BFF1FF", "#CFE1FF"];
  const labels = dataArray.map((item) => item[labelKey]);
  const data = dataArray.map((item) => item[valueKey]);
  const ctx = canvas.getContext("2d");

  const chart = new Chart(ctx, {
    type: "RoundedDoughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: dataArray.map((_, i) => backgroundColors[i % backgroundColors.length]),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutoutPercentage: 70,
      legend: {
        display: false,
      },
    },
  });

  const legendElement = document.getElementById(legendId);
  if (legendElement) {
    legendElement.innerHTML = chart.generateLegend();
  }
  return chart;
}

let originalChart = window.Chart; // Store original Chart.js

function loadChartJS(callback) {
  // Check if Chart.js is already loaded and is version 2.x
  if (
    window.Chart &&
    typeof window.Chart === "function" &&
    window.Chart.version &&
    window.Chart.version.startsWith("2.")
  ) {
    callback();
    return;
  }

  // Check if script is already being loaded
  const existingScript = document.querySelector('script[src*="chart.js@2.9.4"]');
  if (existingScript) {
    // Wait for it to load
    existingScript.addEventListener("load", callback);
    return;
  }

  let script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/chart.js@2.9.4";
  script.onload = () => {
    callback();
    setTimeout(() => restoreOriginalChartJS(), 500);
  };
  script.onerror = () => {
    console.error("Failed to load Chart.js");
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
  if (!window.Chart) {
    console.warn("Chart.js is not loaded yet");
    return;
  }

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

function drawAllVendorCharts(result) {
  const activityLineCounts = result.activityLineCountForVendor?.value || [];
  const chart1Data = activityLineCounts.map((item) => ({
    vendor: item.vendor,
    count: item.count,
  }));

  const subscriptionArray = result.vendor || [];
  const chart2Data = subscriptionArray
    .filter((item) => item.amount > 0)
    .map((item) => ({
      vendor: item.vendorName,
      amount: item.amount,
    }));

  //Render the charts
  renderVendorPieChart({
    canvasId: "doughnut-chart-1",
    legendId: "chart-legend-1",
    dataArray: chart1Data,
    labelKey: "vendor",
    valueKey: "count",
  });

  renderVendorPieChart({
    canvasId: "doughnut-chart-2",
    legendId: "chart-legend-2",
    dataArray: chart2Data,
    labelKey: "vendor",
    valueKey: "amount",
  });
}

// jQuery handler removed - using React onChange handler instead (handleStatusChange)

export function SearchSubscriptionNameOnBlur(event) {
  // Check if event exists and if relatedTarget is the search field
  if (event && event.relatedTarget && event.relatedTarget.id === "Searchfeild") {
    return; // Prevent the onblur function from firing if Enter was pressed
  }

  var searchField = document.getElementById("Searchfeild");
  if (!searchField) {
    console.warn("Search field not found");
    return;
  }

  var inputValue = searchField.value.trim();

  // Update filters object with the search value (use null if empty)
  filters.subscriptionName = inputValue || null;

  console.log("Vendor name filter changed (onBlur):", filters); // Debug log

  // Set pagination values (if needed)
  currentStart = 1;
  currentEnd = 4;

  // Clear the value of the input field if needed (if you want to reset it after use)
  var input = document.getElementById("pageInput");
  if (input) {
    input.value = null; // Clear 'pageInput' field
  }

  // Call the function to get the subscription data with updated filters
  getRelationshipSubsLines(1, filters);
}

export function SearchSubscriptionName(event) {
  // Check if the 'Enter' key is pressed
  if (!event || event.key !== "Enter") {
    return;
  }

  var searchField = document.getElementById("Searchfeild");
  if (!searchField) {
    console.warn("Search field not found");
    return;
  }

  // Use the input's ID to get the value of the field
  var inputValue = searchField.value.trim();

  // Update filters object with the search value (use null if empty)
  filters.subscriptionName = inputValue || null;

  console.log("Vendor name filter changed (Enter key):", filters); // Debug log

  // Set pagination values (if needed)
  currentStart = 1;
  currentEnd = 4;

  // Clear the value of the input field if needed (if you want to reset it after use)
  var input = document.getElementById("pageInput");
  if (input) {
    input.value = null; // Clear 'pageInput' field
  }

  // Call the function to get the subscription data with updated filters
  getRelationshipSubsLines(1, filters);
  searchField.blur();
}

export function handleStatusChange(event) {
  var selectedValue = event.target.value;

  // Check if it's "null" or empty string - set to 3 for "All" (matches original logic)
  if (selectedValue === "null" || selectedValue === "" || isNaN(parseInt(selectedValue))) {
    filters.status = 3; // 3 means "All" (no status filter)
  } else {
    filters.status = parseInt(selectedValue); // 0 = Active, 1 = Inactive
  }

  // Preserve the vendor name filter if it exists
  // filters.subscriptionName remains unchanged

  console.log("Status filter changed:", filters); // Debug log

  currentStart = 1;
  currentEnd = 4;
  var input = document.getElementById("pageInput");
  if (input) {
    input.value = null;
  }

  // Call with updated filters
  getRelationshipSubsLines(1, filters);
}

async function callGetVendorDataAzureFunction(requestBody) {
  const url =
    "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/GetVendorData";

  const key = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": key, // ✅ correct
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

export function getRelationshipSubsLines(number, filters, onSuccess, onError) {
  "use strict";

  // Use filters if provided, otherwise use default values
  // Handle status: 0 = Active, 1 = Inactive, 3 = All (no filter)
  const statusValue = filters && filters.status !== undefined ? filters.status : 0;
  // Handle vendor name: use null if empty string or null
  const vendorName =
    filters && filters.subscriptionName && filters.subscriptionName.trim()
      ? filters.subscriptionName.trim()
      : null;

  const body = {
    contactId: "030ef119-c1c1-ee11-9079-00224827e8f9",
    status: statusValue,
    pagenumber: number,
    vendor: vendorName,
  };

  console.log("API Request Body:", body); // Debug log

  // Return the promise so .finally() can be called
  return callGetVendorDataAzureFunction(body)
    .then((result) => {
      // Wait for DOM to be ready before processing
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait

        const checkDOM = () => {
          const tableBody = document.getElementById("subscription-grid-body");
          const paginationDiv = document.getElementById("paginationid");

          if (tableBody && paginationDiv) {
            try {
              handleGetVendorSuccess(result, number); // existing logic
              if (onSuccess) onSuccess(result); // 👈 React ko data
              resolve(result);
            } catch (error) {
              console.error("Error in handleGetVendorSuccess:", error);
              reject(error);
            }
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkDOM, 100);
          } else {
            // DOM elements not found after max attempts, but still process
            console.warn("DOM elements not found after max attempts, processing anyway");
            try {
              handleGetVendorSuccess(result, number);
              if (onSuccess) onSuccess(result);
              resolve(result);
            } catch (error) {
              console.error("Error in handleGetVendorSuccess:", error);
              reject(error);
            }
          }
        };
        checkDOM();
      });
    })
    .catch((error) => {
      console.error("API Error:", error);
      handleGetVendorError();
      if (onError) onError(error);
      throw error; // Re-throw so .finally() still works
    });
}

function generatePagination(totalPages, activePageNumber = 1) {
  var paginationDiv = document.getElementById("paginationid");
  if (!paginationDiv) {
    console.warn("Pagination element 'paginationid' not found");
    return;
  }

  // Remove all current page numbers and arrows before adding new ones
  while (paginationDiv.firstChild) {
    paginationDiv.removeChild(paginationDiv.firstChild);
  }

  // Determine the page range to display (3 pages at a time)
  var pageStart = currentStart;
  var pageEnd = Math.min(currentEnd, totalPages);

  if (pageStart > pageEnd) {
    currentStart = 1;
    currentEnd = 4;
    pageStart = 1;
    pageEnd = totalPages;
    document.getElementById("paginationid").innerHTML = "";
    return;
  }

  // Add the "prev" arrow
  var prevArrow = document.createElement("a");
  prevArrow.href = "#";
  prevArrow.classList.add("prev");
  prevArrow.innerHTML = "&lsaquo;";
  prevArrow.onclick = function (e) {
    e.preventDefault();
    var input = document.getElementById("pageInput");

    // Clear the value of the input field
    if (input) {
      input.value = null; // This will set the value to null
    }
    if (activePageNumber != 1) {
      if (currentStart != 1) {
        currentStart -= 1; // Move to the previous set of pages
        currentEnd -= 1;
      }
      getRelationshipSubsLines(activePageNumber - 1, filters);
    }
  };
  paginationDiv.appendChild(prevArrow);
  if (activePageNumber == 1) {
    prevArrow.setAttribute("disabled", "true");
    prevArrow.style.backgroundColor = "#DCDCEE"; // Grey background
  }

  // Add page number links (3 pages at a time)
  for (var i = pageStart; i <= pageEnd; i++) {
    var pageLink = document.createElement("a");
    pageLink.href = "#";
    pageLink.textContent = i;
    pageLink.onclick = function (e) {
      e.preventDefault();
      handleClick(this); // Update active page and fetch related data
    };

    // If this page number is the active page, add the "active" class
    if (i === activePageNumber) {
      pageLink.classList.add("active");
    }

    paginationDiv.appendChild(pageLink);
  }

  // Add the "next" arrow
  var nextArrow = document.createElement("a");
  nextArrow.href = "#";
  nextArrow.classList.add("next");
  nextArrow.innerHTML = "&rsaquo;";
  nextArrow.onclick = function (e) {
    e.preventDefault();
    var input = document.getElementById("pageInput");

    // Clear the value of the input field
    if (input) {
      input.value = null; // This will set the value to null
    }
    if (activePageNumber < totalPages) {
      if (currentEnd != totalPages && !(totalPages < 4)) {
        currentStart += 1; // Move to the next set of pages
        currentEnd += 1;
      }
      getRelationshipSubsLines(activePageNumber + 1, filters);
    }
  };
  paginationDiv.appendChild(nextArrow);
  if (activePageNumber == totalPages) {
    nextArrow.setAttribute("disabled", "true");
    nextArrow.style.backgroundColor = "#d3d3d3"; // Grey background
    nextArrow.style.pointerEvents = "none"; // Prevent click
  }
}

function handleClick(element) {
  var input = document.getElementById("pageInput");

  // Clear the value of the input field
  if (input) {
    input.value = null; // This will set the value to null
  }
  var activeLinks = document.querySelectorAll(".pagination a");
  activeLinks.forEach(function (link) {
    link.classList.remove("active");
  });
  element.classList.add("active");
  const numberString = element.textContent.trim();

  // Convert the string to a number
  const number = +numberString;
  getRelationshipSubsLines(number, filters);
}

function handleGetVendorSuccess(result, pageNumber) {
  try {
    console.log("Full vendor response:", result);

    // Parse the response data
    var subscriptionArray;
    var count;

    // Check if it's Azure Function format
    if (result.vendor && Array.isArray(result.vendor)) {
      subscriptionArray = result.vendor || [];
      count = result.count || "0";
    } else {
      // Fallback
      subscriptionArray = [];
      count = "0";
    }

    console.log("Parsed subscriptionArray:", subscriptionArray);

    // Handle count parsing
    var countValue;
    try {
      if (typeof count === "string") {
        // Try to parse as JSON first
        try {
          var countJson = JSON.parse(count);
          if (
            countJson.value &&
            Array.isArray(countJson.value) &&
            countJson.value[0] &&
            countJson.value[0].Count !== undefined
          ) {
            countValue = countJson.value[0].Count;
          } else if (countJson.Count !== undefined) {
            // Alternative JSON format
            countValue = countJson.Count;
          } else {
            // If JSON parsing succeeded but structure is different, try direct number parsing
            countValue = parseInt(count) || 0;
          }
        } catch (jsonError) {
          // If JSON parsing fails, try direct number parsing
          countValue = parseInt(count) || 0;
        }
      } else {
        // If count is already a number
        countValue = count;
      }
    } catch (e) {
      console.warn("Error parsing count, using default:", e);
      countValue = 0;
    }

    console.log("Count value:", countValue, "from original count:", count);

    // Handle charts and flag logic
    if (flag == false) {
      // Wait for DOM to be ready before rendering charts
      let chartAttempts = 0;
      const maxChartAttempts = 50; // 5 seconds max wait

      const renderCharts = () => {
        const chart1Canvas = document.getElementById("doughnut-chart-1");
        const chart2Canvas = document.getElementById("doughnut-chart-2");
        const deptChartCanvas = document.getElementById("department-spend-chart");

        if (chart1Canvas && chart2Canvas && deptChartCanvas) {
          try {
            loadChartJS(() => {
              // Both charts need Chart.js, so render them inside the callback
              drawAllVendorCharts(result);
              renderDepartmentSpendChart();
              console.log(result);
            });
            flag = true;
          } catch (error) {
            console.error("Error rendering charts:", error);
            flag = true; // Set flag anyway to prevent infinite retries
          }
        } else if (chartAttempts < maxChartAttempts) {
          chartAttempts++;
          setTimeout(renderCharts, 100);
        } else {
          console.warn("Chart canvas elements not found after max attempts");
          flag = true; // Set flag anyway to prevent infinite retries
        }
      };

      // Start checking after initial render
      setTimeout(renderCharts, 500);
    }

    var itemsPerPage = 10;
    var totalPages = Math.ceil(countValue / itemsPerPage);
    totalpagecount = totalPages;
    var editButton = document.querySelector(".edit-btn");

    // Check if subscriptionArray is empty
    if (subscriptionArray.length === 0) {
      if (editButton) editButton.setAttribute("disabled", "true");
    } else {
      if (editButton) editButton.removeAttribute("disabled");
    }

    generatePagination(totalPages, pageNumber);

    // Update the grid with the subscription data using promise pattern
    if (subscriptionArray.length == 0) {
      setNullGrid();
    } else {
      setGrid(subscriptionArray).then(() => {});
      console.log(subscriptionArray);
    }
  } catch (error) {
    console.error("Error processing vendor data:", error);
    handleGetVendorError();
  }
}

function handleVendorDelete(vendorId, row) {
  // TODO: Implement vendor delete functionality
  console.log("Delete vendor:", vendorId);
  if (confirm("Are you sure you want to delete this vendor?")) {
    // Delete logic here
    row.remove();
  }
}

function setNullGrid() {
  const tableBody = document.getElementById("subscription-grid-body");
  if (!tableBody) {
    console.warn("Table body element 'subscription-grid-body' not found");
    return;
  }
  tableBody.innerHTML = "";

  // Create empty state row
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 4; // Match the number of columns in the table
  cell.style.textAlign = "center";
  cell.style.color = "#8d8888";
  cell.style.fontSize = "14px";
  cell.style.padding = "40px";
  cell.textContent = "No results found";
  row.appendChild(cell);
  tableBody.appendChild(row);
}

function handleGetVendorError() {
  setNullGrid(); // Reset the grid or handle error state
}

export function populateForm() {
  "use strict"; // Enable strict mode for better error checking and prevention
  // fetchDepartments("departmentWrapper2");
  // Open a loading popup while fetching data
  openPopup("popup_loading");
  var UnitMap = {
    0: "Active",
    1: "InActive",
    2: "Canceled",
    3: "Scheduled",
  };

  // Get the selected radio button for the row selector
  //  var selectedRadio = document.querySelector('input[name="row-selector"]:checked');
  // var selectedRow = document.querySelector('tr.highlight');

  var selectedRow = document.querySelector("#Subscriptions tbody tr.highlight");

  document.getElementById("subscriptionLimitMessage").style.display = "none";
  //document.getElementById("editdescriptionLimitMessage").style.display = "none";

  removeErrorAndClass("editContractAmount");
  removeErrorAndClass("editNumUsers");
  removeErrorAndClass("editNumLicenses");
  removeErrorAndClass("editFrequencyNumber");
  removeErrorAndClass("departmentSelect2");
  removeErrorAndClass("editLastDueDate");
  //if (selectedRadio)
  if (selectedRow) {
    var subActivityLineID = selectedRow.cells[12].textContent.trim();
    // Traverse up the DOM to find the closest row element
    // var row = selectedRadio.closest('tr');

    // // Get the SubActivityLineID cell from the last cell in the row
    // var subActivityLineIDCell = row.cells[row.cells.length - 1]; // Last cell in the row

    // // Retrieve and trim the SubActivityLineID value
    // var subActivityLineID = subActivityLineIDCell.textContent.trim();

    // Make an AJAX request to fetch subscription activity lines
    webapi.safeAjax({
      type: "GET",
      // url: "/_api/yiic_subscriptionsactivitylines?$select=activityid,statecode,yiic_isitautorenewcontract,yiic_doyourequireapartnerforrenewal,yiic_nooflicenses,yiic_subscriptionfrequencyunit,yiic_subscriptionfrequencynumber,yiic_noofcurrentusers,modifiedon,description,yiic_activityid,yiic_subscriptionname,yiic_subscriptioncontractamount,yiic_subscriptionfrequency,yiic_lastduedate,yiic_nextduedate,yiic_subscriptionstartdate,yiic_subscriptionenddate,_yiic_subscriptionactivity_value&$expand=yiic_Subscriptionactivity_yiic_subscriptionsactivityline($select=activityid,yiic_accountmanageremail,yiic_accountmanagername,modifiedon,subject,yiic_accountmanagerphone,yiic_subscriptionamount,yiic_vendorname,yiic_activityid,_yiic_account_value)&$filter=(activityid eq " + subActivityLineID + " and modifiedon le '" + encodeURIComponent(new Date().toISOString()) + "')",
      url:
        "/_api/yiic_subscriptionsactivitylines?" +
        "$select=activityid,statecode,yiic_isitautorenewcontract,yiic_doyourequireapartnerforrenewal,yiic_nooflicenses," +
        "yiic_subscriptionfrequencyunit,yiic_subscriptionfrequencynumber,yiic_noofcurrentusers,modifiedon,description," +
        "yiic_activityid,yiic_subscriptionname,yiic_subscriptioncontractamount,yiic_subscriptionfrequency,yiic_lastduedate," +
        "yiic_nextduedate,yiic_subscriptionstartdate,yiic_subscriptionenddate,_yiic_subscriptionactivity_value," +
        "_yiic_subscriptiondepartment_value" + // ADD THIS
        "&$expand=" +
        "yiic_Subscriptionactivity_yiic_subscriptionsactivityline(" +
        "$select=activityid,yiic_accountmanageremail,yiic_accountmanagername,modifiedon,subject,yiic_accountmanagerphone," +
        "yiic_subscriptionamount,yiic_vendorname,yiic_activityid,_yiic_account_value)," +
        "yiic_SubscriptionDepartment_yiic_subscriptionsactivityline(" + // ADD THIS
        "$select=yiic_budget,yiic_name)" +
        "&$filter=(activityid eq " +
        subActivityLineID +
        " and modifiedon le '" +
        encodeURIComponent(new Date().toISOString()) +
        "')",

      contentType: "application/json; charset=utf-8",
      success: function (data) {
        if (data) {
          // Access the first activity line from the returned data
          var activityLine = data.value[0];
          var subscription = activityLine.yiic_Subscriptionactivity_yiic_subscriptionsactivityline;
          var department = activityLine.yiic_SubscriptionDepartment_yiic_subscriptionsactivityline;

          const preselectedDepartmentId = activityLine._yiic_subscriptiondepartment_value;
          const preselectedDepartmentName = department?.yiic_name;
          const departmentWrapper = document.getElementById("departmentWrapper2");
          if (preselectedDepartmentName != null) {
            // Set the newly added subscription as selected
            var placeholder = departmentWrapper.querySelector(".optionName");
            placeholder.textContent = preselectedDepartmentName;
            departmentWrapper.classList.remove("show-options");
            departmentWrapper.setAttribute("data-selected-value", preselectedDepartmentId);
          } else {
            departmentWrapper.setAttribute("data-selected-value", "");
            var placeholder = departmentWrapper.querySelector(".optionName");
            placeholder.textContent = "Select Department";
          }

          // Populate form fields with the retrieved data
          document.getElementById("editContractAmount").value =
            activityLine.yiic_subscriptioncontractamount !== null
              ? activityLine.yiic_subscriptioncontractamount.toString()
              : "";
          document.getElementById("editDescription").value =
            activityLine.description !== null ? activityLine.description : "";
          enforceEditCharacterLimit("editDescription", "editDescriptionCounter", 2000);

          // document.getElementById('editStartDate').value = activityLine.yiic_subscriptionstartdate !== null ? activityLine.yiic_subscriptionstartdate.substring(0, 10) : '';
          document.getElementById("editEndDate").value =
            activityLine.yiic_subscriptionenddate !== null
              ? activityLine.yiic_subscriptionenddate.substring(0, 10)
              : "";

          // Get the start date value
          var startDate =
            activityLine.yiic_subscriptionstartdate !== null
              ? activityLine.yiic_subscriptionstartdate.substring(0, 10)
              : "";
          document.getElementById("editStartDate").value = startDate;

          // Get the end date field
          var endDateField = document.getElementById("editEndDate");

          // If start date is empty, disable end date
          if (!startDate) {
            endDateField.disabled = true; // Disable the field
          } else {
            // Set the end date value and enable the field
            endDateField.disabled = false;
          }

          document.getElementById("editFrequencyNumber").value =
            activityLine.yiic_subscriptionfrequencynumber !== null
              ? activityLine.yiic_subscriptionfrequencynumber
              : "";
          document.getElementById("editFrequencyUnit").value =
            activityLine.yiic_subscriptionfrequencyunit;
          document.getElementById("editNumLicenses").value = activityLine.yiic_nooflicenses || "";
          document.getElementById("editActivityStatus").value = UnitMap[activityLine.statecode];
          //document.getElementById('reminderIntervalUnit').value = activityLine.yiic_reminderintervalunit;
          document.getElementById("editSubscriptionFrequency").value =
            activityLine.yiic_subscriptionfrequency !== null
              ? activityLine.yiic_subscriptionfrequency
              : "";
          document.getElementById("editLastDueDate").value =
            activityLine.yiic_lastduedate !== null
              ? activityLine.yiic_lastduedate.substring(0, 10)
              : "";
          document.getElementById("editNumUsers").value =
            activityLine.yiic_noofcurrentusers !== null ? activityLine.yiic_noofcurrentusers : "";
          document.getElementById("editNextDueDate").value =
            activityLine.yiic_nextduedate !== null
              ? activityLine.yiic_nextduedate.substring(0, 10)
              : "";
          //document.getElementById('reminderIntervalDays').value = activityLine.yiic_reminderintervaldays || '';
          //document.getElementById('reminderInterval').value = activityLine.yiic_reminderinterval || '';
          document.getElementById("activityLineID").value = activityLine.activityid || "";
          document.getElementById("editSubactivityID").value = activityLine.yiic_activityid || "";
          document.getElementById("editActivityID").value =
            subscription.yiic_activityid !== null ? subscription.yiic_activityid : "";
          document.getElementById("editAccountManagerName").value =
            subscription.yiic_accountmanagername || "";
          document.getElementById("editSubscriptionActivity").value = subscription.subject || "";
          document.getElementById("editAccountManagerEmail").value =
            subscription.yiic_accountmanageremail || "";
          document.getElementById("editAccountManagerPhone").value =
            subscription.yiic_accountmanagerphone || "";
          document.getElementById("editSubscriptionAmount").value =
            subscription.yiic_subscriptionamount !== null
              ? subscription.yiic_subscriptionamount
              : "";
          //document.getElementById('editVendorName').value = subscription.yiic_vendorname || '';
          const vendorField = document.getElementById("editVendorName");
          vendorField.value = subscription.yiic_vendorname || "";
          vendorField.setAttribute("data-subactivity-id", subscription.activityid);

          document.getElementById("editLastUpdated").value =
            activityLine.modifiedon !== null ? activityLine.modifiedon.substring(0, 10) : "";
          document.getElementById("editSubscriptionName").value =
            activityLine.yiic_subscriptionname !== null ? activityLine.yiic_subscriptionname : "";

          // Set checkbox states based on boolean values
          document.getElementById("editRequirePartnerId").checked =
            activityLine.yiic_doyourequireapartnerforrenewal === true;
          document.getElementById("editRequirePartnernoId").checked =
            activityLine.yiic_doyourequireapartnerforrenewal === false;
          document.getElementById("editAutorenewyes").checked =
            activityLine.yiic_isitautorenewcontract === true;
          document.getElementById("editAutoRenewNo").checked =
            activityLine.yiic_isitautorenewcontract === false;

          // Fetch account details for the related subscription
          webapi.safeAjax({
            type: "GET",
            url: "/_api/accounts(" + subscription._yiic_account_value + ")?$select=name",
            contentType: "application/json; charset=utf-8",
            success: function (data) {
              if (data) {
                // Populate the account view field
                var account = data;
                document.getElementById("editAccount").value = account.name || "";
              }
            },
            error: function (err) {
              alert("Couldn't complete request, please try again!");
            },
          });

          // Close the loading popup after data is populated
          closePopup("popup_loading");
        }
      },
      error: function (err) {
        console.error("Error fetching subscription activity lines:", err);
        closePopup("popup_loading"); // Close the loading popup in case of error
      },
    });
  }
}

function setGrid(subscriptions) {
  return new Promise((resolve) => {
    "use strict";

    const tableBody = document.getElementById("subscription-grid-body");
    if (!tableBody) {
      console.warn("Table body element 'subscription-grid-body' not found");
      resolve();
      return;
    }
    tableBody.innerHTML = "";

    const editBtn = document.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.disabled = true;
    }

    const leftSection = document.querySelector(".col-xl-8");
    const rightSection = document.querySelector(".col-xl-4");

    if (subscriptions && subscriptions.length > 0) {
      subscriptions.sort((a, b) =>
        (a.VendorName || "").localeCompare(b.VendorName || "", undefined, {
          sensitivity: "base",
        })
      );

      subscriptions.forEach((subscription) => {
        const row = tableBody.insertRow();

        const radioCell = row.insertCell(0);
        const vendorNameCell = row.insertCell(1);
        const activityIDCell = row.insertCell(2);
        const amountCell = row.insertCell(3);
        const statusCell = row.insertCell(4);
        const vendorIdCell = row.insertCell(5);

        const radioBtn = document.createElement("input");
        radioBtn.type = "radio";
        radioBtn.name = "row-selector";
        radioCell.appendChild(radioBtn);
        radioCell.style.display = "none";

        activityIDCell.textContent = subscription.managerEmail || "";
        vendorNameCell.textContent = subscription.vendorName || "";
        vendorNameCell.style.color = "#4B8FFF";

        amountCell.textContent = subscription.amount !== null ? `$${subscription.amount}` : "";
        amountCell.style.color = "#7259F6";

        vendorIdCell.textContent = subscription.vendorId || "";
        vendorIdCell.style.display = "none";

        const today = new Date();
        const lastUpdated = subscription.lastupdated ? new Date(subscription.lastupdated) : null;

        statusCell.textContent = lastUpdated && lastUpdated < today ? "Active" : "Inactive";

        row.onclick = function () {
          const wasSelected = row.classList.contains("highlight");

          const tbody = document.getElementById("subscription-grid-body");
          if (tbody) {
            tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("highlight"));
          }

          document.querySelectorAll('input[type="radio"]').forEach((rb) => (rb.checked = false));

          if (!wasSelected) {
            row.classList.add("highlight");
            radioBtn.checked = true;
            if (editBtn) {
              editBtn.disabled = false;
            }

            document.getElementById("delete-icon-container")?.remove();

            const statusWrapper = document.createElement("div");
            statusWrapper.style.display = "flex";
            statusWrapper.style.justifyContent = "space-between";
            statusWrapper.style.alignItems = "center";
            statusWrapper.style.width = "100%";

            const statusText = document.createElement("span");
            statusText.textContent = lastUpdated && lastUpdated < today ? "Active" : "Inactive";

            statusWrapper.appendChild(statusText);

            // ✅ DELETE ICON ALWAYS SHOWN (role check removed)
            const deleteIcon = document.createElement("i");
            deleteIcon.className = "fa fa-trash";
            deleteIcon.style.color = "red";
            deleteIcon.style.cursor = "pointer";
            deleteIcon.style.marginRight = "8px";
            deleteIcon.title = "Delete this row";
            deleteIcon.style.fontSize = "19px";
            deleteIcon.id = "delete-icon-container";

            deleteIcon.onclick = function (e) {
              e.stopPropagation();
              handleVendorDelete(subscription.vendorId, row);
            };

            statusWrapper.appendChild(deleteIcon);

            statusCell.innerHTML = "";
            statusCell.appendChild(statusWrapper);
          } else {
            if (editBtn) {
              editBtn.disabled = true;
            }
            document.getElementById("delete-icon-container")?.remove();
          }
        };

        radioBtn.onclick = function (event) {
          event.stopPropagation();

          const tbody = document.getElementById("subscription-grid-body");
          if (tbody) {
            tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("highlight"));
          }

          document.querySelectorAll('input[type="radio"]').forEach((rb) => (rb.checked = false));

          row.classList.add("highlight");
          radioBtn.checked = true;
          if (editBtn) {
            editBtn.disabled = false;
          }
        };

        row.ondblclick = function () {
          const tbody = document.getElementById("subscription-grid-body");
          if (tbody) {
            tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("highlight"));
          }

          document.querySelectorAll('input[type="radio"]').forEach((rb) => (rb.checked = false));

          row.classList.add("highlight");
          radioBtn.checked = true;
          if (editBtn) {
            editBtn.disabled = false;
          }

          $("#editVendorModal").modal("show");
          populateForm();
        };
      });
    } else {
      setNullGrid();
    }

    // Fill remaining empty rows
    const totalDesiredRows = 10;
    const currentRowCount = subscriptions ? subscriptions.length : 0;
    const rowsToAdd = totalDesiredRows - currentRowCount;

    for (let i = 0; i < rowsToAdd; i++) {
      const emptyRow = tableBody.insertRow();
      for (let j = 0; j < 6; j++) {
        const cell = emptyRow.insertCell(j);
        if (j === 0 || j === 5) cell.style.display = "none";
        cell.innerHTML = "&nbsp;";
      }
      emptyRow.style.height = "40px";
      emptyRow.style.backgroundColor = "#fdfdfd";
      emptyRow.style.pointerEvents = "none";
    }

    // Match left & right section height
    setTimeout(() => {
      if (leftSection && rightSection) {
        leftSection.style.minHeight = rightSection.offsetHeight + "px";
      }
    }, 100);

    resolve(); // ✅ grid fully built
  });
}
