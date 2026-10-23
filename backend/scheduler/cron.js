const cron = require("node-cron");
const aqiJob = require("./aqiJob");

// Every 15 minutes
cron.schedule("*/15 * * * *", async () => {
    await aqiJob.execute();
});

console.log("AQI scheduler started: runs every 15 minutes");