const express = require("express")
const testRouter = express.Router()

const test = require("../controllers/testController")

testRouter.get("/test", test.test);

module.exports = testRouter