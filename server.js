require("dotenv").config();
const { extractCategory } = require("./public/features/sort");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo").default;
const app = express();
const fs = require("fs");

//  Debug ENV
console.log("MONGO:Hidden");

//  Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

//  Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,}),
      cookie: { secure: false }, // true if using HTTPS
}));

//  Passport
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

//  MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

//  Routes
app.use("/api/bookings", require("./routes/bookings"));

//  Google Auth
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/admin",
    failureRedirect: "/"
  })
);
app.get("/admin", (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(__dirname, "public/admin.html"));
  } else {
    res.redirect("/");
  }
});

// log out
app.get("/auth/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});
//colectii

// serve images
app.use(
  "/images",
  express.static(path.join(__dirname, "public/images/nailss"))
);

// API imagini grupate pe categorii
app.get("/api/gallery", (req, res) => {
  const dir = path.join(__dirname, "public/images/nailss");

  const files = fs.readdirSync(dir);

  const grouped = {};

  files.forEach(file => {
    const category = extractCategory(file);
    const url = "/images/" + file;

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(url);
  });

  // transformăm în "albums"
  const albums = Object.entries(grouped).map(([category, images]) => {
    const randomCover = images[Math.floor(Math.random() * images.length)];

    return {
      category,
      cover: randomCover,
      images
    };
  });

  res.json(albums);
});
//  Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
