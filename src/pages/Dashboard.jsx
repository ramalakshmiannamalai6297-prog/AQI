import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
  getStations, 
  getStationHistory, 
  getEvents,
  getStationWeather,
  getStationHealth,
  getStationRecommendations,
  getStationForecast
} from "../services/api";
import { 
  mapBackendStationToFrontend, 
  mapBackendHistoryToHourlyTrend, 
  mapBackendEvent 
} from "../services/mappers";
import { LoadingSpinner, ErrorMessage } from "../components/StatusState";
import AQICard from "../components/AQICard";
import PollutantCard from "../components/PollutantCard";
import AQIChart from "../components/AQIChart";
import RecommendationCard from "../components/RecommendationCard";
import PredictionCard from "../components/PredictionCard";
import EventCard from "../components/EventCard";
import { 
  HiOutlineArrowLeft, 
  HiOutlineRefresh, 
  HiOutlineLocationMarker 
} from "react-icons/hi";

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cityParam = searchParams.get("city") || "";

  const [stations, setStations] = useState([]);
  const [hourlyTrend, setHourlyTrend] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [error, setError] = useState(null);

  // 1. Fetch stations list from backend API on initial mount
  useEffect(() => {
    let ignore = false;
    async function loadStations() {
      try {
        const res = await getStations();
        if (!ignore) {
          if (res && Array.isArray(res.stations) && res.stations.length > 0) {
            const mapped = res.stations.map((s) => mapBackendStationToFrontend(s));
            setStations(mapped);
          } else {
            setStations([]);
          }
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Dashboard: Error fetching stations:", err);
          setError("Could not reach backend server to load monitoring stations.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadStations();
    return () => {
      ignore = true;
    };
  }, []);

  // 2. Identify the active station
  const activeStation = useMemo(() => {
    if (stations.length === 0) return null;
    if (!cityParam) return stations[0];

    const match = stations.find(
      (s) =>
        String(s.id).toLowerCase() === cityParam.toLowerCase() ||
        String(s.stationId) === cityParam ||
        s.city.toLowerCase() === cityParam.toLowerCase()
    );
    return match || stations[0];
  }, [stations, cityParam]);

  // 3. Fetch telemetry, weather, health, recommendations & forecast whenever activeStation changes
  const loadStationTelemetry = useCallback(async () => {
    if (!activeStation || !activeStation.stationId) return;
    const sId = activeStation.stationId;

    setHistoryLoading(true);
    setHistoryError(null);

    // Run parallel fetches for station data
    try {
      const [historyRes, weatherRes, healthRes, recsRes, forecastRes, eventsRes] = await Promise.allSettled([
        getStationHistory(sId, 24),
        getStationWeather(sId),
        getStationHealth(sId),
        getStationRecommendations(sId),
        getStationForecast(sId, 6),
        getEvents(10)
      ]);

      // Handle history
      if (historyRes.status === "fulfilled" && historyRes.value && Array.isArray(historyRes.value.history)) {
        const mappedTrend = mapBackendHistoryToHourlyTrend(historyRes.value.history, activeStation);
        setHourlyTrend(mappedTrend);
      } else {
        setHourlyTrend([]);
      }

      // Handle weather
      if (weatherRes.status === "fulfilled") {
        setWeatherData(weatherRes.value);
      } else {
        setWeatherData({ available: false });
      }

      // Handle health
      if (healthRes.status === "fulfilled") {
        setHealthData(healthRes.value);
      } else {
        setHealthData({ status: "Unavailable", lastUpdate: null, minutesSinceUpdate: null });
      }

      // Handle recommendations
      if (recsRes.status === "fulfilled") {
        setRecommendationsData(recsRes.value);
      } else {
        setRecommendationsData(null);
      }

      // Handle forecast
      if (forecastRes.status === "fulfilled") {
        setForecastData(forecastRes.value);
      } else {
        setForecastData(null);
      }

      // Handle events
      if (eventsRes.status === "fulfilled" && eventsRes.value && Array.isArray(eventsRes.value.events)) {
        const stationEvent = eventsRes.value.events.find(
          (e) =>
            Number(e.station_id) === Number(sId) ||
            e.city.toLowerCase() === activeStation.city.toLowerCase()
        );
        setActiveEvent(stationEvent ? mapBackendEvent(stationEvent) : null);
      } else {
        setActiveEvent(null);
      }
    } catch (err) {
      console.error("Dashboard: Error fetching station telemetry:", err);
      setHistoryError("Could not retrieve 24h telemetry readings from server.");
      setHourlyTrend([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [activeStation]);

  useEffect(() => {
    loadStationTelemetry();
  }, [loadStationTelemetry]);

  // Calculate real 1-hour delta trend from history readings
  const displayStation = useMemo(() => {
    if (!activeStation) return null;
    let trend = activeStation.trend || "Live Tracking";
    if (hourlyTrend && hourlyTrend.length >= 2) {
      const latestReading = hourlyTrend[hourlyTrend.length - 1];
      const prevReading = hourlyTrend[hourlyTrend.length - 2];
      if (
        latestReading?.aqi !== undefined &&
        latestReading?.aqi !== null &&
        prevReading?.aqi !== undefined &&
        prevReading?.aqi !== null
      ) {
        const diff = latestReading.aqi - prevReading.aqi;
        trend = diff > 0 ? `+${diff} pts (last hr)` : diff < 0 ? `${diff} pts (last hr)` : `0 pts (last hr)`;
      }
    }
    return {
      ...activeStation,
      trend
    };
  }, [activeStation, hourlyTrend]);

  const handleCityChange = (e) => {
    setSearchParams({ city: e.target.value });
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStations();
      if (res && Array.isArray(res.stations) && res.stations.length > 0) {
        const mapped = res.stations.map((s) => mapBackendStationToFrontend(s));
        setStations(mapped);
      }
      await loadStationTelemetry();
    } catch (err) {
      console.error("Dashboard: Error refreshing stations:", err);
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !displayStation) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
        <LoadingSpinner message="Connecting to environmental monitoring stations..." />
      </div>
    );
  }

  if (!displayStation) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
        <ErrorMessage
          message="No monitoring stations available"
          subtext="Please check that the backend server is running at http://localhost:3000."
          onRetry={handleManualRefresh}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
      {/* Top Header / Navigation Bar with "Back to Map" */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Back to Map Option */}
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ffffff",
              color: "#1e293b",
              border: "1px solid #cbd5e1",
              padding: "10px 18px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            <HiOutlineArrowLeft size={18} />
            <span>Back to Map</span>
          </Link>

          {/* Quick City Switcher Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HiOutlineLocationMarker size={20} color="#2563eb" />
            <select
              value={displayStation.stationId || displayStation.id}
              onChange={handleCityChange}
              style={{
                padding: "10px 16px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
                cursor: "pointer",
                outline: "none",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
              }}
            >
              {stations.map((sensor) => (
                <option key={sensor.stationId || sensor.id} value={sensor.stationId || sensor.id}>
                  {sensor.city} — {sensor.station || sensor.stationName} ({sensor.aqi} AQI - {sensor.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleManualRefresh}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              padding: "9px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#475569",
              cursor: "pointer"
            }}
          >
            <HiOutlineRefresh size={16} /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Error Banner if Server cannot be reached */}
      {error && (
        <ErrorMessage
          message={error}
          subtext="Unable to reach Express backend at http://localhost:3000."
          onRetry={handleManualRefresh}
        />
      )}

      {/* Loading Banner */}
      {loading && (
        <div style={{ marginBottom: "20px" }}>
          <LoadingSpinner message="Retrieving station telemetry and 24-hour pollutant records..." />
        </div>
      )}

      {/* Live Anomaly Detection Event Card */}
      {activeEvent ? (
        <EventCard
          city={activeEvent.city}
          message={activeEvent.message}
          severity={activeEvent.severity}
          time={activeEvent.time}
        />
      ) : (
        displayStation.aqi > 200 && (
          <EventCard
            city={displayStation.city}
            message={`Elevated ambient pollution concentrations (${displayStation.aqi} AQI - ${displayStation.category}). Heavy particulate loading detected.`}
            severity={displayStation.aqi > 400 ? "HIGH" : "MEDIUM"}
            time="Live Alert"
          />
        )
      )}

      {/* Main AQI Telemetry Overview Card with Live Weather & Station Health */}
      <AQICard 
        data={displayStation} 
        weather={weatherData}
        health={healthData}
      />

      {/* 6-Pollutant Breakdown Matrix from Real Backend Pollutants */}
      <PollutantCard
        pollutants={displayStation.pollutants}
        pollutantBreakdown={displayStation.pollutantBreakdown}
      />

      {/* 24-Hour Trend & Analytics Charts (Real historical readings from /api/stations/:id/history) */}
      <AQIChart
        hourlyTrend={hourlyTrend}
        pollutantBreakdown={displayStation.pollutantBreakdown}
        cityName={displayStation.city}
        loading={historyLoading}
        error={historyError}
        onRetry={loadStationTelemetry}
      />

      {/* Rule-based Health Guidance Section */}
      <RecommendationCard
        city={displayStation.city}
        aqi={recommendationsData?.aqi ?? displayStation.aqi}
        category={recommendationsData?.category ?? displayStation.category}
        dominantPollutant={recommendationsData?.dominantPollutant ?? displayStation.dominatingPollutant}
        recommendations={recommendationsData?.recommendations || []}
      />

      {/* Trend Forecast Section */}
      <PredictionCard
        city={displayStation.city}
        forecastData={forecastData}
      />
    </div>
  );
}

export default Dashboard;