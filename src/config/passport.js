const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Users } = require('../models/User');
const { PendingUsers } = require('../models/PendingUser');

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
          
          // Link googleId if not already present
          const updates = { updatedAt: new Date() };
          if (!user.googleId) updates.googleId = profile.id;
          if (!user.avatar && profile.photos?.[0]?.value) updates.avatar = profile.photos[0].value;

          await usersCollection.updateOne(
            { _id: user._id },
            { $set: updates }
          );
          return done(null, user);
        }

        // 2. Check if user exists in PendingUsers (Email signed up but not verified)
        const pendingCollection = PendingUsers();
        const pendingUser = await pendingCollection.findOne({ email });

        if (pendingUser) {
          const newUserFromPending = {
            name: profile.displayName || pendingUser.name,
            email: email,
            password: pendingUser.password, // Keep their password if they set one
            phone: pendingUser.phone || '',
            role: 'customer',
            status: 'active',
            isActive: true,
            isVerified: true,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value,
            createdAt: pendingUser.createdAt || new Date(),
            updatedAt: new Date(),
          };

          const result = await usersCollection.insertOne(newUserFromPending);
          await pendingCollection.deleteOne({ _id: pendingUser._id });
          
          return done(null, { ...newUserFromPending, _id: result.insertedId, isNew: true });
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
        user = { ...newUser, _id: result.insertedId, isNew: true };
        
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
