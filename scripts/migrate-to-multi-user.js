/**
 * Migration Script: Multi-User RBAC Setup
 *
 * This script migrates the LFST Finance App from single-user to multi-user with RBAC.
 *
 * What it does:
 * 1. Creates initial admin user in the users collection
 * 2. Updates all existing records to include user tracking fields
 * 3. Verifies the migration was successful
 *
 * Usage:
 *   node scripts/migrate-to-multi-user.js <admin-email> <admin-uid>
 *
 * Example:
 *   node scripts/migrate-to-multi-user.js admin@lfst.com abc123def456
 *
 * IMPORTANT: Run this BEFORE deploying new Firestore rules!
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
  console.error('❌ Usage: node migrate-to-multi-user.js <admin-email> <admin-uid>');
  console.error('');
  console.error('Example: node migrate-to-multi-user.js admin@lfst.com abc123def456');
  console.error('');
  console.error('To get your UID, log in to the app and check the browser console,');
  console.error('or use the Firebase console to find your UID.');
  process.exit(1);
}

const [adminEmail, adminUid] = args;

console.log('🚀 Starting Multi-User RBAC Migration...');
console.log('');
console.log(`Admin Email: ${adminEmail}`);
console.log(`Admin UID: ${adminUid}`);
console.log(`Club ID: ${CLUB_ID}`);
console.log('');

async function migrateToMultiUser() {
  try {
    // Step 1: Create initial admin user
    console.log('📝 Step 1: Creating initial admin user...');
    await createAdminUser(adminEmail, adminUid);

    // Step 2: Update all existing records with user tracking
    console.log('');
    console.log('📝 Step 2: Adding user tracking to existing records...');
    await updateExistingRecords(adminUid);

    // Step 3: Verify migration
    console.log('');
    console.log('📝 Step 3: Verifying migration...');
    await verifyMigration();

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Deploy the new Firestore rules: firebase deploy --only firestore:rules');
    console.log('  2. Test the app by logging in as the admin user');
    console.log('  3. Add other users through the User Management UI');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

async function createAdminUser(email, uid) {
  const userRef = db.collection('clubs').doc(CLUB_ID).collection('users').doc(uid);

  // Check if user already exists
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    console.log(`  ⚠️  Admin user already exists. Updating to ensure admin role...`);
  } else {
    console.log(`  ✅ Creating new admin user...`);
  }

  const userData = {
    email,
    displayName: email.split('@')[0],
    role: 'admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  await userRef.set(userData, { merge: true });
  console.log(`  ✅ Admin user created/updated: ${email}`);
}

async function updateExistingRecords(adminUid) {
  const collections = [
    'members',
    'transactions',
    'budgets',
    'capex',
    'majorMaintenance',
    'services'
  ];

  let totalUpdated = 0;

  for (const collectionName of collections) {
    console.log(`  📁 Processing ${collectionName}...`);

    const collectionRef = db.collection('clubs').doc(CLUB_ID).collection(collectionName);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log(`    ℹ️  No documents found in ${collectionName}`);
      continue;
    }

    let updated = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Prepare update data
      const updates = {};

      // Add createdBy if missing
      if (!data.createdBy) {
        updates.createdBy = adminUid;
      }

      // Add createdAt if missing
      if (!data.createdAt) {
        updates.createdAt = data.updatedAt || new Date().toISOString();
      }

      // Add modifiedBy and modifiedAt
      updates.modifiedBy = adminUid;
      updates.modifiedAt = new Date().toISOString();

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        updated++;
        batchCount++;

        // Firestore batch limit is 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`    ✅ Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`    ✅ Updated ${updated} documents in ${collectionName}`);
    totalUpdated += updated;
  }

  // Update settings and balance
  console.log(`  📁 Processing settings and balance...`);

  const settingsRef = db.collection('clubs').doc(CLUB_ID).collection('settings').doc('current');
  const settingsDoc = await settingsRef.get();
  if (settingsDoc.exists) {
    await settingsRef.update({
      modifiedBy: adminUid,
      modifiedAt: new Date().toISOString()
    });
    console.log(`    ✅ Updated settings`);
    totalUpdated++;
  }

  const balanceRef = db.collection('clubs').doc(CLUB_ID).collection('balance').doc('current');
  const balanceDoc = await balanceRef.get();
  if (balanceDoc.exists) {
    await balanceRef.update({
      modifiedBy: adminUid,
      modifiedAt: new Date().toISOString()
    });
    console.log(`    ✅ Updated balance`);
    totalUpdated++;
  }

  console.log(`  ✅ Total records updated: ${totalUpdated}`);
}

async function verifyMigration() {
  // Check admin user exists
  const userRef = db.collection('clubs').doc(CLUB_ID).collection('users').doc(args[1]);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('Admin user not found after migration!');
  }

  const userData = userDoc.data();
  if (userData.role !== 'admin') {
    throw new Error(`User role is "${userData.role}", expected "admin"`);
  }

  console.log(`  ✅ Admin user verified`);

  // Check a sample of records have user tracking
  const membersRef = db.collection('clubs').doc(CLUB_ID).collection('members').limit(1);
  const membersSnapshot = await membersRef.get();

  if (!membersSnapshot.empty) {
    const sampleMember = membersSnapshot.docs[0].data();
    if (!sampleMember.createdBy) {
      throw new Error('Sample member record missing createdBy field!');
    }
    console.log(`  ✅ User tracking fields verified`);
  }

  console.log(`  ✅ Migration verification passed`);
}

// Run migration
migrateToMultiUser();
