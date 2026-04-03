const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Twilio = require("twilio");

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const otpStore = {}; // { phone: otp }

// 📅 Calendar
router.get("/calendar", async (req, res) => {
  try {
    const bookings = await Booking.find({});
    const calendar = {};

    bookings.forEach(b => {
      if (!calendar[b.date]) {
        calendar[b.date] = { booked: 0, occupiedHours: [] };
      }
      calendar[b.date].booked++;
      calendar[b.date].occupiedHours.push(b.time);
    });

    res.json(calendar);
  } catch (err) {
    res.status(500).json({ message: "Calendar error" });
  }
});

// 📲 INIT OTP
router.post("/init", async (req, res) => {
  const { phone, name, date, time } = req.body;

  if (!phone || !name || !date || !time) {
    return res.status(400).json({ message: "Date incomplete" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[phone] = otp;

  try {
    await client.messages.create({
      body: `Codul tău OTP: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    res.json({ message: "OTP trimis" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "SMS error" });
  }
});

// ✅ CONFIRM
router.post("/confirm", async (req, res) => {
  const { phone, otp, date, time, name, service } = req.body;

  if (otpStore[phone] != otp) {
    return res.status(400).json({ message: "OTP invalid" });
  }

  try {
    await Booking.create({ date, time, name, phone, service });
    delete otpStore[phone];

    res.json({ message: "Programare confirmată!" });
  } catch (err) {
    res.status(500).json({ message: "Save error" });
  }
});

// 👑 ADMIN: GET ALL SORTED
router.get("/", async (req, res) => {
  const bookings = await Booking.find({}).sort({ date: 1, time: 1 });
  res.json(bookings);
});

// 👑 ADMIN: ADD
router.post("/", async (req, res) => {
  const booking = await Booking.create(req.body);
  res.json(booking);
});

// 👑 ADMIN: DELETE
router.delete("/:id", async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
