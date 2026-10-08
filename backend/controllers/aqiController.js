const aqiService = require("../services/aqiService")
const { getHotspots } = require("../services/hotspotService");
const { getRecentEvents } = require("../services/eventService");
const { getLatestStations } = require("../services/stationService");
const { getStationHistory } = require("../services/stationService")
exports.getStationHistory = async (req, res) => {
    try {
        const { stationId } = req.params;
        const limit = req.query.limit || 24;

        const history = await getStationHistory(stationId, limit);

        res.status(200).json({
            stationId: Number(stationId),
            count: history.length,
            history
        });
    } catch (error) {
        console.error("Could not fetch station history:", error);

        res.status(500).json({
            message: "Could not fetch station history.",
            error: error.message || error.code || "Unknown database error"
        });
    }
};
exports.getStations = async (req, res) => {
    try {
        const stations = await getLatestStations();

        res.status(200).json({
            count: stations.length,
            stations
        });
    } catch (error) {
        console.error("Could not fetch stations:", error);

        res.status(500).json({
            message: "Could not fetch stations.",
            error: error.message || error.code || "Unknown database error"
        });
    }
};
exports.getEvents = async (req, res) => {
    try {
        const limit = req.query.limit || 10;

        const events = await getRecentEvents(limit);

        res.status(200).json({
            count: events.length,
            events
        });
    } catch (error) {
        console.error("Could not fetch events:", error);

        res.status(500).json({
            message: "Could not fetch events.",
            error: error.message || error.code || "Unknown database error"
        });
    }
};
exports.getHotspots = async (req, res) => {
    try {
        const limit = req.query.limit || 10;

        const hotspots = await getHotspots(limit);

        res.status(200).json({
            count: hotspots.length,
            hotspots
        });
    } catch (error) {
        console.error("Could not fetch hotspots:", error);

        res.status(500).json({
            message: "Could not fetch hotspots.",
            error: error.message || error.code || "Unknown database error"
        });
    }
};
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