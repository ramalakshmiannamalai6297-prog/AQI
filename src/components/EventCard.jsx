import React from "react";
import { HiOutlineLightningBolt, HiOutlineExclamationCircle, HiOutlineClock } from "react-icons/hi";

function EventCard({ city = "Delhi NCR", message = "Rapid AQI surge of +42 points recorded in the last 60 minutes." }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "18px",
        padding: "20px 24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
        border: "1px solid #fee2e2",
        backgroundColor: "#fff5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        margin: "16px 0"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <HiOutlineLightningBolt size={24} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#991b1b" }}>
              ⚠️ Anomaly Detection Event: {city}
            </span>
            <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#dc2626", color: "#ffffff", padding: "2px 6px", borderRadius: "4px" }}>
              HIGH PRIORITY
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#7f1d1d", margin: "4px 0 0" }}>
            {message}
          </p>
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ fontSize: "11px", color: "#991b1b", display: "flex", alignItems: "center", gap: "4px" }}>
          <HiOutlineClock size={14} /> Auto-Flagged 4m ago
        </span>
      </div>
    </div>
  );
}

export default EventCard;