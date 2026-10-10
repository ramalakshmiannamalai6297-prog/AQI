const express = require("express")
const router = express.Router()

const aqiController = require("../controllers/aqiController")

router.get("/events", aqiController.getEvents);
router.get("/hotspots", aqiController.getHotspots);
router.get("/stations", aqiController.getStations);
router.get("/stations/:stationId/history", aqiController.getStationHistory)
module.exports = router