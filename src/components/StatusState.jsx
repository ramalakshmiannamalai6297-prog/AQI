import { HiOutlineExclamationCircle, HiOutlineRefresh } from "react-icons/hi";

export function LoadingSpinner({ message = "Loading air quality telemetry..." }) {
  return (
    <div
      style={{
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        color: "#64748b"
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          border: "3px solid #e2e8f0",
          borderTopColor: "#2563eb",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }}
      />
      <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>
        {message}
      </span>
    </div>
  );
}

export function ErrorMessage({
  message = "Could not reach the server",
  subtext = "Unable to connect to the backend API at http://localhost:3000. Fallback data may be displayed.",
  onRetry
}) {
  return (
    <div
      style={{
        backgroundColor: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "14px",
        padding: "16px 20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        margin: "16px 0",
        boxShadow: "0 2px 8px rgba(220, 38, 38, 0.06)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <HiOutlineExclamationCircle size={22} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#991b1b" }}>
            {message}
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#b91c1c" }}>
            {subtext}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#ffffff",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
        >
          <HiOutlineRefresh size={14} /> Retry Connection
        </button>
      )}
    </div>
  );
}

export default {
  LoadingSpinner,
  ErrorMessage
};
