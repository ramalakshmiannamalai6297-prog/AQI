require("dotenv").config();
const path = require("path");
const { pathToFileURL } = require("url");

const db = require("../config/db");
const stationService = require("../services/stationService");
const readingService = require("../services/readingService");
const eventService = require("../services/eventService");

// 24-hour diurnal factor curve for realistic air quality fluctuation
// Slightly higher concentrations in morning rush and late evening; lower in afternoon
const DIURNAL_FACTORS = [
    1.05, 1.08, 1.10, 1.12, 1.15, 1.18, // 00:00 - 05:00
    1.22, 1.25, 1.28, 1.25, 1.15, 1.00, // 06:00 - 11:00
    0.90, 0.82, 0.80, 0.84, 0.90, 0.98, // 12:00 - 17:00
    1.10, 1.18, 1.20, 1.15, 1.10, 1.05  // 18:00 - 23:00
];

// Deliberate sudden spikes (>= 30% rise AND >= 10 units)
// Spikes at hour 23 (latest reading) will trigger detectPollutantSpike AND appear in /api/hotspots
// Spikes at earlier hours (12, 16, 18, 20) populate historical events in /api/events
const SPIKE_DEFINITIONS = [
    { stationKey: "delhi-anand-vihar", pollutantId: "PM2.5", hourIndex: 23, dipFactor: 0.65 },
    { stationKey: "lucknow-talkatora", pollutantId: "PM2.5", hourIndex: 23, dipFactor: 0.65 },
    { stationKey: "patna-samastipur", pollutantId: "PM10", hourIndex: 23, dipFactor: 0.65 },
    { stationKey: "jaipur-mansarovar", pollutantId: "PM2.5", hourIndex: 23, dipFactor: 0.65 },
    { stationKey: "surat-varachha", pollutantId: "PM2.5", hourIndex: 23, dipFactor: 0.65 },

    { stationKey: "delhi-anand-vihar", pollutantId: "PM10", hourIndex: 16, dipFactor: 0.65 },
    { stationKey: "ahmedabad-maninagar", pollutantId: "NO2", hourIndex: 18, dipFactor: 0.60 },
    { stationKey: "kolkata-victoria", pollutantId: "PM2.5", hourIndex: 12, dipFactor: 0.65 },
    { stationKey: "guwahati-panbazaar", pollutantId: "OZONE", hourIndex: 20, dipFactor: 0.60 }
];

function formatLastUpdate(date) {
    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

async function loadDummyStations() {
    const dummyDataPath = path.resolve(__dirname, "../../src/data/dummyData.js");
    const module = await import(pathToFileURL(dummyDataPath).href);

    if (!module || !Array.isArray(module.sensorLocations)) {
        throw new Error("Could not find sensorLocations in src/data/dummyData.js");
    }

    return module.sensorLocations;
}

function calculatePollutantReading(pollutantId, avgValue) {
    let avg = Number(avgValue);
    let min;
    let max;

    if (pollutantId === "CO") {
        avg = Math.max(0.1, Number(avg.toFixed(2)));
        min = Math.max(0.05, Number((avg * 0.86).toFixed(2)));
        max = Number((avg * 1.15).toFixed(2));
    } else {
        avg = Math.max(1, Number(avg.toFixed(1)));
        min = Math.max(0.5, Number((avg * 0.86).toFixed(1)));
        max = Number((avg * 1.15).toFixed(1));
    }

    // Strict guarantee: min <= avg <= max
    if (min > avg) min = avg;
    if (max < avg) max = avg;

    return {
        pollutant_id: pollutantId,
        min_value: min,
        avg_value: avg,
        max_value: max
    };
}

async function seedSampleData() {
    console.log("Loading dummy stations from src/data/dummyData.js...");
    const sensors = await loadDummyStations();
    console.log(`Loaded ${sensors.length} stations from dummyData.js.`);

    // Anchor time to the current hour (HH:00:00) so repeated runs within the hour produce matching timestamps
    const endTime = new Date();
    endTime.setMinutes(0, 0, 0, 0);

    // 24 hourly readings ending at current time, oldest first (hoursAgo: 23 down to 0)
    const timestamps = [];
    for (let i = 0; i < 24; i++) {
        const hoursAgo = 23 - i;
        const date = new Date(endTime.getTime() - hoursAgo * 3600 * 1000);
        timestamps.push({
            hourIndex: i, // 0 (oldest, 23 hours ago) to 23 (latest, current hour)
            date,
            lastUpdateStr: formatLastUpdate(date),
            hourOfDay: date.getHours()
        });
    }

    const currentHourOfDay = endTime.getHours();
    const currentDiurnalFactor = DIURNAL_FACTORS[currentHourOfDay];

    let totalStationsProcessed = 0;
    let totalReadingsCreated = 0;
    let totalPollutantsSaved = 0;
    let totalEventsDetected = 0;

    for (const sensor of sensors) {
        // 1. Map to existing fields: country, state, city, station, latitude, longitude
        // Country set to "India (SAMPLE)" as required
        const stationData = {
            country: "India (SAMPLE)",
            state: sensor.state || "Delhi NCR",
            city: sensor.city || "Delhi",
            station: sensor.station || "Central Station",
            latitude: Number(sensor.latitude) || 28.6139,
            longitude: Number(sensor.longitude) || 77.2090
        };

        const stationId = await stationService.getOrCreateStation(stationData);
        totalStationsProcessed++;

        // Base pollutant targets from dummy station so latest reading roughly matches
        const baseTargets = {
            "PM2.5": Number(sensor.pm25) || 50,
            "PM10": Number(sensor.pm10) || 90,
            "NO2": Number(sensor.no2) || 35,
            "SO2": Number(sensor.so2) || 15,
            "CO": Number(sensor.co) || 1.0,
            "OZONE": Number(sensor.o3) || 28
        };

        const pollutantIds = ["PM2.5", "PM10", "NO2", "SO2", "CO", "OZONE"];

        // Safe re-run handling:
        // Check if this station already has readings for these exact 24 timestamps.
        // If it has older/mismatched readings from a previous run at a different hour/day,
        // clean up the older readings/events for this station so we maintain exactly 24 hours.
        const [existingReadings] = await db.query(
            "SELECT reading_id, last_update FROM aqi_readings WHERE station_id = ?",
            [stationId]
        );

        if (existingReadings.length > 0) {
            const existingDatesSet = new Set(
                existingReadings.map((r) => new Date(r.last_update).getTime())
            );
            const allMatch =
                existingReadings.length === timestamps.length &&
                timestamps.every((t) => existingDatesSet.has(t.date.getTime()));

            if (!allMatch) {
                const oldReadingIds = existingReadings.map((r) => r.reading_id);
                await db.query("DELETE FROM pollution_events WHERE station_id = ?", [stationId]);
                await db.query("DELETE FROM pollutant_readings WHERE reading_id IN (?)", [oldReadingIds]);
                await db.query("DELETE FROM aqi_readings WHERE station_id = ?", [stationId]);
            }
        }

        // 24 hourly readings per station, oldest first
        for (const t of timestamps) {
            const readingId = await readingService.createReading(stationId, t.lastUpdateStr);
            if (readingId) totalReadingsCreated++;

            for (const pollutantId of pollutantIds) {
                const baseValue = baseTargets[pollutantId];

                // Determine hourly factor
                // At hour 23 (latest reading): factor is 1.0 so readings match dummy data
                let factor = 1.0;
                if (t.hourIndex < 23) {
                    const rawDiurnal = DIURNAL_FACTORS[t.hourOfDay] / currentDiurnalFactor;
                    factor = Math.max(0.65, Math.min(1.35, rawDiurnal));
                }

                // Check if this station/pollutant has a spike defined
                const spike = SPIKE_DEFINITIONS.find(
                    (s) =>
                        (s.stationKey === sensor.id || s.stationKey === sensor.station) &&
                        s.pollutantId === pollutantId
                );

                if (spike) {
                    if (t.hourIndex === spike.hourIndex - 1) {
                        // Dip the previous hour so step to spikeHour produces a >= 30% & >= 10 unit spike
                        factor = factor * spike.dipFactor;
                    } else if (t.hourIndex === spike.hourIndex) {
                        // At the spike hour: if latest (23), factor remains 1.0 (matching dummy data);
                        // if earlier, factor is raised to create the surge
                        factor = t.hourIndex === 23 ? 1.0 : Math.max(factor * 1.15, 1.1);
                    }
                }

                const hourlyAvg = baseValue * factor;
                const pollutantData = calculatePollutantReading(pollutantId, hourlyAvg);

                const saveResult = await readingService.savePollutant(readingId, pollutantData);

                if (saveResult && saveResult.inserted) {
                    totalPollutantsSaved++;

                    // detectPollutantSpike called after saving each pollutant, in time order
                    const event = await eventService.detectPollutantSpike(
                        stationId,
                        readingId,
                        pollutantData.pollutant_id,
                        pollutantData.avg_value
                    );

                    if (event) {
                        totalEventsDetected++;
                    }
                }
            }
        }
    }

    console.log("\nSample data seeding complete!");
    console.log(`- Stations processed: ${totalStationsProcessed}`);
    console.log(`- AQI readings processed: ${totalReadingsCreated}`);
    console.log(`- Pollutant records saved: ${totalPollutantsSaved}`);
    console.log(`- Pollution spike events detected: ${totalEventsDetected}`);

    return {
        stations: totalStationsProcessed,
        readings: totalReadingsCreated,
        pollutants: totalPollutantsSaved,
        events: totalEventsDetected
    };
}

async function run() {
    try {
        await seedSampleData();
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

if (require.main === module) {
    run();
}

module.exports = { seedSampleData };
