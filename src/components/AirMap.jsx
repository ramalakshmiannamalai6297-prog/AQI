import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { sensorLocations, AQI_CATEGORIES, getAQICategory } from "../data/dummyData";
import { 
  HiOutlineLocationMarker, 
  HiOutlineArrowRight, 
  HiOutlineSearch, 
  HiOutlineRefresh,
  HiOutlineSparkles
} from "react-icons/hi";

// Create custom colored DivIcon with the AQI number inside
const createAQIIcon = (aqi, categoryColor) => {
  return L.divIcon({
    className: "aqi-map-marker",
    html: `
      <div class="aqi-marker-bubble" style="background-color: ${categoryColor};">
        <span>${aqi}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  });
};

// Component to handle programmatic map view changes (flyTo)
function MapController({ selectedCoords }) {
  const map = useMap();
  React.useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 10, { duration: 1.5 });
    }
  }, [selectedCoords, map]);
  return null;
}

function AirMap({ onSelectCity }) {
  const navigate = useNavigate();
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [flyCoords, setFlyCoords] = useState(null);

  // Filter cities based on search term and category
  const filteredLocations = sensorLocations.filter((sensor) => {
    const matchesSearch =
      sensor.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.station.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === "ALL") return matchesSearch;
    return matchesSearch && sensor.category.toUpperCase() === activeFilter;
  });

  const handleCitySelect = (sensor) => {
    setSelectedCityId(sensor.id);
    setFlyCoords([sensor.latitude, sensor.longitude]);
    if (onSelectCity) {
      onSelectCity(sensor);
    }
  };

  const handleViewFullAnalysis = (sensorId) => {
    navigate(`/dashboard?city=${sensorId}`);
  };

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: "18px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}>
      {/* Top Map Action Bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px"
        }}
      >
        {/* Search Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 280px", maxWidth: "420px" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              display: "flex",
              alignItems: "center"
            }}
          >
            <HiOutlineSearch
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                color: "#64748b"
              }}
            />
            <input
              type="text"
              placeholder="Search 20 Indian cities, states, or stations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 40px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: "16px"
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Severity Quick Filter Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "2px"
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>
            Filter:
          </span>
          <button
            onClick={() => setActiveFilter("ALL")}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              backgroundColor: activeFilter === "ALL" ? "#0f172a" : "#f1f5f9",
              color: activeFilter === "ALL" ? "#ffffff" : "#475569",
              transition: "all 0.2s"
            }}
          >
            All ({sensorLocations.length})
          </button>
          {Object.entries(AQI_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(cat.label.toUpperCase())}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                backgroundColor: activeFilter === cat.label.toUpperCase() ? cat.color : "#f1f5f9",
                color: activeFilter === cat.label.toUpperCase() ? "#ffffff" : "#475569",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: activeFilter === cat.label.toUpperCase() ? "#ffffff" : cat.color
                }}
              />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height: "600px", width: "100%", position: "relative" }}>
        <MapContainer
          center={[22.5937, 78.9629]}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController selectedCoords={flyCoords} />

          {filteredLocations.map((sensor) => {
            const cat = getAQICategory(sensor.aqi);
            return (
              <Marker
                key={sensor.id}
                position={[sensor.latitude, sensor.longitude]}
                icon={createAQIIcon(sensor.aqi, cat.color)}
                eventHandlers={{
                  click: () => {
                    handleCitySelect(sensor);
                  }
                }}
              >
                <Popup className="custom-aqi-popup">
                  <div style={{ padding: "16px", minWidth: "270px" }}>
                    {/* Header: City & Category */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <HiOutlineLocationMarker size={16} color="#2563eb" />
                          <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                            {sensor.city}
                          </h3>
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                          {sensor.station}
                        </p>
                      </div>

                      <div
                        style={{
                          backgroundColor: cat.bg,
                          color: cat.text,
                          border: `1px solid ${cat.color}40`,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}
                      >
                        {sensor.category}
                      </div>
                    </div>

                    {/* AQI Score Banner */}
                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px"
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
                          Air Quality Index
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ fontSize: "32px", fontWeight: "800", color: cat.color, lineHeight: 1 }}>
                            {sensor.aqi}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>AQI (IN)</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b" }}>
                        <div>Main Pollutant</div>
                        <strong style={{ color: "#0f172a", fontSize: "13px" }}>{sensor.dominatingPollutant}</strong>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        marginBottom: "14px"
                      }}
                    >
                      <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", padding: "6px 10px", borderRadius: "8px" }}>
                        <span style={{ fontSize: "10px", color: "#64748b" }}>PM2.5</span>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                          {sensor.pm25} <span style={{ fontSize: "10px", fontWeight: "400" }}>µg/m³</span>
                        </div>
                      </div>
                      <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", padding: "6px 10px", borderRadius: "8px" }}>
                        <span style={{ fontSize: "10px", color: "#64748b" }}>PM10</span>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                          {sensor.pm10} <span style={{ fontSize: "10px", fontWeight: "400" }}>µg/m³</span>
                        </div>
                      </div>
                      <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", padding: "6px 10px", borderRadius: "8px" }}>
                        <span style={{ fontSize: "10px", color: "#64748b" }}>Temperature</span>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                          {sensor.temperature}
                        </div>
                      </div>
                      <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", padding: "6px 10px", borderRadius: "8px" }}>
                        <span style={{ fontSize: "10px", color: "#64748b" }}>Humidity</span>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                          {sensor.humidity}
                        </div>
                      </div>
                    </div>

                    {/* Sensor Status Footer */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        color: "#64748b",
                        marginBottom: "14px",
                        padding: "0 2px"
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#059669", fontWeight: "600" }}>
                        <span className="pulse-dot" style={{ width: "6px", height: "6px" }} />
                        {sensor.sensorStatus}
                      </span>
                      <span>Updated {sensor.lastUpdated}</span>
                    </div>

                    {/* View Full Analysis Action Button */}
                    <button
                      onClick={() => handleViewFullAnalysis(sensor.id)}
                      style={{
                        width: "100%",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "background-color 0.2s ease, transform 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                    >
                      <span>View Full Analysis</span>
                      <HiOutlineArrowRight size={14} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating AQI Legend Overlay (Bottom-Right) */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "20px",
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            padding: "14px 16px",
            borderRadius: "14px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            maxWidth: "320px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              AQI Legend (CPCB India)
            </span>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Index Scale</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {Object.entries(AQI_CATEGORIES).map(([key, cat]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "3px",
                      backgroundColor: cat.color
                    }}
                  />
                  <span style={{ color: "#334155", fontWeight: "500" }}>{cat.label}</span>
                </div>
                <span style={{ color: "#64748b", fontFamily: "monospace", fontSize: "11px", fontWeight: "600" }}>
                  {cat.min} - {cat.max}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Quick Stats Indicator (Top-Left on Map) */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 1000,
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            color: "#ffffff",
            backdropFilter: "blur(10px)",
            padding: "10px 16px",
            borderRadius: "12px",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="pulse-dot" />
            <span>Showing <strong>{filteredLocations.length}</strong> Locations</span>
          </div>
          <span style={{ color: "#475569" }}>|</span>
          <span style={{ color: "#94a3b8" }}>Click any marker to inspect</span>
        </div>
      </div>
    </div>
  );
}

export default AirMap;