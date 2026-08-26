import React from "react";
import { getHealthAdvice } from "../data/dummyData";
import { HiOutlineHeart, HiOutlineSun, HiOutlineShieldCheck, HiOutlineExclamationCircle } from "react-icons/hi";

function RecommendationCard({ aqi = 150, healthAdvice }) {
  const advice = healthAdvice || getHealthAdvice(aqi);

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
              backgroundColor: `${advice.badgeColor}15`,
              color: advice.badgeColor,
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
              Medical guidance tailored for current AQI score
            </p>
          </div>
        </div>

        <span
          style={{
            backgroundColor: `${advice.badgeColor}15`,
            color: advice.badgeColor,
            border: `1px solid ${advice.badgeColor}40`,
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
          {advice.risk}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px"
        }}
      >
        {/* Short Explanation */}
        <div style={{ backgroundColor: "#f8fafc", padding: "16px 20px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155", fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>
            <HiOutlineShieldCheck size={18} color="#2563eb" />
            <span>Health Risk Assessment</span>
          </div>
          <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
            {advice.explanation}
          </p>
        </div>

        {/* Outdoor Activity Recommendation */}
        <div style={{ backgroundColor: "#f8fafc", padding: "16px 20px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155", fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>
            <HiOutlineSun size={18} color="#f59e0b" />
            <span>Outdoor Activity Recommendation</span>
          </div>
          <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
            {advice.outdoorActivity}
          </p>
        </div>
      </div>

      {/* Suggested Precautions */}
      {advice.precautions && advice.precautions.length > 0 && (
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Recommended Action Checklist
          </span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "8px"
            }}
          >
            {advice.precautions.map((item, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e1",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#334155",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                ✅ {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendationCard;