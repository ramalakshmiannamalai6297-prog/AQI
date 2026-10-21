const pool = require("../config/db");
const mailService = require("./mailService");
const { calcAQI, getAQICategory, generateRecommendations, EXCLUDED_FROM_AQI } = require("../utils/aqi");
const { buildDailyReportEmail, buildSpikeAlertEmail } = require("./emailTemplates");

const VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH"];

/**
 * Validate email string format
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Get current date and hour in Asia/Kolkata (IST)
 */
function getISTDateTime() {
  const now = new Date();
  const parts = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(now).forEach((p) => {
    parts[p.type] = p.value;
  });

  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);
  return { dateStr, hour, minute };
}

/**
 * Subscribe an email to alerts for a station
 */
async function subscribe(email, stationId, minSeverity = "MEDIUM") {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const safeStationId = Number(stationId);
  const severity = String(minSeverity || "MEDIUM").toUpperCase();

  if (!isValidEmail(cleanEmail)) {
    throw new Error("Invalid email address format.");
  }
  if (!Number.isInteger(safeStationId) || safeStationId <= 0) {
    throw new Error("Invalid station ID.");
  }
  if (!VALID_SEVERITIES.includes(severity)) {
    throw new Error("Invalid minSeverity. Must be LOW, MEDIUM, or HIGH.");
  }

  // Check station exists
  const [stations] = await pool.query(
    "SELECT station_id, station_name, city FROM stations WHERE station_id = ?",
    [safeStationId]
  );
  if (stations.length === 0) {
    throw new Error(`Station with ID ${safeStationId} not found.`);
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO alert_subscriptions (email, station_id, min_severity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE min_severity = VALUES(min_severity)`,
      [cleanEmail, safeStationId, severity]
    );

    const isNew = result.affectedRows === 1;
    return {
      success: true,
      message: isNew
        ? `Successfully subscribed ${cleanEmail} for alerts at ${stations[0].city} (${stations[0].station_name}).`
        : `Subscription already active for ${cleanEmail} at ${stations[0].city} (${severity} severity).`,
      subscriptionId: result.insertId || undefined,
      alreadySubscribed: !isNew,
      station: stations[0]
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return {
        success: true,
        message: `Already subscribed to ${stations[0].city} with ${severity} severity.`,
        alreadySubscribed: true
      };
    }
    throw error;
  }
}

/**
 * Unsubscribe an email from alerts for a station
 */
async function unsubscribe(email, stationId) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const safeStationId = Number(stationId);

  if (!isValidEmail(cleanEmail)) {
    throw new Error("Invalid email address format.");
  }
  if (!Number.isInteger(safeStationId) || safeStationId <= 0) {
    throw new Error("Invalid station ID.");
  }

  const [result] = await pool.query(
    "DELETE FROM alert_subscriptions WHERE email = ? AND station_id = ?",
    [cleanEmail, safeStationId]
  );

  return {
    success: true,
    message:
      result.affectedRows > 0
        ? `Successfully unsubscribed ${cleanEmail} from station ${safeStationId}.`
        : `No active subscription found for ${cleanEmail} at station ${safeStationId}.`,
    affectedRows: result.affectedRows
  };
}

/**
 * Helper to build comprehensive daily data for a station:
 * - Station name, city, state
 * - Latest reading with standard 6 pollutants
 * - CPCB calculated AQI, category, dominant pollutant
 * - Health advice recommendations
 * - 24h change, min, max, trend only if >= 3 historical readings exist
 */
async function buildStationDailyData(station) {
  const safeStationId = Number(station.station_id || station.stationId);

  // 1. Fetch latest reading
  const [latestReadings] = await pool.query(
    `
    SELECT ar.reading_id, ar.last_update
    FROM aqi_readings ar
    WHERE ar.station_id = ?
    ORDER BY ar.last_update DESC
    LIMIT 1
    `,
    [safeStationId]
  );

  let aqi = null;
  let category = "AQI unavailable (insufficient data)";
  let dominantPollutant = "Unavailable";
  let lastUpdate = null;
  let recommendations = [];
  const pollutants = {};

  if (latestReadings.length > 0) {
    const reading = latestReadings[0];
    lastUpdate = reading.last_update;

    const [pollutantRows] = await pool.query(
      `
      SELECT pollutant_id, pollutant_avg
      FROM pollutant_readings
      WHERE reading_id = ?
      `,
      [reading.reading_id]
    );

    for (const pr of pollutantRows) {
      if (pr.pollutant_avg !== null && pr.pollutant_avg !== undefined) {
        pollutants[pr.pollutant_id] = Number(pr.pollutant_avg);
      }
    }

    const aqiResult = calcAQI(pollutants);
    if (aqiResult && typeof aqiResult.aqi === "number") {
      aqi = aqiResult.aqi;
      category = getAQICategory(aqi).label;
      dominantPollutant = aqiResult.dominantPollutant;
      recommendations = generateRecommendations(aqi, aqiResult.dominantKey);
    }
  }

  // 2. Fetch up to 24 historical readings for 24h trend/min/max
  const [historyRows] = await pool.query(
    `
    SELECT ar.reading_id, ar.last_update, pr.pollutant_id, pr.pollutant_avg
    FROM aqi_readings ar
    JOIN pollutant_readings pr ON pr.reading_id = ar.reading_id
    WHERE ar.reading_id IN (
      SELECT reading_id FROM (
        SELECT reading_id FROM aqi_readings
        WHERE station_id = ?
        ORDER BY last_update DESC
        LIMIT 24
      ) AS recent_rids
    )
    ORDER BY ar.last_update ASC, pr.pollutant_id ASC
    `,
    [safeStationId]
  );

  const historyByReading = new Map();
  for (const row of historyRows) {
    if (!historyByReading.has(row.reading_id)) {
      historyByReading.set(row.reading_id, {
        readingId: row.reading_id,
        lastUpdate: row.last_update,
        pollutants: {}
      });
    }
    historyByReading.get(row.reading_id).pollutants[row.pollutant_id] = Number(row.pollutant_avg);
  }

  const validAqiReadings = [];
  for (const item of historyByReading.values()) {
    const calc = calcAQI(item.pollutants);
    if (calc && Number.isFinite(calc.aqi)) {
      validAqiReadings.push({
        lastUpdate: item.lastUpdate,
        aqi: calc.aqi
      });
    }
  }

  let has24hStats = false;
  let stats24h = null;

  // Only calculate 24h stats if station has AT LEAST 3 readings
  if (validAqiReadings.length >= 3) {
    const n = validAqiReadings.length;
    const oldestAqi = validAqiReadings[0].aqi;
    const newestAqi = validAqiReadings[n - 1].aqi;
    const aqiValues = validAqiReadings.map((r) => r.aqi);

    const minAqi = Math.min(...aqiValues);
    const maxAqi = Math.max(...aqiValues);
    const changeAqi = newestAqi - oldestAqi;

    // Linear regression slope
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      const x = i;
      const y = validAqiReadings[i].aqi;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const denominator = n * sumX2 - sumX * sumX;
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;

    let trend = "Stable";
    if (slope > 1) {
      trend = "Rising";
    } else if (slope < -1) {
      trend = "Falling";
    }

    if (Number.isFinite(changeAqi) && Number.isFinite(minAqi) && Number.isFinite(maxAqi)) {
      has24hStats = true;
      stats24h = {
        change: changeAqi,
        min: minAqi,
        max: maxAqi,
        trend
      };
    }
  }

  return {
    stationId: safeStationId,
    stationName: station.station_name,
    city: station.city,
    state: station.state,
    aqi,
    category,
    dominantPollutant,
    lastUpdate,
    pollutants,
    recommendations,
    has24hStats,
    stats24h
  };
}

/**
 * Daily report: One email per distinct subscriber email per day, containing a section
 * for EACH station that email subscribes to.
 * Send only if current IST time is 08:00 or later AND no daily_report_log row exists for that email today.
 * If force=true, skip the time and already-sent checks.
 */
async function sendDailyReports(force = false) {
  console.log(`Checking daily air quality reports (force=${force})...`);

  const ist = getISTDateTime();

  // Time check: only 08:00 IST or later unless force=true
  if (!force && ist.hour < 8) {
    console.log(`Daily report window not reached (current IST: ${ist.hour}:${ist.minute} < 08:00). Skipping.`);
    return { processed: 0, sent: 0, reason: "Before 08:00 IST" };
  }

  // Get all distinct subscriber emails
  const [subscribers] = await pool.query(
    "SELECT DISTINCT email FROM alert_subscriptions ORDER BY email ASC"
  );

  if (subscribers.length === 0) {
    console.log("No alert subscribers found for daily reports.");
    return { processed: 0, sent: 0 };
  }

  // If not force, check already-sent log for today in IST
  let alreadySentEmails = new Set();
  if (!force) {
    const [sentRows] = await pool.query(
      "SELECT email FROM daily_report_log WHERE report_date = ?",
      [ist.dateStr]
    );
    alreadySentEmails = new Set(sentRows.map((r) => r.email.toLowerCase()));
  }

  const eligibleSubscribers = subscribers.filter(
    (s) => force || !alreadySentEmails.has(s.email.toLowerCase())
  );

  if (eligibleSubscribers.length === 0) {
    console.log("All subscribers have already received today's daily report.");
    return { processed: 0, sent: 0, alreadySentCount: alreadySentEmails.size };
  }

  console.log(`Processing daily reports for ${eligibleSubscribers.length} subscriber(s)...`);
  let sentCount = 0;

  for (const sub of eligibleSubscribers) {
    const email = sub.email.toLowerCase().trim();

    try {
      // Get all stations this user subscribes to
      const [stationRows] = await pool.query(
        `
        SELECT s.station_id, s.station_name, s.city, s.state
        FROM alert_subscriptions sub
        JOIN stations s ON s.station_id = sub.station_id
        WHERE sub.email = ?
        ORDER BY s.city ASC, s.station_name ASC
        `,
        [email]
      );

      if (stationRows.length === 0) {
        continue;
      }

      // Build data for each station
      const stationDataList = [];
      for (const st of stationRows) {
        const stData = await buildStationDailyData(st);
        stationDataList.push(stData);
      }

      // Generate HTML & Text email
      const { html, text, subject } = buildDailyReportEmail({
        email,
        stations: stationDataList,
        dateStr: ist.dateStr
      });

      // Send email
      const mailResult = await mailService.sendMail({
        to: email,
        subject,
        text,
        html
      });

      if (mailResult.sent) {
        sentCount++;
        // Insert log row only after a successful send
        try {
          await pool.query(
            `
            INSERT INTO daily_report_log (email, report_date, sent_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE sent_at = VALUES(sent_at)
            `,
            [email, ist.dateStr]
          );
        } catch (logErr) {
          console.error(`Failed to log daily report for ${email}:`, logErr.message);
        }
      }
    } catch (err) {
      console.error(`Error sending daily report to ${email}:`, err.message);
    }
  }

  console.log(`Daily report dispatch completed: eligible ${eligibleSubscribers.length}, sent ${sentCount}.`);
  return { processed: eligibleSubscribers.length, sent: sentCount };
}

/**
 * Spike alerts: only considers events with change_percentage >= 75 AND detected_at within
 * the last 24 hours AND detected_at after the subscription's created_at.
 * Ignore min_severity for matching.
 * Bundle per subscriber email into ONE email per run listing all new unsent spikes.
 * Subject: "AQI Spike Alert: N sudden pollution spike(s) in your stations"
 * Insert alert_log rows only after a successful send. Cap at 10 spikes per email, mention how many more.
 */
async function sendAlerts() {
  console.log("Checking for pending sudden pollution spike alerts (>=75%)...");

  const [rows] = await pool.query(
    `
    SELECT 
        sub.subscription_id,
        sub.email,
        sub.created_at AS sub_created_at,
        pe.event_id,
        pe.pollutant_id,
        pe.event_type,
        pe.previous_value,
        pe.current_value,
        pe.change_value,
        pe.change_percentage,
        pe.severity,
        pe.message,
        pe.detected_at,
        s.station_id,
        s.station_name,
        s.city,
        s.state
    FROM pollution_events pe
    JOIN stations s ON s.station_id = pe.station_id
    JOIN alert_subscriptions sub ON sub.station_id = pe.station_id
    LEFT JOIN alert_log al ON al.subscription_id = sub.subscription_id AND al.event_id = pe.event_id
    WHERE al.log_id IS NULL
      AND pe.change_percentage >= 75
      AND pe.detected_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND pe.detected_at > sub.created_at
      ${EXCLUDED_FROM_AQI.length > 0 ? `AND UPPER(pe.pollutant_id) NOT IN (${EXCLUDED_FROM_AQI.map(k => `'${k}'`).join(",")})` : ""}
    ORDER BY pe.detected_at DESC
    `
  );

  if (rows.length === 0) {
    console.log("No pending spike alert notifications found.");
    return { processed: 0, sent: 0 };
  }

  console.log(`Found ${rows.length} pending spike events. Bundling by subscriber email...`);

  // Bundle per subscriber email
  const spikesByEmail = new Map();
  for (const row of rows) {
    const cleanEmail = row.email.toLowerCase().trim();
    if (!spikesByEmail.has(cleanEmail)) {
      spikesByEmail.set(cleanEmail, []);
    }
    spikesByEmail.get(cleanEmail).push(row);
  }

  let sentCount = 0;

  for (const [email, spikes] of spikesByEmail.entries()) {
    try {
      const { html, text, subject } = buildSpikeAlertEmail({
        email,
        spikes
      });

      const mailResult = await mailService.sendMail({
        to: email,
        subject,
        text,
        html
      });

      if (mailResult.sent) {
        sentCount++;

        // Insert alert_log rows only after a successful send
        for (const spike of spikes) {
          try {
            await pool.query(
              `
              INSERT INTO alert_log (subscription_id, event_id, sent_at)
              VALUES (?, ?, NOW())
              ON DUPLICATE KEY UPDATE sent_at = VALUES(sent_at)
              `,
              [spike.subscription_id, spike.event_id]
            );
          } catch (logErr) {
            console.error(
              `Failed to log alert for sub ${spike.subscription_id}, event ${spike.event_id}:`,
              logErr.message
            );
          }
        }
      }
    } catch (err) {
      console.error(`Error sending bundled spike alert to ${email}:`, err.message);
    }
  }

  console.log(`Spike alert dispatch finished: processed ${rows.length} spikes, sent ${sentCount} bundle emails.`);
  return { processed: rows.length, sent: sentCount, emailBundles: spikesByEmail.size };
}

/**
 * Send one test mail to confirm configuration.
 * Sends a real sample daily report for the requested email's first subscribed station,
 * or for station 41 if they have none, using the same new template.
 */
async function sendTestAlert(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error("Invalid email address format.");
  }

  // Find first subscribed station for this email, or fallback to station 41
  const [subs] = await pool.query(
    "SELECT station_id FROM alert_subscriptions WHERE email = ? ORDER BY subscription_id ASC LIMIT 1",
    [cleanEmail]
  );

  let targetStationId = 41;
  if (subs.length > 0 && subs[0].station_id) {
    targetStationId = Number(subs[0].station_id);
  }

  // Fetch station info
  let [stations] = await pool.query(
    "SELECT station_id, station_name, city, state FROM stations WHERE station_id = ?",
    [targetStationId]
  );

  if (stations.length === 0) {
    // If station 41 not found, fallback to first available station in DB
    const [fallbackStations] = await pool.query(
      "SELECT station_id, station_name, city, state FROM stations ORDER BY station_id ASC LIMIT 1"
    );
    if (fallbackStations.length > 0) {
      stations = fallbackStations;
      targetStationId = stations[0].station_id;
    } else {
      throw new Error("No stations available in system to generate sample report.");
    }
  }

  const stationData = await buildStationDailyData(stations[0]);
  const ist = getISTDateTime();

  const { html, text } = buildDailyReportEmail({
    email: cleanEmail,
    stations: [stationData],
    dateStr: ist.dateStr
  });

  const subject = `AirLensAI Sample Daily Report: ${stations[0].city} (${stations[0].station_name})`;

  const res = await mailService.sendMail({
    to: cleanEmail,
    subject,
    text,
    html
  });

  return {
    success: true,
    sent: res.sent,
    configured: res.configured,
    message: res.configured
      ? (res.sent
          ? `Sample daily report sent successfully to ${cleanEmail} for station ${stations[0].city} (${stations[0].station_name}).`
          : "Failed to deliver sample daily report. Check SMTP credentials.")
      : "Email service is not configured on server (SMTP missing in environment)."
  };
}

if (require.main === module) {
  sendAlerts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("sendAlerts failed:", err);
      process.exit(1);
    });
}

module.exports = {
  subscribe,
  unsubscribe,
  sendTestAlert,
  sendAlerts,
  sendDailyReports,
  buildStationDailyData,
  getISTDateTime
};
