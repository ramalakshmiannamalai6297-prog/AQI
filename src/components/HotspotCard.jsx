import React from "react";
import { Link } from "react-router-dom";
import { getAQICategory } from "../utils/aqi.js";
import { HiOutlineArrowRight } from "react-icons/hi";

function formatTime(dateString) {
  if (!dateString) return "Recently";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function HotspotCard({ hotspot }) {
  if (!hotspot) return null;

  const cat = getAQICategory(hotspot.aqi);
  const stationId = hotspot.stationId || hotspot.id;
  const pm25Val = hotspot.pm25 !== null && hotspot.pm25 !== undefined ? hotspot.pm25 : "No data";
  const pm10Val = hotspot.pm10 !== null && hotspot.pm10 !== undefined ? hotspot.pm10 : "No data";

  return (
    <div
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
                backgroundColor: (hotspot.rank && hotspot.rank <= 3) ? "#ef4444" : "#64748b",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              #{hotspot.rank || 1}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                {hotspot.city}
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {hotspot.stationName || hotspot.station || hotspot.state}
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
            {hotspot.category || cat.label}
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#f8fafc",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "12px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>AQI</span>
              <div style={{ fontSize: "28px", fontWeight: "900", color: cat.color }}>
                {hotspot.aqi !== null && hotspot.aqi !== undefined ? hotspot.aqi : "—"}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "12px", color: "#64748b" }}>
              <div>PM2.5: <strong style={{ color: "#0f172a" }}>{pm25Val}</strong></div>
              <div>PM10: <strong style={{ color: "#0f172a" }}>{pm10Val}</strong></div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontSize: "11px", color: "#64748b" }}>
            <span>Dominant: <strong style={{ color: "#0f172a" }}>{hotspot.dominantPollutant || "Unavailable"}</strong></span>
            <span>Updated {formatTime(hotspot.lastUpdate)}</span>
          </div>
        </div>
      </div>

      <Link
        to={`/dashboard?city=${stationId}`}
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
}

export default HotspotCard;