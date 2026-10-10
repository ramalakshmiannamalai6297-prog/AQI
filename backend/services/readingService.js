const db = require("../config/db")

function formatMysqlDate(lastUpdate){
    const [date, time] = lastUpdate.split(" ")
    const [day, month, year] = date.split("-")

    return `${year}-${month}-${day} ${time}`
}

let createReading = async (stationId, lastUpdate) => {
    const mysqlDate = formatMysqlDate(lastUpdate)
    
    const [existingRows] = await db.query(
        `
        SELECT reading_id
        FROM aqi_readings
        WHERE station_id = ? AND last_update = ?
        `,
        [stationId, mysqlDate]
    )

    if (existingRows.length > 0){
        return existingRows[0].reading_id;
    }  

    const [result] = await db.query(
        `
        INSERT into aqi_readings (station_id, last_update)
        VALUES (?, ?)
        `,
        [stationId, mysqlDate]
    )

    return result.insertId
}

let savePollutant = async (readingId, pollutantData) => {

    const {
        pollutant_id,
        min_value,
        avg_value,
        max_value
    } = pollutantData;

    //Skipping invalid data
    const  pollutantMin = Number(min_value)
    const pollutantAvg = Number(avg_value)
    const pollutantMax = Number(max_value)

    if (!Number.isFinite(pollutantMin) || !Number.isFinite(pollutantAvg) ||     !Number.isFinite(pollutantMax)) {
        console.warn("Skipping invalid pollutant data: ", pollutantData);
        return { inserted: false };
    }

    const [existingRows] = await db.query(
        `
        SELECT reading_id
        FROM pollutant_readings
        WHERE reading_id = ? AND pollutant_id = ?
        `,
        [readingId, pollutant_id]
    )

    if (existingRows.length > 0) return { inserted: false };
    
    await db.query(
        `
        INSERT INTO pollutant_readings
        (
            reading_id,
            pollutant_id,
            pollutant_min,
            pollutant_avg,
            pollutant_max
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            readingId,
            pollutant_id,
            pollutantMin,
            pollutantAvg,
            pollutantMax
        ]
    );

    return {
        inserted: true,
        pollutantId: pollutant_id,
        pollutantAvg
    };
}
module.exports = { createReading, savePollutant }