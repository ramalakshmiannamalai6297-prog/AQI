import { useState, useEffect } from "react";
import NotificationCard from "../components/NotificationCard";
import EventCard from "../components/EventCard";
import { getEvents } from "../services/api";
import { mapBackendEvent } from "../services/mappers";
import { LoadingSpinner, ErrorMessage } from "../components/StatusState";
import { HiOutlineBell } from "react-icons/hi";

function Notifications() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEventsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEvents(10);
      if (res && Array.isArray(res.events) && res.events.length > 0) {
        const mapped = res.events.map(mapBackendEvent);
        setEvents(mapped);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Notifications: Error fetching events from backend:", err);
      setError("Could not reach the server");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getEvents(10);
        if (!ignore) {
          if (res && Array.isArray(res.events) && res.events.length > 0) {
            const mapped = res.events.map(mapBackendEvent);
            setEvents(mapped);
          } else {
            setEvents([]);
          }
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Notifications: Error fetching events from backend:", err);
          setError("Could not reach the server");
          setEvents([]);
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

  const topEvent = events.length > 0 ? events[0] : null;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
          <HiOutlineBell size={18} /> Alert Notification Center
        </div>
        <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
          Environmental Alerts & Threshold Triggers 🔔
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          Real-time incident detection, automated sensor warnings, and regulatory notices from the CAAQMS event engine.
        </p>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          subtext="Unable to reach Express backend at http://localhost:3000. Displaying static alert advisories."
          onRetry={fetchEventsList}
        />
      )}

      {loading && (
        <div style={{ marginBottom: "20px" }}>
          <LoadingSpinner message="Scanning environmental monitoring network for active triggers..." />
        </div>
      )}

      {/* Top Spike Event */}
      {topEvent ? (
        <EventCard
          city={topEvent.city}
          message={topEvent.message}
          severity={topEvent.severity}
          time={topEvent.time}
        />
      ) : (
        <EventCard
          city="Patna & Gangetic Plain"
          message="Critical winter smog stagnation event with AQI exceeding 415. Emergency GRAP Phase-IV guidelines in effect."
          severity="HIGH"
          time="Advisory"
        />
      )}

      <div style={{ marginTop: "20px" }}>
        <NotificationCard events={events} />
      </div>
    </div>
  );
}

export default Notifications;
