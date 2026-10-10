import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HiOutlineMap, HiOutlineViewGrid, HiOutlineFire, HiOutlineSparkles, HiOutlineLightBulb, HiOutlineBell } from "react-icons/hi";

function Navbar() {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "AQI Map", icon: <HiOutlineMap size={18} /> },
    { path: "/dashboard", label: "Dashboard", icon: <HiOutlineViewGrid size={18} /> },
    { path: "/hotspots", label: "Hotspots", icon: <HiOutlineFire size={18} /> },
    { path: "/prediction", label: "AI Forecast", icon: <HiOutlineSparkles size={18} /> },
    { path: "/recommendations", label: "Health Guide", icon: <HiOutlineLightBulb size={18} /> },
    { path: "/notifications", label: "Alerts", icon: <HiOutlineBell size={18} /> }
  ];

  return (
    <header
      style={{
        backgroundColor: "#0f172a",
        color: "#ffffff",
        padding: "0 28px",
        height: "70px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1e293b",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
      }}
    >
      {/* Brand / Logo */}
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
          color: "#ffffff"
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)"
          }}
        >
          🌍
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px" }}>
              AirLens<span style={{ color: "#38bdf8" }}>AI</span>
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                padding: "2px 6px",
                borderRadius: "6px",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                letterSpacing: "0.5px"
              }}
            >
              LIVE DEMO
            </span>
          </div>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
            India Ambient Air Quality Monitoring Network
          </p>
        </div>
      </Link>

      {/* Nav Menu Items */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path || (link.path === "/" && location.pathname === "/map");
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: isActive ? "600" : "500",
                color: isActive ? "#ffffff" : "#94a3b8",
                backgroundColor: isActive ? "rgba(59, 130, 246, 0.2)" : "transparent",
                border: isActive ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid transparent",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#94a3b8";
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Live Status Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            color: "#34d399",
            fontWeight: "600"
          }}
        >
          <span className="pulse-dot"></span>
          20 Active Stations
        </div>
      </div>
    </header>
  );
}

export default Navbar;