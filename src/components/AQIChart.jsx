import { useState } from "react";
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
import { LoadingSpinner, ErrorMessage } from "./StatusState";
import { HiOutlineChartBar } from "react-icons/hi";

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
            {entry.name}: {entry.value} {entry.unit || (entry.name === "AQI" ? "AQI" : "µg/m³")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function AQIChart({
  hourlyTrend = [],
  pollutantBreakdown = [],
  cityName = "Selected City",
  loading = false,
  error = null,
  onRetry = null
}) {
  const [activeTab, setActiveTab] = useState("aqi");

  const hasTrendData = Array.isArray(hourlyTrend) && hourlyTrend.length > 0;
  const hasBreakdownData = Array.isArray(pollutantBreakdown) && pollutantBreakdown.length > 0;

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
              border: "none",
              cursor: "pointer",
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
              border: "none",
              cursor: "pointer",
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
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Pollutant Breakdown
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: "40px 0" }}>
          <LoadingSpinner message={`Retrieving 24-hour reading history for ${cityName}...`} />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorMessage
          message="Could not load 24-hour reading history"
          subtext={error}
          onRetry={onRetry}
        />
      )}

      {/* Empty State */}
      {!loading && !error && !hasTrendData && activeTab !== "breakdown" && (
        <div
          style={{
            height: "280px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            borderRadius: "14px",
            border: "1px dashed #cbd5e1",
            color: "#64748b",
            textAlign: "center",
            padding: "24px"
          }}
        >
          <HiOutlineChartBar size={36} color="#94a3b8" style={{ marginBottom: "10px" }} />
          <h4 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "700", color: "#334155" }}>
            No 24-hour history records available
          </h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b", maxWidth: "380px" }}>
            Telemetry history records for {cityName} will appear here once hourly sensor readings are collected.
          </p>
        </div>
      )}

      {/* Chart Canvas */}
      {!loading && !error && (hasTrendData || (activeTab === "breakdown" && hasBreakdownData)) && (
        <div style={{ width: "100%", height: "320px" }}>
          {activeTab === "aqi" && hasTrendData && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Satisfactory Limit (100)", fill: "#10b981", fontSize: 11 }} />
                <Area type="monotone" dataKey="aqi" name="AQI" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#aqiColor)" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeTab === "pm" && hasTrendData && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
              <BarChart data={pollutantBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
      )}
    </div>
  );
}

export default AQIChart;