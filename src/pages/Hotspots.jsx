import React from "react";
import HotspotCard from "../components/HotspotCard";
import { sensorLocations, getAQICategory } from "../data/dummyData";
import { Link } from "react-router-dom";
import { HiOutlineFire, HiOutlineLocationMarker, HiOutlineArrowRight } from "react-icons/hi";

function Hotspots() {
  const sortedSensors = [...sensorLocations].sort((a, b) => b.aqi - a.aqi);

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
          Ranked list of continuous air quality monitoring stations from highest to lowest AQI index.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {sortedSensors.map((sensor, index) => {
          const cat = getAQICategory(sensor.aqi);
          return (
            <div
              key={sensor.id}
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
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{sensor.state}</span>
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
