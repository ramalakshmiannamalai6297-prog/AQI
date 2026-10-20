const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const app = require("../app");
const pool = require("../config/db");
const alertService = require("../services/alertService");

const PORT = process.env.VERIFY_PORT || 3002;
const BASE_URL = `http://localhost:${PORT}`;

async function runVerification() {
  console.log("====================================================");
  console.log("AQI SYSTEM INTEGRATION & VERIFICATION SUITE");
  console.log("====================================================\n");

  // Ensure tables exist
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alert_subscriptions (
          subscription_id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          station_id INT NOT NULL,
          min_severity ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_email_station (email, station_id),
          FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alert_log (
          log_id INT AUTO_INCREMENT PRIMARY KEY,
          subscription_id INT NOT NULL,
          event_id INT NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_sub_event (subscription_id, event_id),
          FOREIGN KEY (subscription_id) REFERENCES alert_subscriptions(subscription_id) ON DELETE CASCADE,
          FOREIGN KEY (event_id) REFERENCES pollution_events(event_id) ON DELETE CASCADE
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_report_log (
          log_id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          report_date DATE NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_daily_report_email_date (email, report_date)
      );
    `);
  } catch (dbErr) {
    console.warn("Database table check warning:", dbErr.message);
  }

  // Start server
  let server;
  try {
    server = await new Promise((resolve, reject) => {
      const s = app.listen(PORT, (err) => {
        if (err) return reject(err);
        console.log(`✓ Verification test server listening on port ${PORT}\n`);
        resolve(s);
      });
    });
  } catch (err) {
    console.error(`Could not start server on port ${PORT}:`, err.message);
    process.exit(1);
  }

  // Dynamically resolve real stations from database
  const [candidateStations] = await pool.query(`
    SELECT s.station_id, s.city, s.station_name
    FROM stations s
    WHERE s.station_id IN (
      SELECT ar.station_id FROM aqi_readings ar
    )
    ORDER BY s.station_id ASC
    LIMIT 10
  `);

  if (!candidateStations || candidateStations.length < 2) {
    console.error("Need at least 2 stations with readings in the database.");
    process.exit(1);
  }

  const stationA = candidateStations[0];
  const stationB = candidateStations[1];
  const sAId = stationA.station_id;
  const sBId = stationB.station_id;

  // Ensure stationA has at least 6 historical readings for forecast regression
  const [rCount] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM aqi_readings WHERE station_id = ?",
    [sAId]
  );
  if (rCount[0].cnt < 6) {
    const times = ["10:00:00", "11:00:00", "12:00:00", "13:00:00", "14:00:00"];
    for (let i = 0; i < times.length; i++) {
      const [r] = await pool.query(
        "INSERT INTO aqi_readings (station_id, last_update) VALUES (?, ?)",
        [sAId, `2026-10-20 ${times[i]}`]
      );
      await pool.query(
        "INSERT INTO pollutant_readings (reading_id, pollutant_id, pollutant_min, pollutant_avg, pollutant_max) VALUES (?, 'PM2.5', ?, ?, ?)",
        [r.insertId, 50 + i * 5, 60 + i * 5, 70 + i * 5]
      );
    }
  }

  const results = {
    a: false,
    b: false,
    c: false,
    d: false,
    e: false
  };

  try {
    // --- ASSERTION A: Recommendations ---
    console.log(`Testing a) Station Recommendations (stations ${sAId} [${stationA.city}] & ${sBId} [${stationB.city}])...`);
    try {
      const recARes = await fetch(`${BASE_URL}/api/stations/${sAId}/recommendations`);
      if (!recARes.ok) throw new Error(`Status ${recARes.status}`);
      const recA = await recARes.json();

      const recBRes = await fetch(`${BASE_URL}/api/stations/${sBId}/recommendations`);
      if (!recBRes.ok) throw new Error(`Status ${recBRes.status}`);
      const recB = await recBRes.json();

      const hasItemsA = Array.isArray(recA.recommendations) && recA.recommendations.length > 0;
      const adviceAGen = recA.recommendations?.find(r => r.group === "General public")?.advice;
      const adviceBGen = recB.recommendations?.find(r => r.group === "General public")?.advice;

      if (hasItemsA && adviceAGen && adviceBGen && adviceAGen !== adviceBGen) {
        results.a = true;
        console.log(`[PASS] a) /api/stations/${sAId}/recommendations returned ${recA.recommendations.length} recommendations.`);
        console.log(`       ${stationA.city} AQI: ${recA.aqi} (${recA.category}) vs ${stationB.city} AQI: ${recB.aqi} (${recB.category})`);
        console.log(`       Advice differs appropriately.`);
      } else {
        console.error(`[FAIL] a) Recommendations check failed. Station A recs: ${recA.recommendations?.length}, match: ${adviceAGen === adviceBGen}`);
      }
    } catch (err) {
      console.error(`[FAIL] a) Recommendations error:`, err.message);
    }
    console.log("");

    // --- ASSERTION B: Forecast ---
    console.log(`Testing b) Station Forecast (hours=6, station ${sAId})...`);
    try {
      const forecastRes = await fetch(`${BASE_URL}/api/stations/${sAId}/forecast?hours=6`);
      if (!forecastRes.ok) throw new Error(`Status ${forecastRes.status}`);
      const forecastData = await forecastRes.json();

      const validTrend = ["rising", "falling", "stable"].includes(forecastData.trend);
      const isSix = Array.isArray(forecastData.forecast) && forecastData.forecast.length === 6;
      const allAqiValid = forecastData.forecast.every(f => typeof f.aqi === "number" && f.aqi >= 0 && f.aqi <= 500);

      if (validTrend && isSix && allAqiValid) {
        results.b = true;
        console.log(`[PASS] b) /api/stations/${sAId}/forecast?hours=6 returned exactly 6 items.`);
        console.log(`       Trend: ${forecastData.trend}, All AQI values valid (0-500).`);
        console.log(`       First projection: +1h = ${forecastData.forecast[0].aqi} (${forecastData.forecast[0].category})`);
      } else {
        console.error(`[FAIL] b) Forecast check failed. isSix=${isSix}, allAqiValid=${allAqiValid}, trend=${forecastData.trend}`);
      }
    } catch (err) {
      console.error(`[FAIL] b) Forecast error:`, err.message);
    }
    console.log("");

    // --- ASSERTION C: Alert Subscriptions & Alert Dispatch ---
    console.log("Testing c) Alerts Subscription, Duplicates, Unsubscribe, and Alert Dispatch...");
    const testEmail = "verify_test_user@example.com";
    try {
      // 1. Subscribe
      const subRes1 = await fetch(`${BASE_URL}/api/alerts/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, stationId: sAId, minSeverity: "MEDIUM" })
      });
      const subData1 = await subRes1.json();
      const sub1Ok = subRes1.ok && subData1.success === true;

      // 2. Duplicate Subscribe (must handle gracefully)
      const subRes2 = await fetch(`${BASE_URL}/api/alerts/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, stationId: sAId, minSeverity: "HIGH" })
      });
      const subData2 = await subRes2.json();
      const sub2Ok = subRes2.ok && subData2.success === true;

      // 3. Alert dispatch runs twice
      const run1 = await alertService.sendAlerts();
      const run2 = await alertService.sendAlerts();
      const alertDedupeOk = (run2.processed === 0 || run2.sent === 0);

      // 4. Unsubscribe
      const unsubRes = await fetch(`${BASE_URL}/api/alerts/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, stationId: sAId })
      });
      const unsubData = await unsubRes.json();
      const unsubOk = unsubRes.ok && unsubData.success === true;

      if (sub1Ok && sub2Ok && alertDedupeOk && unsubOk) {
        results.c = true;
        console.log(`[PASS] c) Alert workflow verified.`);
        console.log(`       Subscribe OK: "${subData1.message}"`);
        console.log(`       Duplicate handled OK: "${subData2.message}"`);
        console.log(`       Second sendAlerts dispatched 0 new emails (deduplication confirmed).`);
        console.log(`       Unsubscribe OK: "${unsubData.message}"`);
      } else {
        console.error(`[FAIL] c) Alert check failed. sub1=${sub1Ok}, sub2=${sub2Ok}, dedupe=${alertDedupeOk}, unsub=${unsubOk}`);
      }
    } catch (err) {
      console.error(`[FAIL] c) Alert error:`, err.message);
    }
    console.log("");

    // --- ASSERTION D: Weather & Station Health ---
    console.log(`Testing d) Station Weather and Station Health (station ${sAId})...`);
    try {
      const weatherRes = await fetch(`${BASE_URL}/api/stations/${sAId}/weather`);
      const weatherData = await weatherRes.json();
      const weatherOk = typeof weatherData.available === "boolean";

      const healthRes = await fetch(`${BASE_URL}/api/stations/${sAId}/health`);
      const healthData = await healthRes.json();
      const validHealthStatus = ["Online", "Delayed", "Offline", "Unavailable"].includes(healthData.status);

      if (weatherOk && validHealthStatus) {
        results.d = true;
        console.log(`[PASS] d) Weather & Health endpoints operational.`);
        console.log(`       Weather available: ${weatherData.available} ${weatherData.available ? `(${weatherData.temperature}°C, ${weatherData.humidity}%)` : ""}`);
        console.log(`       Station Health status: ${healthData.status} (minutesSinceUpdate: ${healthData.minutesSinceUpdate ?? "N/A"})`);
      } else {
        console.error(`[FAIL] d) Weather/Health failed. weatherOk=${weatherOk}, validHealth=${validHealthStatus}`);
      }
    } catch (err) {
      console.error(`[FAIL] d) Weather/Health error:`, err.message);
    }
    console.log("");

    // --- ASSERTION E: Core Existing Endpoints ---
    console.log("Testing e) Existing Core Endpoints (/api/health, /api/stations, /api/hotspots, /api/events)...");
    try {
      const [hRes, sRes, hotRes, eRes] = await Promise.all([
        fetch(`${BASE_URL}/api/health`),
        fetch(`${BASE_URL}/api/stations`),
        fetch(`${BASE_URL}/api/hotspots`),
        fetch(`${BASE_URL}/api/events`)
      ]);

      const all200 = hRes.status === 200 && sRes.status === 200 && hotRes.status === 200 && eRes.status === 200;

      if (all200) {
        results.e = true;
        console.log(`[PASS] e) Core endpoints all responded with HTTP 200 OK.`);
      } else {
        console.error(`[FAIL] e) Core endpoints check failed. Statuses: health=${hRes.status}, stations=${sRes.status}, hotspots=${hotRes.status}, events=${eRes.status}`);
      }
    } catch (err) {
      console.error(`[FAIL] e) Core endpoints error:`, err.message);
    }
    console.log("");

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("✓ Verification server stopped cleanly.\n");
    }
  }

  console.log("====================================================");
  console.log("VERIFICATION SUMMARY");
  console.log("====================================================");
  console.log(`a) Recommendations: ${results.a ? "PASS" : "FAIL"}`);
  console.log(`b) Forecast:        ${results.b ? "PASS" : "FAIL"}`);
  console.log(`c) Email Alerts:    ${results.c ? "PASS" : "FAIL"}`);
  console.log(`d) Weather & Health:${results.d ? "PASS" : "FAIL"}`);
  console.log(`e) Core Endpoints:  ${results.e ? "PASS" : "FAIL"}`);
  console.log("====================================================");

  const allPassed = Object.values(results).every(Boolean);
  if (allPassed) {
    console.log("ALL ASSERTIONS PASSED SUCCESSFULLY! 🎉\n");
    process.exit(0);
  } else {
    console.error("SOME ASSERTIONS FAILED.\n");
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error("Verification suite fatal error:", err);
  process.exit(1);
});
