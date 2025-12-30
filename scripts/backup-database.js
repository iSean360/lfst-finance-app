/**
 * Backup Firestore Database
 * Exports all data to a JSON file for backup/restore purposes
 *
 * Usage:
 *   node scripts/backup-database.js
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

async function backupDatabase() {
  try {
    console.log('🔄 Starting database backup...');
    console.log('');

    const backup = {
      timestamp: new Date().toISOString(),
      clubId: CLUB_ID,
      data: {}
    };

    // Collections to backup
    const collections = [
      'users',
      'budgets',
      'transactions',
      'members',
      'capex',
      'majorMaintenance'
    ];

    for (const collectionName of collections) {
      console.log(`📦 Backing up ${collectionName}...`);

      const collectionRef = db.collection('clubs').doc(CLUB_ID).collection(collectionName);
      const snapshot = await collectionRef.get();

      backup.data[collectionName] = [];

      snapshot.forEach(doc => {
        backup.data[collectionName].push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`   ✅ ${snapshot.size} documents backed up`);
    }

    // Also backup club settings
    console.log('📦 Backing up club settings...');
    const clubDoc = await db.collection('clubs').doc(CLUB_ID).get();
    if (clubDoc.exists) {
      backup.clubSettings = clubDoc.data();
      console.log('   ✅ Club settings backed up');
    }

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
    }

    // Save to file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    console.log('');
    console.log('✅ Backup complete!');
    console.log('');
    console.log(`📁 Backup saved to: ${filepath}`);
    console.log('');
    console.log('Summary:');
    for (const [collection, docs] of Object.entries(backup.data)) {
      console.log(`   ${collection}: ${docs.length} documents`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error backing up database:', error);
    process.exit(1);
  }
}

backupDatabase();
