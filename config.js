// config.js
require('dotenv').config(); // only loads .env locally

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

module.exports = {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  DATABASE_URL,
};
