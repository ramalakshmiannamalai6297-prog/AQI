const pool = require("../config/db");

async function migrate() {
  console.log("Running alert tables migration...");

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
    console.log("Table alert_subscriptions verified/created.");

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
    console.log("Table alert_log verified/created.");

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
