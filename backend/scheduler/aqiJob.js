const { ingestAqiData } = require("../services/ingestionService")

exports.execute = async () => {
    console.log("Running AQI ingestion job...")

    try{
        await ingestAqiData()
        console.log("AQI Ingestion job completed.")
    }
    catch(err){
        console.error("AQI ingestion job failed: ", err.message)
    }
}

