const Booking = require("../models/Booking");
const Twilio = require("twilio");

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Temporary OTP store
const otpStore = {};

// -----------------------------
// 📅 GET CALENDAR
exports.getCalendar = async (req, res) => {
  try {
    const bookings = await Booking.find();

    const calendar = {};

    bookings.forEach(b => {
      if (!calendar[b.date]) {
        calendar[b.date] = {
          booked: 0,
          occupiedHours: []
        };
      }

      calendar[b.date].booked += 1;
      calendar[b.date].occupiedHours.push(b.time);
    });

    res.json(calendar);
  } catch (err) {
    console.error("Calendar error:", err);
    res.status(500).json({ message: "Eroare calendar" });
  }
};

// -----------------------------
// 📩 INIT BOOKING (SEND OTP)
exports.initBooking = async (req, res) => {
  let { phone, name, date, time, service } = req.body;

  console.log("INIT BOOKING:", req.body);

  if (!phone || !name || !date || !time) {
    return res.status(400).json({ message: "Date incomplete" });
  }

  // 🔥 FIX PHONE FORMAT (Romania)
  if (!phone.startsWith("+")) {
    phone = "+40" + phone.replace(/^0/, "");
  }

  console.log("PHONE FINAL:", phone);

  // ❌ prevent double booking same slot
  const exists = await Booking.findOne({ date, time });
  if (exists) {
    return res.status(400).json({ message: "Slot deja ocupat!" });
  }

  // generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[phone] = { otp, data: { date, time, name, phone, service } };

  try {
    const msg = await client.messages.create({
      body: `Codul tău OTP: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log("TWILIO SUCCESS:", msg.sid);

    res.json({ message: "Cod OTP trimis!" });

  } catch (err) {
    console.error("TWILIO ERROR:", err.message);
    res.status(500).json({ message: "Eroare la trimiterea SMS" });
  }
};

// -----------------------------
// ✅ CONFIRM BOOKING
exports.confirmBooking = async (req, res) => {
  let { phone, otp } = req.body;

  // normalize phone again
  if (!phone.startsWith("+")) {
    phone = "+40" + phone.replace(/^0/, "");
  }

  const stored = otpStore[phone];

  if (!stored || stored.otp != otp) {
    return res.status(400).json({ message: "OTP incorect" });
  }

  try {
    const { date, time, name, service } = stored.data;

    // ❌ prevent duplicate again (safety)
    const exists = await Booking.findOne({ date, time });
    if (exists) {
      return res.status(400).json({ message: "Slot deja ocupat!" });
    }

    await Booking.create({
      date,
      time,
      name,
      phone,
      service
    });

    delete otpStore[phone];

    res.json({ message: "Programare confirmată!" });

  } catch (err) {
    console.error("CONFIRM ERROR:", err);
    res.status(500).json({ message: "Eroare salvare booking" });
  }
};

// -----------------------------
// 📋 GET ALL BOOKINGS (ADMIN)
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: 1, time: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Eroare fetch bookings" });
  }
};

// -----------------------------
// ➕ ADD BOOKING (ADMIN - NO OTP)
exports.addBooking = async (req, res) => {
  try {
    const { date, time, name, phone, service } = req.body;

    const exists = await Booking.findOne({ date, time });
    if (exists) {
      return res.status(400).json({ message: "Slot deja ocupat!" });
    }

    const booking = await Booking.create({
      date,
      time,
      name,
      phone,
      service
    });

    res.json(booking);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare creare booking" });
  }
};

// -----------------------------
// ❌ DELETE BOOKING (ADMIN)
exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Șters cu succes" });
  } catch (err) {
    res.status(500).json({ message: "Eroare ștergere" });
  }
};
