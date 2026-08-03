function Navbar() {
  return (
    <nav
      style={{
        backgroundColor: "#1e293b",
        color: "white",
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Logo */}

      <h2
   style={{
    color: "white",
    margin: 0,
    fontSize: "32px",
    fontWeight: "bold",
  }}
      >
        🌍 AirLens AI
      </h2>

      {/* Menu */}

      <div
        style={{
          display: "flex",
          gap: "25px",
          fontSize: "18px",
          fontWeight: "500",
        }}
      >
        <span style={{ cursor: "pointer" }}>Dashboard</span>

        <span style={{ cursor: "pointer" }}>Map</span>

        <span style={{ cursor: "pointer" }}>Prediction</span>

        <span style={{ cursor: "pointer" }}>Alerts</span>
      </div>
    </nav>
  );
}

export default Navbar;