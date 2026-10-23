const { ingestAqiData } = require("../services/ingestionService");
const { sendDailyReports, sendAlerts } = require("../services/alertService");

let isRunning = false;

exports.execute = async () => {
    if (isRunning) {
        console.log("Previous AQI job still running, skipping");
        return;
    }
    isRunning = true;

    try {
        console.log("Running AQI ingestion job...");

        try {
            await ingestAqiData();
            console.log("AQI Ingestion job completed.");
        } catch (err) {
            console.error("AQI ingestion job failed: ", err.message);
        }

        // 1. Dispatch daily air quality reports (runs at >= 08:00 IST or catches up)
        try {
            await sendDailyReports();
        } catch (reportErr) {
            console.error("Daily report dispatch failed:", reportErr.message);
        }

        // 2. Dispatch sudden pollution spike alerts (>= 75% change)
        try {
            await sendAlerts();
        } catch (alertErr) {
            console.error("Alert dispatch failed:", alertErr.message);
        }
    } finally {
        isRunning = false;
    }
};

