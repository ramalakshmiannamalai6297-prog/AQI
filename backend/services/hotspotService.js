const db = require("../config/db")

async function getHotspots(limit=10){
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50)

    const [rows] = await db.query(
        `
        WITH ranked_pollutants AS (
            SELECT
                ar.station_id,
                ar.reading_id,
                ar.last_update,
                pr.pollutant_id,
                pr.pollutant_avg AS current_value,

                LAG(pr.pollutant_avg) OVER (
                    PARTITION BY ar.station_id, pr.pollutant_id
                    ORDER BY ar.last_update
                ) AS previous_value,

                ROW_NUMBER() OVER (
                    PARTITION BY ar.station_id, pr.pollutant_id
                    ORDER BY ar.last_update DESC
                ) AS latest_rank

            FROM aqi_readings ar
            JOIN pollutant_readings pr
                ON pr.reading_id = ar.reading_id
        )
        
        SELECT
            s.station_id,
            s.station_name,
            s.city,
            s.state,
            s.latitude,
            s.longitude,

            rp.pollutant_id,
            rp.previous_value,
            rp.current_value,

            (rp.current_value - rp.previous_value) AS change_value,

            ROUND(
                (
                    (rp.current_value - rp.previous_value)
                    / rp.previous_value
                ) * 100,
                2
            ) AS change_percentage,

            rp.last_update

        FROM ranked_pollutants rp
        JOIN stations s
            ON s.station_id = rp.station_id

        WHERE rp.latest_rank = 1
          AND rp.previous_value IS NOT NULL
          AND rp.previous_value > 0
          AND rp.current_value > rp.previous_value

        ORDER BY change_percentage DESC, change_value DESC
        LIMIT ?        
        `,
        [safeLimit]
    )

    return rows;
}

module.exports = { getHotspots }