import { useState, useEffect } from "react";
import { sensorLocations } from "../data/dummyData";
import { getAQICategory } from "../utils/aqi.js";
import { getHotspots } from "../services/api";
import { mapBackendHotspot } from "../services/mappers";
import { LoadingSpinner, ErrorMessage } from "../components/StatusState";
import { Link } from "react-router-dom";
import { HiOutlineFire, HiOutlineArrowRight, HiOutlineTrendingUp } from "react-icons/hi";

function Hotspots() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHotspotsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHotspots(10);
      if (res && Array.isArray(res.hotspots) && res.hotspots.length > 0) {
        const mapped = res.hotspots.map((h) => mapBackendHotspot(h, sensorLocations));
        setHotspots(mapped);
      } else {
        const fallback = [...sensorLocations].sort((a, b) => b.aqi - a.aqi);
        setHotspots(fallback);
      }
    } catch (err) {
      console.error("Hotspots: Error fetching hotspots from backend:", err);
      setError("Could not reach the server");
      const fallback = [...sensorLocations].sort((a, b) => b.aqi - a.aqi);
      setHotspots(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getHotspots(10);
        if (!ignore) {
          if (res && Array.isArray(res.hotspots) && res.hotspots.length > 0) {
            const mapped = res.hotspots.map((h) => mapBackendHotspot(h, sensorLocations));
            setHotspots(mapped);
          } else {
            const fallback = [...sensorLocations].sort((a, b) => b.aqi - a.aqi);
            setHotspots(fallback);
          }
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Hotspots: Error fetching hotspots from backend:", err);
          setError("Could not reach the server");
          const fallback = [...sensorLocations].sort((a, b) => b.aqi - a.aqi);
          setHotspots(fallback);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
          <HiOutlineFire size={18} /> Critical Emission Zones
        </div>
        <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
          National Air Pollution Hotspots Ranking 🔥
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          Real-time detected pollution surges and continuous air monitoring hotspots across India.
        </p>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          subtext="Unable to reach Express backend at http://localhost:3000. Displaying cached hotspot records."
          onRetry={fetchHotspotsList}
        />
      )}

      {loading && (
        <div style={{ marginBottom: "24px" }}>
          <LoadingSpinner message="Querying continuous air quality network for pollution hotspots..." />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {hotspots.map((sensor, index) => {
          const cat = getAQICategory(sensor.aqi);
          return (
            <div
              key={`${sensor.id}-${index}`}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        backgroundColor: index < 3 ? "#ef4444" : "#64748b",
                        color: "#ffffff",
                        fontWeight: "800",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                        {sensor.city}
                      </h3>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {sensor.station || sensor.state}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      backgroundColor: cat.bg,
                      color: cat.text,
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "3px 8px",
                      borderRadius: "10px",
                      border: `1px solid ${cat.color}40`
                    }}
                  >
                    {sensor.category}
                  </span>
                </div>

                {/* Spiked Pollutant Badge if from live hotspot backend */}
                {sensor.pollutantId && (
                  <div
                    style={{
                      backgroundColor: "#fff1f2",
                      border: "1px solid #fecdd3",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      marginBottom: "12px",
                      fontSize: "12px",
                      color: "#9f1239",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
                      <HiOutlineTrendingUp size={16} color="#e11d48" />
                      {sensor.pollutantId} Surge
                    </span>
                    <span style={{ fontWeight: "700" }}>
                      +{Number(sensor.changePercentage).toFixed(1)}% ({sensor.previousValue} → {sensor.currentValue})
                    </span>
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "12px",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "12px"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Station Index</span>
                    <div style={{ fontSize: "26px", fontWeight: "900", color: cat.color }}>
                      {sensor.aqi} <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>AQI</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "12px", color: "#64748b" }}>
                    <div>PM2.5: <strong style={{ color: "#0f172a" }}>{sensor.pm25} µg/m³</strong></div>
                    <div>PM10: <strong style={{ color: "#0f172a" }}>{sensor.pm10} µg/m³</strong></div>
                  </div>
                </div>
              </div>

              <Link
                to={`/dashboard?city=${sensor.id}`}
                style={{
                  width: "100%",
                  backgroundColor: "#f1f5f9",
                  color: "#2563eb",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#2563eb";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.color = "#2563eb";
                }}
              >
                <span>View Full Telemetry</span>
                <HiOutlineArrowRight size={14} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Hotspots;
