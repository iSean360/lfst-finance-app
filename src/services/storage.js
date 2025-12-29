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
import { getCurrentUserId } from './userService';

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
   * Get current user ID for tracking purposes
   * @returns {string} User ID or 'system' if not authenticated
   */
  getUserId() {
    return getCurrentUserId() || 'system';
  }

  /**
   * Get user metadata for create operations
   * @returns {object} Metadata with createdBy and createdAt
   */
  getCreateMetadata() {
    return {
      createdBy: this.getUserId(),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Get user metadata for update operations
   * @returns {object} Metadata with modifiedBy and modifiedAt
   */
  getUpdateMetadata() {
    return {
      modifiedBy: this.getUserId(),
      modifiedAt: new Date().toISOString()
    };
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
      // For singleton documents like settings and balance, we need a 4-segment path
      const docRef = doc(db, 'clubs', CLUB_ID, key, 'data');
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
      // For singleton documents like settings and balance, we need a 4-segment path
      const docRef = doc(db, 'clubs', CLUB_ID, key, 'data');
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
      const isNew = !member.id || !member.createdAt;

      const memberData = {
        ...member,
        fiscalYear: fiscalYear || member.fiscalYear,
        ...(isNew ? this.getCreateMetadata() : this.getUpdateMetadata())
      };

      // Preserve createdAt and createdBy for existing members
      if (!isNew && member.createdAt) {
        memberData.createdAt = member.createdAt;
        if (member.createdBy) {
          memberData.createdBy = member.createdBy;
        }
      }

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
        ...this.getCreateMetadata()
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
        ...this.getUpdateMetadata()
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

  /**
   * Get Major Maintenance items for fiscal year
   */
  async getMajorMaintenanceItems(fiscalYear) {
    try {
      const maintenanceRef = collection(db, `clubs/${CLUB_ID}/majorMaintenance`);
      const q = query(maintenanceRef, where('fiscalYear', '==', fiscalYear));
      const querySnapshot = await getDocs(q);
      const items = [];

      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });

      return items;
    } catch (error) {
      console.error('Error getting Major Maintenance items:', error);
      return [];
    }
  }

  /**
   * Get all Major Maintenance items (for schedule view)
   */
  async getAllMajorMaintenance() {
    try {
      const maintenanceRef = collection(db, `clubs/${CLUB_ID}/majorMaintenance`);
      const querySnapshot = await getDocs(maintenanceRef);
      const items = [];

      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });

      // Sort by next due date
      return items.sort((a, b) => {
        if (!a.nextDueDateMin) return 1;
        if (!b.nextDueDateMin) return -1;
        return new Date(a.nextDueDateMin) - new Date(b.nextDueDateMin);
      });
    } catch (error) {
      console.error('Error getting all Major Maintenance items:', error);
      return [];
    }
  }

  /**
   * Save Major Maintenance item
   */
  async saveMajorMaintenanceItem(item) {
    try {
      const itemId = item.id || `majormaint_${Date.now()}`;
      const itemData = {
        ...item,
        updatedAt: new Date().toISOString(),
        createdAt: item.createdAt || new Date().toISOString()
      };

      const itemRef = doc(db, `clubs/${CLUB_ID}/majorMaintenance`, itemId);
      await setDoc(itemRef, itemData, { merge: true });

      return await this.getMajorMaintenanceItems(item.fiscalYear);
    } catch (error) {
      console.error('Error saving Major Maintenance item:', error);
      throw error;
    }
  }

  /**
   * Delete Major Maintenance item
   */
  async deleteMajorMaintenanceItem(fiscalYear, itemId) {
    try {
      const itemRef = doc(db, `clubs/${CLUB_ID}/majorMaintenance`, itemId);
      await deleteDoc(itemRef);

      return await this.getMajorMaintenanceItems(fiscalYear);
    } catch (error) {
      console.error('Error deleting Major Maintenance item:', error);
      throw error;
    }
  }

  /**
   * Generic function to link an item (Major Maintenance or CAPEX) to a transaction
   * @param {string} collection - Collection name ('majorMaintenance' or 'capex')
   * @param {string} itemId - ID of the item to link
   * @param {object} transaction - Transaction object to link
   * @param {boolean} markComplete - Whether to mark the item as complete
   * @param {function} completeHandler - Optional function to handle completion-specific logic
   * @returns {object} Updated item
   */
  async linkItemToTransaction(collection, itemId, transaction, markComplete = false, completeHandler = null) {
    try {
      const itemRef = doc(db, `clubs/${CLUB_ID}/${collection}`, itemId);
      const docSnap = await getDoc(itemRef);

      if (!docSnap.exists()) {
        throw new Error(`${collection} item not found`);
      }

      const item = docSnap.data();

      // Initialize or update linked transactions array
      const linkedTransactions = item.linkedTransactions || [];
      const transactionEntry = {
        id: transaction.id,
        date: transaction.date,
        amount: transaction.amount,
        fiscalYear: transaction.fiscalYear
      };

      // Check if this transaction is already linked (prevent duplicates)
      const existingIndex = linkedTransactions.findIndex(t => t.id === transaction.id);
      if (existingIndex >= 0) {
        linkedTransactions[existingIndex] = transactionEntry;
      } else {
        linkedTransactions.push(transactionEntry);
      }

      // Calculate total amount from all linked transactions
      const totalActualAmount = linkedTransactions.reduce((sum, t) => sum + t.amount, 0);

      // Prepare base update data
      const updateData = {
        linkedTransactions,
        updatedAt: new Date().toISOString()
      };

      // Call collection-specific completion handler if marking complete
      if (markComplete && completeHandler) {
        completeHandler(updateData, item, linkedTransactions, totalActualAmount, transaction);
      }

      await updateDoc(itemRef, updateData);

      const updatedDocSnap = await getDoc(itemRef);
      const updatedItem = updatedDocSnap.exists() ? { id: updatedDocSnap.id, ...updatedDocSnap.data() } : null;

      console.log(`✅ ${collection} item linked to transaction:`, itemId, 'Total transactions:', linkedTransactions.length);
      return updatedItem;
    } catch (error) {
      console.error(`Error linking ${collection} to transaction:`, error);
      throw error;
    }
  }

  /**
   * Link Major Maintenance item to transaction
   * Updates the item with occurrence data and recalculates next due dates
   * Supports multiple transactions per item
   */
  async linkMajorMaintenanceToTransaction(itemId, transaction, markComplete = false) {
    const completeHandler = (updateData, item, linkedTransactions, totalActualAmount, transaction) => {
      // Use the most recent transaction date for next occurrence calculation
      const sortedTransactions = [...linkedTransactions].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );
      const mostRecentTransaction = sortedTransactions[0];

      // Calculate next due dates based on most recent transaction
      const inflationRate = 0.03; // 3% annual

      updateData.lastOccurrence = {
        date: mostRecentTransaction.date,
        amount: totalActualAmount,
        transactionIds: linkedTransactions.map(t => t.id),
        fiscalYear: mostRecentTransaction.fiscalYear
      };

      if (item.alertYear) {
        // Use alert year for planning reminder
        const alertDate = `${item.alertYear}-01-01`;
        const currentYear = new Date().getFullYear();
        const yearsUntil = item.alertYear - currentYear;
        const inflatedCost = totalActualAmount * Math.pow(1 + inflationRate, Math.max(0, yearsUntil));

        updateData.nextDueDateMin = alertDate;
        updateData.nextDueDateMax = alertDate;
        updateData.nextExpectedCost = inflatedCost;
      }

      updateData.completed = true;
    };

    return this.linkItemToTransaction('majorMaintenance', itemId, transaction, markComplete, completeHandler);
  }

  /**
   * Link CAPEX project to transaction
   * Updates the project with actual cost and completion details
   * Supports multiple transactions per project
   */
  async linkCapexProjectToTransaction(projectId, transaction, fiscalYear, markComplete = false) {
    // CAPEX always updates actualAmount, not just when marking complete
    // So we always pass a handler that sets actualAmount
    const capexHandler = (updateData, item, linkedTransactions, totalActualAmount, transaction) => {
      updateData.actualAmount = totalActualAmount;

      if (markComplete && !item.completed) {
        updateData.completed = true;
        updateData.completedDate = transaction.date;
        updateData.installDate = transaction.date;
      }
    };

    // Always run the handler for CAPEX (even when markComplete is false)
    return this.linkItemToTransaction('capex', projectId, transaction, true, capexHandler);
  }

  /**
   * Get Major Maintenance items for dashboard (upcoming within 10 years or overdue)
   * Uses intelligent alert timing: items show up earlier for longer lifecycle items
   */
  async getUpcomingMajorMaintenance() {
    try {
      const allItems = await this.getAllMajorMaintenance();
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const tenYearsFromNow = new Date(now);
      tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

      return allItems.filter(item => {
        // Include items with nextDueDateMin (from lastOccurrence)
        if (item.nextDueDateMin) {
          const nextDue = new Date(item.nextDueDateMin);
          nextDue.setHours(0, 0, 0, 0);

          // Include items that are overdue OR upcoming within 10 years
          return nextDue <= tenYearsFromNow;
        }

        // Also include items with alertYear (even without lastOccurrence)
        if (item.alertYear && item.trackingEnabled !== false) {
          const alertDate = new Date(item.alertYear, 0, 1); // January 1 of alert year
          alertDate.setHours(0, 0, 0, 0);

          // Include if alert year is within 10 years
          return alertDate <= tenYearsFromNow;
        }

        return false;
      });
    } catch (error) {
      console.error('Error getting upcoming Major Maintenance:', error);
      return [];
    }
  }

  /**
   * Delete ALL Capital Assets (CAPEX) - transactions with expenseType='CAPEX'
   */
  async deleteAllCapex() {
    try {
      console.log('📍 deleteAllCapex: Starting CAPEX deletion...');

      // CAPEX are stored as transactions with expenseType='CAPEX'
      const transactionsRef = collection(db, `clubs/${CLUB_ID}/transactions`);
      const capexQuery = query(transactionsRef, where('expenseType', '==', 'CAPEX'));
      console.log(`📍 deleteAllCapex: Querying transactions where expenseType='CAPEX'`);

      const capexSnapshot = await getDocs(capexQuery);
      console.log(`📍 deleteAllCapex: Found ${capexSnapshot.docs.length} CAPEX transactions`);

      if (capexSnapshot.docs.length === 0) {
        console.log('⚠️ deleteAllCapex: No CAPEX transactions found to delete');
        return { success: true, deletedCount: 0 };
      }

      // Log each transaction before deletion
      capexSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`📍 deleteAllCapex: Will delete - ${data.category || 'Unnamed'}: $${data.amount} (${data.date || 'no date'})`);
      });

      const batch = writeBatch(db);
      let deletedCount = 0;

      capexSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
      console.log(`✅ deleteAllCapex: Successfully deleted ${deletedCount} CAPEX transactions`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('❌ deleteAllCapex: Error during deletion:', error);
      throw error;
    }
  }

  /**
   * Clean up all test data (CAPEX, Major Maintenance, etc.)
   */
  async cleanupAllTestData() {
    try {
      const batch = writeBatch(db);
      let deletedCount = 0;

      // Delete all CAPEX projects
      const capexRef = collection(db, `clubs/${CLUB_ID}/capex`);
      const capexSnapshot = await getDocs(capexRef);
      capexSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      // Delete all Major Maintenance items
      const maintenanceRef = collection(db, `clubs/${CLUB_ID}/majorMaintenance`);
      const maintenanceSnapshot = await getDocs(maintenanceRef);
      maintenanceSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      // Delete all budgets except current year
      const budgetsRef = collection(db, `clubs/${CLUB_ID}/budgets`);
      const budgetsSnapshot = await getDocs(budgetsRef);
      const settings = await this.getSettings();
      budgetsSnapshot.docs.forEach((doc) => {
        if (doc.id !== `budget_${settings.fiscalYear}`) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      });

      await batch.commit();
      console.log(`🧹 Cleaned up ${deletedCount} test data documents`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      throw error;
    }
  }

  /**
   * Delete all data for a specific fiscal year
   */
  async deleteFiscalYear(fiscalYear) {
    try {
      const batch = writeBatch(db);
      let deletedCount = 0;

      // Delete all members for this fiscal year
      const membersRef = collection(db, `clubs/${CLUB_ID}/members`);
      const membersQuery = query(membersRef, where('fiscalYear', '==', fiscalYear));
      const membersSnapshot = await getDocs(membersQuery);
      membersSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      // Delete all transactions for this fiscal year
      const transactionsRef = collection(db, `clubs/${CLUB_ID}/transactions`);
      const transactionsQuery = query(transactionsRef, where('fiscalYear', '==', fiscalYear));
      const transactionsSnapshot = await getDocs(transactionsQuery);
      transactionsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      // Delete budget for this fiscal year
      const budgetRef = doc(db, `clubs/${CLUB_ID}/budgets`, `budget_${fiscalYear}`);
      const budgetSnap = await getDoc(budgetRef);
      if (budgetSnap.exists()) {
        batch.delete(budgetRef);
        deletedCount++;
      }

      // Delete CAPEX projects for this fiscal year
      const capexRef = collection(db, `clubs/${CLUB_ID}/capex`);
      const capexQuery = query(capexRef, where('fiscalYear', '==', fiscalYear));
      const capexSnapshot = await getDocs(capexQuery);
      capexSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      // Delete Major Maintenance items for this fiscal year
      const maintenanceRef = collection(db, `clubs/${CLUB_ID}/majorMaintenance`);
      const maintenanceQuery = query(maintenanceRef, where('fiscalYear', '==', fiscalYear));
      const maintenanceSnapshot = await getDocs(maintenanceQuery);
      maintenanceSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
      console.log(`🗑️ Deleted ${deletedCount} documents for FY${fiscalYear}`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error(`Error deleting fiscal year ${fiscalYear}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
const storage = new StorageService();
export default storage;
