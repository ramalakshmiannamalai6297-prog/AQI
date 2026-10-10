import { HiOutlineBell, HiOutlineExclamation, HiOutlineInformationCircle, HiOutlineClock, HiOutlineShieldCheck } from "react-icons/hi";

function NotificationCard({ events = [], loading = false, error = null }) {
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
            Recent Pollution Spike Incidents
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
            Automated anomaly detections triggered when a pollutant increases rapidly (&gt;30% and &gt;10 units)
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div
          style={{
            padding: "32px 20px",
            textAlign: "center",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1"
          }}
        >
          <HiOutlineShieldCheck size={32} color="#10b981" style={{ margin: "0 auto 8px" }} />
          <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px" }}>
            No Active Pollution Spikes
          </h4>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            The event detection engine has not recorded recent severe pollutant jumps. All stations operating within standard fluctuations.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {events.map((alert) => {
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
      )}
    </div>
  );
}

export default NotificationCard;