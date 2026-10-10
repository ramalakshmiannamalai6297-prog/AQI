import { getAQICategory } from "../utils/aqi.js";
import { 
  HiOutlineLocationMarker, 
  HiOutlineClock, 
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineMinusSm
} from "react-icons/hi";

function AQICard({ data, weather = null, health = null }) {
  if (!data) return null;
  const categoryInfo = getAQICategory(data.aqi);

  // Weather formatting
  const weatherAvailable = weather && weather.available;
  const tempDisplay = weatherAvailable 
    ? `${weather.temperature}${weather.temperatureUnit || "°C"}`
    : (data.temperature ? data.temperature : "Unavailable");
  const humidityDisplay = weatherAvailable
    ? `${weather.humidity}${weather.humidityUnit || "%"}`
    : (data.humidity ? data.humidity : "Unavailable");

  // Health formatting
  const stationStatus = health?.status || data.sensorStatus || "Unavailable";
  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "online") return { color: "#059669", dot: "#10b981", bg: "#ecfdf5" };
    if (s === "delayed") return { color: "#d97706", dot: "#f59e0b", bg: "#fffbeb" };
    if (s === "offline") return { color: "#dc2626", dot: "#ef4444", bg: "#fef2f2" };
    return { color: "#64748b", dot: "#94a3b8", bg: "#f1f5f9" };
  };
  const statusStyle = getStatusColor(stationStatus);

  const healthDetail = health?.minutesSinceUpdate !== null && health?.minutesSinceUpdate !== undefined
    ? (health.minutesSinceUpdate < 60 
        ? `Last telemetry ${health.minutesSinceUpdate} min${health.minutesSinceUpdate === 1 ? "" : "s"} ago` 
        : `Last telemetry ${Math.floor(health.minutesSinceUpdate / 60)} hr${Math.floor(health.minutesSinceUpdate / 60) === 1 ? "" : "s"} ago`)
    : "Live telemetry tracking";

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "18px",
        padding: "24px 28px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
        border: "1px solid #e2e8f0",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          backgroundColor: categoryInfo.color
        }}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "20px"
        }}
      >
        {/* City & Station */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                color: "#2563eb",
                padding: "4px 8px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              {data.state || "India"}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
              <HiOutlineClock size={14} /> Updated {data.lastUpdated || "Live"}
            </span>
          </div>

          <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <HiOutlineLocationMarker size={26} color="#2563eb" />
            {data.city}
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            {data.station || data.stationName}
          </p>
        </div>

        {/* Category Pill */}
        <div
          style={{
            backgroundColor: categoryInfo.bg,
            color: categoryInfo.text,
            border: `1px solid ${categoryInfo.color}50`,
            padding: "8px 18px",
            borderRadius: "30px",
            fontSize: "14px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: categoryInfo.color
            }}
          />
          Air Quality is {categoryInfo.label}
        </div>
      </div>

      {/* Main Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "1px solid #f1f5f9"
        }}
      >
        {/* Large AQI Value */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "16px",
              backgroundColor: categoryInfo.bg,
              border: `2px solid ${categoryInfo.color}30`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <span style={{ fontSize: "36px", fontWeight: "900", color: categoryInfo.color, lineHeight: 1 }}>
              {data.aqi !== null && data.aqi !== undefined ? data.aqi : "—"}
            </span>
            <span style={{ fontSize: "10px", fontWeight: "700", color: categoryInfo.text, textTransform: "uppercase" }}>
              AQI-IN
            </span>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>DOMINANT POLLUTANT</span>
            <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "2px 0" }}>
              {data.dominatingPollutant || "PM2.5"}
            </h4>
            <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
              <HiOutlineTrendingUp size={14} /> {data.trend || "Live Tracking"}
            </span>
          </div>
        </div>

        {/* Temperature & Humidity from Open-Meteo */}
        <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>WEATHER CONDITIONS</span>
            {weatherAvailable && (
              <span style={{ fontSize: "10px", fontWeight: "600", color: "#059669", backgroundColor: "#ecfdf5", padding: "1px 6px", borderRadius: "4px" }}>
                Live
              </span>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Temperature</span>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                {tempDisplay}
              </div>
            </div>
            <div style={{ width: "1px", height: "30px", backgroundColor: "#e2e8f0" }} />
            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Humidity</span>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                {humidityDisplay}
              </div>
            </div>
          </div>
        </div>

        {/* Station Diagnostic Health */}
        <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>STATION HEALTH</span>
          <div style={{ marginTop: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: statusStyle.color, fontWeight: "700", fontSize: "15px" }}>
              <span 
                style={{ 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  backgroundColor: statusStyle.dot,
                  display: "inline-block" 
                }} 
              />
              {stationStatus}
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", display: "block" }}>
              {healthDetail}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AQICard;