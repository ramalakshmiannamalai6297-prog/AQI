import React, { useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

function AQIChart({ hourlyTrend = [], pollutantBreakdown = [], cityName = "Selected City" }) {
  const [activeTab, setActiveTab] = useState("aqi");

  // Fallback 24-hour trend data if hourlyTrend is empty
  const defaultTrend = [
    { time: "00:00", aqi: 130, pm25: 68, pm10: 110 },
    { time: "02:00", aqi: 145, pm25: 75, pm10: 125 },
    { time: "04:00", aqi: 160, pm25: 84, pm10: 140 },
    { time: "06:00", aqi: 195, pm25: 105, pm10: 175 },
    { time: "08:00", aqi: 210, pm25: 115, pm10: 190 },
    { time: "10:00", aqi: 175, pm25: 92, pm10: 155 },
    { time: "12:00", aqi: 140, pm25: 72, pm10: 120 },
    { time: "14:00", aqi: 125, pm25: 64, pm10: 105 },
    { time: "16:00", aqi: 135, pm25: 70, pm10: 115 },
    { time: "18:00", aqi: 165, pm25: 88, pm10: 145 },
    { time: "20:00", aqi: 185, pm25: 98, pm10: 165 },
    { time: "22:00", aqi: 155, pm25: 80, pm10: 135 }
  ];

  const trendData = hourlyTrend.length > 0 ? hourlyTrend : defaultTrend;

  const defaultBreakdown = [
    { name: "PM2.5", value: 72, safeLimit: 60 },
    { name: "PM10", value: 128, safeLimit: 100 },
    { name: "NO₂", value: 45, safeLimit: 80 },
    { name: "SO₂", value: 18, safeLimit: 80 },
    { name: "CO (x10)", value: 14, safeLimit: 20 },
    { name: "O₃", value: 32, safeLimit: 100 }
  ];

  const breakdownData = pollutantBreakdown.length > 0 ? pollutantBreakdown : defaultBreakdown;

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            border: "1px solid #334155"
          }}
        >
          <p style={{ margin: "0 0 4px", fontWeight: "700", color: "#94a3b8" }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ margin: "2px 0", color: entry.color || "#38bdf8", fontWeight: "600" }}>
              {entry.name}: {entry.value} {entry.unit || ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
      {/* Header & View Switcher */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            📈 Air Quality Trends & Analytics
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
            24-hour diurnal patterns & pollutant profile for {cityName}
          </p>
        </div>

        {/* Tab Controls */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#f1f5f9",
            borderRadius: "10px",
            padding: "3px"
          }}
        >
          <button
            onClick={() => setActiveTab("aqi")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              backgroundColor: activeTab === "aqi" ? "#ffffff" : "transparent",
              color: activeTab === "aqi" ? "#2563eb" : "#64748b",
              boxShadow: activeTab === "aqi" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s"
            }}
          >
            24h AQI Trend
          </button>
          <button
            onClick={() => setActiveTab("pm")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              backgroundColor: activeTab === "pm" ? "#ffffff" : "transparent",
              color: activeTab === "pm" ? "#2563eb" : "#64748b",
              boxShadow: activeTab === "pm" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s"
            }}
          >
            PM2.5 vs PM10
          </button>
          <button
            onClick={() => setActiveTab("breakdown")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              backgroundColor: activeTab === "breakdown" ? "#ffffff" : "transparent",
              color: activeTab === "breakdown" ? "#2563eb" : "#64748b",
              boxShadow: activeTab === "breakdown" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s"
            }}
          >
            Pollutant Breakdown
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: "100%", height: "320px" }}>
        {activeTab === "aqi" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Satisfactory Limit", fill: "#10b981", fontSize: 11 }} />
              <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Moderate Threshold", fill: "#f59e0b", fontSize: 11 }} />
              <Area type="monotone" dataKey="aqi" name="AQI" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#aqiColor)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "pm" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "13px" }} />
              <Line type="monotone" dataKey="pm25" name="PM2.5 (Fine Particulate)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="pm10" name="PM10 (Coarse Dust)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === "breakdown" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdownData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "13px" }} />
              <Bar dataKey="value" name="Current Concentration" fill="#2563eb" radius={[6, 6, 0, 0]} />
              <Bar dataKey="safeLimit" name="NAAQS Safe Limit" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default AQIChart;