const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTP(email, otp) {
 const response =  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial; padding: 10px;">
        <h2>Your OTP Code</h2>
        <p style="font-size: 20px;">
          <b>${otp}</b>
        </p>
        <p>This code expires in 5 minutes.</p>
      </div>
    `
  });
console.log("Resend response:", response);
}

module.exports = { generateOTP, sendOTP };
