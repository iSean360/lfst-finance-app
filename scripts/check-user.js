/**
 * Check User Script
 * Finds a user's UID by their email address
 *
 * Usage:
 *   node scripts/check-user.js <email>
 *
 * Example:
 *   node scripts/check-user.js you@example.com
 */

const admin = require('firebase-admin');
const serviceAccount = require('../lfst-finance-app-firebase-adminsdk-fbsvc-9893315e22.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('❌ Usage: node check-user.js <email>');
  console.error('');
  console.error('Example: node check-user.js you@example.com');
  process.exit(1);
}

const email = args[0];

async function checkUser() {
  try {
    console.log(`🔍 Looking up user: ${email}`);
    console.log('');

    // Get user by email from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);

    console.log('✅ User found in Firebase Authentication:');
    console.log('');
    console.log(`Email: ${userRecord.email}`);
    console.log(`UID: ${userRecord.uid}`);
    console.log(`Created: ${userRecord.metadata.creationTime}`);
    console.log(`Last Sign In: ${userRecord.metadata.lastSignInTime || 'Never'}`);
    console.log('');

    // Check if user exists in Firestore
    const db = admin.firestore();
    const userDoc = await db.collection('clubs').doc('lfst').collection('users').doc(userRecord.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✅ User found in Firestore:');
      console.log('');
      console.log(`Role: ${userData.role}`);
      console.log(`Status: ${userData.status}`);
      console.log(`Display Name: ${userData.displayName}`);
      console.log('');
      console.log('🎉 User is set up correctly!');
    } else {
      console.log('❌ User NOT found in Firestore database');
      console.log('');
      console.log('This is why you cannot access the app!');
      console.log('');
      console.log('To fix this, run:');
      console.log(`node scripts/set-password.js ${userRecord.email} ${userRecord.uid}`);
    }

    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ No user found with that email in Firebase Authentication');
      console.error('');
      console.error('You need to sign up first through the app login screen.');
    } else {
      console.error('❌ Error:', error.message);
      console.error(error);
    }
    process.exit(1);
  }
}

checkUser();
