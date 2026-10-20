const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("../config/db");
const mailService = require("../services/mailService");
const alertService = require("../services/alertService");
const { buildDailyReportEmail, buildSpikeAlertEmail } = require("../services/emailTemplates");

async function testAlertFeatures() {
  console.log("====================================================");
  console.log("TESTING DAILY REPORT & SPIKE ALERT ENHANCEMENTS");
  console.log("====================================================\n");

  const testEmail = "mock_verify_sub@testdomain.org";
  let testStationId = 41;
  let testReadingId = null;
  let testEventId = null;

  // Intercept mailService.sendMail so NO REAL EMAILS ARE EVER SENT
  const originalSendMail = mailService.sendMail;
  const sentMailCalls = [];
  mailService.sendMail = async (options) => {
    sentMailCalls.push(options);
    console.log(`[MOCK EMAIL INTERCEPTED] to=${options.to}, subject="${options.subject}"`);
    return { configured: true, sent: true, messageId: "mock-" + Date.now() };
  };

  try {
    // 1. Pick an active station from DB
    const [stations] = await pool.query(
      `SELECT s.station_id, s.station_name, s.city, s.state
       FROM stations s
       JOIN aqi_readings ar ON ar.station_id = s.station_id
       ORDER BY s.station_id ASC
       LIMIT 1`
    );

    if (stations.length > 0) {
      testStationId = stations[0].station_id;
    }
    console.log(`Using Station ID: ${testStationId} (${stations[0]?.city} - ${stations[0]?.station_name})`);

    // Clean previous remnants if any
    await pool.query("DELETE FROM daily_report_log WHERE email = ?", [testEmail]);
    await pool.query("DELETE FROM alert_subscriptions WHERE email = ?", [testEmail]);

    // 2. Subscribe fake email
    await alertService.subscribe(testEmail, testStationId, "MEDIUM");
    console.log(`✓ Fake subscriber ${testEmail} subscribed to station ${testStationId}`);

    // 3. Test buildStationDailyData and buildDailyReportEmail
    const stationData = await alertService.buildStationDailyData(stations[0]);
    console.log(`Station AQI: ${stationData.aqi}, Category: ${stationData.category}, Dominant: ${stationData.dominantPollutant}`);
    console.log(`Has 24h stats: ${stationData.has24hStats} (stats: ${JSON.stringify(stationData.stats24h)})`);

    const dailyMail = buildDailyReportEmail({
      email: testEmail,
      stations: [stationData],
      dateStr: "2026-10-20"
    });

    // Check for undefined / NaN in daily report HTML and text
    if (dailyMail.html.includes("undefined") || dailyMail.html.includes("NaN") || dailyMail.html.includes("[object Object]")) {
      throw new Error("Daily report HTML contains 'undefined', 'NaN', or '[object Object]'!");
    }
    if (dailyMail.text.includes("undefined") || dailyMail.text.includes("NaN")) {
      throw new Error("Daily report text contains 'undefined' or 'NaN'!");
    }
    if (!dailyMail.html.includes("AirLensAI") || !dailyMail.html.includes("data.gov.in")) {
      throw new Error("Daily report HTML missing required AirLensAI branding or CPCB data disclaimer!");
    }
    console.log("✓ Daily report HTML and Text templates generated cleanly with zero NaN / undefined.");

    // 4. Test sendDailyReports with force=true
    const dailyRun1 = await alertService.sendDailyReports(true);
    console.log(`✓ sendDailyReports(force=true) processed: ${dailyRun1.processed}, sent: ${dailyRun1.sent}`);
    if (dailyRun1.sent === 0) {
      throw new Error("Expected daily report to be sent to mock subscriber.");
    }

    // Verify row inserted in daily_report_log
    const [logCheck1] = await pool.query(
      "SELECT * FROM daily_report_log WHERE email = ?",
      [testEmail]
    );
    if (logCheck1.length === 0) {
      throw new Error("daily_report_log row was not inserted after successful daily report send!");
    }
    console.log(`✓ daily_report_log row verified: report_date=${logCheck1[0].report_date}`);

    // 5. Test sendDailyReports deduplication (without force)
    const dailyRun2 = await alertService.sendDailyReports(false);
    console.log(`✓ sendDailyReports(force=false) deduplication run result: processed=${dailyRun2.processed}, sent=${dailyRun2.sent}`);
    if (dailyRun2.sent > 0 && dailyRun2.eligibleSubscribers?.includes(testEmail)) {
      throw new Error("Deduplication failed: daily report was sent again on the same day!");
    }
    console.log("✓ Daily report deduplication confirmed (no duplicate report sent today).");

    // 6. Test Spike Alert generation and deduplication
    // Insert a reading and spike event detected after subscription
    const [readingResult] = await pool.query(
      "INSERT INTO aqi_readings (station_id, last_update) VALUES (?, NOW())",
      [testStationId]
    );
    testReadingId = readingResult.insertId;

    const [eventResult] = await pool.query(
      `INSERT INTO pollution_events 
       (station_id, reading_id, pollutant_id, event_type, previous_value, current_value, change_value, change_percentage, severity, message, detected_at)
       VALUES (?, ?, 'PM2.5', 'SPIKE', 40.0, 85.0, 45.0, 112.5, 'HIGH', 'Sudden rapid PM2.5 surge detected.', DATE_ADD(NOW(), INTERVAL 5 SECOND))`,
      [testStationId, testReadingId]
    );
    testEventId = eventResult.insertId;

    // Check Spike Email HTML generation
    const mockSpikes = [{
      station_id: testStationId,
      station_name: stations[0].station_name,
      city: stations[0].city,
      state: stations[0].state,
      pollutant_id: "PM2.5",
      previous_value: 40.0,
      current_value: 85.0,
      change_percentage: 112.5,
      detected_at: new Date(),
      message: "Sudden rapid PM2.5 surge detected."
    }];
    const spikeMail = buildSpikeAlertEmail({ email: testEmail, spikes: mockSpikes });

    if (spikeMail.html.includes("undefined") || spikeMail.html.includes("NaN") || spikeMail.html.includes("[object Object]")) {
      throw new Error("Spike alert HTML contains 'undefined', 'NaN', or '[object Object]'!");
    }
    if (!spikeMail.subject.includes("AQI Spike Alert: 1 sudden pollution spike(s)")) {
      throw new Error(`Spike alert subject format mismatch: ${spikeMail.subject}`);
    }
    console.log("✓ Spike alert HTML and Text generated cleanly with valid subject and zero NaN / undefined.");

    // 7. Test sendAlerts() and deduplication
    const alertRun1 = await alertService.sendAlerts();
    console.log(`✓ sendAlerts() run 1: processed=${alertRun1.processed}, sent=${alertRun1.sent}`);
    if (alertRun1.sent === 0) {
      throw new Error("Expected spike alert bundle to be sent to mock subscriber.");
    }

    // Verify row inserted into alert_log
    const [alertLogRows] = await pool.query(
      "SELECT * FROM alert_log WHERE event_id = ?",
      [testEventId]
    );
    if (alertLogRows.length === 0) {
      throw new Error("alert_log entry was not inserted for spike event!");
    }
    console.log("✓ alert_log entry confirmed for spike event.");

    // Run sendAlerts() again -> should process 0 new events for this subscriber
    const alertRun2 = await alertService.sendAlerts();
    console.log(`✓ sendAlerts() run 2 (deduplication): processed=${alertRun2.processed}, sent=${alertRun2.sent}`);
    if (alertRun2.sent !== 0 && alertRun2.processed !== 0) {
      throw new Error("Deduplication failed: spike alert sent twice for the same event!");
    }
    console.log("✓ Spike alert deduplication confirmed.");

    // 8. Test sendTestAlert (sample daily report)
    const testAlertResult = await alertService.sendTestAlert(testEmail);
    console.log(`✓ sendTestAlert() result: sent=${testAlertResult.sent}, message="${testAlertResult.message}"`);
    if (!testAlertResult.success || !testAlertResult.sent) {
      throw new Error("sendTestAlert failed to send sample daily report.");
    }

    console.log("\n====================================================");
    console.log("ALL FEATURE ASSERTIONS PASSED WITH ZERO ERRORS! 🎉");
    console.log("====================================================");
  } finally {
    // Restore mailService
    mailService.sendMail = originalSendMail;

    // Cleanup mock data
    console.log("\nCleaning up test subscriber and event rows...");
    if (testEventId) {
      await pool.query("DELETE FROM alert_log WHERE event_id = ?", [testEventId]);
      await pool.query("DELETE FROM pollution_events WHERE event_id = ?", [testEventId]);
    }
    if (testReadingId) {
      await pool.query("DELETE FROM aqi_readings WHERE reading_id = ?", [testReadingId]);
    }
    await pool.query("DELETE FROM daily_report_log WHERE email = ?", [testEmail]);
    await pool.query("DELETE FROM alert_subscriptions WHERE email = ?", [testEmail]);
    console.log("✓ Cleanup completed cleanly.");
  }

  process.exit(0);
}

testAlertFeatures().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
