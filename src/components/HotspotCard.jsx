import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
          if (res && Array.isArray(res.hotspots)) {
            const mapped = res.hotspots.map(mapBackendHotspot).slice(0, limit);
            setFetchedHotspots(mapped);
          } else {
            setFetchedHotspots([]);
          }
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("HotspotCard: Error fetching hotspots:", err);
          setError("Could not reach backend server to load hotspots.");
          setFetchedHotspots([]);
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

  const hotspots = propHotspots || fetchedHotspots;

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
          subtext="Unable to reach Express backend at http://localhost:3000."
        />
      )}

      {loading && (
        <LoadingSpinner message="Scanning CAAQMS for pollution hotspots..." />
      )}

      {!loading && hotspots.length === 0 && !error && (
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0, padding: "12px 0" }}>
          No high spike hotspots currently detected across stations.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {hotspots.map((sensor, index) => {
          const cat = getAQICategory(sensor.aqi);
          return (
            <Link
              key={`${sensor.stationId || sensor.id}-${index}`}
              to={`/dashboard?city=${sensor.stationId || sensor.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                textDecoration: "none",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f1f5f9";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f8fafc";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "8px",
                    backgroundColor: index < 3 ? "#fef2f2" : "#f1f5f9",
                    color: index < 3 ? "#ef4444" : "#64748b",
                    fontSize: "12px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  #{index + 1}
                </span>

                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                    {sensor.city}
                  </h4>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {sensor.station || sensor.station_name}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "20px", fontWeight: "800", color: cat.color }}>
                      {sensor.aqi}
                    </span>
                    <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600" }}>AQI</span>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: cat.text,
                      backgroundColor: cat.bg,
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}
                  >
                    {cat.label}
                  </span>
                </div>

                <span style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444" }}>
                  {sensor.trend}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default HotspotCard;