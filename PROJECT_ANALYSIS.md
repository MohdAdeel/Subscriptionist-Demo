# Subscriptionist Project Analysis

## What This Project Does

A **Subscription Management Dashboard** that tracks software/service subscriptions for organizations. It displays:

- Total active costs & subscription counts
- Renewal timelines & upcoming renewals
- Monthly spend trends
- Departmental spending breakdown
- Vendor distribution charts
- Budget vs Actual comparisons

---

## Data Flow (Home.jsx)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Home.jsx                                │
│  useEffect() on mount                                           │
│         │                                                       │
│         ▼                                                       │
│  getActivity() ──► Azure API ──► Returns subscription data      │
│         │                                                       │
│         ▼                                                       │
│  processAllCharts(activityData)                                 │
│         │                                                       │
│         ├──► monthlyDataProcessing() ──► Chart2 (Monthly Spend) │
│         ├──► budgetDataProcessing()  ──► ChartBudget            │
│         ├──► handleDataProcessing()  ──► Chart5 (Department)    │
│         ├──► handleVendorDataChart() ──► Doughnut Chart         │
│         ├──► handleVendorProcessingData() ──► Chart6 (Profile)  │
│         └──► handleRenewalChartData() ──► Chart3 (Renewals)     │
│                                                                 │
│  Each util file processes data & renders Chart.js canvas        │
└─────────────────────────────────────────────────────────────────┘
```

**Current Issues:**

1. API call blocks rendering (~6 seconds)
2. Utility files use DOM manipulation (`document.getElementById`) instead of React state
3. Chart data lives in utility file closures, not React state
4. No shared state between components

---

## Do You Need Global State Management?

### Current State: **NO** (Single page app)

Right now, it's just `Home.jsx` - no need for Redux/Zustand.

### Future: **YES** if you add:

- Multiple pages sharing subscription data
- User authentication/profile
- Subscriptions page that edits data shown on Home
- Filters/settings that persist across pages

---

## Recommended Improvements

### Priority 1: Performance (Quick Wins)

```
□ Move API keys to .env file
□ Add API response caching (localStorage or React Query)
□ Show skeleton UI while API loads (already done ✓)
```

### Priority 2: Code Quality

```
□ Convert utility files from DOM manipulation to pure functions
   - Return processed data instead of rendering directly
   - Let React handle DOM updates

□ Move chart data to React state:
   - Before: util file renders chart directly to canvas
   - After: util returns data, Home.jsx passes to Chart component
```

### Priority 3: Architecture (If scaling)

```
□ React Query for API state management
□ Context or Zustand for shared state (only if multiple pages)
□ Extract chart components: <MonthlySpendChart data={...} />
```

---

## Quick Refactor Example

**Current (DOM-based):**

```js
// monthlySpendUtils.js
export function handleDataProcessing(data) {
  // Process data...
  const canvas = document.getElementById("chart2");
  new Chart(canvas, config); // Renders directly
}
```

**Better (React-based):**

```js
// monthlySpendUtils.js
export function processMonthlyData(data) {
  // Process data...
  return { labels, datasets }; // Return data only
}

// Home.jsx
const chartData = processMonthlyData(activityData);
<MonthlyChart data={chartData} />;
```

---

## Summary

| Aspect       | Current          | Recommendation              |
| ------------ | ---------------- | --------------------------- |
| Global State | Not needed yet   | Add when multi-page         |
| API Calls    | Blocking         | Add caching (React Query)   |
| Charts       | DOM manipulation | Convert to React components |
| Performance  | 6s load time     | Fix API speed on backend    |
| Secrets      | Hardcoded        | Move to .env                |

**Bottom line:** The code works but mixes React with direct DOM manipulation. For maintainability, gradually migrate utility functions to return data (not render), and let React handle rendering.
