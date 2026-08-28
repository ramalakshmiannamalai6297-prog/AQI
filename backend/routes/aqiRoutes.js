const express = require("express")
const router = express.Router()

const aqiController = require("../controllers/aqiController")

router.get("/", aqiController.getAqi)

module.exports = router