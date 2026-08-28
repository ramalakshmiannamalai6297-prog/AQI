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

module.exports = {
    getOrCreateStation
}