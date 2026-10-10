import React from "react";
import { HiOutlineBell, HiOutlineExclamation, HiOutlineInformationCircle, HiOutlineClock } from "react-icons/hi";

function NotificationCard() {
  const alerts = [
    {
      id: 1,
      type: "danger",
      title: "Severe Air Quality Emergency in Patna & Delhi NCR",
      time: "10 mins ago",
      message: "AQI levels have surged past 380+ due to stagnant meteorological conditions and thermal inversion. Vulnerable groups must stay indoors."
    },
    {
      id: 2,
      type: "warning",
      title: "PM2.5 Spike Detected in Kolkata & Lucknow",
      time: "25 mins ago",
      message: "Fine particulate matter (PM2.5) concentrations have crossed 180 µg/m³ (3x NAAQS limit). Anti-pollution measures active."
    },
    {
      id: 3,
      type: "info",
      title: "Southern Region Air Quality Remains Clean",
      time: "1 hour ago",
      message: "Bengaluru, Kochi, and Chennai continue to record 'Good' to 'Satisfactory' AQI under active coastal breeze circulation."
    }
  ];

  const getTypeStyles = (type) => {
    switch (type) {
      case "danger":
        return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: <HiOutlineExclamation color="#ef4444" size={20} /> };
      case "warning":
        return { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: <HiOutlineExclamation color="#f59e0b" size={20} /> };
      default:
        return { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", icon: <HiOutlineInformationCircle color="#10b981" size={20} /> };
    }
  };

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
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            backgroundColor: "rgba(245, 158, 11, 0.12)",
            color: "#f59e0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <HiOutlineBell size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            🔔 Live Environmental Alerts
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
            Automated threshold triggers & regional advisory notices
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {alerts.map((alert) => {
          const styles = getTypeStyles(alert.type);
          return (
            <div
              key={alert.id}
              style={{
                backgroundColor: styles.bg,
                border: `1px solid ${styles.border}`,
                borderRadius: "12px",
                padding: "16px 18px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {styles.icon}
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: styles.text }}>
                    {alert.title}
                  </h4>
                </div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                  <HiOutlineClock size={12} /> {alert.time}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#475569", margin: "6px 0 0 28px", lineHeight: 1.5 }}>
                {alert.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NotificationCard;