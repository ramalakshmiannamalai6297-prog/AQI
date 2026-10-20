const cron = require("node-cron");
const aqiJob = require("./aqiJob");

// Hourly at minute 5
cron.schedule("5 * * * *", async () => {
    await aqiJob.execute();
});

console.log("AQI scheduler started: runs hourly");