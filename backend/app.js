const express = require("express");
const cors = require("cors");

const aqiRoutes = require("./routes/aqiRoutes");
const testRoutes = require("./routes/testRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "AQI Event Detection Backend"
    });
});

app.use("/api", aqiRoutes);

/*
 Temporary route used during early database testing.
 Keep it for now, but React will use /api/... routes.
*/
app.use("/", testRoutes);

module.exports = app;