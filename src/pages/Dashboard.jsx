import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getCityData, sensorLocations } from "../data/dummyData";
import { getStations, getStationHistory, getEvents } from "../services/api";
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
  const cityParam = searchParams.get("city") || "delhi-anand-vihar";

  const [stations, setStations] = useState(sensorLocations);
  const [hourlyTrend, setHourlyTrend] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
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
            const mapped = res.stations.map((s) => mapBackendStationToFrontend(s, sensorLocations));
            setStations(mapped);
          } else {
            setStations(sensorLocations);
          }
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Dashboard: Error fetching stations:", err);
          setError("Could not reach the server");
          setStations(sensorLocations);
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
    const match = stations.find(
      (s) =>
        String(s.id).toLowerCase() === cityParam.toLowerCase() ||
        String(s.stationId) === cityParam ||
        s.city.toLowerCase() === cityParam.toLowerCase()
    );
    return match || stations[0] || getCityData(cityParam);
  }, [stations, cityParam]);

  // 3. Fetch 24-hour reading history & events whenever activeStation changes
  const loadStationTelemetry = useCallback(async () => {
    if (!activeStation) return;
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      if (activeStation.stationId) {
        const historyRes = await getStationHistory(activeStation.stationId, 24);
        if (historyRes && Array.isArray(historyRes.history) && historyRes.history.length > 0) {
          const mappedTrend = mapBackendHistoryToHourlyTrend(historyRes.history, activeStation);
          setHourlyTrend(mappedTrend);
        } else {
          setHourlyTrend([]);
        }
      } else {
        setHourlyTrend([]);
      }

      // Check for active pollution spike events for this station
      try {
        const eventsRes = await getEvents(10);
        if (eventsRes && Array.isArray(eventsRes.events) && eventsRes.events.length > 0) {
          const stationEvent = eventsRes.events.find(
            (e) =>
              Number(e.station_id) === Number(activeStation.stationId) ||
              e.city.toLowerCase() === activeStation.city.toLowerCase()
          );
          if (stationEvent) {
            setActiveEvent(mapBackendEvent(stationEvent));
          } else {
            setActiveEvent(null);
          }
        }
      } catch {
        // Event check error is non-critical
      }
    } catch (err) {
      console.error("Dashboard: Error fetching station history:", err);
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
        const mapped = res.stations.map((s) => mapBackendStationToFrontend(s, sensorLocations));
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

  if (!displayStation) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
        <LoadingSpinner message="Loading station dashboard..." />
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
              value={displayStation.id}
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
                <option key={sensor.id} value={sensor.id}>
                  {sensor.city} — {sensor.station} ({sensor.aqi} AQI - {sensor.category})
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
          subtext="Unable to reach Express backend at http://localhost:3000. Displaying fallback station data."
          onRetry={handleManualRefresh}
        />
      )}

      {/* Loading Banner */}
      {loading && (
        <div style={{ marginBottom: "20px" }}>
          <LoadingSpinner message="Retrieving station telemetry and 24-hour pollutant records..." />
        </div>
      )}

      {/* Live Anomaly Detection Event Card (from backend /api/events or AQI > 200) */}
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

      {/* Main AQI Telemetry Overview Card */}
      <AQICard data={displayStation} />

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

      {/* Health Analysis Section */}
      {/* TODO: Connect to backend health recommendations endpoint when available. Currently on guideline model. */}
      <RecommendationCard
        aqi={displayStation.aqi}
        healthAdvice={displayStation.healthAdvice}
      />

      {/* Predictive ML Forecast for the selected city */}
      {/* TODO: Connect to predictive ML neural forecast endpoint when available. Currently on diurnal model. */}
      <PredictionCard
        city={displayStation.city}
        baseAQI={displayStation.aqi}
      />
    </div>
  );
}

export default Dashboard;