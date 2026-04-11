const GoogleStrategy = require("passport-google-oauth20").Strategy;

module.exports = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      (accessToken, refreshToken, profile, done) => {
        const email = profile.emails[0].value;
        ;
console.log("LOGIN EMAIL:", profile.emails[0].value);
        if (email === process.env.ADMIN_EMAIL) {
          return done(null, profile);
        } else {
          return done(null, false);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj))
};

