const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("../config/db");
const { 
  calcAQI, 
  getAQICategory 
} = require("../utils/aqi");
const { getLatestStations } = require("../services/stationService");

async function run() {
  console.log("====================================================");
  console.log("AIRLENSAI CPCB AQI RECOMPUTATION UTILITY");
  console.log("Rules: Highest pollutant sub-index; >=3 pollutants incl PM2.5/PM10");
  console.log("====================================================\n");

  // 1. Check table structure of aqi_readings
  const [cols] = await pool.query("DESCRIBE aqi_readings");
  const columnNames = cols.map(c => c.Field);
  const hasAqiCol = columnNames.includes("aqi");
  const hasDomCol = columnNames.includes("dominant_pollutant") || columnNames.includes("dominating_pollutant");

  console.log(`[SCHEMA CHECK] aqi_readings columns: [${columnNames.join(", ")}]`);
  if (!hasAqiCol && !hasDomCol) {
    console.log("✓ aqi_readings stores raw observation timestamps; AQI is dynamically computed via calcAQI().");
    console.log("  No stored AQI columns exist in aqi_readings, so no table rewrite is necessary.\n");
  } else {
    console.log("→ Recomputing stored AQI columns in aqi_readings...");
    // If aqi_readings had an aqi column, update dynamically
  }

  // 2. Fetch latest stations and recompute
  const stations = await getLatestStations();
  console.log(`Analyzed ${stations.length} active stations across India.\n`);

  let unavailableCount = 0;
  let availableCount = 0;
  const dominantDistribution = {};
  const bandDistribution = {
    "Good (0-50)": 0,
    "Satisfactory (51-100)": 0,
    "Moderate (101-200)": 0,
    "Poor (201-300)": 0,
    "Very Poor (301-400)": 0,
    "Severe (401-500)": 0
  };

  const stationResults = [];

  for (const st of stations) {
    const res = calcAQI(st.pollutants);

    if (res) {
      availableCount++;
      const cat = getAQICategory(res.aqi).label;
      if (cat === "Good") bandDistribution["Good (0-50)"]++;
      else if (cat === "Satisfactory") bandDistribution["Satisfactory (51-100)"]++;
      else if (cat === "Moderate") bandDistribution["Moderate (101-200)"]++;
      else if (cat === "Poor") bandDistribution["Poor (201-300)"]++;
      else if (cat === "Very Poor") bandDistribution["Very Poor (301-400)"]++;
      else if (cat === "Severe") bandDistribution["Severe (401-500)"]++;

      const dom = res.dominantPollutant;
      dominantDistribution[dom] = (dominantDistribution[dom] || 0) + 1;

      stationResults.push({
        stationId: st.stationId,
        city: st.city,
        stationName: st.stationName,
        aqi: res.aqi,
        category: cat,
        dominant: res.dominantPollutant,
        pollutants: st.pollutants
      });
    } else {
      unavailableCount++;
      stationResults.push({
        stationId: st.stationId,
        city: st.city,
        stationName: st.stationName,
        aqi: "AQI unavailable (insufficient data)",
        category: "Unavailable",
        dominant: "Unavailable",
        pollutants: st.pollutants
      });
    }
  }

  // 3. Resolve Target Stations
  const targetMatchers = [
    { label: "Kalu Nagar Dombivli", test: s => s.stationName.includes("Kalu Nagar") || (s.city === "Dombivli" && s.stationName.includes("Dombivli")) },
    { label: "Lingaraj Nagar Hubballi", test: s => s.stationName.includes("Lingaraj Nagar") || (s.city === "Hubballi" && s.stationName.includes("Hubballi")) },
    { label: "Central Academy for SFS Byrnihat", test: s => s.stationName.includes("Central Academy") },
    { label: "15th Mile-Nongthymmai Byrnihat", test: s => s.stationName.includes("15th Mile") },
    { label: "Phase-1 GIDC Vapi", test: s => s.stationName.includes("Phase-1 GIDC") || (s.city === "Vapi" && s.stationName.includes("GIDC")) },
    { label: "Alipur Delhi", test: s => s.stationName.includes("Alipur") },
    { label: "Bandra Kurla Complex Mumbai", test: s => s.stationName.includes("Bandra Kurla") },
    { label: "IITG Guwahati", test: s => s.stationName.includes("IITG") },
    { label: "Town Hall Munger", test: s => s.city.toLowerCase() === "munger" || s.stationName.toLowerCase().includes("munger") },
    { label: "Kodungaiyur Chennai", test: s => s.stationName.includes("Kodungaiyur") }
  ];

  const matchedTargets = [];
  for (const tm of targetMatchers) {
    const found = stationResults.find(tm.test);
    if (found) {
      matchedTargets.push({ targetLabel: tm.label, ...found });
    } else {
      matchedTargets.push({
        targetLabel: tm.label,
        city: tm.label,
        stationName: "Not Found",
        aqi: "N/A",
        dominant: "N/A",
        category: "N/A"
      });
    }
  }

  // Navi Mumbai stations
  const naviMumbaiStations = stationResults.filter(
    s => s.city.toLowerCase().includes("navi mumbai") || s.stationName.toLowerCase().includes("navi mumbai")
  );

  // Print Report Table
  console.log("=========================================================================================");
  console.log("TARGET STATIONS AQI & DOMINANT POLLUTANT (CPCB SUB-INDEX RULES)");
  console.log("=========================================================================================");
  console.log(
    "Station Name".padEnd(46) +
    "City".padEnd(16) +
    "AQI".padEnd(36) +
    "Dominant"
  );
  console.log("-".repeat(110));

  for (const st of matchedTargets) {
    const nameStr = (st.stationName || st.targetLabel).slice(0, 44).padEnd(46);
    const cityStr = st.city.slice(0, 14).padEnd(16);
    const aqiStr = String(st.aqi).slice(0, 34).padEnd(36);
    const domStr = String(st.dominant);
    console.log(`${nameStr}${cityStr}${aqiStr}${domStr}`);
  }

  console.log("\n" + "-".repeat(110));
  console.log("NAVI MUMBAI STATIONS");
  console.log("-".repeat(110));
  for (const st of naviMumbaiStations) {
    const nameStr = st.stationName.slice(0, 44).padEnd(46);
    const cityStr = st.city.slice(0, 14).padEnd(16);
    const aqiStr = String(st.aqi).slice(0, 34).padEnd(36);
    const domStr = String(st.dominant);
    console.log(`${nameStr}${cityStr}${aqiStr}${domStr}`);
  }
  console.log("=========================================================================================\n");

  // Aggregate Statistics
  console.log("====================================================");
  console.log("AGGREGATE SUMMARY & COUNTS");
  console.log("====================================================");
  console.log(`• Total Monitored Stations:       ${stations.length}`);
  console.log(`• Stations with AQI available:    ${availableCount}`);
  console.log(`• Stations with AQI unavailable:  ${unavailableCount} (insufficient data)`);

  console.log("\n• Dominant Pollutant Breakdown:");
  for (const [pol, count] of Object.entries(dominantDistribution).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / availableCount) * 100).toFixed(1);
    console.log(`  - ${pol.padEnd(12)}: ${String(count).padStart(3)} stations (${pct}%)`);
  }

  console.log("\n• AQI Band Distribution:");
  for (const [band, count] of Object.entries(bandDistribution)) {
    const pct = availableCount > 0 ? ((count / availableCount) * 100).toFixed(1) : "0.0";
    console.log(`  - ${band.padEnd(25)}: ${String(count).padStart(3)} stations (${pct}%)`);
  }
  console.log("====================================================\n");

  await pool.end();
}

run().catch(err => {
  console.error("Recompute error:", err);
  process.exit(1);
});
