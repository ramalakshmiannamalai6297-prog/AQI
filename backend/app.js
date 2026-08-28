const express = require("express")
//const authRouter = require("./routes/auth.routes")
//const cookieParser = require("cookie-parser")

const app = express()
//let cors = require("cors")
let testRoutes = require("./routes/testRoutes")

//app.use(cors())


app.use("/", testRoutes)
app.use(express.json())
//app.use("/api/auth", authRouter)
//app.use(cookieParser())
module.exports = app