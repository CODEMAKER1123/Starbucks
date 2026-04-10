# Starbucks Builder

Rolling Suds internal Starbucks operations builder for uploading schedules, managing jobs, and generating job paperwork.

## Changes and improvements

- moved the app to a more reliable local-first setup for schedule management
- added spreadsheet upload for Starbucks route sheets
- added editable job detail pages with status, WO number, invoice number, tech, dates, and time fields
- added invoice and work order PDF generation
- added CompanyCam photo matching support, plus mock fallback behavior when live tokens are not configured
- added mock-safe email and Workiz flows so the app can be tested without sending live data
- updated default techs and pricing for the current Starbucks workflow
- improved deployment compatibility after the Vercel file-write issue surfaced

## Main routes

- `/` dashboard
- `/upload` schedule import
- `/schedule` calendar and job view
- `/jobs/[id]` job details and document actions
- `/generate` standalone document generator
- `/settings` technician settings
- `/guide` operator guide

## Local run

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Notes

- live integrations can be enabled with the proper env vars
- without live credentials, the app can still be exercised in mock mode for testing
