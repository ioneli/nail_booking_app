const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Serve ftontend
app.use(express.static(path.join(__dirname, "public")));

//app.get("/", (req, res) => {
 // res.send("API is running...");
//});

const bookingRoutes = require("./routes/bookings");
app.use("/api/bookings", bookingRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
