const aqiService = require("../services/aqiService");
const { getHotspots } = require("../services/hotspotService");
const { getRecentEvents } = require("../services/eventService");
const { 
    getLatestStations, 
    getStationHistory,
    getStationRecommendations,
    getStationForecast,
    getStationWeather,
    getStationHealth
} = require("../services/stationService");
const alertService = require("../services/alertService");

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
    try {
        const aqi = await aqiService.getAqi();
        res.status(200).json(aqi);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- New Endpoints ---

exports.getStationRecommendations = async (req, res) => {
    try {
        const { stationId } = req.params;
        const data = await getStationRecommendations(stationId);
        res.status(200).json(data);
    } catch (error) {
        console.error("Could not fetch recommendations:", error);
        res.status(error.message.includes("not found") ? 404 : 500).json({
            message: error.message || "Could not fetch recommendations."
        });
    }
};

exports.getStationForecast = async (req, res) => {
    try {
        const { stationId } = req.params;
        const hours = req.query.hours || 6;
        const data = await getStationForecast(stationId, hours);
        res.status(200).json(data);
    } catch (error) {
        console.error("Could not fetch forecast:", error);
        const isInsufficient = error.message.includes("Insufficient");
        const isNotFound = error.message.includes("not found");
        res.status(isInsufficient ? 400 : (isNotFound ? 404 : 500)).json({
            message: error.message || "Could not fetch forecast."
        });
    }
};

exports.getStationWeather = async (req, res) => {
    try {
        const { stationId } = req.params;
        const weather = await getStationWeather(stationId);
        res.status(200).json(weather);
    } catch (error) {
        console.error("Could not fetch weather:", error);
        res.status(200).json({ available: false });
    }
};

exports.getStationHealth = async (req, res) => {
    try {
        const { stationId } = req.params;
        const health = await getStationHealth(stationId);
        res.status(200).json(health);
    } catch (error) {
        console.error("Could not fetch health:", error);
        res.status(500).json({
            message: error.message || "Could not fetch station health."
        });
    }
};

exports.subscribeAlerts = async (req, res) => {
    try {
        const { email, stationId, minSeverity } = req.body;
        const result = await alertService.subscribe(email, stationId, minSeverity);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error subscribing to alerts:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to subscribe to alerts."
        });
    }
};

exports.unsubscribeAlerts = async (req, res) => {
    try {
        const { email, stationId } = req.body;
        const result = await alertService.unsubscribe(email, stationId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error unsubscribing from alerts:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to unsubscribe from alerts."
        });
    }
};

exports.testAlerts = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await alertService.sendTestAlert(email);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error sending test alert:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to send test alert."
        });
    }
};