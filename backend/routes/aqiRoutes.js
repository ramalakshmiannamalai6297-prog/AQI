const express = require("express");
const router = express.Router();

const aqiController = require("../controllers/aqiController");

// Existing endpoints (do not change)
router.get("/events", aqiController.getEvents);
router.get("/hotspots", aqiController.getHotspots);
router.get("/stations", aqiController.getStations);
router.get("/stations/:stationId/history", aqiController.getStationHistory);

// New endpoints
router.get("/stations/:stationId/recommendations", aqiController.getStationRecommendations);
router.get("/stations/:stationId/forecast", aqiController.getStationForecast);
router.get("/stations/:stationId/weather", aqiController.getStationWeather);
router.get("/stations/:stationId/health", aqiController.getStationHealth);

// Alerts endpoints
router.post("/alerts/subscribe", aqiController.subscribeAlerts);
router.post("/alerts/unsubscribe", aqiController.unsubscribeAlerts);
router.post("/alerts/test", aqiController.testAlerts);

module.exports = router;