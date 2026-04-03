// routes/auth.js
const express = require("express");
const passport = require("passport");
const router = express.Router();

// Login via Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    successRedirect: "/admin.html", // redirect to admin panel
  })
);

// Logout
router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) console.error(err);
    res.redirect("/");
  });
});

module.exports = router;
