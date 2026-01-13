/**
 * Shared utility functions used across multiple chart/data processing modules
 */

/**
 * Groups data by vendor name
 * @param {Array} data - Array of subscription items
 * @returns {Array} - Array of arrays, each containing items for a vendor
 */
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
