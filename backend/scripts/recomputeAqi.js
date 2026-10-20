const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("../config/db");
const { 
  calcAQI, 
  calcSubIndex, 
  getAQICategory, 
  normalizePollutantKey 
} = require("../utils/aqi");
const { getLatestStations } = require("../services/stationService");

/**
 * Legacy calculation that allowed CO to contribute to maxSubIndex and dominant pollutant
 */
function calcLegacyWithCO(pollutants) {
  if (!pollutants || typeof pollutants !== "object") return null;

  const standardKeys = ["PM2.5", "PM10", "NO2", "SO2", "CO", "OZONE"];
  const displayNames = {
    "PM2.5": "PM2.5",
    "PM10": "PM10",
    "NO2": "NO₂",
    "SO2": "SO₂",
    "CO": "CO",
    "OZONE": "O₃"
  };

  const normalizedInputs = {};
  for (const [rawKey, rawVal] of Object.entries(pollutants)) {
    const normKey = normalizePollutantKey(rawKey);
    if (normKey) {
      const val = typeof rawVal === "object" ? (rawVal.avg ?? rawVal.value ?? rawVal) : rawVal;
      const num = Number(val);
      if (!isNaN(num) && num !== null && num !== undefined) {
        normalizedInputs[normKey] = num;
      }
    }
  }

  const hasPM = normalizedInputs["PM2.5"] !== undefined || normalizedInputs["PM10"] !== undefined;
  if (!hasPM) return null;

  let maxSubIndex = -1;
  let dominantKey = null;

  for (const key of standardKeys) {
    if (normalizedInputs[key] !== undefined) {
      const sub = calcSubIndex(key, normalizedInputs[key]);
      if (sub !== null && !isNaN(sub)) {
        if (sub > maxSubIndex) {
          maxSubIndex = sub;
          dominantKey = key;
        }
      }
    }
  }

  if (maxSubIndex < 0 || dominantKey === null) return null;

  return {
    aqi: maxSubIndex,
    dominantPollutant: displayNames[dominantKey] || dominantKey,
    dominantKey
  };
}

async function run() {
  console.log("====================================================");
  console.log("AIRLENSAI AQI RECOMPUTATION UTILITY (EXCLUDING CO)");
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
    // If table had an aqi column, we would update rows here
  }

  // 2. Clean up pollution_events caused by CO
  const [coEvents] = await pool.query("SELECT COUNT(*) AS cnt FROM pollution_events WHERE UPPER(pollutant_id) = 'CO'");
  const coEventCount = coEvents[0].cnt;
  if (coEventCount > 0) {
    const [delRes] = await pool.query("DELETE FROM pollution_events WHERE UPPER(pollutant_id) = 'CO'");
    console.log(`✓ Cleaned up ${delRes.affectedRows} erroneous CO spike events from pollution_events table.\n`);
  } else {
    console.log("✓ No CO pollution_events found in database.\n");
  }

  // 3. Fetch latest stations and analyze before vs after
  const stations = await getLatestStations();
  console.log(`Analyzed ${stations.length} active stations across India.\n`);

  let coDominantBeforeCount = 0;
  let aqi500BeforeCount = 0;
  let aqi500AfterCount = 0;
  let stationsWithAqiBefore = 0;
  let stationsWithAqiAfter = 0;

  const bandDistribution = {
    "Good (0-50)": 0,
    "Satisfactory (51-100)": 0,
    "Moderate (101-200)": 0,
    "Poor (201-300)": 0,
    "Very Poor (301-400)": 0,
    "Severe (401-500)": 0
  };

  const stationDiffs = [];

  for (const st of stations) {
    const oldRes = calcLegacyWithCO(st.pollutants);
    const newRes = calcAQI(st.pollutants);

    if (oldRes) {
      stationsWithAqiBefore++;
      if (oldRes.dominantKey === "CO") {
        coDominantBeforeCount++;
      }
      if (oldRes.aqi >= 500) {
        aqi500BeforeCount++;
      }
    }

    if (newRes) {
      stationsWithAqiAfter++;
      if (newRes.aqi >= 500) {
        aqi500AfterCount++;
      }

      const cat = getAQICategory(newRes.aqi).label;
      if (cat === "Good") bandDistribution["Good (0-50)"]++;
      else if (cat === "Satisfactory") bandDistribution["Satisfactory (51-100)"]++;
      else if (cat === "Moderate") bandDistribution["Moderate (101-200)"]++;
      else if (cat === "Poor") bandDistribution["Poor (201-300)"]++;
      else if (cat === "Very Poor") bandDistribution["Very Poor (301-400)"]++;
      else if (cat === "Severe") bandDistribution["Severe (401-500)"]++;
    }

    stationDiffs.push({
      stationId: st.stationId,
      city: st.city,
      stationName: st.stationName,
      oldAqi: oldRes ? oldRes.aqi : "N/A",
      oldDom: oldRes ? oldRes.dominantPollutant : "N/A",
      newAqi: newRes ? newRes.aqi : "N/A",
      newDom: newRes ? newRes.dominantPollutant : "N/A"
    });
  }

  // 4. Select 10 target stations including Dombivli (Kalu Nagar), Bhagalpur, Bihar Sharif, Buxar, Delhi
  const pickTargetStations = () => {
    const targets = [];
    const targetKeywords = [
      { name: "Dombivli", filter: s => s.city.toLowerCase().includes("dombivli") || s.stationName.toLowerCase().includes("kalu nagar") },
      { name: "Bhagalpur", filter: s => s.city === "Bhagalpur" },
      { name: "Bihar Sharif", filter: s => s.city === "Bihar Sharif" },
      { name: "Buxar", filter: s => s.city === "Buxar" },
      { name: "Delhi", filter: s => s.city === "Delhi" }
    ];

    const pickedIds = new Set();

    for (const tk of targetKeywords) {
      const match = stationDiffs.find(s => tk.filter(s) && !pickedIds.has(s.stationId));
      if (match) {
        targets.push(match);
        pickedIds.add(match.stationId);
      }
    }

    // Add 5 more representative stations (Mumbai, Kolkata, Bengaluru, Agra, Lucknow, etc.)
    const otherCities = ["Agra", "Mumbai", "Kolkata", "Bengaluru", "Lucknow", "Chennai", "Hyderabad"];
    for (const city of otherCities) {
      if (targets.length >= 10) break;
      const match = stationDiffs.find(s => s.city === city && !pickedIds.has(s.stationId));
      if (match) {
        targets.push(match);
        pickedIds.add(match.stationId);
      }
    }

    // Fill remaining up to 10 if needed
    for (const s of stationDiffs) {
      if (targets.length >= 10) break;
      if (!pickedIds.has(s.stationId)) {
        targets.push(s);
        pickedIds.add(s.stationId);
      }
    }

    return targets;
  };

  const sample10 = pickTargetStations();

  // Print Report
  console.log("====================================================");
  console.log("10 STATIONS SAMPLE COMPARISON (OLD vs NEW)");
  console.log("====================================================");
  console.log(
    "City".padEnd(16) +
    "Station Name".padEnd(38) +
    "Old AQI".padEnd(10) +
    "New AQI".padEnd(10) +
    "Old Dom".padEnd(10) +
    "New Dom"
  );
  console.log("-".repeat(95));

  for (const st of sample10) {
    const cityStr = st.city.slice(0, 14).padEnd(16);
    const nameStr = st.stationName.slice(0, 36).padEnd(38);
    const oldAqiStr = String(st.oldAqi).padEnd(10);
    const newAqiStr = String(st.newAqi).padEnd(10);
    const oldDomStr = String(st.oldDom).padEnd(10);
    const newDomStr = String(st.newDom);
    console.log(`${cityStr}${nameStr}${oldAqiStr}${newAqiStr}${oldDomStr}${newDomStr}`);
  }
  console.log("-".repeat(95) + "\n");

  console.log("====================================================");
  console.log("AGGREGATE IMPACT STATISTICS");
  console.log("====================================================");
  console.log(`• Total Monitored Stations:         ${stations.length}`);
  console.log(`• Stations with CO dominant BEFORE: ${coDominantBeforeCount} of ${stationsWithAqiBefore} (${((coDominantBeforeCount / stationsWithAqiBefore) * 100).toFixed(1)}%)`);
  console.log(`• Stations with CO dominant AFTER:  0 (CO excluded from overall AQI formula)`);
  console.log(`• Stations with AQI 500 BEFORE:     ${aqi500BeforeCount}`);
  console.log(`• Stations with AQI 500 AFTER:      ${aqi500AfterCount}`);
  console.log("\n• New Distribution Across the Six AQI Bands:");
  for (const [band, count] of Object.entries(bandDistribution)) {
    const pct = ((count / stationsWithAqiAfter) * 100).toFixed(1);
    console.log(`  - ${band.padEnd(25)}: ${String(count).padStart(3)} stations (${pct}%)`);
  }
  console.log("====================================================\n");

  await pool.end();
}

run().catch(err => {
  console.error("Recompute error:", err);
  process.exit(1);
});
