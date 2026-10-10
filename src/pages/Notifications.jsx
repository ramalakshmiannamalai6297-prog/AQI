import { useState, useEffect } from "react";
import NotificationCard from "../components/NotificationCard";
import EventCard from "../components/EventCard";
import { getEvents, getStations, subscribeAlerts, unsubscribeAlerts, testAlerts } from "../services/api";
import { mapBackendEvent } from "../services/mappers";
import { LoadingSpinner, ErrorMessage } from "../components/StatusState";
import { 
  HiOutlineBell, 
  HiOutlineMail, 
  HiOutlineLocationMarker, 
  HiOutlineShieldExclamation,
  HiOutlineCheckCircle,
  HiOutlinePaperAirplane
} from "react-icons/hi";

function Notifications() {
  const [events, setEvents] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Email Alert Form state
  const [email, setEmail] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("");
  const [minSeverity, setMinSeverity] = useState("MEDIUM");
  const [formLoading, setFormLoading] = useState(false);
  const [formStatus, setFormStatus] = useState(null); // { type: 'success'|'error'|'info', message: '' }

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, stationsRes] = await Promise.all([
        getEvents(20),
        getStations()
      ]);

      if (eventsRes && Array.isArray(eventsRes.events)) {
        setEvents(eventsRes.events.map(mapBackendEvent));
      }
      if (stationsRes && Array.isArray(stationsRes.stations) && stationsRes.stations.length > 0) {
        setStations(stationsRes.stations);
        if (!selectedStationId) {
          setSelectedStationId(String(stationsRes.stations[0].stationId));
        }
      }
    } catch (err) {
      console.error("Notifications: Error loading data:", err);
      setError("Could not reach backend server to load environmental alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !selectedStationId) {
      setFormStatus({ type: "error", message: "Please provide both an email address and select a station." });
      return;
    }

    setFormLoading(true);
    setFormStatus(null);
    try {
      const res = await subscribeAlerts(email, selectedStationId, minSeverity);
      setFormStatus({ type: "success", message: res.message || "Subscribed successfully to email alerts!" });
    } catch (err) {
      setFormStatus({ type: "error", message: err.message || "Failed to subscribe to alerts." });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email || !selectedStationId) {
      setFormStatus({ type: "error", message: "Please enter your email and select the station to unsubscribe from." });
      return;
    }

    setFormLoading(true);
    setFormStatus(null);
    try {
      const res = await unsubscribeAlerts(email, selectedStationId);
      setFormStatus({ type: "info", message: res.message || "Unsubscribed successfully." });
    } catch (err) {
      setFormStatus({ type: "error", message: err.message || "Failed to unsubscribe." });
    } finally {
      setFormLoading(false);
    }
  };

  const handleTestAlert = async () => {
    if (!email) {
      setFormStatus({ type: "error", message: "Please enter your email to send a test alert." });
      return;
    }

    setFormLoading(true);
    setFormStatus(null);
    try {
      const res = await testAlerts(email);
      setFormStatus({ 
        type: res.sent ? "success" : "info", 
        message: res.message || (res.sent ? "Test email sent successfully!" : "Email processed by backend.") 
      });
    } catch (err) {
      setFormStatus({ type: "error", message: err.message || "Failed to send test alert." });
    } finally {
      setFormLoading(false);
    }
  };

  const topEvent = events.length > 0 ? events[0] : null;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
          <HiOutlineBell size={18} /> Alert & Notification Center
        </div>
        <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
          Environmental Alerts & Spike Notifications 🔔
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          Real-time incident detection and email alerts dispatched when sudden pollutant spikes are detected.
        </p>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          subtext="Unable to reach Express backend at http://localhost:3000."
          onRetry={fetchData}
        />
      )}

      {loading && (
        <div style={{ marginBottom: "20px" }}>
          <LoadingSpinner message="Scanning environmental monitoring network for active event triggers..." />
        </div>
      )}

      {/* Top Spike Event Banner if present */}
      {topEvent && (
        <div style={{ marginBottom: "20px" }}>
          <EventCard
            city={topEvent.city}
            message={topEvent.message}
            severity={topEvent.severity}
            time={topEvent.time}
          />
        </div>
      )}

      {/* Email Alerts Subscription Box */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          padding: "24px 28px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e2e8f0",
          marginBottom: "24px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "rgba(37, 99, 235, 0.12)",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <HiOutlineMail size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Get Instant Email Alerts
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
              Subscribe to receive automated notifications whenever high pollution spikes occur at your selected station.
            </p>
          </div>
        </div>

        {formStatus && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "16px",
              backgroundColor: formStatus.type === "success" ? "#ecfdf5" : formStatus.type === "error" ? "#fef2f2" : "#eff6ff",
              color: formStatus.type === "success" ? "#065f46" : formStatus.type === "error" ? "#991b1b" : "#1e40af",
              border: `1px solid ${formStatus.type === "success" ? "#a7f3d0" : formStatus.type === "error" ? "#fecaca" : "#bfdbfe"}`
            }}
          >
            {formStatus.message}
          </div>
        )}

        <form onSubmit={handleSubscribe} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          {/* Email input */}
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Station selector */}
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
              Monitoring Station
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              disabled={stations.length === 0}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                backgroundColor: "#ffffff",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box"
              }}
            >
              {stations.map((s) => (
                <option key={s.stationId} value={s.stationId}>
                  {s.city} — {s.stationName}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Severity selector */}
          <div style={{ flex: "1 1 160px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
              Minimum Severity
            </label>
            <select
              value={minSeverity}
              onChange={(e) => setMinSeverity(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                backgroundColor: "#ffffff",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box"
              }}
            >
              <option value="LOW">LOW (All Spikes &gt;30%)</option>
              <option value="MEDIUM">MEDIUM (Spikes &gt;50%)</option>
              <option value="HIGH">HIGH (Severe Spikes &gt;100%)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={formLoading}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "10px 18px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)"
              }}
            >
              <HiOutlineCheckCircle size={18} /> Subscribe
            </button>

            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={formLoading}
              style={{
                backgroundColor: "#ffffff",
                color: "#64748b",
                border: "1px solid #cbd5e1",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Unsubscribe
            </button>

            <button
              type="button"
              onClick={handleTestAlert}
              disabled={formLoading}
              title="Send a sample email verification message"
              style={{
                backgroundColor: "#f8fafc",
                color: "#475569",
                border: "1px solid #cbd5e1",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <HiOutlinePaperAirplane size={16} /> Test Email
            </button>
          </div>
        </form>
      </div>

      {/* Incident Log Feed */}
      <NotificationCard events={events} loading={loading} error={error} />
    </div>
  );
}

export default Notifications;
