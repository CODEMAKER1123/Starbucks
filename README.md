# Rolling Suds — Starbucks Operations Platform

Local-first Next.js app for managing Starbucks overnight pressure washing jobs.

## What works locally

With no external credentials, the app now runs in **mock/local mode**:
- Spreadsheet upload + XLS/XLSX parsing
- Local job storage in `data/jobs.json`
- Technician settings in `data/technicians.json`
- Calendar/schedule view
- Job detail editing with autosave
- Invoice + work order PDF generation
- `/generate` standalone fallback doc generator
- Mock CompanyCam photo matching placeholders
- Mock email sending that writes payloads to `data/mock-emails/*.json`
- Mock Workiz push endpoint for upload flow testing

With real env vars, it will use live integrations for:
- Resend email
- CompanyCam project/photo lookup
- Workiz job creation
- Redis storage (if `REDIS_URL` is provided)

## Quick start

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Recommended local env

The checked-in `.env.example` defaults to mock mode. For local development, keep:

```bash
EMAIL_DELIVERY_MODE=mock
COMPANYCAM_MODE=mock
WORKIZ_MODE=mock
```

Then set your branding:

```bash
NEXT_PUBLIC_COMPANY_NAME=Rolling Suds of Your Territory
NEXT_PUBLIC_COMPANY_PHONE=(555) 000-0000
NEXT_PUBLIC_COMPANY_EMAIL=you@example.com
EMAIL_REPLY_TO=you@example.com
EMAIL_CC=you@example.com
```

## Live integrations

To switch any service from mock to live:
- remove the corresponding `*_MODE=mock` override
- add the real API credential(s)

### Email / Resend

Required for live sends:
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_SENDER_NAME`
- `EMAIL_REPLY_TO`
- `EMAIL_CC`

### CompanyCam

Required for live photo search:
- `COMPANYCAM_API_TOKEN`

### Workiz

Optional live upload target:
- `WORKIZ_API_TOKEN`
- `WORKIZ_BASE_URL`

### Redis storage

Optional persistent hosted storage:
- `REDIS_URL`

Without `REDIS_URL`, the app stores data in the local `data/` folder.

## Helpful routes

- `/` — dashboard
- `/upload` — spreadsheet upload
- `/schedule` — calendar / schedule view
- `/generate` — standalone doc generator fallback
- `/settings` — technician management
- `/guide` — franchise guide
- `/api/seed` — seed demo jobs (GET or POST)

## Notes

- Job detail API now exists at `/api/jobs/[id]`
- Upload page Workiz push uses `/api/workiz/jobs`
- In mock email mode, no email is sent externally; payloads are written to `data/mock-emails/`
- In mock CompanyCam mode, selecting the mock project loads five placeholder images so the send-photos flow can still be tested end-to-end
