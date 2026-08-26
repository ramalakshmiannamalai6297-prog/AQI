import React, { useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { getCityData, getAllCities, getAQICategory } from "../data/dummyData";
import AQICard from "../components/AQICard";
import PollutantCard from "../components/PollutantCard";
import AQIChart from "../components/AQIChart";
import RecommendationCard from "../components/RecommendationCard";
import PredictionCard from "../components/PredictionCard";
import EventCard from "../components/EventCard";
import { 
  HiOutlineArrowLeft, 
  HiOutlineRefresh, 
  HiOutlineShare, 
  HiOutlineDownload,
  HiOutlineLocationMarker 
} from "react-icons/hi";

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const allCities = getAllCities();

  const cityId = searchParams.get("city") || "delhi-anand-vihar";
  const cityData = useMemo(() => getCityData(cityId), [cityId]);

  const handleCityChange = (e) => {
    setSearchParams({ city: e.target.value });
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px" }}>
      {/* Top Header / Navigation Bar with "Back to Map" */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Obvious Back to Map Option */}
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ffffff",
              color: "#1e293b",
              border: "1px solid #cbd5e1",
              padding: "10px 18px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            <HiOutlineArrowLeft size={18} />
            <span>Back to Map</span>
          </Link>

          {/* Quick City Switcher Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HiOutlineLocationMarker size={20} color="#2563eb" />
            <select
              value={cityData.id}
              onChange={handleCityChange}
              style={{
                padding: "10px 16px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
                cursor: "pointer",
                outline: "none",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
              }}
            >
              {allCities.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.city} — {sensor.station} ({sensor.aqi} AQI - {sensor.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              padding: "9px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#475569"
            }}
          >
            <HiOutlineRefresh size={16} /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Anomaly Event Notice if AQI is Poor / Severe */}
      {cityData.aqi > 200 && (
        <EventCard
          city={cityData.city}
          message={`Elevated ambient pollution concentrations (${cityData.aqi} AQI - ${cityData.category}). Heavy particulate loading detected.`}
        />
      )}

      {/* Main AQI Telemetry Overview Card */}
      <AQICard data={cityData} />

      {/* 6-Pollutant Breakdown Matrix */}
      <PollutantCard
        pollutants={cityData.pollutants}
        pollutantBreakdown={cityData.pollutantBreakdown}
      />

      {/* 24-Hour Trend & Analytics Charts (3 Recharts Views) */}
      <AQIChart
        hourlyTrend={cityData.hourlyTrend}
        pollutantBreakdown={cityData.pollutantBreakdown}
        cityName={cityData.city}
      />

      {/* Step 5: Compact Health Analysis Section */}
      <RecommendationCard
        aqi={cityData.aqi}
        healthAdvice={cityData.healthAdvice}
      />

      {/* Predictive ML Forecast for the selected city */}
      <PredictionCard
        city={cityData.city}
        baseAQI={cityData.aqi}
      />
    </div>
  );
}

export default Dashboard;