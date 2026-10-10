require("dotenv").config()

const db = require("../config/db")
const { ingestAqiData } = require("../services/ingestionService")

async function run() {
    try{
        await ingestAqiData()
    }
    catch(error){
        console.error("Ingestion failed: ", error.message)
    }
    finally{
        await db.end()
    }
}

run()