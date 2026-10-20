const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { sendDailyReports } = require("../services/alertService");

async function run() {
  console.log("Running manual/force daily report dispatch...");
  try {
    const result = await sendDailyReports(true);
    console.log("Daily report dispatch result:", result);
    process.exit(0);
  } catch (err) {
    console.error("Daily report dispatch failed:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
