const { getAqi } = require("./aqiService");
const { getOrCreateStation } = require("./stationService");
const { createReading, savePollutant } = require("./readingService");
const { detectPollutantSpike } = require("./eventService");

async function ingestAqiData() {
    const aqiData = await getAqi();

    if (!Array.isArray(aqiData)) {
        throw new Error("AQI API did not return an array of records.");
    }

    console.log(`Received ${aqiData.length} AQI records.`);

    const groupedData = {};

    for (const record of aqiData) {
        const key =
            `${record.station}_${record.city}_${record.state}_${record.last_update}`;

        if (!groupedData[key]) {
            groupedData[key] = {
                stationData: record,
                pollutants: []
            };
        }

        groupedData[key].pollutants.push(record);
    }

    for (const key in groupedData) {
        const group = groupedData[key];
        const stationData = group.stationData;

        const stationId = await getOrCreateStation(stationData);

        const readingId = await createReading(
            stationId,
            stationData.last_update
        );

        for (const pollutant of group.pollutants) {
            const result = await savePollutant(readingId, pollutant)

            if(result.inserted) {
                const event = await detectPollutantSpike(
                    stationId,
                    readingId,
                    result.pollutantId,
                    result.pollutantAvg
                )

                if(event) console.log("Pollution event detected: ", event)
            }
        }
    }

    console.log("AQI data stored successfully.");
}

module.exports = {
    ingestAqiData
};