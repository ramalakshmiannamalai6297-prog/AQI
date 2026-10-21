const { getLatestStations } = require("./stationService");
const { calcAQI, getAQICategory } = require("../utils/aqi");

async function getHotspots(limit = 12) {
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
  const stations = await getLatestStations();
  const now = Date.now();
  const candidateStations = [];

  for (const s of stations) {
    if (!s.lastUpdate) continue;
    const d = new Date(s.lastUpdate).getTime();
    if (isNaN(d)) continue;
    const diffMinutes = Math.max(0, Math.round((now - d) / (1000 * 60)));
    // Exclude stations older than 24 hours (same threshold as existing station health "Offline" rule)
    if (diffMinutes >= 1440) continue;

    const aqiRes = calcAQI(s.pollutants);
    if (!aqiRes || typeof aqiRes.aqi !== "number") continue;

    const cat = getAQICategory(aqiRes.aqi);

    candidateStations.push({
      stationId: s.stationId,
      stationName: s.stationName,
      city: s.city,
      state: s.state,
      latitude: s.latitude,
      longitude: s.longitude,
      aqi: aqiRes.aqi,
      category: cat.label,
      band: cat.label,
      dominantPollutant: aqiRes.dominantPollutant,
      pm25: aqiRes.subIndices["PM2.5"] ?? null,
      pm10: aqiRes.subIndices["PM10"] ?? null,
      lastUpdate: s.lastUpdate
    });
  }

  // Group by city (case-insensitive trimmed city value), keep highest-AQI station in each city
  const cityMap = new Map();
  for (const item of candidateStations) {
    const key = (item.city || "").trim().toLowerCase();
    if (!key) continue;
    const existing = cityMap.get(key);
    if (!existing) {
      cityMap.set(key, item);
    } else {
      if (item.aqi > existing.aqi) {
        cityMap.set(key, item);
      } else if (item.aqi === existing.aqi && item.stationName.localeCompare(existing.stationName) < 0) {
        cityMap.set(key, item);
      }
    }
  }

  const worstPerCity = Array.from(cityMap.values());
  // Sort by AQI descending, ties broken by station name
  worstPerCity.sort((a, b) => b.aqi - a.aqi || a.stationName.localeCompare(b.stationName));

  return worstPerCity.slice(0, safeLimit).map((item, index) => ({
    rank: index + 1,
    city: item.city,
    state: item.state,
    stationId: item.stationId,
    stationName: item.stationName,
    station_name: item.stationName,
    aqi: item.aqi,
    category: item.category,
    band: item.band,
    dominantPollutant: item.dominantPollutant,
    pm25: item.pm25,
    pm10: item.pm10,
    lastUpdate: item.lastUpdate
  }));
}

module.exports = { getHotspots };