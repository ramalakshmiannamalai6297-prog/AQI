const apiClient = require("../utils/apiClient");

const WAQI_BASE_URL = "https://api.waqi.info";

// India bounding box. It lets the provider discover stations instead of
// hard-coding a small list of cities.
const INDIA_BOUNDS = "37.6,68.1,6.5,97.5";

const POLLUTANT_MAP = {
    pm25: "PM2.5",
    pm10: "PM10",
    no2: "NO2",
    so2: "SO2",
    co: "CO",
    o3: "OZONE"
};

function getToken() {
    const token = process.env.WAQI_API_TOKEN;

    if (!token) {
        throw new Error("WAQI_API_TOKEN is missing from .env.");
    }

    return token;
}

function getMaxStations() {
    const configuredLimit = Number(process.env.WAQI_MAX_STATIONS || 20);
    return Math.min(Math.max(configuredLimit, 1), 50);
}

function stationName(feed, mapStation) {
    const name = feed.city?.name || mapStation.station?.name || "Unknown station";
    // The UID prevents a WAQI station being accidentally merged with a CPCB
    // station that happens to have the same display name.
    return `WAQI ${mapStation.uid} - ${name}`;
}

function toRecords(feed, mapStation) {
    const timestamp = feed.time?.s;
    const pollutants = feed.iaqi || {};

    if (!timestamp) {
        return [];
    }

    const [latitude, longitude] = feed.city?.geo || mapStation.station?.geo || [];
    const commonFields = {
        country: "India",
        state: "Unknown",
        city: feed.city?.name || mapStation.station?.name || "Unknown",
        station: stationName(feed, mapStation),
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        last_update: timestamp
    };

    return Object.entries(POLLUTANT_MAP).flatMap(([waqiName, pollutantId]) => {
        const value = Number(pollutants[waqiName]?.v);

        if (!Number.isFinite(value)) {
            return [];
        }

        // WAQI exposes a latest pollutant AQI sub-index, not CPCB's
        // min/average/max concentration range. Store the one snapshot value
        // in each field so the existing schema and API contract remain stable.
        return [{
            ...commonFields,
            pollutant_id: pollutantId,
            min_value: value,
            avg_value: value,
            max_value: value
        }];
    });
}

async function getWaqiRecords() {
    const token = encodeURIComponent(getToken());
    const mapUrl =
        `${WAQI_BASE_URL}/v2/map/bounds/?latlng=${INDIA_BOUNDS}&token=${token}`;
    const mapResponse = await apiClient.get(mapUrl);

    if (mapResponse.status !== "ok" || !Array.isArray(mapResponse.data)) {
        throw new Error("WAQI station map response was invalid.");
    }

    const stations = mapResponse.data.slice(0, getMaxStations());
    const records = [];

    for (const station of stations) {
        if (!station.uid) {
            continue;
        }

        try {
            const feedUrl =
                `${WAQI_BASE_URL}/feed/@${station.uid}/?token=${token}`;
            const feedResponse = await apiClient.get(feedUrl);

            if (feedResponse.status !== "ok" || !feedResponse.data) {
                continue;
            }

            records.push(...toRecords(feedResponse.data, station));
        } catch (error) {
            // One station failing should not discard the rest of the fallback.
            console.warn(`Skipping WAQI station ${station.uid}:`, error.message);
        }
    }

    if (records.length === 0) {
        throw new Error("WAQI returned no usable pollutant readings.");
    }

    console.log(`Received ${records.length} WAQI fallback records.`);
    return records;
}

module.exports = { getWaqiRecords };
