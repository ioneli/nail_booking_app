const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  service: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
