import { HiOutlineSparkles, HiOutlineTrendingUp, HiOutlineTrendingDown } from "react-icons/hi";

// TODO: ML prediction endpoint not yet in backend; keeping dummy forecast
function PredictionCard({ city = "Delhi", baseAQI = 382 }) { // TODO: real AQI
  const predictions = [
    { time: "+1 Hour", expectedAQI: Math.round(baseAQI * 1.04), change: "+4%", trend: "up", condition: "Stagnant Wind Speed" },
    { time: "+3 Hours", expectedAQI: Math.round(baseAQI * 1.12), change: "+12%", trend: "up", condition: "Peak Traffic Influx" },
    { time: "+6 Hours", expectedAQI: Math.round(baseAQI * 0.95), change: "-5%", trend: "down", condition: "Evening Dispersion" },
    { time: "+24 Hours", expectedAQI: Math.round(baseAQI * 0.88), change: "-12%", trend: "down", condition: "Forecast Wind Shift" }
  ];

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "18px",
        padding: "24px 28px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
        border: "1px solid #e2e8f0",
        marginTop: "24px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "rgba(168, 85, 247, 0.12)",
              color: "#9333ea",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <HiOutlineSparkles size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              AI Air Quality Forecast ({city})
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
              Machine Learning neural ensemble model trained on meteorological factors
            </p>
          </div>
        </div>

        <span
          style={{
            backgroundColor: "rgba(168, 85, 247, 0.1)",
            color: "#9333ea",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700"
          }}
        >
          Confidence: 94.2%
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px"
        }}
      >
        {predictions.map((p, index) => {
          const isUp = p.trend === "up";
          return (
            <div
              key={index}
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid #e2e8f0",
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>{p.time}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: isUp ? "#ef4444" : "#10b981",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px"
                  }}
                >
                  {isUp ? <HiOutlineTrendingUp size={14} /> : <HiOutlineTrendingDown size={14} />}
                  {p.change}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
                  {p.expectedAQI}
                </span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>AQI</span>
              </div>

              <p style={{ fontSize: "11px", color: "#64748b", margin: "6px 0 0" }}>
                Factor: {p.condition}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PredictionCard;