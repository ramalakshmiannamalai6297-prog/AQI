// API service to interact with Express backend (http://localhost:3000)
const BASE_URL = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) 
  || "http://localhost:3000";

/**
 * Fetch all monitoring stations with latest pollutant readings
 * Endpoint: GET /api/stations
 */
export async function getStations() {
  try {
    const response = await fetch(`${BASE_URL}/api/stations`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stations: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return {
      count: data.count || 0,
      stations: Array.isArray(data.stations)
        ? data.stations.map((s) => ({
            ...s,
            stationId: Number(s.stationId),
            latitude: Number(s.latitude),
            longitude: Number(s.longitude),
            readingId: s.readingId ? Number(s.readingId) : undefined,
            pollutants: s.pollutants
              ? Object.entries(s.pollutants).reduce((acc, [key, val]) => {
                  acc[key] = Number(val);
                  return acc;
                }, {})
              : {}
          }))
        : []
    };
  } catch (error) {
    console.error("Error in getStations:", error);
    throw error;
  }
}

/**
 * Fetch 24-hour reading history for a specific station
 * Endpoint: GET /api/stations/:stationId/history?limit=24
 */
export async function getStationHistory(stationId, limit = 24) {
  try {
    const response = await fetch(`${BASE_URL}/api/stations/${stationId}/history?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch history for station ${stationId}: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return {
      stationId: Number(data.stationId || stationId),
      count: data.count || 0,
      history: Array.isArray(data.history)
        ? data.history.map((h) => ({
            readingId: Number(h.readingId),
            lastUpdate: h.lastUpdate,
            pollutants: h.pollutants
              ? Object.entries(h.pollutants).reduce((acc, [key, vals]) => {
                  acc[key] = {
                    min: Number(vals?.min ?? 0),
                    avg: Number(vals?.avg ?? 0),
                    max: Number(vals?.max ?? 0)
                  };
                  return acc;
                }, {})
              : {}
          }))
        : []
    };
  } catch (error) {
    console.error(`Error in getStationHistory for station ${stationId}:`, error);
    throw error;
  }
}

/**
 * Fetch pollution hotspots (spikes) across stations
 * Endpoint: GET /api/hotspots?limit=10
 * NOTE: numeric fields arrive as strings from SQL/aggregation, so wrapped with Number()
 */
export async function getHotspots(limit = 10) {
  try {
    const response = await fetch(`${BASE_URL}/api/hotspots?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch hotspots: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return {
      count: data.count || 0,
      hotspots: Array.isArray(data.hotspots)
        ? data.hotspots.map((h) => ({
            station_id: Number(h.station_id),
            station_name: h.station_name,
            city: h.city,
            state: h.state,
            latitude: Number(h.latitude),
            longitude: Number(h.longitude),
            pollutant_id: h.pollutant_id,
            previous_value: Number(h.previous_value),
            current_value: Number(h.current_value),
            change_value: Number(h.change_value),
            change_percentage: Number(h.change_percentage),
            last_update: h.last_update
          }))
        : []
    };
  } catch (error) {
    console.error("Error in getHotspots:", error);
    throw error;
  }
}

/**
 * Fetch recent pollution spike events
 * Endpoint: GET /api/events?limit=10
 * NOTE: numeric fields wrapped with Number()
 */
export async function getEvents(limit = 10) {
  try {
    const response = await fetch(`${BASE_URL}/api/events?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return {
      count: data.count || 0,
      events: Array.isArray(data.events)
        ? data.events.map((e) => ({
            event_id: Number(e.event_id),
            event_type: e.event_type,
            pollutant_id: e.pollutant_id,
            previous_value: Number(e.previous_value),
            current_value: Number(e.current_value),
            change_value: Number(e.change_value),
            change_percentage: Number(e.change_percentage),
            severity: e.severity,
            message: e.message,
            detected_at: e.detected_at,
            station_id: Number(e.station_id),
            station_name: e.station_name,
            city: e.city,
            state: e.state,
            last_update: e.last_update
          }))
        : []
    };
  } catch (error) {
    console.error("Error in getEvents:", error);
    throw error;
  }
}

export default {
  getStations,
  getStationHistory,
  getHotspots,
  getEvents
};
