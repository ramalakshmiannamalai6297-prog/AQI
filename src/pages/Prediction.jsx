import { useState } from "react";
import PredictionCard from "../components/PredictionCard";
import { sensorLocations } from "../data/dummyData";
import { HiOutlineSparkles, HiOutlineLocationMarker } from "react-icons/hi";

// TODO: Prediction stays on dummy data until ML forecast endpoint is implemented in the backend
function Prediction() {
  const [selectedCityId, setSelectedCityId] = useState("delhi-anand-vihar");
  // TODO: real AQI & telemetry data
  const selectedSensor = sensorLocations.find((s) => s.id === selectedCityId) || sensorLocations[0];

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9333ea", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
            <HiOutlineSparkles size={18} /> Predictive Machine Learning
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
            AI Air Quality Forecast 🤖
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Deep neural predictive modelling projecting AQI index variations 1h to 24h into the future.
          </p>
        </div>

        {/* City Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <HiOutlineLocationMarker size={20} color="#9333ea" />
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              color: "#0f172a",
              cursor: "pointer",
              outline: "none"
            }}
          >
            {sensorLocations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.city} (Current: {s.aqi} AQI)
              </option>
            ))}
          </select>
        </div>
      </div>

      <PredictionCard city={selectedSensor.city} baseAQI={selectedSensor.aqi} />

      {/* Model Diagnostic Parameters */}
      <div
        style={{
          marginTop: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px"
        }}
      >
        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#0f172a" }}>💨 Wind Vector Dynamics</h4>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Current vector 4.2 km/h NW. Boundary layer compression expected at 06:00 IST leading to transient morning AQI spike.
          </p>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#0f172a" }}>🌡️ Thermal Inversion Risk</h4>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Inversion layer height estimated at 320m. Trapped pollutants will disperse once solar insolation peaks around 13:00 IST.
          </p>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#0f172a" }}>🛰️ Satellite AOD Correlation</h4>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Aerosol Optical Depth (AOD) from INSAT-3DR aligned at 0.78 index, matching ground sensor readings with 94.2% fidelity.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Prediction;