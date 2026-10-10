import { sensorLocations, getHealthAdvice } from "../data/dummyData.js";
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

/**
 * Maps a single backend station to the shape used by UI components
 * (Matches sensorLocations shape from dummyData.js)
 */
export function mapBackendStationToFrontend(backendStation, dummySensors = sensorLocations) {
  if (!backendStation) return null;

  const dummyList = Array.isArray(dummySensors) ? dummySensors : sensorLocations;

  // Find corresponding dummy sensor for fallback attributes (weather, sensorStatus, ID slug)
  const cityLower = (backendStation.city || "").toLowerCase().trim();
  const stationNameLower = (backendStation.stationName || "").toLowerCase().trim();

  const dummyMatch = dummyList.find(
    (d) =>
      d.city.toLowerCase().trim() === cityLower ||
      d.station.toLowerCase().trim() === stationNameLower
  ) || dummyList[0] || {};

  const pm25 = Number(backendStation.pollutants?.["PM2.5"] ?? dummyMatch.pm25 ?? 0);
  const pm10 = Number(backendStation.pollutants?.["PM10"] ?? dummyMatch.pm10 ?? 0);
  const no2 = Number(backendStation.pollutants?.["NO2"] ?? dummyMatch.no2 ?? 0);
  const so2 = Number(backendStation.pollutants?.["SO2"] ?? dummyMatch.so2 ?? 0);
  const co = Number(backendStation.pollutants?.["CO"] ?? dummyMatch.co ?? 0);
  const o3 = Number(backendStation.pollutants?.["OZONE"] ?? dummyMatch.o3 ?? 0);

  const pollutantsMap = {
    "PM2.5": pm25,
    "PM10": pm10,
    "NO2": no2,
    "SO2": so2,
    "CO": co,
    "OZONE": o3
  };

  // Real Indian CPCB AQI calculation from real pollutant values
  const aqiResult = calcAQI(backendStation.pollutants) || calcAQI(pollutantsMap);
  const aqi = aqiResult ? aqiResult.aqi : (dummyMatch.aqi ?? 120);
  const dominating = aqiResult ? aqiResult.dominantPollutant : (dummyMatch.dominatingPollutant || "PM2.5");
  const categoryInfo = getAQICategory(aqi);

  let lastUpdatedFormatted = dummyMatch.lastUpdated || "Live";
  if (backendStation.lastUpdate) {
    const d = new Date(backendStation.lastUpdate);
    if (!isNaN(d.getTime())) {
      lastUpdatedFormatted = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  }

  return {
    ...dummyMatch, // retains temperature, humidity, sensorStatus demo values
    // ID slug keeps URL routing compatible (/dashboard?city=delhi-anand-vihar or city=21)
    id: dummyMatch.id || String(backendStation.stationId),
    stationId: Number(backendStation.stationId),
    station: backendStation.stationName || dummyMatch.station,
    stationName: backendStation.stationName || dummyMatch.station,
    city: backendStation.city || dummyMatch.city,
    state: backendStation.state || dummyMatch.state,
    latitude: Number(backendStation.latitude ?? dummyMatch.latitude),
    longitude: Number(backendStation.longitude ?? dummyMatch.longitude),
    readingId: backendStation.readingId ? Number(backendStation.readingId) : undefined,
    lastUpdate: backendStation.lastUpdate,
    lastUpdated: lastUpdatedFormatted,
    aqi,
    category: categoryInfo.label,
    categoryColor: categoryInfo.color,
    categoryBg: categoryInfo.bg,
    categoryText: categoryInfo.text,
    healthAdvice: getHealthAdvice(aqi),
    dominatingPollutant: dominating,
    trend: dummyMatch.trend || "Live Tracking",
    pm25,
    pm10,
    co,
    no2,
    so2,
    o3,
    pollutants: {
      pm25,
      pm10,
      co,
      no2,
      so2,
      o3
    },
    pollutantBreakdown: [
      { name: "PM2.5", value: pm25, safeLimit: 60, unit: "µg/m³" },
      { name: "PM10", value: pm10, safeLimit: 100, unit: "µg/m³" },
      { name: "NO₂", value: no2, safeLimit: 80, unit: "µg/m³" },
      { name: "SO₂", value: so2, safeLimit: 80, unit: "µg/m³" },
      { name: "CO", value: co, safeLimit: 2.0, unit: "mg/m³" },
      { name: "O₃", value: o3, safeLimit: 100, unit: "µg/m³" }
    ]
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

    const pm25 = Math.round(Number(item.pollutants?.["PM2.5"]?.avg ?? item.pollutants?.["PM2.5"] ?? 0));
    const pm10 = Math.round(Number(item.pollutants?.["PM10"]?.avg ?? item.pollutants?.["PM10"] ?? 0));
    
    // Real Indian CPCB AQI calculation for every history timestamp
    const aqiResult = calcAQI(item.pollutants);
    const aqi = aqiResult ? aqiResult.aqi : (station?.aqi ?? 120);
    const dominant = aqiResult ? aqiResult.dominantPollutant : (station?.dominatingPollutant || "PM2.5");

    return {
      time,
      aqi,
      dominantPollutant: dominant,
      pm25,
      pm10,
      readingId: Number(item.readingId),
      lastUpdate: item.lastUpdate,
      pollutants: item.pollutants
    };
  });
}

/**
 * Maps a backend hotspot into component shape
 */
export function mapBackendHotspot(hotspot, dummySensors = sensorLocations) {
  const dummyList = Array.isArray(dummySensors) ? dummySensors : sensorLocations;
  const stationId = Number(hotspot.station_id);
  const cityLower = (hotspot.city || "").toLowerCase().trim();
  const stationLower = (hotspot.station_name || "").toLowerCase().trim();

  const dummy = dummyList.find(
    (d) =>
      d.city.toLowerCase().trim() === cityLower ||
      d.station.toLowerCase().trim() === stationLower
  ) || {};

  const previousValue = Number(hotspot.previous_value);
  const currentValue = Number(hotspot.current_value);
  const changeValue = Number(hotspot.change_value);
  const changePercentage = Number(hotspot.change_percentage);

  // Calculate real sub-index / AQI for hotspot
  const sub = calcSubIndex(hotspot.pollutant_id, currentValue);
  const aqi = sub !== null ? sub : (dummy.aqi || 220);
  const cat = getAQICategory(aqi);

  return {
    id: dummy.id || String(stationId),
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
    pm25: hotspot.pollutant_id === "PM2.5" ? Math.round(currentValue) : (dummy.pm25 || 0),
    pm10: hotspot.pollutant_id === "PM10" ? Math.round(currentValue) : (dummy.pm10 || 0),
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
  
  // Format numbers inside message to 1 decimal place without changing backend
  let message = event.message;
  if (message) {
    message = message.replace(/from\s+([0-9.]+)\s+to\s+([0-9.]+)/gi, (_, p1, p2) => {
      return `from ${Number(p1).toFixed(1)} to ${Number(p2).toFixed(1)}`;
    });
  } else {
    message = `${event.pollutant_id} increased from ${previousValue.toFixed(1)} to ${currentValue.toFixed(1)} at ${event.station_name} (+${changePercentage.toFixed(1)}%).`;
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
