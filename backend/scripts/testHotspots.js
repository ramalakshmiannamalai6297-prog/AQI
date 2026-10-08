require("dotenv").config();

const db = require("../config/db");
const { getHotspots } = require("../services/hotspotService");

async function run() {
    try {
        const hotspots = await getHotspots();

        if (hotspots.length === 0) {
            console.log("No hotspot changes found yet.");
            return;
        }

        console.table(hotspots);
    } catch (error) {
        console.error("Hotspot test failed:", error);
    } finally {
        await db.end();
    }
}

run();