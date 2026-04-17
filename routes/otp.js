const express = require("express");
const router = express.Router();

const { generateOTP, sendOTP } = require("../utils/sendEmail");

let otpStore = {}; // temporar (în producție poți pune în MongoDB)

// 🔹 INIT (trimite OTP)
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const otp = generateOTP();

    otpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000 // 5 minute
    };

    await sendOTP(email, otp);

    res.json({
      success: true,
      message: "OTP trimis pe email"
    });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ error: "Eroare la trimitere OTP" });
  }
});


// 🔹 CONFIRM (verifică OTP)
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({ error: "Nu există OTP pentru acest email" });
  }

  if (Date.now() > record.expires) {
    return res.status(400).json({ error: "OTP expirat" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: "OTP invalid" });
  }

  // șterge OTP după succes
  delete otpStore[email];

  res.json({
    success: true,
    message: "OTP validat cu succes"
  });
});

module.exports = router;
