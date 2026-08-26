import React from "react";
import NotificationCard from "../components/NotificationCard";
import EventCard from "../components/EventCard";
import { HiOutlineBell } from "react-icons/hi";

function Notifications() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
          <HiOutlineBell size={18} /> Alert Notification Center
        </div>
        <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
          Environmental Alerts & Threshold Triggers 🔔
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          Real-time incident detection, automated sensor warnings, and regulatory notices.
        </p>
      </div>

      <EventCard
        city="Patna & Gangetic Plain"
        message="Critical winter smog stagnation event with AQI exceeding 415. Emergency GRAP Phase-IV guidelines in effect."
      />

      <div style={{ marginTop: "20px" }}>
        <NotificationCard />
      </div>
    </div>
  );
}

export default Notifications;
