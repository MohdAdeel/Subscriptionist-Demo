import API from "../api/api";
let totalpagecount = 0;
var currentStart = 1;
var currentEnd = 4;
var flag = false;
var subscriptionArray = [];
let deleteTargetRow = null;
let deleteRecordId = null;

let filters = {
  status: 0,
  startdate: null,
  enddate: null,
  vendorName: null,
  subscriptionName: null,
};

export async function getRelationshipSubsLines(number, filters) {
  "use strict";

  showLoader();

  // Prepare the request body
  let body = {
    contactId: "030ef119-c1c1-ee11-9079-00224827e8f9",
    status: 0,
    pagenumber: number,
    startdate: null,
    enddate: null,
    vendorName: null,
    subscriptionName: null,
  };
  console.log("Request body:", body);

  try {
    // Hardcoded Azure Function URL and Key
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/GetSubscriptionData";
    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";

    // Call the Azure Function
    const response = await fetch(azureFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": funcKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Azure Function call successful:", result);

    // Pass data to your table handler
    handleGetSubscriptionSuccess(result, number);
  } catch (error) {
    console.error("Azure Function call failed, falling back to error handler:", error);
    handleGetSubscriptionError();
  }
}

export function handleGetSubscriptionSuccess(result, pageNumber) {
  try {
    console.log(result);
    // Parse the response data
    var activityLines = result.ActivityLines || [];
    var subscriptions = result.Subscriptions || [];
    var count = result.TotalCount || "0";

    // Handle count parsing
    var countValue;
    try {
      // Azure Function returns simple number as string
      countValue = parseInt(count) || 0;
    } catch (e) {
      console.warn("Error parsing count, using default:", e);
      countValue = 0;
    }

    console.log("Count value:", countValue);
    console.log("ActivityLines:", activityLines);
    console.log("Subscriptions:", subscriptions);

    var itemsPerPage = 8;
    var totalPages = Math.ceil(countValue / itemsPerPage);
    totalpagecount = totalPages;

    var editButton = document.querySelector(".edit-btn");

    // Check if activityLines is empty
    if (activityLines.length === 0) {
      if (editButton) editButton.setAttribute("disabled", "true");
    } else {
      if (editButton) editButton.removeAttribute("disabled");
    }

    generatePagination(totalPages, pageNumber);

    // Create the subscription array in the format that setGrid expects
    var subscriptionArray = createSubscriptionArrayFromAzureResponse(activityLines, subscriptions);

    console.log("Final subscriptionArray for setGrid:", subscriptionArray);

    // Update the grid with the subscription data
    if (activityLines.length === 0) {
      setNullGrid();
    } else {
      setGrid(subscriptionArray).then(() => {});
    }
  } catch (error) {
    console.error("Error processing subscription data:", error);
    handleGetSubscriptionError();
  }
}

function showLoader() {
  const accordionBody = document.querySelector(".accordion-body");
  const skeletonDiv = document.querySelector(".Skeleton-Div");

  if (accordionBody) {
    accordionBody.classList.add("hidden");
  }

  if (skeletonDiv) {
    skeletonDiv.classList.remove("hidden");
  }
}

function createSubscriptionArrayFromAzureResponse(activityLines, subscriptions) {
  // Create a map of subscriptions by SubscriptionId
  const subscriptionMap = {};
  subscriptions.forEach((sub) => {
    const key = String(sub.SubscriptionId).trim();
    subscriptionMap[key] = {
      ActivityID: sub.ActivityId,
      VendorName: sub.VendorName,
      lastupdated: sub.LastUpdated,
    };
  });

  const subscriptionObj = {};

  activityLines.forEach((activity) => {
    const subscriptionId = String(activity.SubscriptionActivityId).trim();

    // Find matching subscription using SubscriptionId
    const subscriptionData = subscriptionMap[subscriptionId];

    if (!subscriptionData) {
      console.warn(`No subscription found for ID: ${subscriptionId}`);
    }

    // If subscription not yet created, initialize it
    if (!subscriptionObj[subscriptionId]) {
      subscriptionObj[subscriptionId] = {
        ActivityID: subscriptionData?.ActivityID || subscriptionId,
        VendorName: subscriptionData?.VendorName || "",
        lastupdated: subscriptionData?.lastupdated || "",
        activityLines: [],
      };
    }

    // Add activity line details
    const activityObj = {
      SubName: activity.SubscriptionName,
      SubAmount: activity.SubscriptionAmount,
      SubFrequency: activity.SubscriptionFrequency,
      LastDue: activity.LastDueDate,
      NextDue: activity.NextDueDate,
      SubActivityLineID: activity.SubscriptionActivityLineId,
      ReminderInterval: activity.ReminderInterval,
      SubStartDate: activity.SubscriptionStartDate,
      SubEndDate: activity.SubscriptionEndDate,
      Status: activity.Status,
      departmentID: activity.DepartmentId,
      departmentName: activity.DepartmentName,
      description: activity.Description,
    };

    subscriptionObj[subscriptionId].activityLines.push(activityObj);
  });

  const subscriptionArray = Object.values(subscriptionObj);
  return subscriptionArray;
}

function generatePagination(totalPages, activePageNumber = 1) {
  var paginationDiv = document.getElementById("paginationid");
  if (!paginationDiv) return;

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
    const input = document.getElementById("pageInput");
    if (input) input.value = "";
    // This will set the value to null
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
    input.value = null; // This will set the value to null
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

function setNullGrid() {
  const tableBody = document.querySelector("#Subscriptions tbody");
  tableBody.innerHTML = "";

  var dropdown = document.getElementById("Vendoroptions");
  if (!dropdown) {
    console.warn("Vendoroptions dropdown not found in DOM");
    return; // avoid crash
  }

  // Create the paragraph element
  var paragraph = document.createElement("p");

  // Create a new row to hold the paragraph
  var row = document.createElement("tr");

  // Create a cell to hold the paragraph
  var cell = document.createElement("td");
  cell.colSpan = 11; // Set to the number of columns to span across the whole table
  cell.style.textAlign = "center"; // Center the text
  cell.style.color = "#8d8888";
  cell.style.fontSize = "14px";
  cell.style.padding = "10px";

  // Set the text content of the paragraph
  paragraph.textContent = "No results found";

  // Append the paragraph to the cell
  cell.appendChild(paragraph);

  // Append the cell to the row
  row.appendChild(cell);

  // Append the row to the table body
  tableBody.appendChild(row);

  // Optionally hide the button
  //document.getElementById("btnn").style.display = "none";
}

function handleClick(element) {
  const pageInput = document.getElementById("pageInput");

  // 🔐 SAFETY CHECK
  if (pageInput) {
    pageInput.value = null;
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

function formatDate(dateString) {
  "use strict"; // Enable strict mode for better error checking and prevention

  // Handle null or empty date strings by returning an empty string
  if (!dateString) return "";

  // Create a new Date object from the date string
  var date = new Date(dateString);

  // Extract the day, month, and year from the date object
  var day = date.getDate();
  var month = date.getMonth() + 1; // Months are zero-indexed, so add 1
  var year = date.getFullYear();

  // Format the date components to ensure two digits for day and month
  return (day < 10 ? "0" : "") + day + "." + (month < 10 ? "0" : "") + month + "." + year;
}

function applyTooltip(cell, text, maxWidth = "150px") {
  cell.textContent = text || "";
  cell.title = text || ""; // Tooltip with full text
  cell.style.maxWidth = maxWidth;
  cell.style.overflow = "hidden";
  cell.style.textOverflow = "ellipsis";
  cell.style.whiteSpace = "nowrap";
}

function formatFrequency(frequency) {
  // Check if frequency contains "month" or "months"
  if (frequency.includes("Months")) {
    // Replace "months" with "Monthly" and "month" with "Monthly"
    return frequency.replace("Months", "Monthly");
  }
  // Check if frequency contains "year" or "years"
  else if (frequency.includes("Years")) {
    // Replace "years" with "Yearly" and "year" with "Yearly"
    return frequency.replace("Years", "Yearly");
  }
  return frequency; // In case it's an unexpected format, return as is
}

// function enforceEditCharacterLimit(inputId, counterId, maxLength) {
//   const textarea = document.getElementById(inputId);
//   const counter = document.getElementById(counterId);

//   function updateCounter() {
//     if (textarea.value.length > maxLength) {
//       textarea.value = textarea.value.substring(0, maxLength); // Trim extra characters
//     }
//     counter.textContent = textarea.value.length;
//   }

//   // Initial update in case field is pre-filled
//   updateCounter();

//   textarea.addEventListener("input", updateCounter);
// }

// enforceEditCharacterLimit("editDescription", "editDescriptionCounter", 2000);

export function updateActivityLine() {
  "use strict"; // Enable strict mode for better error checking and performance

  ensureAzureServices();
  // Validate due date and department before proceeding
  if (!validateDueDateAndDepartment()) {
    closePopup("popup_loading");
    return; // Prevent submission if validation fails
  }

  // Get the activity line ID
  var subActivityLineID = document.getElementById("activityLineID").value;
  if (!subActivityLineID) {
    alert("No activity line selected.");
    closePopup("popup_loading");
    return;
  }

  // Get and validate numeric inputs
  var numUsersValue = document.getElementById("editNumUsers");
  var numUsers = parseFloat(numUsersValue.value);
  if (isNaN(numUsers)) {
    numUsers = null;
  }

  var numLicensesValue = document.getElementById("editNumLicenses");
  var numLicenses = parseFloat(numLicensesValue.value);
  if (isNaN(numLicenses)) {
    numLicenses = null;
  }

  // Get boolean values from radio buttons
  var requirePartnerOption = document.querySelector(
    'input[id="editRequirePartnerId"]:checked, input[id="editRequirePartnernoId"]:checked'
  );
  var requirePartnerValue = requirePartnerOption ? requirePartnerOption.value : "";
  var doYouRequireAPartnerForRenewal = requirePartnerValue === "true";

  var autoRenewOption = document.querySelector(
    'input[id="editAutorenewyes"]:checked, input[id="editAutoRenewNo"]:checked'
  );
  var autoRenewContractValue = autoRenewOption ? autoRenewOption.value : "";
  var autoRenewContract = autoRenewContractValue === "true";

  // Format dates to ISO string
  var formattedStartDate = formatDateToISOString(document.getElementById("editStartDate").value);
  var formattedEndDate = formatDateToISOString(document.getElementById("editEndDate").value);
  var formattedLastDueDate = formatDateToISOString(
    document.getElementById("editLastDueDate").value
  );
  var formattedNextDueDate = formatDateToISOString(
    document.getElementById("editNextDueDate").value
  );

  // Get frequency unit value
  var frequencyUnitValue = document.getElementById("editFrequencyUnit").value;
  if (frequencyUnitValue) {
    frequencyUnitValue = parseInt(frequencyUnitValue);
  }

  // Validate contract amount
  var contractAmountValue = document.getElementById("editContractAmount");
  var contractAmount = parseFloat(contractAmountValue.value);
  var minAmount = 0;
  var maxAmount = 1000000;

  if (contractAmount < minAmount || contractAmount > maxAmount) {
    contractAmountValue.classList.add("invalid-field");
    createErrorMessage(
      contractAmountValue,
      "Please enter a contract amount between $0 and $1 million"
    );
    return;
  }

  // Validate frequency number
  var frequncynumber = document.getElementById("editFrequencyNumber");
  var freqnumber = parseFloat(frequncynumber.value);
  if (freqnumber < 0 || freqnumber > 1000) {
    frequncynumber.classList.add("invalid-field");
    createErrorMessage(frequncynumber, "Please enter a frequency number between 0 and 1000.");
    return;
  }

  // Validate licenses
  if (numLicenses < 0 || numLicenses > 100000) {
    numLicensesValue.classList.add("invalid-field");
    createErrorMessage(numLicensesValue, "Please enter a number between 0 to 100,000");
    return;
  }

  // Validate users
  if (numUsers < 0 || numUsers > 100000) {
    numUsersValue.classList.add("invalid-field");
    createErrorMessage(numUsersValue, "Please enter a number between 0 to 100,000");
    return;
  }

  // Get department information
  var departmentWrapper = document.getElementById("departmentWrapper2");
  var departmentId = departmentWrapper.getAttribute("data-selected-value");
  var departmentName = departmentWrapper.querySelector(".optionName").textContent;

  // Open loading popup
  openPopup("popup_loading");

  // Prepare the request data
  var requestData = {
    ActivityAutoNumber: document.getElementById("editActivityID").value,
    activityLineId: subActivityLineID,
    subsname: document.getElementById("editSubscriptionName").value,
    description: document.getElementById("editDescription").value,
    subsstartdate: formattedStartDate,
    subsenddate: formattedEndDate,
    subsfrequencynumber:
      document.getElementById("editFrequencyNumber").value === ""
        ? null
        : document.getElementById("editFrequencyNumber").value,
    subsfrequencyunit: frequencyUnitValue,
    autorenewcontract: autoRenewContract,
    licenses: numLicenses,
    currentusers: numUsers,
    doyourequireapart: doYouRequireAPartnerForRenewal,
    subscontractamount:
      document.getElementById("editContractAmount").value === ""
        ? null
        : document.getElementById("editContractAmount").value,
    subsfrequency: document.getElementById("editSubscriptionFrequency").value,
    lastduedate: formattedLastDueDate,
    nextduedate: formattedNextDueDate,
    department: departmentId,
    departmentName: departmentName,
  };

  console.log("Request Data to be sent for updateActivityLine:", requestData);

  // Optionally, also log it as formatted JSON for easier viewing
  console.log("Formatted JSON:\n", JSON.stringify(requestData, null, 4));

  const vendorField = document.getElementById("editVendorName");
  const subActivityId = vendorField.getAttribute("data-subactivity-id");

  // Check for duplicates first
  checkDuplicateSubscription(
    document.getElementById("editSubscriptionName").value,
    subActivityId,
    subActivityLineID // exclude itself
  ).then((duplicate) => {
    if (duplicate) {
      const subscriptionName = document.getElementById("editSubscriptionName").value;
      const vendorName =
        duplicate.yiic_Subscriptionactivity_yiic_subscriptionsactivityline?.yiic_vendorname ||
        "this vendor";

      document.getElementById("duplicateMessage").innerHTML =
        `A subscription named <strong>${subscriptionName}</strong> already exists for vendor <strong>${vendorName}</strong>.`;

      closePopup("popup_loading");

      // Show duplicate modal
      const modal = new bootstrap.Modal(document.getElementById("duplicateSubscriptionModal"));
      modal.show();
      // When duplicate modal opens → bring it above the edit modal
      $("#duplicateModal").on("shown.bs.modal", function () {
        var zIndex = 1050 + 10 * $(".modal:visible").length;
        $(this).css("z-index", zIndex);

        setTimeout(function () {
          $(".modal-backdrop")
            .not(".modal-stack")
            .css("z-index", zIndex - 1)
            .addClass("modal-stack");
        }, 0);
      });

      // When duplicate modal closes → clean backdrop & keep edit modal active
      $("#duplicateModal").on("hidden.bs.modal", function () {
        // Remove the extra backdrop
        $(".modal-backdrop.modal-stack").remove();

        // KEEP the edit modal "modal-open"
        if ($(".modal:visible").length) {
          $("body").addClass("modal-open");
        }
      });

      // Ensure duplicate modal’s backdrop is above the edit modal’s backdrop
      // setTimeout(() => {
      //     document.querySelectorAll('.modal-backdrop')
      //         .forEach(b => b.style.zIndex = 9998);
      // }, 200);

      return;
    }

    // Perform Azure update
    callUpdateSubscriptionActivityLineAzureFunction(requestData)
      .then(() => {
        closePopup("popup_loading");
        $("#editModalCenter").modal("hide");
        updateUIAfterSuccess(requestData);
        EditSuccessbox();
      })
      .catch((error) => {
        closePopup("popup_loading");
        $("#editModalCenter").modal("hide");
        console.error("Azure Function call failed:", error);
        EditSuccessbox();
      });
  });
}

async function callUpdateSubscriptionActivityLineAzureFunction(requestData) {
  try {
    // Hardcoded Azure Function URL
    const azureFunctionUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/UpdateSubscriptionActivityLine";

    console.log("Calling Azure Function to update subscription activity line...");

    // Make the API call
    const response = await fetch(azureFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Azure Function call successful:", result);
    return result;
  } catch (error) {
    console.error("Azure Function call failed:", error);
    throw error;
  }
}

function DeleteSubscriptionActivityLine() {
  openPopup("popup_loading");
  if (!deleteRecordId || !deleteTargetRow) {
    closePopup("popup_loading");
    return;
  }

  const url = `/_api/yiic_subscriptionsactivitylines(${deleteRecordId})`;

  webapi.safeAjax({
    type: "DELETE",
    url: url,
    contentType: "application/json",
    success: function () {
      console.log("Record deleted");
      deleteTargetRow.remove();
      deleteTargetRow = null;
      deleteRecordId = null;
      const modal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal"));
      modal.hide();
      closePopup("popup_loading");
      showSuccessAlert("The activity line was deleted successfully!");
    },
    error: function (xhr) {
      console.log("Deletion failed", xhr);
      closePopup("popup_loading");
    },
  });
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

function removeErrorAndClass(inputid) {
  const inputElement = document.getElementById(inputid);

  // 🔒 Null safety check
  if (inputElement) {
    inputElement.classList.remove("invalid-field");
  } else {
    console.warn(`removeErrorAndClass: '${inputid}' not found`);
  }

  const errorSpan = document.getElementById(inputid + "Error");
  if (errorSpan) {
    errorSpan.style.display = "none";
  }
}

export function populateForm() {
  "use strict";
  openPopup("popup_loading");

  var UnitMap = {
    0: "Active",
    1: "InActive",
    2: "Canceled",
    3: "Scheduled",
  };

  var selectedRow = document.querySelector("#Subscriptions tbody tr.highlight");

  const subLimitMsg = document.getElementById("subscriptionLimitMessage");
  if (subLimitMsg) {
    subLimitMsg.style.display = "none";
  }

  removeErrorAndClass("editContractAmount");
  removeErrorAndClass("editNumUsers");
  removeErrorAndClass("editNumLicenses");
  removeErrorAndClass("editFrequencyNumber");
  removeErrorAndClass("departmentSelect2");
  removeErrorAndClass("editLastDueDate");

  if (selectedRow) {
    var subActivityLineID = selectedRow.cells[12].textContent.trim();
    console.log("Selected SubActivityLineID:", subActivityLineID);

    // 🔴 URL CHANGED (Azure API)
    var url =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/Getsubscriptionactivityline?activityId=" +
      subActivityLineID;

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
      },
    })
      .then((response) => {
        console.log("Subscription fetch response status:", response.status);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Fetched subscription data:", data);
        if (data) {
          var activityLine = data;
          var subscription = activityLine.subscription;
          var department = activityLine.department;

          const preselectedDepartmentId = activityLine.departmentId;
          const preselectedDepartmentName = department?.yiic_name;
          const departmentWrapper = document.getElementById("departmentWrapper2");

          if (preselectedDepartmentName != null) {
            var placeholder = departmentWrapper.querySelector(".optionName");
            placeholder.textContent = preselectedDepartmentName;
            departmentWrapper.classList.remove("show-options");
            departmentWrapper.setAttribute("data-selected-value", preselectedDepartmentId);
          } else {
            departmentWrapper.setAttribute("data-selected-value", "");
            var placeholder = departmentWrapper.querySelector(".optionName");
            placeholder.textContent = "Select Department";
          }

          document.getElementById("editContractAmount").value =
            activityLine.yiic_subscriptioncontractamount !== null
              ? activityLine.yiic_subscriptioncontractamount.toString()
              : "";

          document.getElementById("editDescription").value =
            activityLine.description !== null ? activityLine.description : "";
          enforceEditCharacterLimit("editDescription", "editDescriptionCounter", 2000);

          document.getElementById("editEndDate").value =
            activityLine.yiic_subscriptionenddate !== null
              ? activityLine.yiic_subscriptionenddate.substring(0, 10)
              : "";

          var startDate =
            activityLine.yiic_subscriptionstartdate !== null
              ? activityLine.yiic_subscriptionstartdate.substring(0, 10)
              : "";
          document.getElementById("editStartDate").value = startDate;

          var endDateField = document.getElementById("editEndDate");
          endDateField.disabled = !startDate;

          document.getElementById("editFrequencyNumber").value =
            activityLine.yiic_subscriptionfrequencynumber !== null
              ? activityLine.yiic_subscriptionfrequencynumber
              : "";

          document.getElementById("editFrequencyUnit").value =
            activityLine.yiic_subscriptionfrequencyunit;

          document.getElementById("editNumLicenses").value = activityLine.yiic_nooflicenses || "";

          document.getElementById("editActivityStatus").value = UnitMap[activityLine.statecode];

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

          const vendorField = document.getElementById("editVendorName");
          vendorField.value = subscription.yiic_vendorname || "";
          vendorField.setAttribute("data-subactivity-id", subscription.activityid);

          document.getElementById("editLastUpdated").value =
            activityLine.modifiedon !== null ? activityLine.modifiedon.substring(0, 10) : "";

          document.getElementById("editSubscriptionName").value =
            activityLine.yiic_subscriptionname !== null ? activityLine.yiic_subscriptionname : "";

          document.getElementById("editRequirePartnerId").checked =
            activityLine.yiic_doyourequireapartnerforrenewal === true;

          document.getElementById("editRequirePartnernoId").checked =
            activityLine.yiic_doyourequireapartnerforrenewal === false;

          document.getElementById("editAutorenewyes").checked =
            activityLine.yiic_isitautorenewcontract === true;

          document.getElementById("editAutoRenewNo").checked =
            activityLine.yiic_isitautorenewcontract === false;
          var accountUrl =
            "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/accounts/" +
            subscription.accountId;

          return fetch(accountUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Accept: "application/json",
            },
          });
        } else {
          throw new Error("No data returned");
        }
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok for account data");
        }
        return response.json();
      })
      .then((accountData) => {
        if (accountData) {
          document.getElementById("editAccount").value = accountData.name || "";
        }
        closePopup("popup_loading");
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        alert("Couldn't complete request, please try again!");
        closePopup("popup_loading");
      });
  }
}

export function applyFilters() {
  "use strict"; // Enable strict mode for better error checking and cleaner code

  // Retrieve selected filter values from the dropdowns and input fields
  var selectedVendor = $("#Vendoroptions").val();
  // var selectedInterval = $('#Intervaloptions').val();
  var dateRangeInput = $('input[name="datefilter"]').val();
  var selectedStatus = $("#Statusoptions").val();

  // Filter subscriptions based on selected options
  var filteredSubscriptions = subscriptionArray
    .map(function (subscription) {
      // Check if the subscription matches the selected vendor
      if (selectedVendor !== "option1" && subscription.VendorName !== selectedVendor) {
        return null; // Skip if vendor doesn't match
      }

      // Check if the subscription matches the selected due date range
      if (dateRangeInput) {
        var dateRange = dateRangeInput.split(" - ");
        var fromDate = new Date(dateRange[0]);
        var toDate = new Date(dateRange[1]);

        // Filter activity lines based on selected date range
        var matchingDueDates = subscription.activityLines.filter(function (activity) {
          var lastDueDate = new Date(activity.LastDue);
          return lastDueDate >= fromDate && lastDueDate <= toDate;
        });

        // If no matching due dates found, skip this subscription
        if (matchingDueDates.length === 0) {
          return null;
        }
      }

      // Check if the subscription matches the selected status
      if (selectedStatus !== "4" && selectedStatus !== "null") {
        var filteredActivityLines = subscription.activityLines.filter(function (activity) {
          return activity.Status === parseInt(selectedStatus);
        });

        // Skip if no activity line has the selected status
        if (filteredActivityLines.length === 0) {
          return null;
        }
      }

      // Return a new subscription object with relevant details
      return {
        id: subscription.id,
        ActivityID: subscription.ActivityID,
        VendorName: subscription.VendorName,
        activityLines: matchingDueDates || filteredActivityLines || subscription.activityLines,
      };
    })
    .filter(function (subscription) {
      return subscription !== null; // Remove any null entries
    });

  // Update the grid with the filtered subscriptions
  setGrid(filteredSubscriptions);
}

function showDeleteConfirmationModal(recordId, row) {
  deleteTargetRow = row;
  deleteRecordId = recordId;
  const modal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"));
  modal.show();
}

function setGrid(subscriptions) {
  return new Promise((resolve) => {
    const tableBody = document.querySelector("#subscription-grid-body");
    if (!tableBody) {
      console.warn("Table body not found yet");
      resolve();
      return;
    }

    tableBody.innerHTML = "";

    const editBtn = document.querySelector(".edit-btn");
    const viewBtn = document.querySelector(".view-btn");

    if (editBtn) editBtn.disabled = true;
    if (viewBtn) viewBtn.disabled = true;

    if (subscriptions && subscriptions.length > 0) {
      let allActivities = [];

      subscriptions.forEach((subscription) => {
        subscription.activityLines.forEach((activity) => {
          allActivities.push({ subscription, activity });
        });
      });

      allActivities.sort((a, b) =>
        (a.activity.SubName || "").localeCompare(b.activity.SubName || "", undefined, {
          sensitivity: "base",
        })
      );

      allActivities.forEach(({ subscription, activity }) => {
        const row = tableBody.insertRow();

        const radioCell = row.insertCell(0);
        const subscriptionNameCell = row.insertCell(1);
        const vendorNameCell = row.insertCell(2);
        const activityIDCell = row.insertCell(3);
        const subscriptionAmountCell = row.insertCell(4);
        const departmentCell = row.insertCell(5);
        const startDateCell = row.insertCell(6);
        const endDateCell = row.insertCell(7);
        const paymentFrequencyCell = row.insertCell(8);
        const lastDueDateCell = row.insertCell(9);
        const nextDueDateCell = row.insertCell(10);
        const status = row.insertCell(11);
        const subActivityLineIDCell = row.insertCell(12);

        const radioBtn = document.createElement("input");
        radioBtn.type = "radio";
        radioBtn.name = "row-selector";
        radioCell.appendChild(radioBtn);
        radioCell.style.display = "none";

        const formattedFrequency = activity.SubFrequency
          ? formatFrequency(activity.SubFrequency)
          : "";

        applyTooltip(subscriptionNameCell, activity.SubName || "");
        applyTooltip(vendorNameCell, subscription.VendorName || "");
        applyTooltip(
          subscriptionAmountCell,
          activity.SubAmount != null ? "$" + activity.SubAmount : ""
        );
        subscriptionAmountCell.style.color = "#7259F6";
        applyTooltip(departmentCell, activity.departmentName || "");

        activityIDCell.textContent = subscription.ActivityID || "";
        activityIDCell.classList.add("hidden");

        startDateCell.textContent = formatDate(activity.SubStartDate) || "";
        endDateCell.textContent = formatDate(activity.SubEndDate) || "";
        startDateCell.style.color = "#00C2FA";
        endDateCell.style.color = "#00C2FA";

        paymentFrequencyCell.textContent = formattedFrequency || "";
        lastDueDateCell.textContent = formatDate(activity.LastDue) || "";
        lastDueDateCell.style.color = "red";
        nextDueDateCell.textContent = formatDate(activity.NextDue) || "";

        const today = new Date();
        const subEndDate = new Date(activity.SubEndDate);

        if (activity.SubEndDate) {
          status.textContent = subEndDate < today ? "Inactive" : "Active";
        } else {
          status.textContent = "Active";
        }

        subActivityLineIDCell.textContent = activity.SubActivityLineID || "";
        subActivityLineIDCell.classList.add("hidden");

        row.onclick = function () {
          const editBtn = document.querySelector(".edit-btn");
          const viewBtn = document.querySelector(".view-btn");

          if (!editBtn || !viewBtn) {
            console.warn("Edit/View button not found");
            return;
          }

          const wasSelected = row.classList.contains("highlight");

          tableBody.querySelectorAll("tr").forEach((r) => r.classList.remove("highlight"));
          tableBody.querySelectorAll('input[type="radio"]').forEach((rb) => (rb.checked = false));

          if (!wasSelected) {
            row.classList.add("highlight");
            radioBtn.checked = true;
            editBtn.disabled = false;
            viewBtn.disabled = false;

            document.getElementById("delete-icon-container")?.remove();

            const deleteIcon = document.createElement("i");
            deleteIcon.className = "fa fa-trash";
            deleteIcon.style.color = "red";
            deleteIcon.style.cursor = "pointer";
            deleteIcon.style.marginLeft = "35px";
            deleteIcon.title = "Delete this row";
            deleteIcon.style.fontSize = "19px";
            deleteIcon.id = "delete-icon-container";

            deleteIcon.onclick = function (e) {
              e.stopPropagation();
              showDeleteConfirmationModal(activity.SubActivityLineID, row);
            };

            row.cells[row.cells.length - 2].appendChild(deleteIcon);
          } else {
            editBtn.disabled = true;
            viewBtn.disabled = true;
            document.getElementById("delete-icon-container")?.remove();
          }
        };

        radioBtn.onclick = function (event) {
          event.stopPropagation();

          const wasSelected = row.classList.contains("highlight");

          tableBody.querySelectorAll("tr").forEach((r) => r.classList.remove("highlight"));
          tableBody.querySelectorAll('input[type="radio"]').forEach((rb) => (rb.checked = false));

          if (!wasSelected) {
            row.classList.add("highlight");
            radioBtn.checked = true;
            editBtn.disabled = false;
            viewBtn.disabled = false;
          } else {
            editBtn.disabled = true;
            viewBtn.disabled = true;
          }
        };

        row.ondblclick = function () {
          const editBtn = document.querySelector(".edit-btn");
          const viewBtn = document.querySelector(".view-btn");

          if (!editBtn || !viewBtn) {
            console.warn("Edit/View button not found");
            return;
          }
          tableBody.querySelectorAll("tr").forEach((r) => r.classList.remove("highlight"));
          tableBody.querySelectorAll('input[type="radio"]').forEach((rb) => (rb.checked = false));

          row.classList.add("highlight");
          radioBtn.checked = true;
          editBtn.disabled = false;
          viewBtn.disabled = false;

          $("#editModalCenter").modal("show");
          populateForm();
        };
      });
    } else {
      setNullGrid();
    }

    resolve(); // grid fully built
  });
}

let totalSubsBudgetpagecount = 0;
var BudgetArray = [];
var budgetStart = 1;
var budgetEnd = 4;
let subscriptionBudgetStart = 1;
let subscriptionBudgetEnd = 4;
let departmentBudgetStart = 1;
let departmentBudgetEnd = 4;
let totalDepartBudgetpagecount = 0;

export function validateAndCallSubscriptionFunction(event) {
  if (event.key === "Enter") {
    const input = document.getElementById("subscriptionPageInput");
    const inputValue = Number(input.value.trim());

    if (
      input.value.trim() === "" ||
      isNaN(inputValue) ||
      inputValue <= 0 ||
      /[^\d]/.test(input.value)
    ) {
      return;
    }

    // Check if the input is a valid number
    if (!isNaN(inputValue) && inputValue !== "" && inputValue != 0 && inputValue > 0) {
      if (inputValue > totalSubsBudgetpagecount) {
        //  input.style.border = "1px solid red";
        return;
      }
      input.style.border = "1px solid black";
      budgetEnd = inputValue;
      budgetStart = budgetEnd - 3;
      if (budgetStart < 1) {
        budgetStart = 1;
      }
      if (budgetEnd < 4) {
        budgetEnd = 4;
      }
      const activeTab = document.querySelector("#budgetTab .nav-link.active").id;

      getBudgetData(inputValue);
    } else {
      if (inputValue != 0) {
        // If not a valid number, set the border color to red
        // input.style.border = "1px solid red";
      }

      return; // Exit the function
    }
  }
}

function handleSubscriptionPageClick(element) {
  const input = document.getElementById("subscriptionPageInput");
  if (input) {
    input.value = "";
  }

  const activeLinks = document.querySelectorAll("#subscriptionPagination a");
  activeLinks.forEach((link) => link.classList.remove("active"));

  element.classList.add("active");

  const pageNumber = +element.textContent.trim();
  getBudgetData(pageNumber);
}

function setBudgetNullGrid(tableBodyId) {
  //var tableBody = document.querySelector("#BudgetSubscriptions tbody");

  var tableBody = document.querySelector(`#${tableBodyId} tbody`);

  tableBody.innerHTML = "";

  var paragraph = document.createElement("p");
  var row = document.createElement("tr");
  var cell = document.createElement("td");

  cell.colSpan = 6; // total visible columns in your budget table
  cell.style.textAlign = "center";
  cell.style.color = "#8d8888";
  cell.style.fontSize = "14px";
  cell.style.padding = "10px";

  paragraph.textContent = "No results found";

  cell.appendChild(paragraph);
  row.appendChild(cell);
  tableBody.appendChild(row);
}

function generateSubscriptionPagination(totalPages, activePageNumber = 1) {
  const paginationDiv = document.getElementById("subscriptionPagination");
  if (!paginationDiv) {
    console.warn("Pagination container not found");
    return;
  }

  while (paginationDiv.firstChild) {
    paginationDiv.removeChild(paginationDiv.firstChild);
  }

  if (subscriptionBudgetStart > subscriptionBudgetEnd) {
    subscriptionBudgetStart = 1;
    subscriptionBudgetEnd = 4;
    return;
  }

  const pageStart = subscriptionBudgetStart;
  const pageEnd = Math.min(subscriptionBudgetEnd, totalPages);

  // Prev Arrow
  const prevArrow = document.createElement("a");
  prevArrow.href = "#";
  prevArrow.classList.add("prev");
  prevArrow.innerHTML = "&lsaquo;";
  prevArrow.onclick = function (e) {
    e.preventDefault();
    const input = document.getElementById("subscriptionPageInput");
    if (input) {
      input.value = "";
    }

    if (activePageNumber !== 1) {
      if (subscriptionBudgetStart !== 1) {
        subscriptionBudgetStart -= 1;
        subscriptionBudgetEnd -= 1;
      }
      getBudgetData(activePageNumber - 1);
    }
  };
  paginationDiv.appendChild(prevArrow);
  if (activePageNumber === 1) {
    prevArrow.setAttribute("disabled", "true");
    prevArrow.style.backgroundColor = "#DCDCEE";
  }

  // Page Numbers
  for (let i = pageStart; i <= pageEnd; i++) {
    const pageLink = document.createElement("a");
    pageLink.href = "#";
    pageLink.textContent = i;
    pageLink.onclick = function (e) {
      e.preventDefault();
      handleSubscriptionPageClick(this);
    };
    if (i === activePageNumber) {
      pageLink.classList.add("active");
    }
    paginationDiv.appendChild(pageLink);
  }

  // Next Arrow
  const nextArrow = document.createElement("a");
  nextArrow.href = "#";
  nextArrow.classList.add("next");
  nextArrow.innerHTML = "&rsaquo;";
  nextArrow.onclick = function (e) {
    e.preventDefault();
    const input = document.getElementById("subscriptionPageInput");
    if (input) {
      input.value = "";
    }

    if (activePageNumber < totalPages) {
      if (subscriptionBudgetEnd !== totalPages && totalPages >= 4) {
        subscriptionBudgetStart += 1;
        subscriptionBudgetEnd += 1;
      }
      getBudgetData(activePageNumber + 1);
    }
  };
  paginationDiv.appendChild(nextArrow);
  if (activePageNumber === totalPages) {
    nextArrow.setAttribute("disabled", "true");
    nextArrow.style.backgroundColor = "#d3d3d3";
    nextArrow.style.pointerEvents = "none";
  }
}

export async function callgetBudgetData(requestData) {
  try {
    const baseUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";

    const funcKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";

    const azureFunctionUrl = `${baseUrl}/GetbudgetData?code=${funcKey}`;

    const response = await fetch(azureFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...requestData,
        pagesize: 8,
        budgetType: "subscription",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    return await response.json();
  } catch (error) {
    console.error("Budget API call failed:", error);
    throw error;
  }
}

export function getBudgetData(number) {
  "use strict";

  openPopup("popup_loading");
  const input = document.getElementById("subscriptionPageInput");
  if (input) {
    input.value = "";
  }

  const contactId = "030ef119-c1c1-ee11-9079-00224827e8f9"; // Replace with actual contact ID logic

  const requestData = {
    contactId: contactId,
    pagenumber: number,
  };

  // Call your async Azure Function wrapper
  callgetBudgetData(requestData)
    .then((result) => {
      console.log("Function call successful:", result);

      // Azure Function result is already JSON, no need to parse
      const subsBudget = result.SubscriptionBudget || [];
      const count = result.SubscriptionBudgetCount || 0;

      const itemsPerPage = 8; // Items per page
      const totalPages = Math.ceil(count / itemsPerPage);
      totalSubsBudgetpagecount = totalPages;

      generateSubscriptionPagination(totalPages, number);

      BudgetArray = subsBudget;

      // Update the grid
      if (subsBudget.length === 0) {
        setBudgetNullGrid("BudgetSubscriptions");
      } else {
        setBudgetGrid(BudgetArray);
      }

      closePopup("popup_loading"); // Hide loading popup
    })
    .catch((error) => {
      console.error("Azure Function call failed:", error);
      closePopup("popup_loading");
      setBudgetGrid(BudgetArray);
    });
}

function setBudgetGrid(subscriptions) {
  "use strict";

  var tableBody = document.querySelector("#BudgetSubscriptions");
  if (!tableBody) {
    console.warn("Budget table body not found");
    return;
  }
  tableBody.innerHTML = "";

  if (subscriptions && subscriptions.length > 0) {
    subscriptions.sort((a, b) => {
      return (a.SubName || "").localeCompare(b.SubName || "", undefined, {
        sensitivity: "base",
      });
    });

    subscriptions.forEach((subscription) => {
      var row = tableBody.insertRow();

      var radioCell = row.insertCell(0);
      var BudgetNameCell = row.insertCell(1);
      var BudgetAmmountCell = row.insertCell(2);
      var subscriptionNameCell = row.insertCell(3);
      var subscriptionAmountCell = row.insertCell(4);
      var subActivityLineIDCell = row.insertCell(5);

      var radioBtn = document.createElement("input");
      radioBtn.type = "radio";
      radioBtn.name = "row-selector";

      radioCell.appendChild(radioBtn);
      radioCell.style.display = "none";

      applyTooltip(subscriptionNameCell, subscription.SubName || "");
      subscriptionNameCell.style.color = "#4B8FFF";
      applyTooltip(BudgetNameCell, subscription.BudgetName || "");
      applyTooltip(
        subscriptionAmountCell,
        subscription.SubAmount !== null ? "$" + subscription.SubAmount : ""
      );

      applyTooltip(
        BudgetAmmountCell,
        subscription.BudgetAmount !== null ? "$" + subscription.BudgetAmount : ""
      );
      BudgetAmmountCell.style.color = "#7259F6";

      subActivityLineIDCell.textContent = subscription.BudgetId || "";
      subActivityLineIDCell.classList.add("hidden");

      radioBtn.style.display = "none"; // Instead of hiding radioCell

      row.onclick = function () {
        console.log("Row clicked"); // Debug
        var wasSelected = row.classList.contains("highlight");
        tableBody.querySelectorAll("tr").forEach((r) => r.classList.remove("highlight"));
        tableBody.querySelectorAll('input[type="radio"]').forEach((rb) => (rb.checked = false));

        if (!wasSelected) {
          row.classList.add("highlight");
          radioBtn.checked = true;
        }
      };

      radioBtn.onclick = function (event) {
        event.stopPropagation();
        var wasSelected = row.classList.contains("highlight");
        var rows = tableBody.querySelectorAll("tr");
        rows.forEach((r) => r.classList.remove("highlight"));

        var radioButtons = tableBody.querySelectorAll('input[type="radio"]');
        radioButtons.forEach((radioButton) => (radioButton.checked = false));

        if (!wasSelected) {
          row.classList.add("highlight");
          radioBtn.checked = true;
        }
      };

      row.ondblclick = function () {
        var rows = tableBody.querySelectorAll("tr");
        rows.forEach((r) => r.classList.remove("highlight"));
        tableBody.querySelectorAll('input[type="radio"]').forEach((rb) => (rb.checked = false));

        row.classList.add("highlight");
        radioBtn.checked = true;

        $("#EditBudget").modal("show");

        populateBudgetForm();
      };
    });
  } else {
    setBudgetNullGrid("BudgetSubscriptions");
  }
}

export function validateAndCallDepartmentFunction(event) {
  if (event.key === "Enter") {
    const departmentInput = document.getElementById("departmentPageInput");
    if (departmentInput) {
      departmentInput.value = "";
    }

    const inputValue = Number(input.value.trim());

    if (
      input.value.trim() === "" ||
      isNaN(inputValue) ||
      inputValue <= 0 ||
      /[^\d]/.test(input.value)
    ) {
      return;
    }

    // Check if the input is a valid number
    if (!isNaN(inputValue) && inputValue !== "" && inputValue != 0 && inputValue > 0) {
      if (inputValue > totalDepartBudgetpagecount) {
        //  input.style.border = "1px solid red";
        return;
      }
      input.style.border = "1px solid black";
      budgetEnd = inputValue;
      budgetStart = budgetEnd - 3;
      if (budgetStart < 1) {
        budgetStart = 1;
      }
      if (budgetEnd < 4) {
        budgetEnd = 4;
      }
      const activeTab = document.querySelector("#budgetTab .nav-link.active").id;

      getDepartmentBudgetData(inputValue);
    } else {
      if (inputValue != 0) {
        // If not a valid number, set the border color to red
        // input.style.border = "1px solid red";
      }

      return; // Exit the function
    }
  }
}

function handleDepartmentPageClick(element) {
  const departmentInput = document.getElementById("departmentPageInput");
  if (departmentInput) {
    departmentInput.value = "";
  }

  const activeLinks = document.querySelectorAll("#departmentPagination a");
  activeLinks.forEach((link) => link.classList.remove("active"));

  element.classList.add("active");

  const pageNumber = +element.textContent.trim();
  getDepartmentBudgetData(pageNumber);
}

function generateDepartmentPagination(totalPages, activePageNumber = 1) {
  const paginationDiv = document.getElementById("departmentPagination");
  if (!paginationDiv) {
    console.warn("departmentPagination not found in DOM");
    return;
  }

  while (paginationDiv.firstChild) {
    paginationDiv.removeChild(paginationDiv.firstChild);
  }

  if (departmentBudgetStart > departmentBudgetEnd) {
    departmentBudgetStart = 1;
    departmentBudgetEnd = 4;
    return;
  }

  const pageStart = departmentBudgetStart;
  const pageEnd = Math.min(departmentBudgetEnd, totalPages);

  // Prev Arrow
  const prevArrow = document.createElement("a");
  prevArrow.href = "#";
  prevArrow.classList.add("prev");
  prevArrow.innerHTML = "&lsaquo;";
  prevArrow.onclick = function (e) {
    e.preventDefault();
    const departmentInput = document.getElementById("departmentPageInput");
    if (departmentInput) {
      departmentInput.value = "";
    }

    if (activePageNumber !== 1) {
      if (departmentBudgetStart !== 1) {
        departmentBudgetStart -= 1;
        departmentBudgetEnd -= 1;
      }
      getDepartmentBudgetData(activePageNumber - 1);
    }
  };
  paginationDiv.appendChild(prevArrow);
  if (activePageNumber === 1) {
    prevArrow.setAttribute("disabled", "true");
    prevArrow.style.backgroundColor = "#DCDCEE";
  }

  // Page Numbers
  for (let i = pageStart; i <= pageEnd; i++) {
    const pageLink = document.createElement("a");
    pageLink.href = "#";
    pageLink.textContent = i;
    pageLink.onclick = function (e) {
      e.preventDefault();
      handleDepartmentPageClick(this);
    };
    if (i === activePageNumber) {
      pageLink.classList.add("active");
    }
    paginationDiv.appendChild(pageLink);
  }

  // Next Arrow
  const nextArrow = document.createElement("a");
  nextArrow.href = "#";
  nextArrow.classList.add("next");
  nextArrow.innerHTML = "&rsaquo;";
  nextArrow.onclick = function (e) {
    e.preventDefault();
    const departmentInput = document.getElementById("departmentPageInput");
    if (departmentInput) {
      departmentInput.value = "";
    }

    if (activePageNumber < totalPages) {
      if (departmentBudgetEnd !== totalPages && totalPages >= 4) {
        departmentBudgetStart += 1;
        departmentBudgetEnd += 1;
      }
      getDepartmentBudgetData(activePageNumber + 1);
    }
  };
  paginationDiv.appendChild(nextArrow);
  if (activePageNumber === totalPages) {
    nextArrow.setAttribute("disabled", "true");
    nextArrow.style.backgroundColor = "#d3d3d3";
    nextArrow.style.pointerEvents = "none";
  }
}

export function getDepartmentBudgetData(number) {
  "use strict";

  openPopup("popup_loading");
  const departmentInput = document.getElementById("departmentPageInput");
  if (departmentInput) {
    departmentInput.value = "";
  }

  const contactId = "030ef119-c1c1-ee11-9079-00224827e8f9";
  const requestData = {
    contactId: contactId,
    pagenumber: number,
  };

  callgetBudgetData(requestData) // This should call your Azure Function
    .then((result) => {
      console.log("Function call successful:", result);

      const depBudget = result.DepartmentBudget || [];
      const count = result.DepartmentCount || 0;

      const itemsPerPage = 8;
      const totalPages = Math.ceil(count / itemsPerPage);
      totalDepartBudgetpagecount = totalPages;

      generateDepartmentPagination(totalPages, number);

      BudgetArray = depBudget;

      // Update the grid
      if (depBudget.length === 0) {
        setBudgetNullGrid("DepartmentBudgets");
      } else {
        setDepartmentGrid(BudgetArray);
      }

      closePopup("popup_loading");
    })
    .catch((error) => {
      console.error("Azure Function call failed:", error);
      closePopup("popup_loading");

      // fallback to last known department budget
      setDepartmentGrid(BudgetArray);
    });
}

function setDepartmentGrid(departments) {
  "use strict";

  var tableBody = document.querySelector("#DepartmentBudgets");
  tableBody.innerHTML = "";

  if (departments && departments.length > 0) {
    departments.forEach((dept) => {
      var row = tableBody.insertRow();
      var radioCell = row.insertCell(0);
      var BudgetNameCell = row.insertCell(1);
      var BudgetAmountCell = row.insertCell(2);
      var DepartmentNameCell = row.insertCell(3);
      var subActivityLineIDCell = row.insertCell(4);

      var radioBtn = document.createElement("input");
      radioBtn.type = "radio";
      radioBtn.name = "row-selector";

      radioCell.appendChild(radioBtn);
      radioCell.style.display = "none";

      applyTooltip(BudgetNameCell, dept.BudgetName || "");
      applyTooltip(BudgetAmountCell, dept.BudgetAmount !== null ? "$" + dept.BudgetAmount : "");
      BudgetAmountCell.style.color = "#7259F6";
      applyTooltip(DepartmentNameCell, dept.DepartmentName || "");
      DepartmentNameCell.style.color = "#4B8FFF";

      subActivityLineIDCell.textContent = dept.BudgetId || "";
      subActivityLineIDCell.classList.add("hidden");

      radioBtn.style.display = "none"; // Instead of hiding radioCell

      row.onclick = function () {
        console.log("Row clicked"); // Debug
        var wasSelected = row.classList.contains("highlight");
        tableBody.querySelectorAll("tr").forEach((r) => r.classList.remove("highlight"));
        tableBody.querySelectorAll('input[type="radio"]').forEach((rb) => (rb.checked = false));

        if (!wasSelected) {
          row.classList.add("highlight");
          radioBtn.checked = true;
        }
      };

      radioBtn.onclick = function (event) {
        event.stopPropagation();
        var wasSelected = row.classList.contains("highlight");
        var rows = tableBody.querySelectorAll("tr");
        rows.forEach((r) => r.classList.remove("highlight"));

        var radioButtons = tableBody.querySelectorAll('input[type="radio"]');
        radioButtons.forEach((radioButton) => (radioButton.checked = false));

        if (!wasSelected) {
          row.classList.add("highlight");
          radioBtn.checked = true;
        }
      };

      row.ondblclick = function () {
        var rows = tableBody.querySelectorAll("tr");
        rows.forEach((r) => r.classList.remove("highlight"));
        tableBody.querySelectorAll('input[type="radio"]').forEach((rb) => (rb.checked = false));

        row.classList.add("highlight");
        radioBtn.checked = true;

        $("#EditBudget").modal("show");

        populateDepartmentBudgetForm();
      };
    });
  } else {
    setBudgetNullGrid("DepartmentBudgets");
  }
}

//Add Budget Modal

export function AddBudgetRecord() {
  const BudgetName = document.getElementById("budgetName");

  if (BudgetName.value.trim() === "") {
    BudgetName.classList.add("invalid-field");
    return;
  }

  const deptToggle = document.getElementById("departmentBudget");
  const subToggle = document.getElementById("subscriptionBudget");
  const budgetNameVlaue = BudgetName.value;

  const isSubscriptionValid = validateCustomSelect(
    "subscriptionActivityWrapper2",
    "subscriptionActivity2",
    "Vendor is required"
  );

  const isFinancialYearValid = validateCustomSelect(
    "financialYearWrapper",
    "financialYear",
    "Financial Year is required"
  );

  const isDepartmentValid = validateCustomSelect(
    "departmentWrapper3",
    "departmentSelect3",
    "Department is required"
  );

  const Amount =
    document.getElementById("budgetAmount").value === ""
      ? null
      : parseFloat(document.getElementById("budgetAmount").value);

  if (subToggle.checked && !isSubscriptionValid) return;
  if (deptToggle.checked && (!isFinancialYearValid || !isDepartmentValid)) return;

  const financialYearId = document
    .getElementById("financialYearWrapper")
    ?.getAttribute("data-selected-value");

  const departmentId = document
    .getElementById("departmentWrapper3")
    ?.getAttribute("data-selected-value");

  const activityLineId = document
    .getElementById("subscriptionActivityWrapper2")
    ?.getAttribute("data-selected-value");

  /* =======================
     DEPARTMENT BUDGET FLOW
     ======================= */
  if (deptToggle.checked) {
    if (!financialYearId || !departmentId) {
      alert("Please select both Financial Year and Department before proceeding.");
      return;
    }

    // 1️⃣ CHECK BUDGET API
    const checkUrl =
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/getBudget/check" +
      `?financialYearId=${financialYearId}&departmentId=${departmentId}`;

    fetch(checkUrl, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.exists === true) {
          showCustomPopup("A budget for this department and financial year already exists!");
          return;
        }

        // 2️⃣ ADD DEPARTMENT BUDGET API
        const record = {
          yiic_departmentbudget: true,
          yiic_subscriptionbudget: false,
          "yiic_department@odata.bind": `/yiic_departments(${departmentId})`,
          "yiic_financialyear@odata.bind": `/yiic_masterdatas(${financialYearId})`,
          yiic_name: budgetNameVlaue,
          yiic_amount: Amount,
        };

        fetch(
          "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/addBudget",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(record),
          }
        )
          .then((res) => {
            if (!res.ok) throw new Error("Failed to create department budget");
            closeModalAndShowSuccess();
          })
          .catch((err) => {
            console.error("Error creating department budget:", err);
          });
      })
      .catch((err) => {
        console.error("Error checking department budget:", err);
      });

    return; // wait for async flow
  }

  /* =======================
     SUBSCRIPTION BUDGET FLOW
     ======================= */
  if (subToggle.checked && activityLineId) {
    const record = {
      yiic_departmentbudget: false,
      yiic_subscriptionbudget: true,
      "yiic_subscriptionactivity@odata.bind": `/yiic_subscriptionsactivitylines(${activityLineId})`,
      yiic_name: budgetNameVlaue,
      yiic_amount: Amount,
    };

    fetch(
      "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/addBudget",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(record),
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create subscription budget");
        closeModalAndShowSuccess();
      })
      .catch((err) => {
        console.error("Error creating subscription budget:", err);
      });
  }
}

function fetchDepartments(wrapperId) {
  const API_URL =
    "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/getDepartments";

  fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch departments");
      }
      return response.json();
    })
    .then((data) => {
      // ✅ Adjust this if your Azure API wraps data differently
      const results = data?.value || data || [];

      const departmentWrapper = document.getElementById(wrapperId);
      const optionsContainer = departmentWrapper.querySelector(".options-container");

      optionsContainer.innerHTML = "";

      // ❌ No data
      if (!results.length) {
        const noDepts = document.createElement("div");
        noDepts.className = "no-vendors";
        noDepts.textContent = "No departments available";

        Object.assign(noDepts.style, {
          padding: "15px",
          fontSize: "13px",
          fontWeight: "600",
          color: "grey",
        });

        optionsContainer.appendChild(noDepts);
        return;
      }

      // 🔍 Search input
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.className = "search-input";
      searchInput.placeholder = "Search...";
      searchInput.setAttribute("aria-label", "Search Department");
      optionsContainer.appendChild(searchInput);

      // 📋 Options
      results.forEach((dept) => {
        const option = document.createElement("div");
        option.className = "option";
        option.setAttribute("data-value", dept.yiic_departmentid);
        option.textContent = dept.yiic_name;
        optionsContainer.appendChild(option);
      });

      // 🔍 Filter logic
      searchInput.addEventListener("input", function () {
        const filter = searchInput.value.toLowerCase();
        const options = optionsContainer.querySelectorAll(".option");

        options.forEach((option) => {
          option.style.display = option.textContent.toLowerCase().includes(filter) ? "" : "none";
        });
      });

      // ✅ Select option
      optionsContainer.querySelectorAll(".option").forEach((option) => {
        option.addEventListener("click", function () {
          const value = option.getAttribute("data-value");
          const placeholder = departmentWrapper.querySelector(".optionName");

          placeholder.textContent = option.textContent;
          departmentWrapper.setAttribute("data-selected-value", value);
          departmentWrapper.classList.remove("show-options");
        });
      });
    })
    .catch((error) => {
      console.error("Error fetching departments:", error);
    });
}

function fetchActivityLines(wrapperId) {
  const accountId = window.APP_CONFIG.primaryAccountId;

  const API_URL =
    "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/getSubscriptionActivityLinesByAccount" +
    "?accountId=" +
    accountId;

  fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch subscription activity lines");
      }
      return response.json();
    })
    .then((data) => {
      // ⚠️ Adjust if backend wraps response
      const results = data?.value || data || [];

      const departmentWrapper = document.getElementById(wrapperId);
      const optionsContainer = departmentWrapper.querySelector(".options-container");

      optionsContainer.innerHTML = "";

      // ❌ No data case
      if (!results.length) {
        const noDepts = document.createElement("div");
        noDepts.className = "no-vendors";
        noDepts.textContent = "No subscriptions available";

        Object.assign(noDepts.style, {
          padding: "15px",
          fontSize: "13px",
          fontWeight: "600",
          color: "grey",
        });

        optionsContainer.appendChild(noDepts);
        return;
      }

      // 🔍 Search input
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.className = "search-input";
      searchInput.placeholder = "Search...";
      searchInput.setAttribute("aria-label", "Search Subscription");
      optionsContainer.appendChild(searchInput);

      // 📋 Options
      results.forEach((item) => {
        const option = document.createElement("div");
        option.className = "option";
        option.setAttribute("data-value", item.activityid);
        option.textContent = item.yiic_subscriptionname;
        optionsContainer.appendChild(option);
      });

      // 🔍 Filter logic
      searchInput.addEventListener("input", function () {
        const filter = searchInput.value.toLowerCase();
        const options = optionsContainer.querySelectorAll(".option");

        options.forEach((option) => {
          option.style.display = option.textContent.toLowerCase().includes(filter) ? "" : "none";
        });
      });

      // ✅ Select option
      optionsContainer.querySelectorAll(".option").forEach((option) => {
        option.addEventListener("click", function () {
          const value = option.getAttribute("data-value");
          const placeholder = departmentWrapper.querySelector(".optionName");

          placeholder.textContent = option.textContent;
          departmentWrapper.setAttribute("data-selected-value", value);
          departmentWrapper.classList.remove("show-options");
        });
      });
    })
    .catch((error) => {
      console.error("Error fetching subscriptions:", error);
    });
}

function fetchFinancialYear(wrapperId) {
  var currentYear = new Date().getFullYear();

  const API_URL =
    "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/Getfinancialyeardata";

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentYear: currentYear,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch financial years");
      }
      return response.json();
    })
    .then((data) => {
      // ⚠️ Adjust ONLY if backend wraps response differently
      var results = data?.value || data || [];

      var departmentWrapper = document.getElementById(wrapperId);
      var optionsContainer = departmentWrapper.querySelector(".options-container");

      optionsContainer.innerHTML = ""; // Clear previous options

      if (results.length === 0) {
        var noDepts = document.createElement("div");
        noDepts.classList.add("no-vendors");
        noDepts.textContent = "No departments available";

        noDepts.style.padding = "15px";
        noDepts.style.fontSize = "13px";
        noDepts.style.fontWeight = "600";
        noDepts.style.color = "grey";

        optionsContainer.appendChild(noDepts);
        return;
      }

      var searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.classList.add("search-input");
      searchInput.placeholder = "Search...";
      searchInput.setAttribute("aria-label", "Search Department");
      optionsContainer.appendChild(searchInput);

      results.forEach(function (dept) {
        var option = document.createElement("div");
        option.classList.add("option");
        option.setAttribute("data-value", dept.yiic_masterdataid);
        option.textContent = dept.yiic_name;
        optionsContainer.appendChild(option);
      });

      searchInput.addEventListener("input", function () {
        var filter = searchInput.value.toLowerCase();
        var options = optionsContainer.querySelectorAll(".option");

        options.forEach(function (option) {
          option.style.display = option.textContent.toLowerCase().includes(filter) ? "" : "none";
        });
      });

      var options = optionsContainer.querySelectorAll(".option");
      options.forEach(function (option) {
        option.addEventListener("click", function () {
          var value = option.getAttribute("data-value");
          var placeholder = departmentWrapper.querySelector(".optionName");

          placeholder.textContent = option.textContent;
          departmentWrapper.setAttribute("data-selected-value", value);
          departmentWrapper.classList.remove("show-options");
        });
      });
    })
    .catch((error) => {
      console.error("Error fetching financial years:", error);
    });
}

export function FetchChoices() {
  ResetBudgetModal();
  removeErrorAndClass("budgetAmount");

  const subFields = document.getElementById("subscriptionFields");
  const nonSubFields = document.getElementById("nonSubscriptionFields");

  subFields.classList.add("hidden");
  nonSubFields.classList.add("hidden");

  document.getElementById("budgetName").value = "";
  document.getElementById("budgetName").classList.remove("invalid-field");

  // Reset Budget Amount
  document.getElementById("budgetAmount").value = "";

  // Reset toggles
  document.getElementById("departmentBudget").checked = false;
  document.getElementById("subscriptionBudget").checked = false;

  fetchDepartments("departmentWrapper3");
  fetchActivityLines("subscriptionActivityWrapper2");
  fetchFinancialYear("financialYearWrapper");
}

/// SUBSCRIPTION BUDGET FUNCTIONS END ///

/// ADD subscription functions///
