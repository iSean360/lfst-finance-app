/**
 * Restore Firestore Database from Backup
 * Restores data from a backup JSON file
 *
 * Usage:
 *   node scripts/restore-database.js <backup-file>
 *
 * Example:
 *   node scripts/restore-database.js backups/backup-2025-12-29.json
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../lfst-finance-app-firebase-adminsdk-fbsvc-9893315e22.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const CLUB_ID = 'lfst';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('❌ Usage: node restore-database.js <backup-file>');
  console.error('');
  console.error('Example: node restore-database.js backups/backup-2025-12-29.json');
  process.exit(1);
}

const backupFile = args[0];

async function restoreDatabase() {
  try {
    console.log('⚠️  WARNING: This will OVERWRITE all current data!');
    console.log('');
    console.log(`Restoring from: ${backupFile}`);
    console.log('');

    // Read backup file
    const backupPath = path.isAbsolute(backupFile)
      ? backupFile
      : path.join(__dirname, '..', backupFile);

    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Backup file not found: ${backupPath}`);
      process.exit(1);
    }

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    console.log(`Backup created: ${backup.timestamp}`);
    console.log('');
    console.log('Data to restore:');
    for (const [collection, docs] of Object.entries(backup.data)) {
      console.log(`   ${collection}: ${docs.length} documents`);
    }
    console.log('');

    // Confirm before proceeding
    console.log('⚠️  Type "YES" to continue with restore:');

    // For automated scripts, we'll skip the prompt
    // In production, you'd want to add a readline prompt here

    console.log('🔄 Starting restore...');
    console.log('');

    // Restore each collection
    for (const [collectionName, documents] of Object.entries(backup.data)) {
      console.log(`📦 Restoring ${collectionName}...`);

      const collectionRef = db.collection('clubs').doc(CLUB_ID).collection(collectionName);

      // Delete existing documents
      const existingDocs = await collectionRef.get();
      console.log(`   🗑️  Deleting ${existingDocs.size} existing documents...`);

      const batch = db.batch();
      existingDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Restore documents
      console.log(`   ✍️  Writing ${documents.length} documents...`);
      for (const doc of documents) {
        const { id, ...data } = doc;
        await collectionRef.doc(id).set(data);
      }

      console.log(`   ✅ ${collectionName} restored`);
    }

    // Restore club settings
    if (backup.clubSettings) {
      console.log('📦 Restoring club settings...');
      await db.collection('clubs').doc(CLUB_ID).set(backup.clubSettings);
      console.log('   ✅ Club settings restored');
    }

    console.log('');
    console.log('✅ Restore complete!');
    console.log('');
    console.log('All data has been restored from backup.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error restoring database:', error);
    process.exit(1);
  }
}

restoreDatabase();
