/**
 * Set User as Admin Script
 * Adds a user to Firestore with admin permissions
 *
 * Usage:
 *   node scripts/set-password.js <email> <uid>
 *
 * Example:
 *   node scripts/set-password.js you@example.com abc123def456
 */

const admin = require('firebase-admin');
const serviceAccount = require('../lfst-finance-app-firebase-adminsdk-fbsvc-9893315e22.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const CLUB_ID = 'lfst';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('❌ Usage: node set-password.js <email> <uid>');
  console.error('');
  console.error('Example: node set-password.js you@example.com abc123def456');
  console.error('');
  console.error('If you don\'t know your UID, run:');
  console.error('  node scripts/check-user.js <email>');
  process.exit(1);
}

const [email, uid] = args;

async function setUserAsAdmin() {
  try {
    console.log('🚀 Setting up admin user...');
    console.log('');
    console.log(`Email: ${email}`);
    console.log(`UID: ${uid}`);
    console.log('');

    // Create admin user document in Firestore
    const userRef = db.collection('clubs').doc(CLUB_ID).collection('users').doc(uid);

    const userData = {
      email,
      displayName: email.split('@')[0],
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    await userRef.set(userData, { merge: true });

    console.log('✅ User successfully added as admin!');
    console.log('');
    console.log('You can now sign in to the app with:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: (your Firebase Auth password)`);
    console.log('');
    console.log('🎉 Setup complete!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up user:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setUserAsAdmin();
