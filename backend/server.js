require("dotenv").config()
require("./scheduler/cron")

const db = require("./config/db");
const app = require("./app")
// const connectToDB = require("./src/config/database")

async function testDB() {
    try {
        const connection = await db.getConnection();
        console.log("✅ MySQL Connected");
        connection.release();
    } catch (err) {
        console.error(err);
    }
}

testDB();

app.listen(3000, ()=> {
    console.log("Server is running on port 3000")
})