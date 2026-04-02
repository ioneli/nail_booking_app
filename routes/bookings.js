const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/bookingsController");

// 🔹 API routes
router.get("/", ctrl.getBookings);
router.post("/init", ctrl.initBooking);
router.post("/confirm", ctrl.confirmBooking);
router.get("/calendar", ctrl.getCalendar);
router.delete("/:id", ctrl.deleteBooking);

module.exports = router;
