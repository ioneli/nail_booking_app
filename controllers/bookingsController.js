const Booking = require("../models/Booking");

// 🔹 Twilio client (Verify API)
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const VERIFY_SID = process.env.TWILIO_VERIFY_SID;

// 🔹 Nume servicii
const serviceNames = [
  "Curățare",
  "Balerina",
  "Slim",
  "Pătrat",
  "Pătrat ascuțit",
  "Oval",
  "Stiletto"
];


// 🔹 INIT BOOKING → trimite OTP
exports.initBooking = async (req, res) => {
  try {
    const { service, date, time, phone } = req.body;

    // ❌ Duminica interzis
    if (new Date(date).getDay() === 0)
      return res.status(400).json({ message: "Duminica nu se lucrează!" });

    // ❌ Verifică dacă ora e ocupată
    const existing = await Booking.findOne({ date, time, confirmed: true });
    if (existing)
      return res.status(400).json({ message: "Ora ocupată!" });

    // ❌ Maxim 6 programări/zi
    const bookingsForDay = await Booking.find({ date, confirmed: true });
    if (bookingsForDay.length >= 6)
      return res.status(400).json({ message: "Zi complet ocupată!" });

    console.log("Sending OTP to:", phone);

    // 🔥 TRIMITE OTP PRIN TWILIO VERIFY
    await client.verify.v2.services(VERIFY_SID)
      .verifications
      .create({
        to: phone,
        channel: "sms"
      });

    res.json({ message: "Cod SMS trimis!" });

  } catch (err) {
    console.error("TWILIO ERROR:", err);
    console.error("TWILIO RESPONSE:", err.response?.data);
    res.status(500).json({ message: "Eroare SMS" });
  }
};


// 🔹 CONFIRM BOOKING → verifică OTP și salvează
exports.confirmBooking = async (req, res) => {
  try {
    const { service, date, time, phone, otp } = req.body;

    // 🔥 Verifică OTP
    const verification = await client.verify.v2.services(VERIFY_SID)
      .verificationChecks
      .create({
        to: phone,
        code: otp
      });

    if (verification.status !== "approved") {
      return res.status(400).json({ message: "Cod invalid" });
    }

    // 🔹 Creează programare DOAR dacă OTP e valid
    const booking = new Booking({
      service,
      date,
      time,
      phone,
      confirmed: true
    });

    await booking.save();

    res.json({ message: "Programare confirmată!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare confirmare" });
  }
};


// 🔹 CALENDAR (culori + sloturi ocupate)
exports.getCalendar = async (req, res) => {
  try {
    const slotsPerDay = 6;
    const bookings = await Booking.find({ confirmed: true });

    const calendar = {};

    bookings.forEach(b => {
      if (!calendar[b.date]) calendar[b.date] = [];
      calendar[b.date].push(b.time);
    });

    const result = {};

    for (const date in calendar) {
      const count = calendar[date].length;
//      let color;
//switch color
// 🔥 Gradient smooth de la verde -> roșu
const maxSlots = 6;
const ratio = count / maxSlots;

// HSL: 120 = verde, 0 = roșu
const hue = 120 - (120 * ratio);

// Saturation 100%, Lightness 50%
const color = `hsl(${hue}, 100%, 50%)`;


      result[date] = {
        booked: count,
        total: slotsPerDay,
        color,
        occupiedHours: calendar[date]
      };
    }

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: "Eroare calendar" });
  }
};


// 🔹 ADMIN - LISTĂ PROGRAMĂRI
exports.getBookings = async (req, res) => {
  const bookings = await Booking.find({ confirmed: true });

  const result = bookings.map(b => ({
    ...b._doc,
    serviceName: serviceNames[b.service]
  }));

  res.json(result);
};


// 🔹 DELETE
exports.deleteBooking = async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.json({ message: "Șters" });
};
