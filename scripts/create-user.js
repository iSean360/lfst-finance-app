/**
 * Create User Script
 * Creates a Firebase Auth user AND adds them to Firestore with specified role
 *
 * Usage:
 *   node scripts/create-user.js <email> <password> <role> <displayName>
 *
 * Example:
 *   node scripts/create-user.js user@example.com TempPass123! editor "John Smith"
 */

const admin = require('firebase-admin');
const serviceAccount = require('../lfst-finance-app-firebase-adminsdk-fbsvc-9893315e22.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();
const CLUB_ID = 'lfst';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('❌ Usage: node create-user.js <email> <password> <role> [displayName]');
  console.error('');
  console.error('Roles: admin, editor, viewer');
  console.error('');
  console.error('Example: node create-user.js user@example.com TempPass123! editor "John Smith"');
  process.exit(1);
}

const [email, password, role, displayName] = args;

// Validate role
const validRoles = ['admin', 'editor', 'viewer'];
if (!validRoles.includes(role)) {
  console.error(`❌ Invalid role: ${role}`);
  console.error(`Valid roles: ${validRoles.join(', ')}`);
  process.exit(1);
}

async function createUser() {
  try {
    console.log('🚀 Creating new user...');
    console.log('');
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);
    console.log(`Display Name: ${displayName || email.split('@')[0]}`);
    console.log('');

    // Step 1: Create Firebase Auth user
    console.log('📝 Creating Firebase Auth account...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName || email.split('@')[0],
      emailVerified: false
    });

    console.log(`✅ Firebase Auth user created with UID: ${userRecord.uid}`);
    console.log('');

    // Step 2: Create Firestore user document
    console.log('📝 Creating Firestore user document...');
    const userRef = db.collection('clubs').doc(CLUB_ID).collection('users').doc(userRecord.uid);

    const userData = {
      email: email,
      displayName: displayName || email.split('@')[0],
      role: role,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await userRef.set(userData);

    console.log('✅ Firestore user document created!');
    console.log('');
    console.log('🎉 User successfully created!');
    console.log('');
    console.log('Login credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: ${role}`);
    console.log('');
    console.log('User can now sign in at: http://localhost:5173');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);

    if (error.code === 'auth/email-already-exists') {
      console.error('');
      console.error('This email already has a Firebase Auth account.');
      console.error('Use reset-password.js to change their password, or delete the user first.');
    }

    process.exit(1);
  }
}

createUser();
