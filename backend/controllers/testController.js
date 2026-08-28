const aqiService = require("../services/aqiService");
const stationService = require("../services/stationService");

exports.test = async(req,res)=>{

    const data = await aqiService.getAqi();

    for(const record of data){

        await stationService.getOrCreateStation(record);

    }

    res.send("Finished");

}