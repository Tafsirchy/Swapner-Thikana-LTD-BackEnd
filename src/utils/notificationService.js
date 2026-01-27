const admin = require('firebase-admin');
const { Users } = require('../models/User');

/**
 * Initialize Firebase Admin
 * Note: Requires FIREBASE_SERVICE_ACCOUNT_PATH or individual env vars
 */
const initializeFirebase = () => {
  try {
    if (admin.apps.length > 0) return;

    // We can use a service account JSON file (recommended)
    // or individual environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized');
    } else {
      console.warn('⚠️ Firebase Admin not initialized: Missing credentials');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
};

/**
 * Send push notification to a specific user
 * @param {string} userId 
 * @param {object} payload { title, body, data: { link, type } }
 */
const sendPushNotification = async (userId, payload) => {
  try {
    const user = await Users().findOne({ _id: userId });
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return;

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: user.fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error.code;
          if (errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered') {
            invalidTokens.push(user.fcmTokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await Users().updateOne(
          { _id: userId },
          { $pull: { fcmTokens: { $in: invalidTokens } } }
        );
      }
    }

    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = {
  initializeFirebase,
  sendPushNotification
};
