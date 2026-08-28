const db = require("../config/db")

const SPIKE_PERCENT_THRESHOLD = 30
const MINIMUM_CHANGE_THRESHOLD = 10

function getSeverity(changePercentage){
    if(changePercentage >= 100) return "HIGH"
    if(changePercentage >= 50) return "MEDIUM"
    return "LOW"
}

async function detectPollutantSpike(
    stationId,
    readingId,
    pollutantId,
    currentValue
){
    const [previousRows] = await db.query(
        `
        SELECT pr.pollutant_avg AS previous_value
        FROM aqi_readings previous_reading
        JOIN pollutant_readings pr
            ON pr.reading_id = previous_reading.reading_id
        JOIN aqi_readings current_reading
            ON current_reading.reading_id = ?
        WHERE previous_reading.station_id = ?
            AND pr.pollutant_id = ?
            AND previous_reading.last_update < current_reading.last_update
        ORDER BY previous_reading.last_update DESC
        LIMIT 1
        `,
        [readingId, stationId, pollutantId]
    )

    if(previousRows.length === 0) return null

    const previousValue = previousRows[0].previous_value
    const changeValue = currentValue - previousValue

    if(previousValue === 0 || changeValue <= 0) return null

    const changePercentage = (changeValue / previousValue) * 100

    if(
        changePercentage < SPIKE_PERCENT_THRESHOLD ||
        changeValue < MINIMUM_CHANGE_THRESHOLD
    ) return null

    const severity = getSeverity(changePercentage)

    const message = 
        `${pollutantId} increased from ${previousValue} `+ `to ${currentValue} at this station.`

    const [result] = await db.query(
        `
        INSERT INTO pollution_events
        (
            station_id,
            reading_id,
            pollutant_id,
            event_type,
            previous_value,
            current_value,
            change_value,
            change_percentage,
            severity,
            message
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            stationId,
            readingId,
            pollutantId,
            "POLLUTANT_SPIKE",
            previousValue,
            currentValue,
            changeValue,
            changePercentage,
            severity,
            message
        ]
    )
    return {
        eventId: result.insertId,
        pollutantId,
        severity,
        changePercentage
    }
}

module.exports = {
    detectPollutantSpike
}