const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  date: String,
  time: String,
  name: String,
  phone: String,
  service: {
    type: Number,
    default: null
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
