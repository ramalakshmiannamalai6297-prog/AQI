const aqiService = require("../services/aqiService")

exports.getUsers = async (req, res) => {
    try{
        const aqi = await aqiService.getAqi()

        res.status(200).json(aqi)
    }
    catch(err){
        res.status(500).json(
            { message: err.message }
        )
    }
}