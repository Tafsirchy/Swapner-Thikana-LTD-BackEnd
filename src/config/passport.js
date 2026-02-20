const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Users } = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'place_your_client_id_here',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'place_your_client_secret_here',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const usersCollection = Users();

        // 1. Check if user exists
        let user = await usersCollection.findOne({ email });

        if (user) {
          if (!user.isActive || user.status === 'inactive') {
            return done(null, false, { message: 'Account has been deactivated' });
          }
          // Update last login or profile info if needed
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { updatedAt: new Date() } }
          );
          return done(null, user);
        }

        // 2. Create new user if not exists
        const newUser = {
          name: profile.displayName,
          email: email,
          phone: '', // Google OAuth doesn't provide phone
          role: 'customer',
          status: 'active', // Add status field for consistency
          isActive: true,
          isVerified: true, // Google accounts are verified
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await usersCollection.insertOne(newUser);
        user = { ...newUser, _id: result.insertedId };
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Users().findOne({ _id: id });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
