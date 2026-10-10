import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#0f172a",
        color: "#94a3b8",
        padding: "36px 24px 28px",
        marginTop: "60px",
        borderTop: "1px solid #1e293b",
        fontSize: "13px"
      }}
    >
      <div
        style={{
          maxWidth: "1300px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🌍</span>
          <div>
            <strong style={{ color: "#ffffff", fontSize: "15px" }}>AirLens AI</strong>
            <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "12px" }}>
              National Ambient Air Quality Monitoring & Analytics Platform (Frontend Prototype)
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
          <Link to="/" style={{ color: "#cbd5e1" }}>Interactive Map</Link>
          <Link to="/dashboard" style={{ color: "#cbd5e1" }}>Analysis Dashboard</Link>
          <Link to="/hotspots" style={{ color: "#cbd5e1" }}>Hotspots</Link>
          <Link to="/prediction" style={{ color: "#cbd5e1" }}>AI Forecast</Link>
          <Link to="/recommendations" style={{ color: "#cbd5e1" }}>Health Guide</Link>
        </div>

        <div style={{ color: "#64748b", fontSize: "12px" }}>
          CPCB & WHO Benchmark Data Alignment • 2026 AirLens
        </div>
      </div>
    </footer>
  );
}

export default Footer;