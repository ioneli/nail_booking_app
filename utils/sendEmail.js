// utils/sendEmail.js

const nodemailer = require("nodemailer");

// configurare transport email (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // email tău
    pass: process.env.EMAIL_PASS  // app password
  }
});

// funcție pentru trimitere OTP
async function sendOTP(email, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Cod verificare programare",
    text: `Codul tău OTP este: ${otp}`
  });
}

module.exports = sendOTP;
