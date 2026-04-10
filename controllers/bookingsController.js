const Booking = require("../models/Booking");

//Node Mailer

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ====anti spam
//==============
function getWeekRange(dateStr) {
  const date = new Date(dateStr);

  const first = new Date(date);
  first.setDate(date.getDate() - date.getDay() + 1); // luni

  const last = new Date(first);
  last.setDate(first.getDate() + 6); // duminică

  const format = d => d.toISOString().split("T")[0];

  return {
    start: format(first),
    end: format(last)
  };
}


// anti fake nr

function isValidPhone(phone) {
  // scoate spații
  const cleaned = phone.replace(/\s+/g, "");

  // doar cifre + optional +
  if (!/^\+?\d+$/.test(cleaned)) return false;

  // minim 10 cifre
  if (cleaned.length < 10) return false;

  // NU toate cifrele la fel (ex: 3333333)
  if (/^(\d)\1+$/.test(cleaned.replace("+",""))) return false;

  return true;
}

// Temporary OTP store
const otpStore = {};
// Temporary OTP view store
const otpViewStore = {};
//==== for see appointment
//==================
// init otp
exports.initMyBookings = async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpViewStore[email] = {
    otp,
    verified: false,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 min
  };

  await transporter.sendMail({
    to: email,
    subject: "OTP programări",
    text: `Codul tău: ${otp}`
  });

  res.json({ message: "OTP trimis" });
};
//=== verify otp
exports.verifyMyBookings = async (req, res) => {
  const { email, otp } = req.body;

  const stored = otpViewStore[email];

  if (!stored || stored.otp != otp) {
    return res.status(400).json({ message: "OTP invalid" });
  }

  if (Date.now() > stored.expiresAt) {
    return res.status(400).json({ message: "OTP expirat" });
  }

  stored.verified = true;

  const bookings = await Booking.find({ email }).sort({ date: 1 });

  res.json(bookings);
};

//=== delete its own

exports.deleteMyBooking = async (req, res) => {
  const { email } = req.body;

  const stored = otpViewStore[email];

  if (!stored || !stored.verified) {
    return res.status(403).json({ message: "Neautorizat" });
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Nu există" });
  }

  if (booking.email !== email) {
    return res.status(403).json({ message: "Nu ai voie" });
  }

  await booking.deleteOne();

  res.json({ message: "Șters cu succes!" });
};

//--=== update reschedule
exports.updateMyBooking = async (req, res) => {
  const { email, date, time } = req.body;

  const stored = otpViewStore[email];

  if (!stored || !stored.verified) {
    return res.status(403).json({ message: "Neautorizat" });
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Nu există" });
  }

  if (booking.email !== email) {
    return res.status(403).json({ message: "Nu ai voie" });
  }

  // verifică slot liber
  const existingBooking = await Booking.findOne({
  date,
  time,
  _id: { $ne : req.params.id}
  });

  if (existingBooking) {
    return res.status(400).json({ message: "Slot ocupat!" });
  }
   // VALIDARE DATĂ
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0,0,0,0);

  if (dateObj <= today) {
    return res.status(400).json({ message: "Nu poți selecta o zi trecută!" });
  }

  // NU DUMINICA
  if (dateObj.getDay() === 0) {
    return res.status(400).json({ message: "Duminica este închis!" });
  }

  // VALIDARE ORE
  const allowedSlots = ["10:00", "13:00", "15:00", "18:00"];

  if (!allowedSlots.includes(time)) {
    return res.status(400).json({ message: "Ora invalidă!" });
  }

  // SLOT OCUPAT
  const exists = await Booking.findOne({ date, time });

  if (exists) {
    return res.status(400).json({ message: "Slot ocupat!" });
  }

  // UPDATE
  booking.date = date;
  booking.time = time;

  await booking.save();

  res.json({ message: "Programare modificată!" });
};

// -----------------------------
//  GET CALENDAR
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
// INIT BOOKING (SEND OTP)
exports.initBooking = async (req, res) => {
  let { phone, name, date, time, service, email } = req.body;

  if (!phone || !name || !date || !time || !email) {
    return res.status(400).json({ message: "Date incomplete" });
  }

  // VALIDARE TELEFON 
   if (!isValidPhone(phone)) {
    console.log("no:", phone);
    return res.status(400).json({ message: "Număr de telefon invalid!" });
  }

  // prevenire duplicate
  const exists = await Booking.findOne({ date, time });
  if (exists) {
    return res.status(400).json({ message: "Slot deja ocupat!" });
  }
  const dailyCount = await Booking.countDocuments({ date, email });

  if (dailyCount >= 1) {
  return res.status(400).json({
    message: "Ai deja 1 programări în această zi!"
  });
}

//LIMITARE PE SĂPTĂMÂNĂ
const { start, end } = getWeekRange(date);

const weeklyCount = await Booking.countDocuments({
  email,
  date: { $gte: start, $lte: end }
});

if (weeklyCount >= 2) {
  return res.status(400).json({
    message: "Ai atins limita de 2 programări pe săptămână!"
  });
}
  const otp = Math.floor(100000 + Math.random() * 900000);

  // IMPORTANT: salvăm pe EMAIL acum, nu pe telefon
  otpStore[email] = {
    otp,
    data: { date, time, name, phone, service, email }
  };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Cod OTP programare",
      text: `Codul tău OTP este: ${otp}`
    });

    res.json({ message: "Cod OTP trimis pe email!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare trimitere email" });
  }
};

// -----------------------------
//  CONFIRM BOOKING
exports.confirmBooking = async (req, res) => {
  const { email, otp } = req.body;

  const stored = otpStore[email];

  if (!stored || stored.otp != otp) {
    return res.status(400).json({ message: "OTP incorect" });
  }

  const { date, time, name, phone, service } = stored.data;

  const exists = await Booking.findOne({ date, time });
  if (exists) {
    return res.status(400).json({ message: "Slot deja ocupat!" });
  }
// RECHECK (anti bypass)
const dailyCount = await Booking.countDocuments({ date, email });

if (dailyCount >= 1) {
  return res.status(400).json({
    message: "Limită zilnică atinsă!"
  });
}

const { start, end } = getWeekRange(date);

const weeklyCount = await Booking.countDocuments({
  email,
  date: { $gte: start, $lte: end }
});

if (weeklyCount >= 2) {
  return res.status(400).json({
    message: "Limită săptămânală atinsă!"
  });
}
  await Booking.create({
    date,
    time,
    name,
    phone,
    email,
    service
  });

  delete otpStore[email];

  res.json({ message: "Programare confirmată!" });
};
// -----------------------------
//  GET ALL BOOKINGS (ADMIN)


exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: 1, time: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Eroare fetch bookings" });
  }
};

// -----------------------------
//  ADD BOOKING (ADMIN - NO OTP)
exports.addBooking = async (req, res) => {
  try {
    const { date, time, name, phone, service, email } = req.body;

    // Prevent double booking
    const exists = await Booking.findOne({ date, time });
    if (exists) {
      return res.status(400).json({ message: "Slot deja ocupat!" });
    }

    const booking = await Booking.create({
      date,
      time,
      name,
      phone: phone || null,
      service,
      email: email || null,
    });

    // Return proper message + booking
    res.status(201).json({
      message: "Programare creată cu succes!",
      booking
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare creare booking" });
  }
};
// -----------------------------
//  DELETE BOOKING (ADMIN)
exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Șters cu succes" });
  } catch (err) {
    res.status(500).json({ message: "Eroare ștergere" });
  }
};


