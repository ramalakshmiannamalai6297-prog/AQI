const pool = require("../config/db");
const mailService = require("./mailService");

const VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH"];

/**
 * Validate email string format
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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
    message: result.affectedRows > 0
      ? `Successfully unsubscribed ${cleanEmail} from station ${safeStationId}.`
      : `No active subscription found for ${cleanEmail} at station ${safeStationId}.`,
    affectedRows: result.affectedRows
  };
}

/**
 * Send one test mail to confirm configuration
 */
async function sendTestAlert(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error("Invalid email address format.");
  }

  const subject = "AQI System: Test Alert Verification";
  const body = `Hello,\n\nThis is a test notification from the India Air Quality & Anomaly Detection network.\nYour email subscription is active and working.\n\nTimestamp: ${new Date().toISOString()}`;

  const res = await mailService.sendMail({
    to: cleanEmail,
    subject,
    text: body
  });

  return {
    success: true,
    sent: res.sent,
    configured: res.configured,
    message: res.configured
      ? (res.sent ? "Test email sent successfully." : "Failed to deliver test email. Check SMTP credentials.")
      : "Email service is not configured on server (SMTP missing in environment)."
  };
}

/**
 * Main alerting job: finds unnotified events, delivers emails, logs sent records
 */
async function sendAlerts() {
  console.log("Checking for pending pollution event alerts...");

  const [rows] = await pool.query(
    `
    SELECT 
        sub.subscription_id,
        sub.email,
        sub.min_severity,
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
      AND (
          (sub.min_severity = 'LOW')
          OR (sub.min_severity = 'MEDIUM' AND pe.severity IN ('MEDIUM', 'HIGH', 'CRITICAL', 'SEVERE'))
          OR (sub.min_severity = 'HIGH' AND pe.severity IN ('HIGH', 'CRITICAL', 'SEVERE'))
      )
    ORDER BY pe.detected_at ASC
    `
  );

  if (rows.length === 0) {
    console.log("No pending alert notifications found.");
    return { processed: 0, sent: 0 };
  }

  console.log(`Found ${rows.length} pending alert notifications.`);
  let sentCount = 0;

  for (const item of rows) {
    const subject = `[AQI Alert - ${item.severity}] ${item.pollutant_id} Spike in ${item.city} (${item.station_name})`;
    const textBody = `
AQI Pollutant Spike Alert

Station: ${item.station_name}, ${item.city}, ${item.state}
Pollutant: ${item.pollutant_id}
Severity: ${item.severity}
Change: ${Number(item.previous_value).toFixed(1)} -> ${Number(item.current_value).toFixed(1)} (+${Number(item.change_percentage).toFixed(1)}%)
Event Time: ${item.detected_at}

Advisory Message:
${item.message}

Please take appropriate respiratory precautions.
    `.trim();

    // Send email
    const mailResult = await mailService.sendMail({
      to: item.email,
      subject,
      text: textBody
    });

    if (mailResult.sent) {
      sentCount++;
    }

    // Insert into alert_log so duplicate sending is impossible
    try {
      await pool.query(
        `INSERT INTO alert_log (subscription_id, event_id, sent_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE sent_at = VALUES(sent_at)`,
        [item.subscription_id, item.event_id]
      );
    } catch (logErr) {
      console.error(`Failed to log alert for sub ${item.subscription_id}, event ${item.event_id}:`, logErr.message);
    }
  }

  console.log(`Alert dispatch finished: processed ${rows.length}, sent ${sentCount}.`);
  return { processed: rows.length, sent: sentCount };
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
  sendAlerts
};
