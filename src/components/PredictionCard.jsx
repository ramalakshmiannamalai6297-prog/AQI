import { useState, useEffect } from "react";
import { getAQICategory } from "../utils/aqi.js";
import { 
  HiOutlineSparkles, 
  HiOutlineTrendingUp, 
  HiOutlineTrendingDown, 
  HiOutlineMinusSm,
  HiOutlineClock,
  HiOutlineX
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
  const [showInfo, setShowInfo] = useState(false);
  const data = forecastData || { method, basedOnReadings, trend, forecast };
  const items = data.forecast || [];
  const trendNormalized = (data.trend || "stable").toLowerCase();

  useEffect(() => {
    if (!showInfo) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowInfo(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showInfo]);

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

  const renderInfoModal = () => {
    if (!showInfo) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forecast-modal-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowInfo(false);
          }
        }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          zIndex: 9999
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            maxWidth: "680px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            position: "relative"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "18px",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "14px"
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#9333ea",
                  fontWeight: "700",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                <HiOutlineSparkles size={16} /> Statistical Trend Forecaster
              </div>
              <h3
                id="forecast-modal-title"
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#0f172a",
                  margin: "4px 0 0"
                }}
              >
                AQI Forecast Methodology
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
                Trend-based projections calculated via least-squares linear regression over recent telemetry readings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              aria-label="Close modal"
              style={{
                backgroundColor: "#f1f5f9",
                border: "none",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                transition: "all 0.2s ease",
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e2e8f0";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f1f5f9";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              <HiOutlineX size={18} />
            </button>
          </div>

          {/* 3 Info Cards copied exactly from Prediction page */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px"
            }}
          >
            <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#0f172a" }}>📐 Linear Trend Method</h4>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.55 }}>
                Computes an ordinary least-squares line through up to 24 sequential hourly AQI datapoints. Projects immediate trajectory while clamping output values to standard 0-500 scale.
              </p>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#0f172a" }}>📊 Trend Classification</h4>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.55 }}>
                Classified as <strong>Rising</strong> (rate &gt; +1 AQI/hr), <strong>Falling</strong> (rate &lt; -1 AQI/hr), or <strong>Stable</strong> (rate within ±1 AQI/hr) based on regression slope.
              </p>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#0f172a" }}>🎯 Data Requirements</h4>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.55 }}>
                Requires minimum 6 contiguous telemetry records with particulate matter (PM2.5 or PM10) to generate accurate statistical slope projections.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInfoButton = () => (
    <button
      type="button"
      onClick={() => setShowInfo((prev) => !prev)}
      title="Forecast methodology and requirements"
      aria-label="Forecast methodology and requirements"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        backgroundColor: showInfo ? "rgba(147, 51, 234, 0.15)" : "#f1f5f9",
        color: showInfo ? "#9333ea" : "#64748b",
        border: `1px solid ${showInfo ? "#9333ea" : "#cbd5e1"}`,
        cursor: "pointer",
        padding: 0,
        fontSize: "12px",
        fontWeight: "700",
        fontFamily: "serif",
        fontStyle: "italic",
        lineHeight: 1,
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        if (!showInfo) {
          e.currentTarget.style.backgroundColor = "#e2e8f0";
          e.currentTarget.style.color = "#0f172a";
        }
      }}
      onMouseLeave={(e) => {
        if (!showInfo) {
          e.currentTarget.style.backgroundColor = "#f1f5f9";
          e.currentTarget.style.color = "#64748b";
        }
      }}
    >
      i
    </button>
  );

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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                AQI Forecast ({city})
              </h3>
              {renderInfoButton()}
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
              Trend-based projection from historical telemetry
            </p>
          </div>
        </div>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          Forecast unavailable or insufficient historical readings.
        </p>
        {renderInfoModal()}
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                AQI Forecast ({city})
              </h3>
              {renderInfoButton()}
            </div>
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
      {renderInfoModal()}
    </div>
  );
}

export default PredictionCard;