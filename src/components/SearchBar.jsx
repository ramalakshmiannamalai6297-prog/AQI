import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sensorLocations, getAQICategory } from "../data/dummyData";
import { HiOutlineSearch, HiOutlineLocationMarker } from "react-icons/hi";

function SearchBar({ onSelectCity }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const results = sensorLocations.filter(
    (s) =>
      s.city.toLowerCase().includes(query.toLowerCase()) ||
      s.state.toLowerCase().includes(query.toLowerCase()) ||
      s.station.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (sensor) => {
    setQuery("");
    setIsOpen(false);
    if (onSelectCity) {
      onSelectCity(sensor);
    } else {
      navigate(`/dashboard?city=${sensor.id}`);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "560px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "2px solid #e2e8f0",
          padding: "6px 14px",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease"
        }}
      >
        <HiOutlineSearch size={22} color="#64748b" style={{ marginRight: "10px" }} />
        <input
          type="text"
          value={query}
          placeholder="Search any Indian city, monitoring station or state..."
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            fontSize: "15px",
            color: "#0f172a",
            padding: "8px 0"
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Auto-complete Dropdown */}
      {isOpen && query.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
            border: "1px solid #e2e8f0",
            maxHeight: "320px",
            overflowY: "auto",
            zIndex: 1000,
            padding: "8px 0"
          }}
        >
          {results.length > 0 ? (
            results.map((sensor) => {
              const cat = getAQICategory(sensor.aqi);
              return (
                <div
                  key={sensor.id}
                  onClick={() => handleSelect(sensor)}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <HiOutlineLocationMarker size={18} color="#2563eb" />
                    <div>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>{sensor.city}</strong>
                      <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "6px" }}>
                        ({sensor.station})
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800", color: cat.color }}>
                      {sensor.aqi} AQI
                    </span>
                    <span
                      style={{
                        backgroundColor: cat.bg,
                        color: cat.text,
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 6px",
                        borderRadius: "6px"
                      }}
                    >
                      {cat.label}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: "14px 16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
              No stations match "{query}". Try Delhi, Mumbai, Bengaluru, etc.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;