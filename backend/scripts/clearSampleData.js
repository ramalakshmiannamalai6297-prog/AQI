require("dotenv").config();
const db = require("../config/db");

async function clearSampleData() {
    console.log("Searching for sample stations with country 'India (SAMPLE)'...");

    const [stations] = await db.query(
        "SELECT station_id, station_name, city FROM stations WHERE country = ?",
        ["India (SAMPLE)"]
    );

    if (stations.length === 0) {
        console.log("No sample stations found. Database already clean.");
        return {
            stationsDeleted: 0,
            readingsDeleted: 0,
            pollutantsDeleted: 0,
            eventsDeleted: 0
        };
    }

    const stationIds = stations.map((s) => s.station_id);
    console.log(`Found ${stationIds.length} sample station(s): ID(s) [${stationIds.join(", ")}].`);

    // Find reading IDs for foreign key cleanup in pollutant_readings
    const [readings] = await db.query(
        "SELECT reading_id FROM aqi_readings WHERE station_id IN (?)",
        [stationIds]
    );
    const readingIds = readings.map((r) => r.reading_id);

    // Delete in reverse dependency order to respect foreign key constraints:
    // 1. pollution_events (references stations and aqi_readings)
    const [eventsResult] = await db.query(
        "DELETE FROM pollution_events WHERE station_id IN (?)",
        [stationIds]
    );

    // 2. pollutant_readings (references aqi_readings)
    let pollutantsDeleted = 0;
    if (readingIds.length > 0) {
        const [pollutantsResult] = await db.query(
            "DELETE FROM pollutant_readings WHERE reading_id IN (?)",
            [readingIds]
        );
        pollutantsDeleted = pollutantsResult.affectedRows;
    }

    // 3. aqi_readings (references stations)
    const [readingsResult] = await db.query(
        "DELETE FROM aqi_readings WHERE station_id IN (?)",
        [stationIds]
    );

    // 4. stations (referenced by aqi_readings & pollution_events)
    const [stationsResult] = await db.query(
        "DELETE FROM stations WHERE station_id IN (?)",
        [stationIds]
    );

    const summary = {
        stationsDeleted: stationsResult.affectedRows,
        readingsDeleted: readingsResult.affectedRows,
        pollutantsDeleted,
        eventsDeleted: eventsResult.affectedRows
    };

    console.log("Sample data cleanup complete:");
    console.log(`- Pollution events deleted: ${summary.eventsDeleted}`);
    console.log(`- Pollutant readings deleted: ${summary.pollutantsDeleted}`);
    console.log(`- AQI readings deleted: ${summary.readingsDeleted}`);
    console.log(`- Stations deleted: ${summary.stationsDeleted}`);

    return summary;
}

async function run() {
    try {
        await clearSampleData();
    } catch (error) {
        console.error("Failed to clear sample data:", error);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

if (require.main === module) {
    run();
}

module.exports = { clearSampleData };
