import React, { useState } from "react";
import RecommendationCard from "../components/RecommendationCard";
import { sensorLocations, AQI_CATEGORIES } from "../data/dummyData";
import { HiOutlineLightBulb, HiOutlineLocationMarker } from "react-icons/hi";

function Recommendations() {
  const [selectedCityId, setSelectedCityId] = useState("delhi-anand-vihar");
  const selectedSensor = sensorLocations.find((s) => s.id === selectedCityId) || sensorLocations[0];

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
            <HiOutlineLightBulb size={18} /> Public Health Advisory
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
            Health Guide & Exposure Guidelines 💡
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Standard health recommendations based on CPCB & WHO air pollution safety thresholds.
          </p>
        </div>

        {/* City Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <HiOutlineLocationMarker size={20} color="#10b981" />
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              color: "#0f172a",
              cursor: "pointer",
              outline: "none"
            }}
          >
            {sensorLocations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.city} ({s.aqi} AQI - {s.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      <RecommendationCard
        aqi={selectedSensor.aqi}
        healthAdvice={selectedSensor.healthAdvice}
      />

      {/* General Guidelines Matrix */}
      <div style={{ marginTop: "32px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
          Standard Air Quality Index Scale & Protection Guidelines
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {Object.entries(AQI_CATEGORIES).map(([key, cat]) => (
            <div
              key={key}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                borderLeft: `5px solid ${cat.color}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "16px", color: "#0f172a" }}>{cat.label}</strong>
                <span
                  style={{
                    backgroundColor: cat.bg,
                    color: cat.text,
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "6px"
                  }}
                >
                  {cat.min} - {cat.max}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                {cat.label === "Good" && "Minimal impact. Safe for everyone to engage in all outdoor recreational activities."}
                {cat.label === "Satisfactory" && "Minor breathing discomfort to sensitive people. Safe for general public outdoor activities."}
                {cat.label === "Moderate" && "Discomfort to patients with asthma & heart conditions. Sensitive groups should reduce heavy exertion."}
                {cat.label === "Poor" && "Breathing discomfort to most people on prolonged exposure. Wear N95 masks outdoors."}
                {cat.label === "Very Poor" && "Respiratory illness on prolonged exposure. Avoid morning/evening outdoor cardio and runs."}
                {cat.label === "Severe" && "Seriously affects healthy people and severely impacts patients. Strict indoor stay advised."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Recommendations;