import { useState, useEffect } from "react";
import { getHotspots } from "../services/api";
import { mapBackendHotspot } from "../services/mappers";
import { LoadingSpinner, ErrorMessage } from "../components/StatusState";
import HotspotCard from "../components/HotspotCard";
import { HiOutlineFire, HiOutlineShieldCheck } from "react-icons/hi";

function Hotspots() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHotspotsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHotspots(12);
      if (res && Array.isArray(res.hotspots)) {
        const mapped = res.hotspots.map(mapBackendHotspot);
        setHotspots(mapped);
      } else {
        setHotspots([]);
      }
    } catch (err) {
      console.error("Hotspots: Error fetching hotspots from backend:", err);
      setError("Could not reach the server to load pollution hotspots.");
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getHotspots(12);
        if (!ignore) {
          if (res && Array.isArray(res.hotspots)) {
            const mapped = res.hotspots.map(mapBackendHotspot);
            setHotspots(mapped);
          } else {
            setHotspots([]);
          }
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Hotspots: Error fetching hotspots from backend:", err);
          setError("Could not reach the server to load pollution hotspots.");
          setHotspots([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
          <HiOutlineFire size={18} /> MOST POLLUTED RIGHT NOW
        </div>
        <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
          Pollution Hotspots
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          The most polluted station in each city, ranked by current AQI. Based on the latest hourly reading from each station.
        </p>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          subtext="Unable to reach Express backend at http://localhost:3000."
          onRetry={fetchHotspotsList}
        />
      )}

      {loading && (
        <div style={{ marginBottom: "24px" }}>
          <LoadingSpinner message="Querying continuous air quality network for pollution hotspots..." />
        </div>
      )}

      {!loading && hotspots.length === 0 && !error && (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "36px 24px",
            textAlign: "center",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}
        >
          <HiOutlineShieldCheck size={36} color="#10b981" style={{ margin: "0 auto 10px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px" }}>
            No hotspot data available right now.
          </h3>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {hotspots.map((sensor, index) => (
          <HotspotCard key={sensor.stationId || sensor.id || index} hotspot={sensor} />
        ))}
      </div>
    </div>
  );
}

export default Hotspots;
