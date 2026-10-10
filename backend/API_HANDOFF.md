# AQI Backend API Handoff

Base URL during local development:

```text
http://localhost:3000
```

All responses are JSON.

## 1. Backend Health Check

```text
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "service": "AQI Event Detection Backend"
}
```

Use this to confirm that the backend is running.

## 2. Latest Station Data

```text
GET /api/stations
```

Returns every station with its most recent saved pollutant readings.

Example response:

```json
{
  "count": 2,
  "stations": [
    {
      "stationId": 6,
      "stationName": "District Court, Eluru - APPCB",
      "city": "Eluru",
      "state": "Andhra Pradesh",
      "latitude": 16.711754,
      "longitude": 81.092095,
      "readingId": 42,
      "lastUpdate": "2026-10-08T12:00:00.000Z",
      "pollutants": {
        "PM2.5": 48,
        "PM10": 67,
        "NO2": 21
      }
    }
  ]
}
```

Frontend uses:

- Map markers
- Station search
- Station list
- Dashboard selector
- Current pollutant cards

## 3. Station History

```text
GET /api/stations/:stationId/history
```

Optional query parameter:

```text
?limit=24
```

Example:

```text
GET /api/stations/6/history?limit=10
```

Example response:

```json
{
  "stationId": 6,
  "count": 2,
  "history": [
    {
      "readingId": 41,
      "lastUpdate": "2026-10-08T11:00:00.000Z",
      "pollutants": {
        "PM2.5": {
          "min": 40,
          "avg": 45,
          "max": 52
        }
      }
    }
  ]
}
```

Frontend uses:

- Pollutant trend charts
- Station-history graphs
- Time-based dashboard analysis

## 4. Hotspots

```text
GET /api/hotspots
```

Optional query parameter:

```text
?limit=10
```

Example:

```text
GET /api/hotspots?limit=5
```

A hotspot means a station where a pollutant has increased compared with its previous recorded value.

Example response:

```json
{
  "count": 1,
  "hotspots": [
    {
      "station_id": 6,
      "station_name": "District Court, Eluru - APPCB",
      "city": "Eluru",
      "state": "Andhra Pradesh",
      "pollutant_id": "PM2.5",
      "previous_value": 54,
      "current_value": 90,
      "change_value": 36,
      "change_percentage": 66.67,
      "last_update": "2026-10-08T12:00:00.000Z"
    }
  ]
}
```

Frontend uses:

- Hotspots page
- Hotspot map markers
- Pollution increase ranking

## 5. Pollution Events

```text
GET /api/events
```

Optional query parameter:

```text
?limit=10
```

A pollution event is created when:

- Pollutant average increases by at least 10 units
- Pollutant average increases by at least 30%

Example response:

```json
{
  "count": 1,
  "events": [
    {
      "event_id": 1,
      "event_type": "POLLUTANT_SPIKE",
      "pollutant_id": "PM2.5",
      "previous_value": 54,
      "current_value": 90,
      "change_value": 36,
      "change_percentage": 66.67,
      "severity": "MEDIUM",
      "message": "PM2.5 increased from 54 to 90 at this station.",
      "city": "Eluru",
      "station_name": "District Court, Eluru - APPCB"
    }
  ]
}
```

Frontend uses:

- Notifications page
- Event cards
- “Why pollution changed” explanations

## Important Frontend Note

The current backend stores pollutant data such as:

```text
PM2.5
PM10
NO2
SO2
CO
OZONE
```

It does not yet calculate one overall AQI number. For now, frontend pages should display the provided pollutant values directly.

Overall AQI calculation and AI prediction are future integration tasks.