# Subscriptionist Project Analysis

## Overview

A **Subscription Management Dashboard** for organizations to track software and service subscriptions. It displays:

- Total active costs & subscription counts
- Renewal timelines & upcoming renewals
- Monthly spend trends
- Departmental spending breakdown
- Vendor distribution charts
- Budget vs actual comparisons

---

## Tech Stack

| Layer         | Technology                |
| ------------- | ------------------------- |
| Build         | Vite 7                    |
| UI            | React 19                  |
| Routing       | React Router 7            |
| State         | Zustand                   |
| Data Fetching | TanStack React Query      |
| HTTP          | Axios                     |
| Charts        | Chart.js                  |
| Styling       | Tailwind CSS 4            |
| Icons         | react-icons, Font Awesome |

---

## Project Structure

```
src/
├── main.jsx           # Entry: QueryClient, Router, PopupProvider, App
├── App.jsx            # Renders AppRoutes
├── index.css          # Tailwind import + custom animations (animate-fadeIn, uc-*)
├── App.css            # Root & layout styles (#root, .app-layout, .app-content)
│
├── routes/
│   ├── AppRoutes.jsx      # Route definitions (public + protected)
│   └── ProtectedRoutes.jsx# Layout wrapper: Menu + Header + Outlet
│
├── pages/
│   ├── Home/              # Dashboard: KPIs, charts, renewals
│   ├── Reports/           # Financial, Standard, Renewal & Expiration reports
│   ├── Subscriptions/     # Subscription list, add/edit modals, budgets
│   ├── Vendors/           # Vendor list, add/edit vendor
│   ├── Profile/           # User profile, notifications, associated users
│   ├── Login/             # Login (unprotected)
│   └── ...
│
├── components/        # Shared: Header, menu, Popup, SkeletonLoader, NotFound, UnderConstruction
├── hooks/             # useActivityLines (React Query + Zustand sync)
├── stores/            # Zustand: HomeStore, activityLineStore, reportsPageStore, etc.
└── lib/
    ├── api/           # API clients (activityLine, vendor, profile)
    └── utils/         # Data processing (home.js, reportsPage.js, subscriptions.js)
```

---

## How Things Work

### 1. Bootstrap (`main.jsx`)

```
createRoot → QueryClientProvider → BrowserRouter → PopupProvider → App
```

- **QueryClient**: 1min stale, 10min cache, 2 retries, no refetch on focus
- **PopupProvider**: Global toast/notification context
- **App**: Renders `<AppRoutes />`

### 2. Routing

| Route               | Component         | Protection |
| ------------------- | ----------------- | ---------- |
| `/login`            | Login             | Public     |
| `/`                 | Home              | Protected  |
| `/reports`          | Report            | Protected  |
| `/subscriptions`    | Subscription      | Protected  |
| `/vendors`          | Vendor            | Protected  |
| `/profile`          | Profile           | Protected  |
| `/mytasks`, `/faqs` | UnderConstruction | Protected  |
| `*`                 | NotFound          | Protected  |

Protected routes use a shared layout:

- **Menu** (sidebar) – navigation
- **Header** – page title, last update, notifications, profile dropdown
- **Outlet** – current page content

Layout styles come from `App.css` (`.app-layout`, `.app-content`).

### 3. Data Flow

#### Activity Lines (Primary Data Source)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  useActivityLines() hook (React Query)                                   │
│       │                                                                  │
│       ▼                                                                  │
│  fetchActivityLines() → API.get("/GetActivityLinesByContactId")          │
│       │                                                                  │
│       ├──► setActivityLines(data)        → activityLineStore (Zustand)   │
│       ├──► handleActivityLinesSuccess()  → reportsPageStore              │
│       └──► return data                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Home Page Processing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Home.jsx                                                                │
│       │                                                                  │
│       │  useActivityLines()  →  activityLinesData, isLoading, error      │
│       │                                                                  │
│       ▼                                                                  │
│  useEffect: when activityLinesData is available                          │
│       │                                                                  │
│       ▼                                                                  │
│  handleDataProcessing(activityLinesData)  [lib/utils/home.js]            │
│       │                                                                  │
│       ├──► setFirstTwoCards()          → HomeStore.FirstTwoCards         │
│       ├──► setRenewalTimelineCards()   → HomeStore.renewalTimelineCards  │
│       ├──► setRecentlyConcluded()      → HomeStore.RecentlyConcluded     │
│       ├──► setVendorDoughnutChartData()→ HomeStore.VendorDoughnutChart   │
│       ├──► setVendorProfileCounts()    → HomeStore.vendorProfileCounts   │
│       ├──► setVendorProfileChartData() → HomeStore.VendorProfileChart    │
│       ├──► setMonthlySpendChartData()  → HomeStore.monthlySpendChartData │
│       ├──► setDepartmentSpendChartData()→ HomeStore.departmentSpendChart │
│       ├──► setActualVsBudgetData()     → HomeStore.ActualVsBudgetData    │
│       └──► setUpcomingRenewalRecords() → HomeStore.upcomingRenewalRecords│
│                                                                          │
│  Home reads from HomeStore and renders Chart.js canvases                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4. State Management (Zustand)

| Store                | Purpose                               |
| -------------------- | ------------------------------------- |
| `HomeStore`          | KPI cards, chart data for Home page   |
| `activityLineStore`  | Raw activity lines (from React Query) |
| `reportsPageStore`   | Processed data for Reports page       |
| `subscriptionsStore` | Subscription list state               |
| `vendorsStore`       | Vendor list state                     |
| `authStore`          | Auth state (TODO: wired to real auth) |

### 5. API Layer

- **Base client**: `src/lib/api/api.js` – Axios instance with base URL and `x-functions-key`
- **Endpoints**:
  - Activity lines: `GetActivityLinesByContactId`
  - Vendors, profiles, budgets via other API modules
- **Note**: API key is still hardcoded; should be moved to `.env` (`VITE_API_BASE_URL`, `VITE_API_KEY`)

### 6. Styling

- **Tailwind**: Via `@import "tailwindcss"` in `index.css`
- **index.css**: Custom keyframes & classes (`animate-fadeIn`, `uc-float`, `uc-pulse`, `uc-scan`, `uc-dot`, etc.) used by dropdowns, NotFound, UnderConstruction
- **App.css**: Root layout (`#root`), `.app-layout`, `.app-content` used in `ProtectedRoutes`

---

## Key Integration Points

| Component         | Uses                                                                                      | Provides                             |
| ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| `Home`            | `useActivityLines`, `useHomeStore`, `handleDataProcessing`, `calculateSubscriptionAmount` | Dashboard charts & KPIs              |
| `Report`          | `useActivityLines`, `reportsPageStore`                                                    | Financial, Standard, Renewal reports |
| `Subscription`    | `subscriptionsStore`, API                                                                 | Subscription list, add/edit, budgets |
| `Vendor`          | `vendorsStore`, vendor API                                                                | Vendor list, add/edit                |
| `ProtectedRoutes` | `authStore` (TODO), `Menu`, `Header`                                                      | Layout for all protected pages       |

---

## Remaining Legacy / TODOs

1. **Auth**: `ProtectedRoutes` uses `useIsAuthenticated()` from `@azure/msal-react` (real auth). No change needed.

2. **API keys, base URLs (rechecked)** – Move to `.env` / build-time variables. Hardcoded locations as of recheck:

   | File                                        | Line(s)          | What is hardcoded                                                                                                                                                                            |
   | ------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `src/lib/api/api.js`                        | 4–9              | `baseURL` (Azure API), `x-functions-key`                                                                                                                                                     |
   | `src/lib/api/vendor/vendor.js`              | 6–8              | `API_BASE_URL`, `API_KEY`; key used at 20, 55, 77, 99, 121, 157, 180                                                                                                                         |
   | `src/lib/api/profile/profile.js`            | 6–10             | `API_BASE_URL`, `API_KEY`, `AZURE_B2C_API_URL` (Power Automate URL + sig); key at 22, 40, 65, 93, 119, 145, 169, 194, 219                                                                    |
   | `src/lib/api/getAccount/getAccount.js`      | 2–3              | `GET_CONTACT_BY_B2C_OBJECT_ID_URL`, `API_KEY`                                                                                                                                                |
   | `src/lib/utils/home.js`                     | 27–29            | `API_KEY`, `BUDGETS_API_URL`; key at 637                                                                                                                                                     |
   | `src/lib/api/Subscription/subscriptions.js` | 2–4              | `API_BASE_URL`, `AZURE_FUNCTION_KEY` (no `DEFAULT_ACCOUNT_ID`/`DEFAULT_CONTACT_ID` in this file; key at 15, 39, 60, 76, 97, 113, 135, 159, 187, 205, 228, 246, 271, 291, 312, 335, 357, 378) |
   | `src/lib/msalConfig/authConfig.js`          | 7, 11–12, 15, 19 | `clientId`, `authority` (B2C), `redirectUri`, `postLogoutRedirectUri` (env vars exist in comments but are overridden by hardcoded values)                                                    |

3. **Summary – still to do**:
   - Move all API base URLs and keys to `.env` (e.g. `VITE_API_BASE_URL`, `VITE_API_KEY`, `VITE_AZURE_B2C_API_URL`).
   - Move MSAL config (clientId, authority, redirectUri, postLogoutRedirectUri) to `.env` and uncomment env usage in `authConfig.js`.
   - In `src/hooks/useVendors.js`: remove `DEFAULT_CONTACT_ID` and use `userAuth?.contactid` from `useAuthStore` when no filter is provided.

---

## Quick Reference

- **Add a new page**: Add route in `AppRoutes.jsx`, create page under `src/pages/`
- **Fetch shared data**: Use `useActivityLines()` – data is cached by React Query and synced to stores
- **Show a toast**: `usePopup().show({ type, title, message })` from `PopupProvider`
- **Add global styles**: `index.css` for Tailwind/custom; `App.css` for layout/root
