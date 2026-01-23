let deleteTargetRow = null;
let deleteRecordId = null;
let deleteAllVendorId = null;
let deleteAllVendorRow = null;
let deleteAllActivityIds = [];

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

function createErrorMessage(inputElement, message) {
  // Remove old error message
  const oldMsg = inputElement.parentElement.querySelector(".error-msg");
  if (oldMsg) oldMsg.remove();

  // Create new error message
  const msg = document.createElement("p");
  msg.className = "error-msg text-red-500 text-xs mt-1";
  msg.innerText = message;

  // Append after the input
  inputElement.parentElement.appendChild(msg);
}

function removeErrorAndClass(inputElement) {
  // Remove error class
  if (inputElement) {
    inputElement.classList.remove("invalid-field");
    // Remove error message
    const oldMsg = inputElement.parentElement.querySelector(".error-msg");
    if (oldMsg) oldMsg.remove();
  }
}

function openPopup(e) {
  const el = document.getElementById(e);
  if (!el) {
    console.warn(`openPopup: element '${e}' not found`);
    return;
  }
  el.classList.add("active");
}

function closePopup(e) {
  const el = document.getElementById(e);
  if (!el) {
    console.warn(`closePopup: element '${e}' not found`);
    return;
  }
  el.classList.remove("active");
}

function showSuccessMessage(message) {
  // Remove existing success message if any
  const existingMsg = document.getElementById("vendor-success-message");
  if (existingMsg) {
    existingMsg.remove();
  }

  // Create success message element
  const successMsg = document.createElement("div");
  successMsg.id = "vendor-success-message";
  successMsg.className =
    "fixed top-4 right-4 z-[2000] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in";
  successMsg.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
    <span>${message}</span>
  `;

  // Add animation styles if not already added
  if (!document.getElementById("vendor-success-styles")) {
    const style = document.createElement("style");
    style.id = "vendor-success-styles";
    style.textContent = `
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(successMsg);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (successMsg.parentElement) {
      successMsg.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out";
      successMsg.style.opacity = "0";
      successMsg.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (successMsg.parentElement) {
          successMsg.remove();
        }
      }, 300);
    }
  }, 3000);
}

export function AddNewVendor(onSuccess, onError, onClose) {
  // Clear previous errors
  const vendorNameInput = document.getElementById("addVendorRecord_name");
  const accountManagerEmailInput = document.getElementById("addVendorRecord_managerEmail");
  const accountManagerPhoneInput = document.getElementById("addVendorRecord_managerPhone");

  // Remove all previous error messages and classes
  removeErrorAndClass(vendorNameInput);
  removeErrorAndClass(accountManagerEmailInput);
  removeErrorAndClass(accountManagerPhoneInput);

  const vendorName = vendorNameInput ? vendorNameInput.value.trim() : "";
  const accountManagerName = document.getElementById("addVendorRecord_managerName")
    ? document.getElementById("addVendorRecord_managerName").value.trim()
    : "";
  const accountManagerEmail = accountManagerEmailInput ? accountManagerEmailInput.value.trim() : "";
  let accountManagerPhone = accountManagerPhoneInput ? accountManagerPhoneInput.value.trim() : "";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[\d\s\-()]+$/;

  // ---------------------
  // VALIDATION
  // ---------------------
  let hasError = false;

  if (!vendorName) {
    if (vendorNameInput) {
      vendorNameInput.classList.add("invalid-field");
      createErrorMessage(vendorNameInput, "Vendor Name is required.");
    }
    hasError = true;
  }

  if (accountManagerEmail && !emailRegex.test(accountManagerEmail)) {
    if (accountManagerEmailInput) {
      accountManagerEmailInput.classList.add("invalid-field");
      createErrorMessage(accountManagerEmailInput, "Please enter a valid email address.");
    }
    hasError = true;
  }

  if (accountManagerPhone && !phoneRegex.test(accountManagerPhone)) {
    if (accountManagerPhoneInput) {
      accountManagerPhoneInput.classList.add("invalid-field");
      createErrorMessage(
        accountManagerPhoneInput,
        "Phone number must contain only numbers, spaces, hyphens, parentheses, and + sign."
      );
    }
    hasError = true;
  }

  if (hasError) {
    return;
  }

  // Clean phone - remove all non-digit characters except +
  accountManagerPhone = accountManagerPhone.replace(/[^\d+]/g, "");

  // -----------------------------------------------
  // PREPARE RECORD
  // -----------------------------------------------
  const record = {
    yiic_vendorname: vendorName,
    yiic_accountmanagername: accountManagerName,
    yiic_accountmanageremail: accountManagerEmail,
    yiic_accountmanagerphone: accountManagerPhone,
    "yiic_Account_yiic_subscriptionsactivity@odata.bind":
      "/accounts(f0983e34-d2c5-ee11-9079-00224827e0df)",
  };

  // Create vendor record with callbacks
  createVendorRecord(record, onSuccess, onError, onClose);
}

const createVendorRecord = async (record, onSuccess, onError, onClose) => {
  try {
    const response = await fetch(
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/createVendor",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
        },
        body: JSON.stringify(record),
      }
    );

    // Check if response is successful (200-299 range, including 201)
    if (response.status >= 200 && response.status < 300) {
      // Try to parse JSON, but handle cases where response might be empty
      let data = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (e) {
          // Response might be empty, that's okay for 201
          console.log("Response body is empty or not JSON, which is fine for 201 status");
        }
      }

      console.log("Vendor created successfully:", data || "No response body");

      // Show success message
      showSuccessMessage("Vendor created successfully!");

      // Clear form fields
      const vendorNameInput = document.getElementById("addVendorRecord_name");
      const accountManagerNameInput = document.getElementById("addVendorRecord_managerName");
      const accountManagerEmailInput = document.getElementById("addVendorRecord_managerEmail");
      const accountManagerPhoneInput = document.getElementById("addVendorRecord_managerPhone");

      if (vendorNameInput) vendorNameInput.value = "";
      if (accountManagerNameInput) accountManagerNameInput.value = "";
      if (accountManagerEmailInput) accountManagerEmailInput.value = "";
      if (accountManagerPhoneInput) accountManagerPhoneInput.value = "";

      // Remove any error messages
      removeErrorAndClass(vendorNameInput);
      removeErrorAndClass(accountManagerEmailInput);
      removeErrorAndClass(accountManagerPhoneInput);

      // Call success callback
      if (onSuccess) {
        onSuccess(data);
      }

      // Close modal
      if (onClose) {
        onClose();
      }
    } else {
      // Handle error response
      let errorMessage = "Failed to create vendor";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Failed to create vendor. Status: ${response.status}`;
      }

      console.error("Error creating vendor:", errorMessage);

      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  } catch (error) {
    console.error("Error creating vendor:", error);
    const errorMessage = error.message || "Failed to create vendor. Please try again.";

    if (onError) {
      onError(errorMessage);
    } else {
      alert(errorMessage);
    }
  }
};

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
function resetDeleteContext() {
  deleteTargetRow = null;
  deleteRecordId = null;
  deleteAllVendorId = null;
  deleteAllVendorRow = null;
  deleteAllActivityIds = [];
}

export function DeleteSubscriptionActivityLine() {
  openPopup("popup_loading");

  if (!deleteRecordId) {
    console.error("deleteRecordId is not defined");
    closePopup("popup_loading");
    return;
  }

  const apiUrl = `https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/deleteSubscriptionActivityLine/${deleteRecordId}`;

  fetch(apiUrl, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json(); // assuming API returns JSON; remove if no body
    })
    .then(() => {
      if (deleteTargetRow) deleteTargetRow.remove();
      closePopup("popup_loading");
      resetDeleteContext();
      const modalEl = document.getElementById("deleteActivityLineConfirmModal");
      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    })
    .catch((xhr) => {
      console.error("Error deleting single activity line:", xhr);
      closePopup("popup_loading");
    });
}

// React-compatible delete vendor function
export async function checkVendorActivityLines(vendorId) {
  try {
    const apiUrl = `https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/getSubscriptionActivityLinesBySubscriptionActivity?subscriptionActivityId=${vendorId}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const activityLines = Array.isArray(data) ? data : data.value || [];

    return {
      hasActivityLines: activityLines.length > 0,
      activityLines: activityLines,
      count: activityLines.length,
    };
  } catch (error) {
    console.error("Error fetching activity lines:", error);
    throw error;
  }
}

// Delete vendor API function
export async function deleteVendorAPI(vendorId) {
  try {
    const apiUrl = `https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/deleteVendor/${vendorId}`;

    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete vendor: ${response.status} - ${errorText}`);
    }

    // Try to parse JSON, but handle empty responses
    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (e) {
        // Empty response is fine for DELETE operations
        console.log("Delete response is empty, which is normal");
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error deleting vendor:", error);
    throw error;
  }
}

// Delete activity line API function
export async function deleteActivityLineAPI(activityLineId) {
  try {
    const apiUrl = `https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/deleteSubscriptionActivityLine/${activityLineId}`;

    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete activity line: ${response.status} - ${errorText}`);
    }

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (e) {
        console.log("Delete response is empty, which is normal");
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error deleting activity line:", error);
    throw error;
  }
}

// Delete vendor with all activity lines
export async function deleteVendorWithActivityLines(vendorId, activityLineIds, onProgress) {
  try {
    // Delete all activity lines first
    if (activityLineIds && activityLineIds.length > 0) {
      for (let i = 0; i < activityLineIds.length; i++) {
        const activityLineId = activityLineIds[i];
        await deleteActivityLineAPI(activityLineId);

        if (onProgress) {
          onProgress(i + 1, activityLineIds.length);
        }

        // Small delay to avoid overwhelming the server
        if (i < activityLineIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    // Then delete the vendor
    await deleteVendorAPI(vendorId);

    return { success: true };
  } catch (error) {
    console.error("Error deleting vendor with activity lines:", error);
    throw error;
  }
}

// Legacy function for backward compatibility
function handleVendorDelete(vendorId, row) {
  const subscriptionActivityId = vendorId; // VendorId is used dynamically
  const apiUrl = `https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/getSubscriptionActivityLinesBySubscriptionActivity?subscriptionActivityId=${subscriptionActivityId}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const activityLines = data; // Assuming the API returns an array directly

      if (activityLines.length > 0) {
        showActivityLinesDeleteModal(activityLines, subscriptionActivityId, row);
      } else {
        showDeleteConfirmationModal(subscriptionActivityId, row);
      }
    })
    .catch((error) => {
      console.error("Error fetching activity lines:", error);
    });
}

function showSingleLineDeleteConfirmation(activityId, tableRow) {
  const modal = new bootstrap.Modal(document.getElementById("deleteActivityLineConfirmModal"));
  deleteRecordId = activityId;
  deleteTargetRow = tableRow;
  modal.show();
}

function showActivityLinesDeleteModal(activityLines, vendorId, vendorRow) {
  const tableBody = document.getElementById("activityLineTableBody");
  tableBody.innerHTML = "";

  activityLines.forEach((line) => {
    const tr = document.createElement("tr");
    const trashIcon = document.createElement("i");
    trashIcon.className = "fa fa-trash";
    trashIcon.style.color = "red";
    trashIcon.style.cursor = "pointer";
    trashIcon.style.fontSize = "19px";
    trashIcon.title = "Delete this line";
    trashIcon.onclick = function () {
      showSingleLineDeleteConfirmation(line.activityid, tr);
    };

    const tdName = document.createElement("td");
    tdName.textContent = line.yiic_subscriptionname;
    const tdAction = document.createElement("td");
    tdAction.appendChild(trashIcon);

    tr.appendChild(tdName);
    tr.appendChild(tdAction);
    tableBody.appendChild(tr);
  });

  deleteAllVendorId = vendorId;
  deleteAllVendorRow = vendorRow;
  deleteAllActivityIds = activityLines.map((l) => l.activityid);

  document.getElementById("deleteAllActivityLinesBtn").onclick = function () {
    const modal = new bootstrap.Modal(document.getElementById("deleteAllConfirmModal"));
    modal.show();
  };

  $("#deleteActivityLinesModal").modal("show");
}

export function deleteAllActivityLines(activityIds, vendorId, vendorRow) {
  openPopup("popup_loading");
  let deleteCount = 0;

  activityIds.forEach((id, index) => {
    setTimeout(() => {
      const apiUrl = `https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/deleteSubscriptionActivityLine/${id}`;

      fetch(apiUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json(); // remove if API does not return a body
        })
        .then(() => {
          deleteCount++;
          if (deleteCount === activityIds.length) {
            deleteVendorinCaseOfAll(vendorId, vendorRow);
            const modalEl = document.getElementById("deleteActivityLinesModal");
            if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl);
              if (modal) modal.hide();
            }
          }
        })
        .catch((xhr) => {
          closePopup("popup_loading");
          console.error("Error deleting activity line:", xhr);
        });
    }, index * 300); // keeps original staggered deletion
  });
}

export function deleteVendor() {
  openPopup("popup_loading");

  if (!deleteRecordId) {
    console.error("deleteRecordId is not defined");
    closePopup("popup_loading");
    return;
  }

  const apiUrl = `https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/deleteVendor/${deleteRecordId}`;

  fetch(apiUrl, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json(); // remove if API does not return body
    })
    .then(() => {
      if (deleteTargetRow) deleteTargetRow.remove();
      resetDeleteContext();
      const modalEl = document.getElementById("deleteVendorConfirmModal");
      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
      closePopup("popup_loading");
      showSuccessAlert("The vendor was deleted successfully!");
      // successBox("Vendor and associated records deleted.");
    })
    .catch((error) => {
      console.error("Error deleting vendor:", error);
      closePopup("popup_loading");
    });
}

function deleteVendorinCaseOfAll(vendorId, row) {
  if (!vendorId) {
    console.error("vendorId is not defined");
    closePopup("popup_loading");
    return;
  }

  const apiUrl = `https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/deleteVendor/${vendorId}`;

  fetch(apiUrl, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json(); // remove if API does not return body
    })
    .then(() => {
      if (row) row.remove();
      resetDeleteContext();
      closePopup("popup_loading");
      showSuccessAlert("The vendor was deleted successfully!");
      // successBox("Vendor and associated records deleted.");
    })
    .catch((xhr) => {
      closePopup("popup_loading");
      console.error("Error deleting vendor:", xhr);
    });
}

function showDeleteConfirmationModal(recordId, row) {
  deleteTargetRow = row;
  deleteRecordId = recordId;
  const modal = new bootstrap.Modal(document.getElementById("deleteVendorConfirmModal"));
  modal.show();
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

export function updateVendor(onSuccess, onError, onClose) {
  "use strict";

  try {
    // Show loading popup when updating
    openPopup("popup_loading");

    // Get the selected row
    const selectedRow = document.querySelector("#Subscriptions tbody tr.highlight");
    if (!selectedRow) {
      const message = "Please select a row to update.";
      closePopup("popup_loading");
      alert(message);
      if (onError) onError(message);
      return;
    }

    const activityID = selectedRow.cells[5].textContent.trim(); // adjust if needed

    // Get updated values from the modal
    const vendorNameField = document.getElementById("editVendor_name");
    const accountManagerName = document
      .getElementById("editVendor_accountManagerName")
      .value.trim();
    const accountManagerEmail = document
      .getElementById("editVendor_accountManagerEmail")
      .value.trim();
    let accountManagerPhone = document
      .getElementById("editVendor_accountManagerPhone")
      .value.trim();

    const vendorName = vendorNameField.value.trim();

    // Validate Vendor Name
    if (vendorName === "") {
      vendorNameField.classList.add("invalid-field");
      const message = "Vendor Name is required.";
      createErrorMessage(vendorNameField, message);
      closePopup("popup_loading");
      if (onError) onError(message);
      return;
    }

    const accountId = window.APP_CONFIG?.primaryAccountId;

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (accountManagerEmail && !emailRegex.test(accountManagerEmail)) {
      const emailInput = document.getElementById("editVendor_accountManagerEmail");
      if (emailInput) {
        emailInput.classList.add("invalid-field");
        createErrorMessage(emailInput, "Enter a valid email address.");
      }
      closePopup("popup_loading");
      if (onError) onError("Enter a valid email address.");
      return;
    }

    // Validate Phone
    const phoneRegex = /^\+?\d+$/;
    if (accountManagerPhone && !phoneRegex.test(accountManagerPhone)) {
      const phoneInput = document.getElementById("editVendor_accountManagerPhone");
      if (phoneInput) {
        phoneInput.classList.add("invalid-field");
        createErrorMessage(phoneInput, "Only numbers allowed, optionally starting with '+'.");
      }
      closePopup("popup_loading");
      if (onError) onError("Only numbers allowed, optionally starting with '+'.");
      return;
    }

    // Sanitize phone
    accountManagerPhone = accountManagerPhone.replace(/\D/g, "");

    // Create update object
    const updateData = {
      yiic_vendorname: vendorName,
      yiic_accountmanagername: accountManagerName,
      yiic_accountmanageremail: accountManagerEmail,
      yiic_accountmanagerphone: accountManagerPhone,
    };

    /*
    checkIfVendorExists(accountId, vendorName, activityID, function () {
      // Duplicate check skipped → directly updating
      updateVendorRecord(
        activityID,
        updateData,
        selectedRow,
        onSuccess,
        onError,
        onClose,
      );
    });
    */

    // Duplicate check skipped → directly updating
    updateVendorRecord(activityID, updateData, selectedRow, onSuccess, onError, onClose);
  } catch (error) {
    console.error("Error preparing vendor update:", error);
    closePopup("popup_loading");
    if (onError) {
      onError(error.message || "Failed to update vendor. Please try again.");
    } else {
      alert("Failed to update vendor. Please try again.");
    }
  }
}

function updateVendorRecord(activityID, updateData, selectedRow, onSuccess, onError, onClose) {
  fetch(
    "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/updateVendor/" +
      activityID,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
      },
      body: JSON.stringify(updateData),
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("API request failed");
      }
      return response.json();
    })
    .then(() => {
      selectedRow.cells[1].textContent = updateData.yiic_vendorname;
      selectedRow.cells[2].textContent = updateData.yiic_accountmanageremail;

      // Show success message
      showSuccessMessage("Vendor updated successfully!");

      closePopup("popup_loading");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    })
    .catch((error) => {
      console.error("Error updating vendor:", error);
      closePopup("popup_loading");
      if (onError) {
        onError(error.message || "Failed to update vendor. Please try again.");
      } else {
        alert("Failed to update vendor. Please try again.");
      }
    });
}

export function populateForm() {
  "use strict";

  // Show loading popup when fetching data
  openPopup("popup_loading");

  // Get the selected row
  const selectedRow = document.querySelector("#Subscriptions tbody tr.highlight");

  if (!selectedRow) {
    alert("Please select a vendor to edit.");
    closePopup("popup_loading");
    return;
  }

  // Get the ActivityID / VendorId from hidden cell
  const activityID = selectedRow.cells[5]?.textContent.trim();

  if (!activityID) {
    alert("Could not find ActivityID.");
    closePopup("popup_loading");
    return;
  }

  // Reset modal fields
  const editVendorNameInput = document.getElementById("editVendor_name");
  const editVendorManagerNameInput = document.getElementById("editVendor_accountManagerName");
  const editVendorManagerEmailInput = document.getElementById("editVendor_accountManagerEmail");
  const editVendorManagerPhoneInput = document.getElementById("editVendor_accountManagerPhone");

  if (editVendorNameInput) editVendorNameInput.value = "";
  if (editVendorManagerNameInput) editVendorManagerNameInput.value = "";
  if (editVendorManagerEmailInput) editVendorManagerEmailInput.value = "";
  if (editVendorManagerPhoneInput) editVendorManagerPhoneInput.value = "";

  // Reset error states
  const nameLimitMsg = document.getElementById("editVendor_nameLimitMessage");
  const managerNameLimitMsg = document.getElementById("editVendor_accountManagerNameLimitMessage");
  const managerEmailLimitMsg = document.getElementById(
    "editVendor_accountManagerEmailLimitMessage"
  );
  const managerPhoneLimitMsg = document.getElementById(
    "editVendor_accountManagerPhoneLimitMessage"
  );

  if (nameLimitMsg) nameLimitMsg.style.display = "none";
  if (managerNameLimitMsg) managerNameLimitMsg.style.display = "none";
  if (managerEmailLimitMsg) managerEmailLimitMsg.style.display = "none";
  if (managerPhoneLimitMsg) managerPhoneLimitMsg.style.display = "none";

  removeErrorAndClass(editVendorNameInput);
  removeErrorAndClass(editVendorManagerNameInput);
  removeErrorAndClass(editVendorManagerEmailInput);
  removeErrorAndClass(editVendorManagerPhoneInput);

  // ✅ NEW API URL
  const apiUrl = `https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/getVendorDetails/${activityID}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((result) => {
      // Populate modal fields (API response mapping)
      document.getElementById("editVendor_name").value =
        result.vendorName || result.yiic_vendorname || "";

      document.getElementById("editVendor_accountManagerName").value =
        result.accountManagerName || result.yiic_accountmanagername || "";

      document.getElementById("editVendor_accountManagerEmail").value =
        result.accountManagerEmail || result.yiic_accountmanageremail || "";

      document.getElementById("editVendor_accountManagerPhone").value =
        result.accountManagerPhone || result.yiic_accountmanagerphone || "";

      // Close loading popup after data is fetched and populated
      closePopup("popup_loading");
    })
    .catch((error) => {
      console.error("Error fetching vendor data:", error);
      closePopup("popup_loading");
      alert("Failed to load vendor data. Please try again.");
    });
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
              // Dispatch custom event for React to handle
              const deleteEvent = new CustomEvent("vendorDeleteRequest", {
                detail: {
                  vendorId: subscription.vendorId,
                  vendorName: subscription.vendorName,
                  row: row,
                },
                bubbles: true,
              });
              document.dispatchEvent(deleteEvent);
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
