const db = require("../config/db");
const { calcAQI, getAQICategory, generateRecommendations } = require("../utils/aqi");

// In-memory weather cache (10 minutes TTL)
const weatherCache = new Map();
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;

let getOrCreateStation = async (stationData) => {
    const {
        country,
        state,
        city,
        station,
        latitude,
        longitude
    } = stationData;

    let [rows] = await db.query(
        `
        SELECT *
        FROM stations
        WHERE station_name = ?
        AND city = ?
        AND state = ?;
        `,
        [station, city, state]
    );

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
    );

    return result.insertId;
};

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

async function getStationRecommendations(stationId) {
    const safeStationId = Number(stationId);
    if (!Number.isInteger(safeStationId)) {
        throw new Error("Station ID must be a valid number.");
    }

    const [stations] = await db.query(
        "SELECT station_id, station_name, city, state FROM stations WHERE station_id = ?",
        [safeStationId]
    );

    if (stations.length === 0) {
        throw new Error(`Station with ID ${safeStationId} not found.`);
    }

    const station = stations[0];

    const [rows] = await db.query(
        `
        SELECT
            ar.reading_id,
            ar.last_update,
            pr.pollutant_id,
            pr.pollutant_avg
        FROM aqi_readings ar
        JOIN pollutant_readings pr ON pr.reading_id = ar.reading_id
        WHERE ar.station_id = ?
          AND ar.last_update = (
              SELECT MAX(latest_reading.last_update)
              FROM aqi_readings latest_reading
              WHERE latest_reading.station_id = ?
          )
        `,
        [safeStationId, safeStationId]
    );

    if (rows.length === 0) {
        return {
            stationId: safeStationId,
            city: station.city,
            stationName: station.station_name,
            aqi: null,
            category: "Unavailable",
            dominantPollutant: "Unavailable",
            recommendations: []
        };
    }

    const pollutants = {};
    for (const row of rows) {
        pollutants[row.pollutant_id] = Number(row.pollutant_avg);
    }

    const aqiResult = calcAQI(pollutants);
    if (!aqiResult) {
        return {
            stationId: safeStationId,
            city: station.city,
            stationName: station.station_name,
            aqi: null,
            category: "Unavailable",
            dominantPollutant: "Unavailable",
            recommendations: []
        };
    }

    const categoryInfo = getAQICategory(aqiResult.aqi);
    const recommendations = generateRecommendations(aqiResult.aqi, aqiResult.dominantKey);

    return {
        stationId: safeStationId,
        city: station.city,
        stationName: station.station_name,
        aqi: aqiResult.aqi,
        category: categoryInfo.label,
        dominantPollutant: aqiResult.dominantPollutant,
        recommendations
    };
}

async function getStationForecast(stationId, hours = 6) {
    const safeStationId = Number(stationId);
    const requestedHours = Math.min(Math.max(Number(hours) || 6, 1), 24);

    if (!Number.isInteger(safeStationId)) {
        throw new Error("Station ID must be a valid number.");
    }

    const [stations] = await db.query(
        "SELECT station_id, station_name, city, state FROM stations WHERE station_id = ?",
        [safeStationId]
    );

    if (stations.length === 0) {
        throw new Error(`Station with ID ${safeStationId} not found.`);
    }

    const station = stations[0];
    const history = await getStationHistory(safeStationId, 24);

    // Compute AQI for each reading
    const historyWithAQI = [];
    for (const reading of history) {
        const aqiResult = calcAQI(reading.pollutants);
        if (aqiResult && Number.isFinite(aqiResult.aqi)) {
            historyWithAQI.push({
                readingId: reading.readingId,
                lastUpdate: reading.lastUpdate,
                aqi: aqiResult.aqi
            });
        }
    }

    if (historyWithAQI.length < 6) {
        throw new Error(
            `Insufficient historical readings for forecast (minimum 6 required, found ${historyWithAQI.length}).`
        );
    }

    // Fit simple linear regression: least squares (x = 0..n-1, y = aqi)
    const n = historyWithAQI.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
        const x = i;
        const y = historyWithAQI[i].aqi;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    }

    const denominator = n * sumX2 - sumX * sumX;
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;

    // Trend definition: "stable" if slope is within +-1 AQI per hour
    let trend = "stable";
    if (slope > 1) {
        trend = "rising";
    } else if (slope < -1) {
        trend = "falling";
    }

    const lastReading = historyWithAQI[n - 1];
    const lastDate = new Date(lastReading.lastUpdate);
    const validLastDate = !isNaN(lastDate.getTime()) ? lastDate : new Date();

    const forecast = [];
    for (let h = 1; h <= requestedHours; h++) {
        const targetX = (n - 1) + h;
        const projectedAQI = slope * targetX + intercept;
        const clampedAQI = Math.min(500, Math.max(0, Math.round(projectedAQI)));
        const cat = getAQICategory(clampedAQI);
        const forecastTime = new Date(validLastDate.getTime() + h * 60 * 60 * 1000).toISOString();

        forecast.push({
            hoursAhead: h,
            time: forecastTime,
            aqi: clampedAQI,
            category: cat.label
        });
    }

    return {
        stationId: safeStationId,
        city: station.city,
        stationName: station.station_name,
        method: "linear-trend",
        basedOnReadings: n,
        trend,
        forecast
    };
}

async function getStationWeather(stationId) {
    const safeStationId = Number(stationId);
    if (!Number.isInteger(safeStationId)) {
        return { available: false };
    }

    const cached = weatherCache.get(safeStationId);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    try {
        const [rows] = await db.query(
            "SELECT latitude, longitude FROM stations WHERE station_id = ?",
            [safeStationId]
        );

        if (rows.length === 0 || rows[0].latitude === null || rows[0].longitude === null) {
            return { available: false };
        }

        const lat = Number(rows[0].latitude);
        const lon = Number(rows[0].longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return { available: false };
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m`;

        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            return { available: false };
        }

        const data = await response.json();

        if (!data.current || typeof data.current.temperature_2m !== "number") {
            return { available: false };
        }

        const weatherResult = {
            available: true,
            temperature: Number(data.current.temperature_2m),
            humidity: Number(data.current.relative_humidity_2m),
            temperatureUnit: data.current_units?.temperature_2m || "°C",
            humidityUnit: data.current_units?.relative_humidity_2m || "%",
            time: data.current.time
        };

        weatherCache.set(safeStationId, {
            data: weatherResult,
            expiresAt: Date.now() + WEATHER_CACHE_TTL_MS
        });

        return weatherResult;
    } catch (err) {
        console.warn(`Weather fetch failed for station ${safeStationId}:`, err.message);
        return { available: false };
    }
}

async function getStationHealth(stationId) {
    const safeStationId = Number(stationId);
    if (!Number.isInteger(safeStationId)) {
        throw new Error("Station ID must be a valid number.");
    }

    const [rows] = await db.query(
        `
        SELECT MAX(last_update) AS last_update
        FROM aqi_readings
        WHERE station_id = ?
        `,
        [safeStationId]
    );

    if (rows.length === 0 || !rows[0].last_update) {
        return {
            status: "Offline",
            lastUpdate: null,
            minutesSinceUpdate: null
        };
    }

    const lastUpdateDate = new Date(rows[0].last_update);
    if (isNaN(lastUpdateDate.getTime())) {
        return {
            status: "Offline",
            lastUpdate: rows[0].last_update,
            minutesSinceUpdate: null
        };
    }

    const diffMs = Date.now() - lastUpdateDate.getTime();
    const minutesSinceUpdate = Math.max(0, Math.round(diffMs / (1000 * 60)));

    let status = "Offline";
    if (minutesSinceUpdate < 180) {
        status = "Online";
    } else if (minutesSinceUpdate < 1440) {
        status = "Delayed";
    }

    return {
        status,
        lastUpdate: rows[0].last_update,
        minutesSinceUpdate
    };
}

module.exports = {
    getOrCreateStation,
    getLatestStations,
    getStationHistory,
    getStationRecommendations,
    getStationForecast,
    getStationWeather,
    getStationHealth
};