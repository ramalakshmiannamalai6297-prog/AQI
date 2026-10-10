const db = require("../config/db")

let getOrCreateStation = async (stationData) => {
    const {
        country,
        state,
        city,
        station,
        latitude,
        longitude
    } = stationData

    let [rows] = await db.query(
        `
        SELECT *
        FROM stations
        WHERE station_name = ?
        AND city = ?
        AND state = ?;
        `,
        [station, city, state]
    )

    if(rows.length > 0){
        return rows[0].station_id;
    }

    let [result] = await db.query(
        `
        INSERT INTO stations
        (
            country,
            state,
            city,
            station_name,
            latitude,
            longitude
        )
        VALUES (?,?,?,?,?,?)
        `,
        [
            country,
            state,
            city,
            station,
            latitude,
            longitude
        ]
    )

    return result.insertId;
}

async function getLatestStations() {
    const [rows] = await db.query(
        `
        SELECT
            s.station_id,
            s.station_name,
            s.city,
            s.state,
            s.latitude,
            s.longitude,

            ar.reading_id,
            ar.last_update,

            pr.pollutant_id,
            pr.pollutant_avg

        FROM stations s
        JOIN aqi_readings ar
            ON ar.station_id = s.station_id
        JOIN pollutant_readings pr
            ON pr.reading_id = ar.reading_id

        WHERE ar.last_update = (
            SELECT MAX(latest_reading.last_update)
            FROM aqi_readings latest_reading
            WHERE latest_reading.station_id = s.station_id
        )

        ORDER BY s.city, s.station_name, pr.pollutant_id
        `
    );

    const stationsById = new Map();

    for (const row of rows) {
        if (!stationsById.has(row.station_id)) {
            stationsById.set(row.station_id, {
                stationId: row.station_id,
                stationName: row.station_name,
                city: row.city,
                state: row.state,
                latitude: Number(row.latitude),
                longitude: Number(row.longitude),
                readingId: row.reading_id,
                lastUpdate: row.last_update,
                pollutants: {}
            });
        }

        const station = stationsById.get(row.station_id);

        station.pollutants[row.pollutant_id] =
            Number(row.pollutant_avg);
    }

    return Array.from(stationsById.values());
}
async function getStationHistory(stationId, limit = 24) {
    const safeStationId = Number(stationId);
    const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 168);

    if (!Number.isInteger(safeStationId)) {
        throw new Error("Station ID must be a valid number.");
    }

    const [rows] = await db.query(
        `
        SELECT
            ar.reading_id,
            ar.last_update,

            pr.pollutant_id,
            pr.pollutant_min,
            pr.pollutant_avg,
            pr.pollutant_max

        FROM aqi_readings ar
        JOIN pollutant_readings pr
            ON pr.reading_id = ar.reading_id

        WHERE ar.reading_id IN (
            SELECT reading_id
            FROM (
                SELECT reading_id
                FROM aqi_readings
                WHERE station_id = ?
                ORDER BY last_update DESC
                LIMIT ?
            ) AS latest_readings
        )

        ORDER BY ar.last_update ASC, pr.pollutant_id ASC
        `,
        [safeStationId, safeLimit]
    );

    const historyByReading = new Map();

    for (const row of rows) {
        if (!historyByReading.has(row.reading_id)) {
            historyByReading.set(row.reading_id, {
                readingId: row.reading_id,
                lastUpdate: row.last_update,
                pollutants: {}
            });
        }

        historyByReading.get(row.reading_id).pollutants[row.pollutant_id] = {
            min: Number(row.pollutant_min),
            avg: Number(row.pollutant_avg),
            max: Number(row.pollutant_max)
        };
    }

    return Array.from(historyByReading.values());
}

module.exports = {
    getOrCreateStation,
    getLatestStations,
    getStationHistory
}