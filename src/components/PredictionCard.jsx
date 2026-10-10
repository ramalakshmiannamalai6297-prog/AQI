import { getAQICategory } from "../utils/aqi.js";
import { 
  HiOutlineSparkles, 
  HiOutlineTrendingUp, 
  HiOutlineTrendingDown, 
  HiOutlineMinusSm,
  HiOutlineClock
} from "react-icons/hi";

function formatForecastTime(isoString, hoursAhead) {
  if (!isoString) return `+${hoursAhead}h`;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return `+${hoursAhead}h`;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function PredictionCard({ 
  city = "Station", 
  forecastData = null,
  method = "Trend-based estimate",
  basedOnReadings = null,
  trend = "stable",
  forecast = []
}) {
  const data = forecastData || { method, basedOnReadings, trend, forecast };
  const items = data.forecast || [];
  const trendNormalized = (data.trend || "stable").toLowerCase();

  const getTrendIcon = () => {
    if (trendNormalized === "rising") {
      return (
        <span style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
          <HiOutlineTrendingUp size={16} /> Rising Trend
        </span>
      );
    }
    if (trendNormalized === "falling") {
      return (
        <span style={{ color: "#10b981", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
          <HiOutlineTrendingDown size={16} /> Falling Trend
        </span>
      );
    }
    return (
      <span style={{ color: "#2563eb", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
        <HiOutlineMinusSm size={16} /> Stable Trend (±1 AQI/hr)
      </span>
    );
  };

  if (!items || items.length === 0) {
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
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
              AQI Trend Forecast ({city})
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
              Trend-based projection from historical telemetry
            </p>
          </div>
        </div>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          Forecast unavailable or insufficient historical readings.
        </p>
      </div>
    );
  }

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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "18px"
        }}
      >
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
              Air Quality Forecast ({city})
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
              Method: Trend-based estimate (least-squares linear regression on {data.basedOnReadings || 24} hourly readings)
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px"
            }}
          >
            {getTrendIcon()}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px"
        }}
      >
        {items.map((p, index) => {
          const aqiVal = Number(p.aqi);
          const cat = getAQICategory(aqiVal);
          const timeFormatted = formatForecastTime(p.time, p.hoursAhead);

          return (
            <div
              key={index}
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                padding: "14px 16px",
                border: "1px solid #e2e8f0",
                borderTop: `4px solid ${cat.color}`,
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>
                  +{p.hoursAhead}h ({timeFormatted})
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "24px", fontWeight: "900", color: cat.color }}>
                  {aqiVal}
                </span>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8" }}>AQI</span>
              </div>

              <span
                style={{
                  backgroundColor: cat.bg,
                  color: cat.text,
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  alignSelf: "flex-start"
                }}
              >
                {p.category || cat.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PredictionCard;