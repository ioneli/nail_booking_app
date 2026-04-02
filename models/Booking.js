const mongoose = require("mongoose");

// Schema pentru programari
const BookingSchema = new mongoose.Schema({
  service: Number, //tip serviciu
  date: String,   //data (YYYY-MM-DD)
  time: String,  //ora
  phone: String, // telefon client
  confirmed: { type: Boolean, default: false }
});

module.exports = mongoose.model("Booking", BookingSchema);
