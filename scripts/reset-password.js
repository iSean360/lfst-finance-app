/**
 * Reset Password Script
 * Resets a user's password directly using Firebase Admin SDK
 *
 * Usage:
 *   node scripts/reset-password.js <email> <new-password>
 *
 * Example:
 *   node scripts/reset-password.js you@example.com MyNewPassword123
 */

const admin = require('firebase-admin');
const serviceAccount = require('../lfst-finance-app-firebase-adminsdk-fbsvc-9893315e22.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('❌ Usage: node reset-password.js <email> <new-password>');
  console.error('');
  console.error('Example: node reset-password.js you@example.com MyNewPassword123');
  console.error('');
  console.error('Password must be at least 6 characters long.');
  process.exit(1);
}

const [email, newPassword] = args;

async function resetPassword() {
  try {
    if (newPassword.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    console.log('🔐 Resetting password...');
    console.log('');
    console.log(`Email: ${email}`);
    console.log('');

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Update password
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });

    console.log('✅ Password reset successfully!');
    console.log('');
    console.log('You can now sign in with:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${newPassword}`);
    console.log('');
    console.log('🎉 All set! Try signing in now.');

    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ No user found with that email');
    } else {
      console.error('❌ Error resetting password:', error.message);
      console.error(error);
    }
    process.exit(1);
  }
}

resetPassword();
