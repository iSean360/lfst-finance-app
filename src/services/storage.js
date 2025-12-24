/**
 * Storage Service - Firebase Firestore Edition
 *
 * Handles reading and writing data to Firebase Firestore.
 * All operations are async and sync across devices.
 *
 * Data is stored in Firestore collections:
 * - settings (single document)
 * - members (collection, organized by fiscal year)
 * - transactions (collection, organized by fiscal year)
 * - services (collection)
 * - budgets (collection, organized by fiscal year)
 * - capex (collection, organized by fiscal year)
 */

import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';

const CLUB_ID = 'lfst'; // Club identifier for multi-tenancy support later

// Default data structures
const DEFAULT_DATA = {
  settings: {
    fiscalYear: 2026,
    startDate: '2025-10-01',
    clubName: 'Lockridge Forest Swim & Tennis Club',
    lastModified: new Date().toISOString()
  },
  balance: {
    current: 18500.00,
    lastUpdated: new Date().toISOString()
  },
  members: [],
  transactions: [],
  services: [
    {
      id: 'service_1',
      name: 'Georgia Power - Pool & Tennis',
      category: 'Utilities',
      monthlyAmounts: [1301.97, 1282.32, 1344.77, 1385.17, 1424.45, 1500, 1650, 1700, 1650, 1600, 1550, 1500],
      notes: 'Acct # 51518-53007',
      autoPayEnabled: true
    },
    {
      id: 'service_2',
      name: 'Georgia Power - Outbuilding (Taj)',
      category: 'Utilities',
      monthlyAmounts: [28.04, 36.79, 24.63, 24.66, 25.15, 25.17, 29.07, 35.27, 38.58, 44.53, 40.78, 0],
      notes: 'Acct # 33918-81005',
      autoPayEnabled: true
    },
    {
      id: 'service_3',
      name: 'Georgia Power - Bathhouse',
      category: 'Utilities',
      monthlyAmounts: [24.58, 24.35, 24.37, 24.12, 24.61, 26.39, 24.79, 25.04, 32.62, 35.33, 32.44, 0],
      notes: 'Acct # 50528-53002',
      autoPayEnabled: true
    },
    {
      id: 'service_4',
      name: 'Sweetwater Pool Management',
      category: 'Pool Management',
      monthlyAmounts: [100, 100, 100, 100, 947.5, 947.5, 2842.5, 4737.5, 4737.5, 3790, 947.5, 100],
      notes: 'Contracted through 2023',
      autoPayEnabled: false
    },
    {
      id: 'service_5',
      name: 'Nesbitt Landscape Group',
      category: 'Landscaping',
      monthlyAmounts: [355, 355, 355, 355, 355, 355, 481.25, 481.25, 481.25, 0, 1443.75, 0],
      notes: 'Monthly maintenance',
      autoPayEnabled: false
    },
    {
      id: 'service_6',
      name: 'Waste Pro',
      category: 'Waste Management',
      monthlyAmounts: [125.38, 125.38, 0, 0, 0, 0, 351.14, 115.38, 115.38, 115.38, 115.38, 115.38],
      notes: 'Acct # 121057',
      autoPayEnabled: true
    },
    {
      id: 'service_7',
      name: 'Gwinnett County Water',
      category: 'Utilities',
      monthlyAmounts: [112.85, 29.43, 28.94, 27, 27, 27.98, 219.86, 321.22, 439.79, 355.66, 304.49, 197.92],
      notes: 'Acct# 20000922',
      autoPayEnabled: true
    }
  ]
};

class StorageService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize storage - create default data if doesn't exist
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Check if settings exist, if not, create defaults
      const settings = await this.getSettings();
      if (!settings || !settings.fiscalYear) {
        await this.setData('settings', DEFAULT_DATA.settings);
      }

      const balance = await this.getBalance();
      if (!balance || balance.current === undefined) {
        await this.setData('balance', DEFAULT_DATA.balance);
      }

      const services = await this.getServices();
      if (!services || services.length === 0) {
        // Initialize services
        for (const service of DEFAULT_DATA.services) {
          await setDoc(doc(db, `clubs/${CLUB_ID}/services`, service.id), service);
        }
      }

      this.initialized = true;
      console.log('✅ Firestore storage initialized');
    } catch (error) {
      console.error('❌ Error initializing storage:', error);
    }
  }

  /**
   * Get data from Firestore
   */
  async getData(key) {
    try {
      const docRef = doc(db, `clubs/${CLUB_ID}/${key}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in Firestore
   */
  async setData(key, value) {
    try {
      const docRef = doc(db, `clubs/${CLUB_ID}/${key}`);
      await setDoc(docRef, value, { merge: true });
      console.log(`💾 Saved ${key} to Firestore`);
      return true;
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all settings
   */
  async getSettings() {
    const data = await this.getData('settings');
    return data || DEFAULT_DATA.settings;
  }

  /**
   * Update settings
   */
  async updateSettings(updates) {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...updates,
      lastModified: new Date().toISOString()
    };
    await this.setData('settings', updated);
    return updated;
  }

  /**
   * Get current balance
   */
  async getBalance() {
    const data = await this.getData('balance');
    return data || DEFAULT_DATA.balance;
  }

  /**
   * Update balance
   */
  async updateBalance(amount) {
    const balance = {
      current: amount,
      lastUpdated: new Date().toISOString()
    };
    await this.setData('balance', balance);
    return balance;
  }

  /**
   * Get all members
   */
  async getMembers(fiscalYear = null) {
    try {
      const membersRef = collection(db, `clubs/${CLUB_ID}/members`);
      let q;

      if (fiscalYear) {
        q = query(membersRef, where('fiscalYear', '==', fiscalYear));
      } else {
        q = membersRef;
      }

      const querySnapshot = await getDocs(q);
      const members = [];
      querySnapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() });
      });

      return members;
    } catch (error) {
      console.error('Error getting members:', error);
      return [];
    }
  }

  /**
   * Add or update member
   */
  async saveMember(member, fiscalYear = null) {
    try {
      const memberId = member.id || `member_${Date.now()}`;
      const memberData = {
        ...member,
        fiscalYear: fiscalYear || member.fiscalYear,
        updatedAt: new Date().toISOString(),
        createdAt: member.createdAt || new Date().toISOString()
      };

      const memberRef = doc(db, `clubs/${CLUB_ID}/members`, memberId);
      await setDoc(memberRef, memberData, { merge: true });

      return await this.getMembers(fiscalYear);
    } catch (error) {
      console.error('Error saving member:', error);
      throw error;
    }
  }

  /**
   * Delete member
   */
  async deleteMember(memberId, fiscalYear = null) {
    try {
      const memberRef = doc(db, `clubs/${CLUB_ID}/members`, memberId);
      await deleteDoc(memberRef);

      return await this.getMembers(fiscalYear);
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  /**
   * Get all transactions
   */
  async getTransactions(fiscalYear = null) {
    try {
      const transactionsRef = collection(db, `clubs/${CLUB_ID}/transactions`);
      let q;

      if (fiscalYear) {
        q = query(transactionsRef, where('fiscalYear', '==', fiscalYear), orderBy('date', 'desc'));
      } else {
        q = query(transactionsRef, orderBy('date', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const transactions = [];
      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });

      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  /**
   * Add transaction
   */
  async addTransaction(transaction, fiscalYear = null) {
    try {
      const transactionId = transaction.id || `txn_${Date.now()}`;
      const transactionData = {
        ...transaction,
        fiscalYear: fiscalYear || transaction.fiscalYear,
        createdAt: new Date().toISOString(),
        createdBy: 'treasurer'
      };

      const transactionRef = doc(db, `clubs/${CLUB_ID}/transactions`, transactionId);
      await setDoc(transactionRef, transactionData);

      return { id: transactionId, ...transactionData };
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(transactionId, updates, fiscalYear = null) {
    try {
      const transactionRef = doc(db, `clubs/${CLUB_ID}/transactions`, transactionId);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(transactionRef, updatedData);

      const docSnap = await getDoc(transactionRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(transactionId, fiscalYear = null) {
    try {
      const transactionRef = doc(db, `clubs/${CLUB_ID}/transactions`, transactionId);
      await deleteDoc(transactionRef);

      return await this.getTransactions(fiscalYear);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  /**
   * Get all services
   */
  async getServices() {
    try {
      const servicesRef = collection(db, `clubs/${CLUB_ID}/services`);
      const querySnapshot = await getDocs(servicesRef);
      const services = [];

      querySnapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() });
      });

      return services.length > 0 ? services : DEFAULT_DATA.services;
    } catch (error) {
      console.error('Error getting services:', error);
      return DEFAULT_DATA.services;
    }
  }

  /**
   * Update service
   */
  async updateService(serviceId, updates) {
    try {
      const serviceRef = doc(db, `clubs/${CLUB_ID}/services`, serviceId);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(serviceRef, updatedData);

      const docSnap = await getDoc(serviceRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Export all data as JSON (for backup)
   */
  async exportData() {
    const settings = await this.getSettings();
    const balance = await this.getBalance();
    const members = await this.getMembers();
    const transactions = await this.getTransactions();
    const services = await this.getServices();

    return {
      exportDate: new Date().toISOString(),
      settings,
      balance,
      members,
      transactions,
      services
    };
  }

  /**
   * Import data from JSON (for restore)
   */
  async importData(data) {
    try {
      if (data.settings) await this.setData('settings', data.settings);
      if (data.balance) await this.setData('balance', data.balance);

      if (data.members && data.members.length > 0) {
        for (const member of data.members) {
          await this.saveMember(member);
        }
      }

      if (data.transactions && data.transactions.length > 0) {
        for (const transaction of data.transactions) {
          await this.addTransaction(transaction);
        }
      }

      if (data.services && data.services.length > 0) {
        for (const service of data.services) {
          const serviceRef = doc(db, `clubs/${CLUB_ID}/services`, service.id);
          await setDoc(serviceRef, service);
        }
      }

      console.log('✅ Data imported successfully to Firestore');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Clear all data (use with caution!)
   */
  async clearAllData() {
    try {
      const batch = writeBatch(db);

      // This is a simplified version - in production, you'd need to paginate
      const collections = ['members', 'transactions', 'services'];

      for (const collectionName of collections) {
        const collectionRef = collection(db, `clubs/${CLUB_ID}/${collectionName}`);
        const snapshot = await getDocs(collectionRef);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }

      await batch.commit();
      this.initialized = false;
      console.log('🗑️ All data cleared from Firestore');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    const members = await this.getMembers();
    const transactions = await this.getTransactions();
    const services = await this.getServices();
    const balance = await this.getBalance();
    const settings = await this.getSettings();

    return {
      members: members.length,
      transactions: transactions.length,
      services: services.length,
      balance: balance.current,
      lastModified: settings.lastModified
    };
  }

  /**
   * Get budget for fiscal year
   */
  async getBudget(fiscalYear) {
    try {
      const budgetRef = doc(db, `clubs/${CLUB_ID}/budgets`, `budget_${fiscalYear}`);
      const docSnap = await getDoc(budgetRef);

      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error getting budget:', error);
      return null;
    }
  }

  /**
   * Save budget
   */
  async saveBudget(budget) {
    try {
      const budgetRef = doc(db, `clubs/${CLUB_ID}/budgets`, `budget_${budget.fiscalYear}`);
      const budgetData = {
        ...budget,
        updatedAt: new Date().toISOString()
      };

      await setDoc(budgetRef, budgetData, { merge: true });
      return budgetData;
    } catch (error) {
      console.error('Error saving budget:', error);
      throw error;
    }
  }

  /**
   * Update specific month in budget
   */
  async updateBudgetMonth(fiscalYear, month, updates) {
    try {
      const budget = await this.getBudget(fiscalYear);
      if (!budget) return null;

      budget.monthlyBudgets[month] = { ...budget.monthlyBudgets[month], ...updates };
      budget.updatedAt = new Date().toISOString();

      await this.saveBudget(budget);
      return budget;
    } catch (error) {
      console.error('Error updating budget month:', error);
      throw error;
    }
  }

  /**
   * Get planned CAPEX projects for fiscal year
   */
  async getPlannedCapex(fiscalYear) {
    try {
      const capexRef = collection(db, `clubs/${CLUB_ID}/capex`);
      const q = query(capexRef, where('fiscalYear', '==', fiscalYear));
      const querySnapshot = await getDocs(q);
      const capex = [];

      querySnapshot.forEach((doc) => {
        capex.push({ id: doc.id, ...doc.data() });
      });

      return capex;
    } catch (error) {
      console.error('Error getting CAPEX:', error);
      return [];
    }
  }

  /**
   * Save CAPEX project
   */
  async saveCapexProject(project) {
    try {
      const projectId = project.id || `capex_${Date.now()}`;
      const projectData = {
        ...project,
        updatedAt: new Date().toISOString(),
        createdAt: project.createdAt || new Date().toISOString()
      };

      const projectRef = doc(db, `clubs/${CLUB_ID}/capex`, projectId);
      await setDoc(projectRef, projectData, { merge: true });

      return await this.getPlannedCapex(project.fiscalYear);
    } catch (error) {
      console.error('Error saving CAPEX project:', error);
      throw error;
    }
  }

  /**
   * Delete CAPEX project
   */
  async deleteCapexProject(fiscalYear, projectId) {
    try {
      const projectRef = doc(db, `clubs/${CLUB_ID}/capex`, projectId);
      await deleteDoc(projectRef);

      return await this.getPlannedCapex(fiscalYear);
    } catch (error) {
      console.error('Error deleting CAPEX project:', error);
      throw error;
    }
  }

  /**
   * Mark CAPEX project as completed
   */
  async completeCapexProject(fiscalYear, projectId, actualAmount) {
    try {
      const projectRef = doc(db, `clubs/${CLUB_ID}/capex`, projectId);
      await updateDoc(projectRef, {
        completed: true,
        completedDate: new Date().toISOString(),
        actualAmount: actualAmount
      });

      return await this.getPlannedCapex(fiscalYear);
    } catch (error) {
      console.error('Error completing CAPEX project:', error);
      throw error;
    }
  }
}

// Export singleton instance
const storage = new StorageService();
export default storage;
