# AirLens
 
**Real-time air quality monitoring for India.** AirLens collects live data from the CPCB real-time AQI feed (via [data.gov.in](https://data.gov.in)), stores it in MySQL, and shows it as an interactive map, a per-station dashboard, a pollution hotspot ranking, and email alerts.
 
> College mini project. Data is live and unvalidated at the source, so treat values as indicative, not official.
 
---
 
## Table of contents
 
1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [How it works](#how-it-works)
4. [How AQI is calculated](#how-aqi-is-calculated)
5. [Project structure](#project-structure)
6. [Getting started](#getting-started)
7. [Environment variables](#environment-variables)
8. [Available scripts](#available-scripts)
9. [API reference](#api-reference)
10. [Email alerts](#email-alerts)
11. [Limitations](#limitations) <!-- [Team](#team) -->
12. [Data source and acknowledgements](#data-source-and-acknowledgements)
---
 
## Features
 
- **AQI Map:** about 550 monitoring stations across India on an OpenStreetMap-based map, coloured by AQI band, with search and band filters.
- **Dashboard:** for any station, the current AQI and dominant pollutant, pollutant breakdown, 24-hour trend chart, live weather (temperature and humidity), station health (Online, Delayed, Offline), a short-term **AQI Forecast**, health advice for the current AQI, and recent pollution spikes.
- **Hotspots:** the most polluted station in each city, ranked by current AQI.
- **Alerts:** subscribe with an email address to get a daily air quality report and sudden-spike alerts for chosen stations.
- **Honest data handling:** a station without enough valid readings shows a grey **"AQI unavailable"** instead of a made-up number.
## Tech stack
 
| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Leaflet (react-leaflet), Recharts, Framer Motion |
| Backend | Node.js, Express 5 |
| Database | MySQL 8 (mysql2) |
| Scheduler | node-cron |
| Email | Nodemailer (Gmail SMTP) |
| Weather | Open-Meteo API (no key needed) |
| Map tiles | OpenStreetMap |
 
## How it works
 
```text
data.gov.in (CPCB real-time AQI feed)
        |   every 15 minutes (node-cron)
        v
Backend (Node.js + Express, port 3000)
  fetch -> group by station and timestamp -> store in MySQL
        -> detect pollution spikes -> send daily reports and spike alerts
        |   REST API (JSON)
        v
Frontend (React + Vite)
  Map | Dashboard | Hotspots | Alerts
```
 
1. Every **15 minutes** the backend requests the full feed. The source itself updates roughly once an hour, so most runs simply find nothing new; duplicates are never stored.
2. Records are grouped per station and timestamp and saved to `stations`, `aqi_readings` and `pollutant_readings`.
3. Each newly stored pollutant value is compared with the station's previous value. A rise of at least 30% and at least 10 points is saved as a **pollution event**.
4. After each run the backend checks whether any daily reports or spike emails are due.
5. The website never calls data.gov.in directly. It only reads from the backend, which reads the local database.
## How AQI is calculated
 
The feed's pollutant values are already **CPCB AQI sub-indices (0-500)**, not concentrations. This was checked against the official CPCB site on many stations. No official document states it, so treat it as verified by cross-checking.
 
- **Overall AQI = the highest pollutant sub-index** at the station. That pollutant is the *dominant pollutant*.
- **Data requirement (CPCB):** an AQI is shown only when at least **3 pollutants** have real values and at least one is **PM2.5 or PM10**. Otherwise: "AQI unavailable (insufficient data)".
- A pollutant reported as `NA` means no data, never 0.
- Values are never converted and no units are shown.

| AQI | Band |
|---|---|
| 0-50 | Good |
| 51-100 | Satisfactory |
| 101-200 | Moderate |
| 201-300 | Poor |
| 301-400 | Very Poor |
| 401-500 | Severe |
 
**AQI Forecast:** a simple trend estimate, not a trained model. It fits a least-squares line through up to the last 24 hourly AQI values and projects it forward (0-500). The trend is *Rising* above +1 AQI/hr, *Falling* below -1 AQI/hr, otherwise *Stable*. It needs at least 6 readings. Click the **i** icon next to the forecast on the Dashboard for the details.
 
Small differences from CPCB's own page are normal: CPCB averages PM over 24 hours and CO over 8 hours, and its page may be a few hours off from our feed time.
 
## Project structure
 
```text
AQI/
├── src/                      React frontend
│   ├── pages/                Home (map), Dashboard, Hotspots, Notifications (Alerts)
│   ├── components/           AirMap, AQICard, AQIChart, PollutantCard, HotspotCard, ...
│   ├── services/             api.js (backend calls), mappers.js (data shaping)
│   └── utils/aqi.js          AQI calculation (frontend)
├── backend/
│   ├── server.js, app.js     Express app
│   ├── routes/, controllers/ HTTP layer
│   ├── services/             ingestion, stations, readings, events, hotspots, alerts, mail
│   ├── scheduler/            cron.js, aqiJob.js
│   ├── scripts/              ingestion, migration, verification, reports
│   ├── utils/aqi.js          AQI calculation (backend)
│   └── schema.sql            database tables
├── aqi_backup.sql            database snapshot for quick setup
└── README.md
```
 
## Getting started
 
### Prerequisites
 
- [Node.js](https://nodejs.org) 18 or newer
- [MySQL](https://dev.mysql.com/downloads/) 8.0 or newer
- [Git](https://git-scm.com)
- A free API key from [data.gov.in](https://data.gov.in) (for live ingestion)
- Optional, for emails: a Gmail account with 2-Step Verification and an [App Password](https://myaccount.google.com/apppasswords)
### 1. Clone and install
 
```bash
git clone https://github.com/ramalakshmiannamalai6297-prog/AQI.git
cd AQI
npm install
cd backend
npm install
cd ..
```
 
### 2. Configure environment files
 
Copy the examples and fill in the values (see [Environment variables](#environment-variables)):
 
```bash
copy .env.example .env
copy backend\.env.example backend\.env
```
 
(On macOS or Linux use `cp` instead of `copy`.)
 
### 3. Set up the database
 
Quick way, using the included snapshot (contains station data and history):
 
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS aqi_event"
mysql -u root -p aqi_event -e "source aqi_backup.sql"
```
 
From scratch instead: run `backend/schema.sql`, then `node scripts/migrateAlerts.js` and `node scripts/runIngestion.js` inside `backend/`, then `npm run recompute-aqi`. Charts and forecasts fill in as hourly history builds up.
 
### 4. Run
 
Terminal 1, backend:
 
```bash
cd backend
node server.js
```
 
Check `http://localhost:3000/api/health`. It should answer `{"status":"ok", ...}`.
 
Terminal 2, frontend (main folder):
 
```bash
npm run dev
```
 
Open the exact link Vite prints (usually `http://localhost:5173`).
 
> Keep the backend running. The scheduled data collection and email alerts only work while `node server.js` is running. After changing backend code, restart it and hard-refresh the browser (Ctrl+Shift+R).
 
## Environment variables
 
**Frontend `.env` (main folder)**
 
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend address, default `http://localhost:3000` |
 
**Backend `backend/.env`**
 
| Variable | Description |
|---|---|
| `API_KEY` | data.gov.in API key |
| `DB_HOST`, `DB_PORT` | MySQL host and port (`localhost`, `3306`) |
| `DB_USER`, `DB_PASSWORD` | MySQL login |
| `DB_NAME` | `aqi_event` |
| `DB_SSL` | Optional, `true` for cloud databases |
| `SMTP_HOST`, `SMTP_PORT` | `smtp.gmail.com`, `587` |
| `SMTP_USER`, `SMTP_PASS` | Sender Gmail and its 16-letter App Password |
| `MAIL_FROM` | Sender name and address shown in emails |
 
Never commit a real `.env` file. Email is optional: if the SMTP values are empty, the app runs normally and simply skips sending.
 
## Available scripts
 
**Frontend (main folder)**
 
| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build (also a good check that nothing is broken) |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |
 
**Backend (`backend/`)**
 
| Command | What it does |
|---|---|
| `node server.js` | Start the API and the 15-minute scheduler |
| `node scripts/runIngestion.js` | Fetch and store the feed once, right now |
| `npm run recompute-aqi` | Recompute stored AQI values |
| `npm run migrate-alerts` | Create or update the alert tables |
| `npm run send-daily-report` | Send the daily report now |
| `npm run send-alerts` | Send pending spike alerts now |
| `node scripts/verifyAll.js` | Run the automated backend checks |
 
## API reference
 
Base URL: `http://localhost:3000`
 
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server status |
| GET | `/api/stations` | All stations with their latest pollutant values |
| GET | `/api/stations/:id/history?limit=24` | Past readings for charts (limit up to 168) |
| GET | `/api/stations/:id/recommendations` | AQI, band, dominant pollutant, health advice |
| GET | `/api/stations/:id/forecast?hours=6` | AQI Forecast, 1 to 24 hours ahead |
| GET | `/api/stations/:id/weather` | Live temperature and humidity |
| GET | `/api/stations/:id/health` | Online, Delayed or Offline, with minutes since last update |
| GET | `/api/hotspots?limit=12` | Most polluted station per city, highest first |
| GET | `/api/events?limit=10` | Recent pollution spike events |
| POST | `/api/alerts/subscribe` | Body: `{ email, stationId, minSeverity }` |
| POST | `/api/alerts/unsubscribe` | Body: `{ email, stationId }` |
| POST | `/api/alerts/test` | Body: `{ email }`. Sends a sample report |
 
## Email alerts
 
- **Daily report:** one email per subscriber per day, sent once India time (IST) is 08:00 or later. It covers every station the person subscribed to.
- **Spike alerts:** sent only for rises of **75% or more**, detected in the last 24 hours and after the subscription was created. Spikes are bundled into one email per run (up to 10 listed).
- Sent emails are logged, so the same report or spike is never sent twice. A log entry is written only after a successful send, so a failed send is retried automatically.
## Limitations
 
- The live feed is unvalidated and may contain errors or faulty sensors. A hotspot could be a local source or a bad sensor, so cards show the dominant pollutant and update time.
- Overall AQI uses the latest reading, while CPCB uses 24-hour averages for PM, so small differences are expected.
- The forecast is a straight-line trend and cannot predict sudden events.
- There is no user login, and the API allows requests from any origin. It is meant for local or demo use, not public deployment as is.
- Weather and email need an internet connection.

## Data source and acknowledgements
 
- Air quality data: **Central Pollution Control Board (CPCB)** real-time AQI, published through the Government of India open data platform, [data.gov.in](https://data.gov.in).
- Weather: [Open-Meteo](https://open-meteo.com).
- Map data: &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
AirLens is an independent student project and is not affiliated with CPCB or the Government of India.
