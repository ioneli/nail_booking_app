// 🔹 Importuri
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// 🔹 Middleware
app.use(express.json());

// 🔹 Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Conectare MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

// 🔹 Routes
const bookingRoutes = require("./routes/bookings");
app.use("/api/bookings", bookingRoutes);

// 🔹 Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 🔹 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
