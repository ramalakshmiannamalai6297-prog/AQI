import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sensorLocations } from "../data/dummyData";
import { getAQICategory } from "../utils/aqi.js";
import { getHotspots } from "../services/api";
import { mapBackendHotspot } from "../services/mappers";
import { LoadingSpinner, ErrorMessage } from "./StatusState";
import { HiOutlineFire, HiOutlineArrowRight } from "react-icons/hi";

function HotspotCard({ limit = 5, hotspots: propHotspots = null }) {
  const [fetchedHotspots, setFetchedHotspots] = useState([]);
  const [loading, setLoading] = useState(!propHotspots);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propHotspots) return;

    let isMounted = true;
    async function loadHotspots() {
      try {
        const res = await getHotspots(limit);
        if (isMounted) {
          if (res && Array.isArray(res.hotspots) && res.hotspots.length > 0) {
            const mapped = res.hotspots.map((h) => mapBackendHotspot(h, sensorLocations)).slice(0, limit);
            setFetchedHotspots(mapped);
          } else {
            const fallback = [...sensorLocations].sort((a, b) => b.aqi - a.aqi).slice(0, limit);
            setFetchedHotspots(fallback);
          }
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("HotspotCard: Error fetching hotspots:", err);
          setError("Could not reach the server");
          const fallback = [...sensorLocations].sort((a, b) => b.aqi - a.aqi).slice(0, limit);
          setFetchedHotspots(fallback);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHotspots();
    return () => {
      isMounted = false;
    };
  }, [propHotspots, limit]);

  const hotspots = propHotspots || (fetchedHotspots.length > 0 ? fetchedHotspots : [...sensorLocations].sort((a, b) => b.aqi - a.aqi).slice(0, limit));

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "18px",
        padding: "24px 28px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
        border: "1px solid #e2e8f0"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <HiOutlineFire size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              🚨 National Pollution Hotspots
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
              Highest pollution changes detected across continuous monitoring stations
            </p>
          </div>
        </div>

        <Link
          to="/hotspots"
          style={{
            fontSize: "13px",
            color: "#2563eb",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          View All Hotspots <HiOutlineArrowRight size={14} />
        </Link>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          subtext="Showing fallback hotspot telemetry."
        />
      )}

      {loading && (
        <LoadingSpinner message="Scanning CAAQMS for pollution hotspots..." />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {hotspots.map((sensor, index) => {
          const cat = getAQICategory(sensor.aqi);
          return (
            <Link
              key={`${sensor.id}-${index}`}
              to={`/dashboard?city=${sensor.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f1f5f9";
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f8fafc";
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: index < 3 ? "#ef4444" : "#64748b",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  #{index + 1}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                    {sensor.city}, <span style={{ fontWeight: "400", color: "#64748b", fontSize: "13px" }}>{sensor.state}</span>
                  </h4>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{sensor.station}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: cat.color }}>
                    {sensor.aqi} <span style={{ fontSize: "11px", fontWeight: "600" }}>AQI</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600" }}>
                    {sensor.trend}
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: cat.bg,
                    color: cat.text,
                    border: `1px solid ${cat.color}40`,
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "700",
                    minWidth: "80px",
                    textAlign: "center"
                  }}
                >
                  {sensor.category}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default HotspotCard;