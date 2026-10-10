import { getAQICategory } from "../utils/aqi.js";
import { 
  HiOutlineHeart, 
  HiOutlineShieldCheck, 
  HiOutlineExclamationCircle, 
  HiOutlineUserGroup, 
  HiOutlineSparkles,
  HiOutlineSun,
  HiOutlineHome
} from "react-icons/hi";

function getGroupIcon(group) {
  const g = String(group || "").toLowerCase();
  if (g.includes("child")) return "👶";
  if (g.includes("elder")) return "👵";
  if (g.includes("asthma") || g.includes("heart")) return "🫁";
  if (g.includes("exercise") || g.includes("outdoor")) return <HiOutlineSun size={20} color="#f59e0b" />;
  if (g.includes("mask")) return "😷";
  if (g.includes("window") || g.includes("purifier")) return <HiOutlineHome size={20} color="#2563eb" />;
  if (g.includes("dominant") || g.includes("tip") || g.includes("pollutant")) return "⚡";
  return <HiOutlineShieldCheck size={20} color="#10b981" />;
}

function getSeverityBadge(severity) {
  const s = String(severity || "low").toLowerCase();
  if (s === "critical" || s === "danger" || s === "severe") {
    return { bg: "#fef2f2", text: "#991b1b", border: "#fecaca", label: "High Risk" };
  }
  if (s === "high" || s === "warning" || s === "medium") {
    return { bg: "#fffbeb", text: "#92400e", border: "#fde68a", label: "Caution" };
  }
  return { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0", label: "Safe / Low" };
}

function RecommendationCard({ 
  city = null, 
  aqi = null, 
  category = null, 
  dominantPollutant = null, 
  recommendations = [] 
}) {
  const categoryInfo = aqi !== null ? getAQICategory(aqi) : null;
  const displayCategory = category || (categoryInfo ? categoryInfo.label : "Unavailable");
  const catColor = categoryInfo ? categoryInfo.color : "#64748b";

  if (!recommendations || recommendations.length === 0) {
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
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <HiOutlineHeart size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Health Impact & Activity Advisory
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
              Medical guidance from backend rule-based advisory engine
            </p>
          </div>
        </div>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          {aqi === null ? "Health advisory unavailable for this station." : "Loading recommendations..."}
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
          marginBottom: "20px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: `${catColor}15`,
              color: catColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <HiOutlineHeart size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Health Guidance & Group Advisories {city ? `(${city})` : ""}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
              Tailored medical and protective recommendations for {displayCategory} air quality ({aqi !== null ? `${aqi} AQI` : "Live"})
              {dominantPollutant && dominantPollutant !== "Unavailable" ? ` • Dominant: ${dominantPollutant}` : ""}
            </p>
          </div>
        </div>

        {categoryInfo && (
          <span
            style={{
              backgroundColor: categoryInfo.bg,
              color: categoryInfo.text,
              border: `1px solid ${categoryInfo.color}40`,
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <HiOutlineExclamationCircle size={16} />
            {categoryInfo.label} Risk Level
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "14px"
        }}
      >
        {recommendations.map((item, idx) => {
          const badge = getSeverityBadge(item.severity);
          const icon = getGroupIcon(item.group);

          return (
            <div
              key={idx}
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "14px",
                padding: "16px 20px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "10px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>
                  <span>{icon}</span>
                  <span>{item.group}</span>
                </div>
                <span
                  style={{
                    backgroundColor: badge.bg,
                    color: badge.text,
                    border: `1px solid ${badge.border}`,
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "6px"
                  }}
                >
                  {badge.label}
                </span>
              </div>

              <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.55, margin: 0 }}>
                {item.advice}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecommendationCard;