const { ingestAqiData } = require("../services/ingestionService");
const { sendAlerts } = require("../services/alertService");

exports.execute = async () => {
    console.log("Running AQI ingestion job...");

    try {
        await ingestAqiData();
        console.log("AQI Ingestion job completed.");

        // Dispatch email alerts for any detected pollution events
        try {
            await sendAlerts();
        } catch (alertErr) {
            console.error("Alert dispatch failed:", alertErr.message);
        }
    } catch (err) {
        console.error("AQI ingestion job failed: ", err.message);
    }
};
