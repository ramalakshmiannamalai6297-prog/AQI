import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AirMap from "../components/AirMap";
import { getAQICategory } from "../utils/aqi.js";
import { getStations } from "../services/api";
import { mapBackendStationToFrontend } from "../services/mappers";
import { LoadingSpinner, ErrorMessage } from "../components/StatusState";
import { 
  HiOutlineSparkles, 
  HiOutlineShieldExclamation, 
  HiOutlineCheckCircle, 
  HiOutlineArrowRight
} from "react-icons/hi";

function Home() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStations();
      if (data && Array.isArray(data.stations) && data.stations.length > 0) {
        const mapped = data.stations.map((s) => mapBackendStationToFrontend(s));
        setStations(mapped);
      } else {
        setStations([]);
      }
    } catch (err) {
      console.error("Home: Error reaching backend for stations:", err);
      setError("Could not reach the server");
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadStations() {
      try {
        const data = await getStations();
        if (!ignore) {
          if (data && Array.isArray(data.stations) && data.stations.length > 0) {
            const mapped = data.stations.map((s) => mapBackendStationToFrontend(s));
            setStations(mapped);
          } else {
            setStations([]);
          }
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Home: Error reaching backend for stations:", err);
          setError("Could not reach the server");
          setStations([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadStations();
    return () => {
      ignore = true;
    };
  }, []);

  // Summary computations from active stations with real CPCB AQI values
  const totalSensors = stations.length;
  const avgAQI = totalSensors > 0
    ? Math.round(stations.reduce((acc, s) => acc + (s.aqi || 0), 0) / totalSensors)
    : 0;
  const mostPolluted = totalSensors > 0
    ? [...stations].sort((a, b) => b.aqi - a.aqi)[0]
    : null;
  const cleanest = totalSensors > 0
    ? [...stations].sort((a, b) => a.aqi - b.aqi)[0]
    : null;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
      {/* Top Hero Banner */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "24px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                color: "#2563eb",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <HiOutlineSparkles size={14} /> National Sensor Network
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Continuous Ambient Air Quality Monitoring (CAAQMS)
            </span>
          </div>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: "900",
              color: "#0f172a",
              letterSpacing: "-0.5px",
              margin: 0
            }}
          >
            India Real-Time AQI & Air Quality Map 🇮🇳
          </h1>
          <p style={{ fontSize: "15px", color: "#64748b", margin: "6px 0 0" }}>
            Interactive geospatial monitoring across 20 major Indian urban centers. Connected to real-time telemetry stream.
          </p>
        </div>

        <Link
          to={`/dashboard${mostPolluted ? `?city=${mostPolluted.id || mostPolluted.stationId}` : ""}`}
          style={{
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "12px 22px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
        >
          <span>Explore Live Dashboard</span>
          <HiOutlineArrowRight size={16} />
        </Link>
      </div>

      {/* Error state if server is offline */}
      {error && (
        <ErrorMessage
          message={error}
          subtext="Unable to reach Express backend at http://localhost:3000."
          onRetry={fetchStationData}
        />
      )}

      {/* Loading state indicator */}
      {loading && (
        <div style={{ marginBottom: "20px" }}>
          <LoadingSpinner message="Syncing with CAAQMS national monitoring stations..." />
        </div>
      )}

      {/* Network Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        {/* Active Stations */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "18px 20px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
            Network Coverage
          </span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "4px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
              {totalSensors} <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Stations</span>
            </span>
            <span style={{ color: error ? "#f59e0b" : "#10b981", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="pulse-dot" style={{ width: "6px", height: "6px" }} /> {error ? "Offline Mode" : "100% Online"}
            </span>
          </div>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>
            Pan-India Tier 1 & Tier 2 Cities
          </p>
        </div>

        {/* National Average AQI */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "18px 20px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
            National Average AQI
          </span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "4px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: getAQICategory(avgAQI).color }}>
              {avgAQI} <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>AQI-IN</span>
            </span>
            <span
              style={{
                backgroundColor: getAQICategory(avgAQI).bg,
                color: getAQICategory(avgAQI).text,
                fontSize: "11px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "8px"
              }}
            >
              {getAQICategory(avgAQI).label}
            </span>
          </div>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>
            Weighted mean across continuous nodes
          </p>
        </div>

        {/* Highest Pollution Hotspot */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "18px 20px",
            borderRadius: "16px",
            border: "1px solid #fee2e2",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}
        >
          <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: "700", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
            <HiOutlineShieldExclamation size={16} /> Highest AQI Alert
          </span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "4px" }}>
            <div>
              <span style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                {mostPolluted?.city || "Unavailable"}
              </span>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                {mostPolluted?.station || mostPolluted?.stationName || "No data"}
              </span>
            </div>
            <span style={{ fontSize: "24px", fontWeight: "900", color: "#7f1d1d" }}>
              {mostPolluted?.aqi !== undefined ? mostPolluted.aqi : "—"}
            </span>
          </div>
        </div>

        {/* Cleanest Air Station */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "18px 20px",
            borderRadius: "16px",
            border: "1px solid #dcfce7",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}
        >
          <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "700", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
            <HiOutlineCheckCircle size={16} /> Cleanest Air Pocket
          </span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "4px" }}>
            <div>
              <span style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                {cleanest?.city || "Unavailable"}
              </span>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                {cleanest?.station || cleanest?.stationName || "No data"}
              </span>
            </div>
            <span style={{ fontSize: "24px", fontWeight: "900", color: "#10b981" }}>
              {cleanest?.aqi !== undefined ? cleanest.aqi : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Component */}
      <AirMap stations={stations} />

      {/* Quick City Selector Bar Below Map */}
      <div style={{ marginTop: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              ⚡ Quick City Sensor Cards
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
              Click any city card below to open its dedicated dashboard & analytical breakdown
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "14px"
          }}
        >
          {stations.slice(0, 10).map((sensor) => {
            const cat = getAQICategory(sensor.aqi);
            return (
              <Link
                key={sensor.id}
                to={`/dashboard?city=${sensor.id}`}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.08)";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                      {sensor.city}
                    </h4>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>{sensor.state}</span>
                  </div>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: cat.color
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "24px", fontWeight: "900", color: cat.color }}>
                    {sensor.aqi}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: cat.text,
                      backgroundColor: cat.bg,
                      padding: "2px 6px",
                      borderRadius: "6px"
                    }}
                  >
                    {sensor.category}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                  <span>PM2.5: <strong>{sensor.pm25}</strong></span>
                  <span>PM10: <strong>{sensor.pm10}</strong></span>
                  <span>{sensor.temperature || "Live"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Home;