import { calcAQI, calcSubIndex, getAQICategory } from "../utils/aqi.js";

/**
 * Format timestamp into relative or friendly time
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function parseVal(v) {
  if (v === null || v === undefined || v === "NA" || v === "na") return null;
  if (typeof v === "object") {
    const raw = v.avg ?? v.value ?? v.val;
    if (raw === null || raw === undefined || raw === "NA" || raw === "na") return null;
    const n = Number(raw);
    return isNaN(n) || !isFinite(n) ? null : n;
  }
  const n = Number(v);
  return isNaN(n) || !isFinite(n) ? null : n;
}

/**
 * Maps a single backend station to the shape used by UI components
 */
export function mapBackendStationToFrontend(backendStation) {
  if (!backendStation) return null;

  const rawPollutants = backendStation.pollutants || {};
  const pm25 = parseVal(rawPollutants["PM2.5"] ?? rawPollutants["pm25"]);
  const pm10 = parseVal(rawPollutants["PM10"] ?? rawPollutants["pm10"]);
  const no2 = parseVal(rawPollutants["NO2"] ?? rawPollutants["no2"]);
  const so2 = parseVal(rawPollutants["SO2"] ?? rawPollutants["so2"]);
  const co = parseVal(rawPollutants["CO"] ?? rawPollutants["co"]);
  const o3 = parseVal(rawPollutants["OZONE"] ?? rawPollutants["O3"] ?? rawPollutants["o3"]);
  const nh3 = parseVal(rawPollutants["NH3"] ?? rawPollutants["nh3"]);

  const pollutantsMap = {};
  if (pm25 !== null) pollutantsMap["PM2.5"] = pm25;
  if (pm10 !== null) pollutantsMap["PM10"] = pm10;
  if (no2 !== null) pollutantsMap["NO2"] = no2;
  if (so2 !== null) pollutantsMap["SO2"] = so2;
  if (co !== null) pollutantsMap["CO"] = co;
  if (o3 !== null) pollutantsMap["OZONE"] = o3;
  if (nh3 !== null) pollutantsMap["NH3"] = nh3;

  // Real Indian CPCB AQI calculation from real pollutant values
  const aqiResult = calcAQI(backendStation.pollutants) || calcAQI(pollutantsMap);
  const aqi = aqiResult ? aqiResult.aqi : null;
  const dominating = aqiResult ? aqiResult.dominantPollutant : "Unavailable";
  const categoryInfo = getAQICategory(aqi);

  let lastUpdatedFormatted = "Live";
  if (backendStation.lastUpdate) {
    const d = new Date(backendStation.lastUpdate);
    if (!isNaN(d.getTime())) {
      lastUpdatedFormatted = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  }

  // Pollutant breakdown for charts and cards (no units, no safeLimit)
  const breakdown = [
    { name: "PM2.5", value: pm25 },
    { name: "PM10", value: pm10 },
    { name: "NO₂", value: no2 },
    { name: "SO₂", value: so2 },
    { name: "CO", value: co },
    { name: "O₃", value: o3 }
  ];
  if (nh3 !== null) {
    breakdown.push({ name: "NH₃", value: nh3 });
  }

  return {
    id: String(backendStation.stationId),
    stationId: Number(backendStation.stationId),
    station: backendStation.stationName || "Station",
    stationName: backendStation.stationName || "Station",
    city: backendStation.city || "City",
    state: backendStation.state || "State",
    latitude: Number(backendStation.latitude || 0),
    longitude: Number(backendStation.longitude || 0),
    readingId: backendStation.readingId ? Number(backendStation.readingId) : undefined,
    lastUpdate: backendStation.lastUpdate,
    lastUpdated: lastUpdatedFormatted,
    aqi,
    category: categoryInfo.label,
    categoryColor: categoryInfo.color,
    categoryBg: categoryInfo.bg,
    categoryText: categoryInfo.text,
    dominatingPollutant: dominating,
    trend: "Live Tracking",
    pm25,
    pm10,
    co,
    no2,
    so2,
    o3,
    nh3,
    pollutants: {
      pm25,
      pm10,
      co,
      no2,
      so2,
      o3,
      nh3
    },
    pollutantBreakdown: breakdown
  };
}

/**
 * Maps backend station history into 24-hour hourlyTrend format for AQIChart
 */
export function mapBackendHistoryToHourlyTrend(historyList, station = null) {
  if (!Array.isArray(historyList) || historyList.length === 0) {
    return [];
  }

  return historyList.map((item, index) => {
    const d = new Date(item.lastUpdate);
    const time = !isNaN(d.getTime())
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      : `Reading ${index + 1}`;

    const pm25 = parseVal(item.pollutants?.["PM2.5"]);
    const pm10 = parseVal(item.pollutants?.["PM10"]);
    
    // Real Indian CPCB AQI calculation for every history timestamp
    const aqiResult = calcAQI(item.pollutants);
    const aqi = aqiResult ? aqiResult.aqi : null;
    const dominant = aqiResult ? aqiResult.dominantPollutant : "Unavailable";

    return {
      time,
      aqi,
      dominantPollutant: dominant,
      pm25: pm25 !== null ? Math.round(pm25) : null,
      pm10: pm10 !== null ? Math.round(pm10) : null,
      readingId: Number(item.readingId),
      lastUpdate: item.lastUpdate,
      pollutants: item.pollutants
    };
  });
}

/**
 * Maps a backend hotspot into component shape
 */
export function mapBackendHotspot(hotspot) {
  const stationId = Number(hotspot.station_id);
  const previousValue = Number(hotspot.previous_value);
  const currentValue = Number(hotspot.current_value);
  const changeValue = Number(hotspot.change_value);
  const changePercentage = Number(hotspot.change_percentage);

  // Sub-index is currentValue directly
  const sub = calcSubIndex(hotspot.pollutant_id, currentValue);
  const aqi = sub !== null ? sub : null;
  const cat = getAQICategory(aqi);

  return {
    id: String(stationId),
    stationId,
    city: hotspot.city,
    state: hotspot.state,
    station: hotspot.station_name,
    latitude: Number(hotspot.latitude),
    longitude: Number(hotspot.longitude),
    pollutantId: hotspot.pollutant_id,
    previousValue,
    currentValue,
    changeValue,
    changePercentage,
    lastUpdate: hotspot.last_update,
    aqi,
    category: cat.label,
    categoryColor: cat.color,
    categoryBg: cat.bg,
    categoryText: cat.text,
    pm25: hotspot.pollutant_id === "PM2.5" ? Math.round(currentValue) : null,
    pm10: hotspot.pollutant_id === "PM10" ? Math.round(currentValue) : null,
    trend: `+${changePercentage.toFixed(1)}% ${hotspot.pollutant_id}`
  };
}

/**
 * Maps a backend event into the notification/alert item format
 */
export function mapBackendEvent(event) {
  const severity = (event.severity || "MEDIUM").toUpperCase();
  let type = "warning";
  if (severity === "HIGH" || severity === "CRITICAL" || severity === "SEVERE") {
    type = "danger";
  } else if (severity === "LOW" || severity === "INFO") {
    type = "info";
  }

  const changePercentage = Number(event.change_percentage);
  const currentValue = Number(event.current_value);
  const previousValue = Number(event.previous_value);

  const title = `${event.severity || "POLLUTANT"} SPIKE: ${event.city} (${event.pollutant_id})`;
  
  let message = event.message;
  if (!message) {
    message = `${event.pollutant_id} AQI rose from ${previousValue.toFixed(1)} to ${currentValue.toFixed(1)}`;
  }

  return {
    id: Number(event.event_id),
    type,
    title,
    time: formatTimeAgo(event.detected_at || event.last_update),
    message,
    city: event.city,
    state: event.state,
    station: event.station_name,
    stationId: Number(event.station_id),
    pollutantId: event.pollutant_id,
    previousValue,
    currentValue,
    changeValue: Number(event.change_value),
    changePercentage,
    severity: event.severity || "MEDIUM",
    detectedAt: event.detected_at
  };
}
