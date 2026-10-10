import { useState, useEffect } from "react";
import PredictionCard from "../components/PredictionCard";
import { getStations, getStationForecast } from "../services/api";
import { LoadingSpinner, ErrorMessage } from "../components/StatusState";
import { HiOutlineSparkles, HiOutlineLocationMarker, HiOutlineClock, HiOutlineRefresh } from "react-icons/hi";

function Prediction() {
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [hours, setHours] = useState(6);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch available stations from backend
  useEffect(() => {
    let ignore = false;
    async function loadStations() {
      try {
        const res = await getStations();
        if (!ignore) {
          if (res && Array.isArray(res.stations) && res.stations.length > 0) {
            setStations(res.stations);
            setSelectedStationId(String(res.stations[0].stationId));
          }
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Prediction: Error fetching stations:", err);
          setError("Could not reach backend server to load monitoring stations.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadStations();
    return () => {
      ignore = true;
    };
  }, []);

  // 2. Fetch forecast whenever selectedStationId or hours change
  useEffect(() => {
    if (!selectedStationId) return;

    let ignore = false;
    async function loadForecast() {
      setForecastLoading(true);
      setError(null);
      try {
        const data = await getStationForecast(selectedStationId, hours);
        if (!ignore) {
          setForecastData(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Prediction: Error fetching forecast:", err);
          setError(err.message || "Could not retrieve air quality forecast.");
          setForecastData(null);
        }
      } finally {
        if (!ignore) setForecastLoading(false);
      }
    }

    loadForecast();
    return () => {
      ignore = true;
    };
  }, [selectedStationId, hours]);

  const handleRefresh = async () => {
    if (!selectedStationId) return;
    setForecastLoading(true);
    setError(null);
    try {
      const data = await getStationForecast(selectedStationId, hours);
      setForecastData(data);
    } catch (err) {
      setError(err.message || "Failed to refresh forecast.");
    } finally {
      setForecastLoading(false);
    }
  };

  const selectedStation = stations.find((s) => String(s.stationId) === String(selectedStationId));

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
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
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9333ea", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
            <HiOutlineSparkles size={18} /> Statistical Trend Forecaster
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
            Air Quality Trend Forecast 📈
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Trend-based projections calculated via least-squares linear regression over recent telemetry readings.
          </p>
        </div>

        {/* Controls: Station selector & Hours selector */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
          {/* Station Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HiOutlineLocationMarker size={20} color="#9333ea" />
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              disabled={stations.length === 0}
              style={{
                padding: "10px 16px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
                cursor: "pointer",
                outline: "none"
              }}
            >
              {stations.map((s) => (
                <option key={s.stationId} value={s.stationId}>
                  {s.city} — {s.stationName}
                </option>
              ))}
            </select>
          </div>

          {/* Forecast Duration Horizon */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HiOutlineClock size={18} color="#64748b" />
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value={6}>Next 6 Hours</option>
              <option value={12}>Next 12 Hours</option>
              <option value={24}>Next 24 Hours</option>
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={forecastLoading}
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
            <HiOutlineRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          subtext="The forecasting engine requires at least 6 historical telemetry readings for this station."
          onRetry={handleRefresh}
        />
      )}

      {(loading || forecastLoading) && (
        <div style={{ marginBottom: "20px" }}>
          <LoadingSpinner message="Calculating linear regression trend projections from historical readings..." />
        </div>
      )}

      {forecastData && (
        <PredictionCard
          city={forecastData.city || selectedStation?.city}
          forecastData={forecastData}
        />
      )}

      {/* Method & Mathematical Explanation Card */}
      <div
        style={{
          marginTop: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px"
        }}
      >
        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#0f172a" }}>📐 Linear Trend Method</h4>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.55 }}>
            Computes an ordinary least-squares line through up to 24 sequential hourly AQI datapoints. Projects immediate trajectory while clamping output values to standard 0-500 scale.
          </p>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#0f172a" }}>📊 Trend Classification</h4>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.55 }}>
            Classified as <strong>Rising</strong> (rate &gt; +1 AQI/hr), <strong>Falling</strong> (rate &lt; -1 AQI/hr), or <strong>Stable</strong> (rate within ±1 AQI/hr) based on regression slope.
          </p>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#0f172a" }}>🎯 Data Requirements</h4>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.55 }}>
            Requires minimum 6 contiguous telemetry records with particulate matter (PM2.5 or PM10) to generate accurate statistical slope projections.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Prediction;