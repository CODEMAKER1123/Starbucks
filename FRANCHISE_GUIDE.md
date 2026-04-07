# Rolling Suds — Starbucks Operations Platform

## What This Is

A free web app that automates the paperwork for your Starbucks overnight pressure washing contract through GoSuperClean. Every Rolling Suds franchisee doing Starbucks work can use this.

---

## Full Functionality

### 1. Upload Your Starbucks Schedule
- Drag and drop your monthly .xlsx schedule spreadsheet
- The app parses every store: night number, date, store number, address, city, state
- Set the price for all stores at once (e.g. type "350" and click "Set All")
- Assign a default technician to all jobs, or assign per-store
- Click "Save Locally" — all jobs are saved and appear on your calendar

### 2. Calendar / Schedule View
- See all your Starbucks jobs in a week or month calendar view
- Color coded: red = unassigned, blue = assigned, green = completed
- Click any job to open its detail page
- Bulk assign a technician to multiple jobs at once (Shift+Click to select)

### 3. Job Detail Page (where the magic happens)
After a job is completed, open it and:
- Fill in the **WO#** (work order number from GoSuperClean)
- Fill in the **Invoice#** (your sequential invoice number)
- Set **start/stop times** and mark as **completed**
- Everything auto-saves as you type

### 4. PDF Generation
From any job or from the standalone Generate Docs page:
- **Invoice PDF** — Rolling Suds branded with teal header, "THE POWER WASHING PROFESSIONALS" tagline, your company name/phone/email, Bill To / Service Location, description table, price, Balance Due
- **Work Order PDF** — SuperClean Service Company format with service date (12:00 AM), store info, instruction paragraph, photo warning, technician checklist (all boxes checked), completion section with tech name/start/stop/total hours, and Max's signature rendered as vector graphics
- Preview each PDF in the browser before downloading
- Download individually or both at once

### 5. CompanyCam Integration
- Click "Find Photos" on any job
- The app searches CompanyCam for a project matching "Starbucks #XXXXX WO# XXXXXXX"
- If found, automatically loads and selects all photos (typically the 5 required: front door + 2 before + 2 after)
- You can see thumbnails and confirm they're correct before sending
- If the exact name doesn't match, shows similar projects so you can pick the right one

### 6. Email Sending
Two separate emails per store, each with one click:

**"Send Documents" → documents@gosuperclean.com**
- Auto-generates the Invoice PDF and signed Work Order PDF on the server
- Attaches both as proper PDF file attachments
- Subject: `Starbucks #00806 WO# 1963606 Invoice`
- Body: "Attached is the invoice and signed WO for Starbucks #00806 WO# 1963606. Let me know if you have any questions. Thanks."
- You are CC'd on every email

**"Send Photos" → starbucks@gosuperclean.com**
- Downloads the selected CompanyCam photos on the server
- Attaches all as proper JPEG file attachments
- Subject: `Starbucks #00806 WO# 1963606 Pictures`
- Body: "Attached are the before/after pictures and front door photo for Starbucks #00806 WO# 1963606. Let me know if you have any questions. Thanks."
- You are CC'd on every email

**"Test to Me" button** — sends to your own email first so you can verify everything looks right before sending to GoSuperClean.

### 7. Email Logging
- Every email sent is recorded on the job: type (docs/photos), recipient, timestamp
- Shows a green "Sent" badge so you know what's been sent
- Button changes to "Resend" after first send to prevent accidental double-sends
- Full audit trail of every email per store

### 8. Settings
- Add and remove technicians from the app (no code changes needed)
- Technician list is shared across all pages

### 9. Standalone Doc Generator
- The /generate page works independently of everything else
- Type in store info manually and generate Invoice + Work Order PDFs
- Useful as a fallback if you just need quick PDFs without the full workflow

---

## Cost

| Service | Cost |
|---------|------|
| Hosting (Vercel) | Free |
| Database (Redis) | Free (30MB) |
| Email (Resend) | Free (3,000 emails/month) |
| CompanyCam | You already have this |
| **Total** | **$0/month** |

---

## Setup Instructions

**Time needed: about 30 minutes.** Follow every step exactly.

### Step 1: Create Accounts (if you don't have them)

You need these free accounts:
- **GitHub** — go to github.com and sign up
- **Vercel** — go to vercel.com and sign in with your GitHub account
- **Resend** — go to resend.com and sign up (for sending emails)

### Step 2: Fork the Repository

1. Go to: **https://github.com/maxgelfman-glitch/Starbucks**
2. Click the **"Fork"** button (top right)
3. On the fork page, click **"Create fork"**
4. You now have your own copy at `github.com/YOUR-USERNAME/Starbucks`

**IMPORTANT:** This is YOUR copy. Your data, your API keys, your emails. It is completely separate from everyone else's.

### Step 3: Get Your CompanyCam API Token

1. Log into CompanyCam (web or app)
2. Go to **Your Company → Account → Access Tokens**
3. Click **Create an Access Token**
4. Select **"N/A"** from the dropdown
5. Click Create
6. **Copy the token** and save it somewhere — you'll need it in Step 6

### Step 4: Set Up Resend (for email)

1. Go to **resend.com** and sign in
2. Go to **API Keys** and copy your API key
3. Go to **Domains** → **Add Domain**
4. Type in a domain you own (e.g. `yourbusiness.com`)
5. Resend will show you **3 DNS records** to add
6. Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add those DNS records
7. Go back to Resend and click **Verify**
8. Wait for verification (can take a few minutes to an hour)

**You MUST verify a domain to send emails to external addresses.** There is no way around this — it's the same with every email service.

### Step 5: Deploy to Vercel

1. Go to **vercel.com**
2. Click **"Add New..." → "Project"**
3. Find your forked **Starbucks** repo and click **Import**
4. **Before clicking Deploy**, expand **"Environment Variables"**
5. Add each of these variables (type the name on the left, paste the value on the right, click Add):

| Name | Your Value |
|------|-----------|
| `RESEND_API_KEY` | Your Resend API key |
| `EMAIL_FROM` | yourname@yourdomain.com (must match your verified Resend domain) |
| `EMAIL_SENDER_NAME` | Your Name |
| `EMAIL_REPLY_TO` | your.email@rollingsuds.com |
| `EMAIL_CC` | your.email@rollingsuds.com |
| `COMPANYCAM_API_TOKEN` | Your CompanyCam token from Step 3 |
| `NEXT_PUBLIC_COMPANY_NAME` | Rolling Suds of [Your Territory] |
| `NEXT_PUBLIC_COMPANY_PHONE` | (555) 123-4567 |
| `NEXT_PUBLIC_COMPANY_EMAIL` | your.email@rollingsuds.com |

Optional (only if you have Workiz API access):

| Name | Your Value |
|------|-----------|
| `WORKIZ_API_TOKEN` | Your Workiz API token |
| `WORKIZ_BASE_URL` | https://api.workiz.com/api/v1 |

6. Click **Deploy**
7. Wait 1-2 minutes. You'll get a URL like `starbucks-xyz.vercel.app`

### Step 6: Add Database

Your app needs a database to store jobs. Without this, data disappears.

1. In Vercel, go to your **starbucks project**
2. Click **"Storage"** tab
3. Click **"Create Database"**
4. Choose **"KV"** (Redis)
5. Name it anything (e.g. `starbucks-data`)
6. Select the **free 30MB plan**
7. Click **Create**
8. When asked, **connect it to your starbucks project**
9. Go to **Deployments** tab → click the **three dots** on the latest deploy → **Redeploy**

### Step 7: Load Your Schedule

1. Go to your app URL
2. Add `/api/seed` at the end (e.g. `https://starbucks-xyz.vercel.app/api/seed`)
3. You should see `{"success":true,"count":30}`
4. Go back to the main URL — your dashboard and schedule should have data

OR skip the seed data and just go to **Upload** and drop in your actual .xlsx schedule.

### Step 8: Test Everything

1. Go to **Generate Docs** — fill in a test store and click "Generate Invoice & Work Order". Verify the PDFs download correctly.
2. Go to **Schedule** — verify your jobs appear on the calendar.
3. Click into a job — fill in WO#, invoice#, start/stop times.
4. Click **"Find Photos"** — verify it finds the CompanyCam project.
5. Click **"Test to Me"** for documents — check your email for the invoice and work order PDFs.
6. Click **"Test to Me"** for photos — check your email for the photo attachments.
7. If everything looks good, you're ready to use it for real.

---

## Spreadsheet Format

Your Starbucks schedule .xlsx must have these columns:

| Night | Date | Store | Address | City | State |
|-------|------|-------|---------|------|-------|
| 1 | 2026-04-06 | Starbucks # 00806 | 301 Greenwich Ave | Greenwich | CT |

- **Night** — night number (1, 2, 3, etc.)
- **Date** — service date (any format the spreadsheet uses)
- **Store** — must contain the store number (the app extracts it automatically)
- **Address** — street address
- **City** — city name
- **State** — state abbreviation

---

## Daily Workflow

1. Jobs get done overnight
2. Next morning, open the app (works on your phone)
3. Go to **Schedule**, click the completed job
4. Fill in: **WO#**, **Invoice#**, **start time**, **stop time**
5. Change status to **completed**
6. Click **"Find Photos"** — auto-matches from CompanyCam
7. Verify photos look right
8. Click **"Test to Me"** first time to verify (optional)
9. Click **"Send Documents"** — invoice + signed WO → documents@gosuperclean.com
10. Click **"Send Photos"** — 5 photos → starbucks@gosuperclean.com
11. Green "Sent" badge confirms it's done. Move to next store.

---

## Important Notes

- **Each franchisee runs their own instance.** Your data, API keys, and emails are 100% separate from everyone else's. There is no shared anything.
- **If you fork without changing the environment variables**, the app shows generic placeholder info and emails won't work. You MUST set up your own env vars.
- **CompanyCam project naming matters.** Projects should be named like `Starbucks #00806 WO# 1963606` for the auto-match to work. If named differently, the app shows a list of similar projects to pick from.
- **The app works without Workiz.** Workiz integration is optional. Everything else (PDFs, schedule, CompanyCam, emails) works independently.
- **Bookmark your Vercel URL.** That's your app. It works on desktop and mobile.

---

## Questions?

This is open source software. If you need help setting it up, reach out to Max Gelfman at Rolling Suds of Westchester-Stamford.
