import { useState, useEffect } from "react";
import RecommendationCard from "../components/RecommendationCard";
import { getStations, getStationRecommendations } from "../services/api";
import { AQI_CATEGORIES } from "../utils/aqi";
import { LoadingSpinner, ErrorMessage } from "../components/StatusState";
import { HiOutlineLightBulb, HiOutlineLocationMarker, HiOutlineRefresh } from "react-icons/hi";

function Recommendations() {
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [recommendationData, setRecommendationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recsLoading, setRecsLoading] = useState(false);
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
          console.error("Recommendations: Error fetching stations:", err);
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

  // 2. Fetch recommendations whenever selectedStationId changes
  useEffect(() => {
    if (!selectedStationId) return;

    let ignore = false;
    async function loadRecs() {
      setRecsLoading(true);
      setError(null);
      try {
        const data = await getStationRecommendations(selectedStationId);
        if (!ignore) {
          setRecommendationData(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Recommendations: Error fetching recommendations:", err);
          setError(err.message || "Could not retrieve health recommendations from server.");
          setRecommendationData(null);
        }
      } finally {
        if (!ignore) setRecsLoading(false);
      }
    }

    loadRecs();
    return () => {
      ignore = true;
    };
  }, [selectedStationId]);

  const handleRefresh = async () => {
    setError(null);
    if (stations.length === 0) {
      setLoading(true);
      try {
        const res = await getStations();
        if (res && Array.isArray(res.stations) && res.stations.length > 0) {
          setStations(res.stations);
          setSelectedStationId(String(res.stations[0].stationId));
          const data = await getStationRecommendations(res.stations[0].stationId);
          setRecommendationData(data);
        } else {
          setError("No monitoring stations available from server.");
        }
      } catch (err) {
        console.error("Recommendations: Error reloading stations:", err);
        setError("Could not reach backend server to load monitoring stations.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!selectedStationId) return;
    setRecsLoading(true);
    try {
      const data = await getStationRecommendations(selectedStationId);
      setRecommendationData(data);
    } catch (err) {
      setError(err.message || "Failed to refresh recommendations.");
    } finally {
      setRecsLoading(false);
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
            <HiOutlineLightBulb size={18} /> Public Health Advisory Engine
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
            Health Guide & Exposure Guidelines 💡
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Dynamic, rule-based medical advisories computed by backend from real-time monitoring telemetry.
          </p>
        </div>

        {/* Station Selector & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HiOutlineLocationMarker size={20} color="#10b981" />
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

          <button
            onClick={handleRefresh}
            disabled={recsLoading}
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
          subtext="Unable to fetch health advisory for the selected station."
          onRetry={handleRefresh}
        />
      )}

      {(loading || recsLoading) && (
        <div style={{ marginBottom: "20px" }}>
          <LoadingSpinner message="Calculating real-time health advisories from station telemetry..." />
        </div>
      )}

      {recommendationData && (
        <RecommendationCard
          city={recommendationData.city || selectedStation?.city}
          aqi={recommendationData.aqi}
          category={recommendationData.category}
          dominantPollutant={recommendationData.dominantPollutant}
          recommendations={recommendationData.recommendations}
        />
      )}

      {/* General Indian CPCB Guidelines Matrix */}
      <div style={{ marginTop: "32px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
          Indian National Air Quality Index (CPCB) Standard Scale
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {Object.entries(AQI_CATEGORIES).map(([key, cat]) => (
            <div
              key={key}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                borderLeft: `5px solid ${cat.color}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "16px", color: "#0f172a" }}>{cat.label}</strong>
                <span
                  style={{
                    backgroundColor: cat.bg,
                    color: cat.text,
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "6px"
                  }}
                >
                  {cat.min} - {cat.max}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                {cat.label === "Good" && "Minimal health impact. Safe for all outdoor activities."}
                {cat.label === "Satisfactory" && "Minor breathing discomfort to sensitive people. Safe for general public."}
                {cat.label === "Moderate" && "Breathing discomfort to people with asthma and heart conditions."}
                {cat.label === "Poor" && "Breathing discomfort to most people on prolonged exposure. N95 mask recommended."}
                {cat.label === "Very Poor" && "Respiratory illness on prolonged exposure. Severe impact on sensitive groups."}
                {cat.label === "Severe" && "Emergency health alert. Seriously affects healthy people and severely impacts patients."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Recommendations;