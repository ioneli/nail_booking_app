
const Booking = require("../models/Booking");
const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");

// Calendar
router.get("/calendar", bookingsController.getCalendar);

// OTP workflow
router.post("/init", bookingsController.initBooking);
router.post("/confirm", bookingsController.confirmBooking);

// Admin
router.get("/by-date/:date", async (req, res) => {
  try {
    const bookings = await Booking.find({ date: req.params.date });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la preluarea programărilor" });
  }
});
router.get("/", bookingsController.getBookings);
router.post("/", bookingsController.addBooking);
router.delete("/:id", bookingsController.deleteBooking);
//user
router.post("/my/init", bookingsController.initMyBookings);
router.post("/my/verify", bookingsController.verifyMyBookings);
router.delete("/my/:id", bookingsController.deleteMyBooking);
router.put("/my/:id", bookingsController.updateMyBooking);
module.exports = router;
