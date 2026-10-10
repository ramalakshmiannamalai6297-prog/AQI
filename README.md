# AQI Event Detection System

A web-based Air Quality Monitoring and Pollution Event Detection System.

Current backend focus:

> Fetch AQI-related pollutant data → store it safely → detect unusual pollutant spikes.

## Current Backend Flow

```text
data.gov.in AQI API
        ↓
utils/apiClient.js
        ↓
services/aqiService.js
        ↓
services/ingestionService.js
        ↓
Group records by station + timestamp
        ↓
services/stationService.js
        ↓
Find or create station in MySQL
        ↓
services/readingService.js
        ↓
Create/reuse AQI reading
        ↓
Store pollutant readings
        ↓
services/eventService.js
        ↓
Compare with previous station reading
        ↓
Store pollution spike event if threshold is crossed