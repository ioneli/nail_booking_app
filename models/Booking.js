const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  date: String,
  time: String,
  name: String,
  phone: String,
 email: String,
  service: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
