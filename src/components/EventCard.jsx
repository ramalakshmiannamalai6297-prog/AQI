import { HiOutlineLightningBolt, HiOutlineClock } from "react-icons/hi";

function EventCard({
  city = "Delhi NCR",
  message = "Rapid AQI surge recorded in the last 60 minutes.",
  severity = "MEDIUM",
  time = "Auto-Flagged 4m ago"
}) {
  const normSeverity = String(severity || "MEDIUM").toUpperCase();

  let styles = {
    cardBg: "#fffbeb",
    border: "#fde68a",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    titleColor: "#92400e",
    msgColor: "#78350f",
    timeColor: "#92400e",
    badgeBg: "#f59e0b",
    badgeText: "#ffffff",
    badgeLabel: "MEDIUM PRIORITY"
  };

  if (normSeverity === "HIGH" || normSeverity === "CRITICAL" || normSeverity === "SEVERE") {
    styles = {
      cardBg: "#fff5f5",
      border: "#fee2e2",
      iconBg: "#fee2e2",
      iconColor: "#dc2626",
      titleColor: "#991b1b",
      msgColor: "#7f1d1d",
      timeColor: "#991b1b",
      badgeBg: "#dc2626",
      badgeText: "#ffffff",
      badgeLabel: "HIGH PRIORITY"
    };
  } else if (normSeverity === "LOW" || normSeverity === "INFO") {
    styles = {
      cardBg: "#eff6ff",
      border: "#bfdbfe",
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      titleColor: "#1e40af",
      msgColor: "#1e3a8a",
      timeColor: "#1e40af",
      badgeBg: "#3b82f6",
      badgeText: "#ffffff",
      badgeLabel: "LOW PRIORITY"
    };
  }

  return (
    <div
      style={{
        backgroundColor: styles.cardBg,
        borderRadius: "18px",
        padding: "20px 24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
        border: `1px solid ${styles.border}`,
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
            backgroundColor: styles.iconBg,
            color: styles.iconColor,
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
            <span style={{ fontSize: "14px", fontWeight: "700", color: styles.titleColor }}>
              ⚠️ Anomaly Detection Event: {city}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                backgroundColor: styles.badgeBg,
                color: styles.badgeText,
                padding: "2px 6px",
                borderRadius: "4px"
              }}
            >
              {styles.badgeLabel}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: styles.msgColor, margin: "4px 0 0" }}>
            {message}
          </p>
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ fontSize: "11px", color: styles.timeColor, display: "flex", alignItems: "center", gap: "4px" }}>
          <HiOutlineClock size={14} /> {time}
        </span>
      </div>
    </div>
  );
}

export default EventCard;