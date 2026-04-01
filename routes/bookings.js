const express = require("express");
const router = express.Router();

const {
  createBooking,
  getBookings,
} = require("../controllers/bookingsController");

// GET ocupare pe zi

router.get("/calendar", async (req, res) => {
  const Booking = require("../models/Booking");

  const slotsPerDay = 6; // sloturi pe zi
  const bookings = await Booking.find();

  const calendar = {};

  bookings.forEach(b => {
    if (!calendar[b.date]) calendar[b.date] = [];
    calendar[b.date].push(b.time); // salvăm ora ocupată
  });

  const calendarStatus = {};

  // calculăm culoarea zilei după câte sloturi sunt ocupate
  for (const date of Object.keys(calendar)) {
    const bookedCount = calendar[date].length;
    const percent = (bookedCount / slotsPerDay) * 100;

    let color = "green";
    if (percent >= 70) color = "red";
    else if (percent >= 30) color = "yellow";

    calendarStatus[date] = { booked: bookedCount, color, occupiedHours: calendar[date] };
  }

  res.json(calendarStatus);
});

// GET all bookings
router.get("/", getBookings);

// POST create booking
router.post("/", createBooking);
//endpoint pentru stergere
router.delete("/:id", async (req, res) => {
  const Booking = require("../models/Booking");

  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Programare ștearsă" });
  } catch (error) {
    res.status(500).json({ message: "Eroare la ștergere" });
  }
});

module.exports = router;
