// resetAndSeed.js
require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("./models/Booking"); // modelul tău Booking

// 1️⃣ Conectare la MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("Mongo error:", err);
    process.exit(1);
  });

async function resetAndSeed() {
  try {
    // 2️⃣ Șterge toate programările vechi
    await Booking.deleteMany({});
    console.log("Colecția bookings a fost resetată.");

    // 3️⃣ Adaugă câteva programări de test
    const testBookings = [
      { date: "2026-04-10", time: "10:00", name: "Ana", phone: "+123456789", service: "Balerina", email: "ana@test.com" },
      { date: "2026-04-10", time: "13:00", name: "Maria", phone: "+987654321", service: "Slim", email: "maria@test.com" },
      { date: "2026-04-11", time: "15:00", name: "Ioana", phone: "+111222333", service: "Curățare", email: "ioana@test.com" },
    ];

    await Booking.insertMany(testBookings);
    console.log("Programările de test au fost adăugate.");

    process.exit(0); // ieșim după ce am terminat
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetAndSeed();
