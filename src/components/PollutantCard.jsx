import { getAQICategory } from "../utils/aqi.js";

function PollutantCard({ pollutants = {}, pollutantBreakdown = [] }) {
  // If specific pollutantBreakdown is not passed, create a default array from pollutants
  const list = pollutantBreakdown.length > 0 ? pollutantBreakdown : [
    { name: "PM2.5", value: pollutants.pm25 ?? null },
    { name: "PM10", value: pollutants.pm10 ?? null },
    { name: "NO₂", value: pollutants.no2 ?? null },
    { name: "SO₂", value: pollutants.so2 ?? null },
    { name: "CO", value: pollutants.co ?? null },
    { name: "O₃", value: pollutants.o3 ?? null }
  ];

  return (
    <div style={{ marginTop: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            🔬 Pollutant AQI Sub-Indices
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
            CPCB AQI contribution of each pollutant (0-500)
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
          const hasValue = item.value !== null && item.value !== undefined && !isNaN(Number(item.value));
          const numVal = hasValue ? Number(item.value) : null;
          const cat = hasValue ? getAQICategory(numVal) : null;
          const percentOf500 = hasValue ? Math.min(100, Math.max(0, (numVal / 500) * 100)) : 0;
          const formattedVal = hasValue ? Math.round(numVal) : null;

          return (
            <div
              key={item.name}
              style={{
                backgroundColor: hasValue ? "#ffffff" : "#f8fafc",
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
                {hasValue ? (
                  <span
                    style={{
                      backgroundColor: cat.bg,
                      color: cat.text,
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      border: `1px solid ${cat.color}30`
                    }}
                  >
                    {cat.label}
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#64748b",
                      fontSize: "11px",
                      fontWeight: "600",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1"
                    }}
                  >
                    No data
                  </span>
                )}
              </div>

              {/* Sub-Index Value */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "12px" }}>
                {hasValue ? (
                  <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", lineHeight: 1 }}>
                    {formattedVal}
                  </span>
                ) : (
                  <span style={{ fontSize: "20px", fontWeight: "700", color: "#94a3b8", lineHeight: 1.4 }}>
                    No data
                  </span>
                )}
              </div>

              {/* Progress bar (0-500 scale) */}
              <div style={{ width: "100%", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: hasValue ? `${percentOf500}%` : "0%",
                    backgroundColor: hasValue ? cat.color : "transparent",
                    borderRadius: "3px",
                    transition: "width 0.5s ease"
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PollutantCard;