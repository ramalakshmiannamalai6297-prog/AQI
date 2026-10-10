const app = require("../app");
const pool = require("../config/db");
const alertService = require("../services/alertService");

const PORT = 3000;
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

  const results = {
    a: false,
    b: false,
    c: false,
    d: false,
    e: false
  };

  try {
    // --- ASSERTION A: Recommendations ---
    console.log("Testing a) Station Recommendations...");
    try {
      const rec21Res = await fetch(`${BASE_URL}/api/stations/21/recommendations`);
      if (!rec21Res.ok) throw new Error(`Status ${rec21Res.status}`);
      const rec21 = await rec21Res.json();

      const rec23Res = await fetch(`${BASE_URL}/api/stations/23/recommendations`);
      if (!rec23Res.ok) throw new Error(`Status ${rec23Res.status}`);
      const rec23 = await rec23Res.json();

      const hasItems21 = Array.isArray(rec21.recommendations) && rec21.recommendations.length > 0;
      const advice21Gen = rec21.recommendations.find(r => r.group === "General public")?.advice;
      const advice23Gen = rec23.recommendations?.find(r => r.group === "General public")?.advice;

      if (hasItems21 && advice21Gen && advice23Gen && advice21Gen !== advice23Gen) {
        results.a = true;
        console.log(`[PASS] a) /api/stations/21/recommendations returned ${rec21.recommendations.length} recommendations.`);
        console.log(`       Delhi AQI: ${rec21.aqi} (${rec21.category}) vs Bengaluru AQI: ${rec23.aqi} (${rec23.category})`);
        console.log(`       Advice differs appropriately.`);
      } else {
        console.error(`[FAIL] a) Recommendations check failed. Delhi recs: ${rec21.recommendations?.length}, match: ${advice21Gen === advice23Gen}`);
      }
    } catch (err) {
      console.error(`[FAIL] a) Recommendations error:`, err.message);
    }
    console.log("");

    // --- ASSERTION B: Forecast ---
    console.log("Testing b) Station Forecast (hours=6)...");
    try {
      const forecastRes = await fetch(`${BASE_URL}/api/stations/21/forecast?hours=6`);
      if (!forecastRes.ok) throw new Error(`Status ${forecastRes.status}`);
      const forecastData = await forecastRes.json();

      const validTrend = ["rising", "falling", "stable"].includes(forecastData.trend);
      const isSix = Array.isArray(forecastData.forecast) && forecastData.forecast.length === 6;
      const allAqiValid = forecastData.forecast.every(f => typeof f.aqi === "number" && f.aqi >= 0 && f.aqi <= 500);

      if (validTrend && isSix && allAqiValid) {
        results.b = true;
        console.log(`[PASS] b) /api/stations/21/forecast?hours=6 returned exactly 6 items.`);
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
        body: JSON.stringify({ email: testEmail, stationId: 21, minSeverity: "MEDIUM" })
      });
      const subData1 = await subRes1.json();
      const sub1Ok = subRes1.ok && subData1.success === true;

      // 2. Duplicate Subscribe (must handle gracefully)
      const subRes2 = await fetch(`${BASE_URL}/api/alerts/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, stationId: 21, minSeverity: "HIGH" })
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
        body: JSON.stringify({ email: testEmail, stationId: 21 })
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
    console.log("Testing d) Station Weather and Station Health...");
    try {
      const weatherRes = await fetch(`${BASE_URL}/api/stations/21/weather`);
      const weatherData = await weatherRes.json();
      const weatherOk = typeof weatherData.available === "boolean";

      const healthRes = await fetch(`${BASE_URL}/api/stations/21/health`);
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
