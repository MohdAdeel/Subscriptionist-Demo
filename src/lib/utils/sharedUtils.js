/**
 * Shared utility functions used across multiple chart/data processing modules
 */

/**
 * Groups data by vendor name
 * @param {Array} data - Array of subscription items
 * @returns {Array} - Array of arrays, each containing items for a vendor
 */

let monthlySubscription = [];
let filtersForFinance = {
  startDate: null,
  endDate: null,
  amount1: null,
  amount2: null,
  status: null,
};

/**
 * Clears the monthlySubscription array to prevent data duplication on refetch.
 * This must be called at the start of data processing to ensure fresh data.
 */
export function clearMonthlySubscription() {
  monthlySubscription = [];
}

export function groupByVendorName(data) {
  if (!Array.isArray(data)) return [];

  const result = [];
  data.forEach((item) => {
    const group = result.find((g) => g[0]?.VendorName === item?.VendorName);
    group ? group.push(item) : result.push([item]);
  });

  return result;
}

/**
 * Parses frequency string to extract numeric value
 * @param {string} frequencyString - Frequency string like "12 Months" or "1 Year"
 * @returns {number} - Extracted numeric value
 */
export function parseFrequency(frequencyString) {
  if (!frequencyString || typeof frequencyString !== "string") return 0;
  const match = frequencyString.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Safely gets a DOM element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} - Element or null if not found
 */
export function getElementById(id) {
  if (typeof document === "undefined") return null;
  return document.getElementById(id);
}

/**
 * Safely queries a DOM element
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null} - Element or null if not found
 */
export function querySelector(selector) {
  if (typeof document === "undefined") return null;
  return document.querySelector(selector);
}

/**
 * Safely destroys a Chart.js chart instance
 * @param {Chart|null|undefined} chart - Chart instance to destroy
 */
export function destroyChart(chart) {
  if (chart && typeof chart.destroy === "function") {
    try {
      chart.destroy();
    } catch (error) {
      console.warn("Error destroying chart:", error);
    }
  }
}

/**
 * Gets existing chart from Chart.js registry for a canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Chart|null} - Existing chart or null
 */
export function getExistingChart(canvas) {
  if (!canvas || typeof Chart === "undefined") return null;
  try {
    return Chart.getChart(canvas);
  } catch (error) {
    return null;
  }
}

/**
 * Validates date object
 * @param {Date|string|number} date - Date to validate
 * @returns {boolean} - True if valid date
 */
export function isValidDate(date) {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d) && d.getFullYear() !== 1;
}

export function transformAzureResponseToBlobFormat(azureLines) {
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

export function removeObjectsWithSameTime(array) {
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

export function generateSimilarRecordsbyMonth(record) {
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

export function generateSimilarRecordsbyYear(record) {
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

export function filterMonthlySubsinRange() {
  const currentDate = new Date();
  const startMonthIndex = 0; // January
  const endMonthIndex = 11; // December
  const startDate = new Date(currentDate.getFullYear(), startMonthIndex, 1); // January 1st
  const endDate = new Date(currentDate.getFullYear(), endMonthIndex + 1, 0); // December 31st

  var tempMonthly = [];

  monthlySubscription.forEach(function (record) {
    var subscriptionstartDate = new Date(record.SubscriptionStartDate);

    // Filter records that fall within the full year range
    if (subscriptionstartDate >= startDate && subscriptionstartDate <= endDate) {
      // Create a deep copy to prevent reference issues
      tempMonthly.push(JSON.parse(JSON.stringify(record)));
    }
  });

  return tempMonthly;
}

export function filterSubscriptionsforFinance(flattenedArray) {
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
    return []; // This only happens if the chart has no data
  }
  return filteredArray;
}

export function aggregateSubscriptionsByName(subscriptionArray) {
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

export function setMostExpensiveChart(expensiveSubscriptions) {
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
