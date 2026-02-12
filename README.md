# Subscriptionist Demo

Subscription management dashboard for tracking renewals, costs, vendors, and reports.

## Tech stack

- React 19 + Vite
- Zustand (state)
- React Query (data fetching)
- Chart.js (charts)
- Tailwind CSS (styling)

## Prerequisites

- Node.js 18+ and npm

## Getting started

1. Install deps:
   - `npm install`
2. Create `.env` (see Environment below).
3. Start dev server:
   - `npm run dev`

## Scripts

- `npm run dev` start local dev server
- `npm run build` build for production
- `npm run preview` preview production build
- `npm run lint` run ESLint

## Project structure

- `src/pages/` page-level screens
- `src/components/` shared UI components
- `src/lib/api/` API clients
- `src/lib/utils/` data processing helpers
- `src/stores/` Zustand stores
- `src/routes/` route definitions

## Deployment notes

- Build output is in `dist/`
- Configure the environment variables in your hosting provider
- Do not ship API keys in the client bundle

## Troubleshooting

- Blank data or charts usually means the API base URL or key is invalid.
- If builds fail, re-run `npm install` and check Node version.
