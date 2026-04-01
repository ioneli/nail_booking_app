const Booking = require("../models/Booking");

// CREATE booking
const createBooking = async (req, res) => {
  try {
    const { service, date, time, phone } = req.body;

    if (!service && service !== 0 || !date || !time || !phone) {
      return res.status(400).json({ message: "Toate câmpurile sunt obligatorii!" });
    }

    // ❌ blocăm duminica
    const dayOfWeek = new Date(date).getDay(); // 0 = duminică
    if (dayOfWeek === 0) {
      return res.status(400).json({ message: "Duminica nu se lucrează!" });
    }

    // ❌ blocăm dublura (aceeași oră)
    const existing = await Booking.findOne({ date, time });
    if (existing) {
      return res.status(400).json({ message: "Această oră este deja ocupată!" });
    }

    // ❌ limită 6 sloturi pe zi
    const bookingsForDay = await Booking.find({ date });
    if (bookingsForDay.length >= 6) {
      return res.status(400).json({ message: "Ziua este complet ocupată!" });
    }

    const newBooking = new Booking({
      service,
      date,
      time,
      phone,
    });

    await newBooking.save();

    res.status(201).json(newBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Eroare la crearea rezervării" });
  }
};
// GET all bookings
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Eroare la preluarea rezervărilor" });
  }
};

module.exports = {
  createBooking,
  getBookings,
};
