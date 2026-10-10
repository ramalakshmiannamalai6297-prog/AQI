function PollutantCard({ pollutants = {}, pollutantBreakdown = [] }) {
  // If specific pollutantBreakdown is not passed, create a default array from pollutants
  const list = pollutantBreakdown.length > 0 ? pollutantBreakdown : [
    { name: "PM2.5", value: pollutants.pm25 ?? 0, safeLimit: 60, unit: "µg/m³" },
    { name: "PM10", value: pollutants.pm10 ?? 0, safeLimit: 100, unit: "µg/m³" },
    { name: "NO₂", value: pollutants.no2 ?? 0, safeLimit: 80, unit: "µg/m³" },
    { name: "SO₂", value: pollutants.so2 ?? 0, safeLimit: 80, unit: "µg/m³" },
    { name: "CO", value: pollutants.co ?? 0, safeLimit: 2.0, unit: "mg/m³" },
    { name: "O₃", value: pollutants.o3 ?? 0, safeLimit: 100, unit: "µg/m³" }
  ];

  const getPollutantStatus = (val, limit) => {
    const ratio = val / limit;
    if (ratio <= 0.8) return { label: "Good", color: "#10b981", bg: "#ecfdf5" };
    if (ratio <= 1.2) return { label: "Moderate", color: "#f59e0b", bg: "#fffbeb" };
    return { label: "Exceeded", color: "#ef4444", bg: "#fef2f2" };
  };

  return (
    <div style={{ marginTop: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            🔬 Pollutant Concentrations
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
            Real-time optical spectrometry vs. NAAQS National Safe Limits
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px"
        }}
      >
        {list.map((item) => {
          const rawVal = Number(item.value ?? 0);
          const limit = Number(item.safeLimit ?? 100);
          const status = getPollutantStatus(rawVal, limit);
          const percentOfLimit = Math.min(Math.round((rawVal / limit) * 100), 200);

          const formattedVal = item.name === "CO" 
            ? rawVal.toFixed(1) 
            : Math.round(rawVal);

          return (
            <div
              key={item.name}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                padding: "18px 20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>
                  {item.name}
                </span>
                <span
                  style={{
                    backgroundColor: status.bg,
                    color: status.color,
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    border: `1px solid ${status.color}30`
                  }}
                >
                  {status.label}
                </span>
              </div>

              {/* Concentration value */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "10px" }}>
                <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", lineHeight: 1 }}>
                  {formattedVal}
                </span>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                  {item.unit || "µg/m³"}
                </span>
              </div>

              {/* Progress bar vs limit */}
              <div style={{ width: "100%", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(percentOfLimit, 100)}%`,
                    backgroundColor: status.color,
                    borderRadius: "3px",
                    transition: "width 0.5s ease"
                  }}
                />
              </div>

              {/* Safe limit comparison */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                <span>Safe Limit:</span>
                <span style={{ fontWeight: "600", color: "#64748b" }}>
                  {item.safeLimit} {item.unit || "µg/m³"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PollutantCard;