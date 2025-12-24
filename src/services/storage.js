/**
 * Storage Service
 * 
 * Handles reading and writing data to JSON files in OneDrive folder.
 * For Windows: C:\Users\seant\OneDrive\LFST-Financial-Data\
 * 
 * Since we're running in browser, we use localStorage as the actual storage mechanism.
 * In production with Electron or Node.js backend, this would write actual files.
 * 
 * For now, this gives you full CRUD operations with persistent storage.
 * Later, we can add actual file system writing via Electron or Node.js backend.
 */

const STORAGE_PREFIX = 'lfst_finance_';

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
    this.dataPath = 'C:\\Users\\seant\\OneDrive\\LFST-Financial-Data\\';
  }

  /**
   * Initialize storage - create default data if doesn't exist
   */
  initialize() {
    if (this.initialized) return;

    // Check if data exists, if not, create defaults
    if (!this.getData('settings')) {
      this.setData('settings', DEFAULT_DATA.settings);
    }
    if (!this.getData('balance')) {
      this.setData('balance', DEFAULT_DATA.balance);
    }
    if (!this.getData('members')) {
      this.setData('members', DEFAULT_DATA.members);
    }
    if (!this.getData('transactions')) {
      this.setData('transactions', DEFAULT_DATA.transactions);
    }
    if (!this.getData('services')) {
      this.setData('services', DEFAULT_DATA.services);
    }

    this.initialized = true;
    console.log('✅ Storage initialized. Data will be saved to:', this.dataPath);
    console.log('💡 Note: Currently using browser localStorage. When running with Electron, files will be written to OneDrive.');
  }

  /**
   * Get data from storage
   */
  getData(key) {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in storage
   */
  setData(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      console.log(`💾 Saved ${key} to storage`);
      return true;
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all settings
   */
  getSettings() {
    return this.getData('settings') || DEFAULT_DATA.settings;
  }

  /**
   * Update settings
   */
  updateSettings(updates) {
    const current = this.getSettings();
    const updated = {
      ...current,
      ...updates,
      lastModified: new Date().toISOString()
    };
    this.setData('settings', updated);
    return updated;
  }

  /**
   * Get current balance
   */
  getBalance() {
    return this.getData('balance') || DEFAULT_DATA.balance;
  }

  /**
   * Update balance
   */
  updateBalance(amount) {
    const balance = {
      current: amount,
      lastUpdated: new Date().toISOString()
    };
    this.setData('balance', balance);
    return balance;
  }

  /**
   * Get all members
   */
  getMembers(fiscalYear = null) {
    const key = fiscalYear ? `members_${fiscalYear}` : 'members';
    return this.getData(key) || [];
  }

  /**
   * Add or update member
   */
  saveMember(member, fiscalYear = null) {
    const key = fiscalYear ? `members_${fiscalYear}` : 'members';
    const members = this.getData(key) || [];
    const existingIndex = members.findIndex(m => m.id === member.id);

    if (existingIndex >= 0) {
      members[existingIndex] = { ...member, updatedAt: new Date().toISOString() };
    } else {
      members.push({
        ...member,
        id: member.id || `member_${Date.now()}`,
        createdAt: new Date().toISOString()
      });
    }

    this.setData(key, members);
    return members;
  }

  /**
   * Delete member
   */
  deleteMember(memberId, fiscalYear = null) {
    const key = fiscalYear ? `members_${fiscalYear}` : 'members';
    const members = this.getData(key) || [];
    const filtered = members.filter(m => m.id !== memberId);
    this.setData(key, filtered);
    return filtered;
  }

  /**
   * Get all transactions
   */
  getTransactions(fiscalYear = null) {
    const key = fiscalYear ? `transactions_${fiscalYear}` : 'transactions';
    return this.getData(key) || [];
  }

  /**
   * Add transaction
   */
  addTransaction(transaction, fiscalYear = null) {
    const key = fiscalYear ? `transactions_${fiscalYear}` : 'transactions';
    const transactions = this.getData(key) || [];
    const newTransaction = {
      ...transaction,
      id: transaction.id || `txn_${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: 'treasurer' // Will be dynamic with auth
    };

    transactions.push(newTransaction);
    this.setData(key, transactions);

    // Balance is now calculated from Cash Flow projections, not stored incrementally

    return newTransaction;
  }

  /**
   * Update transaction
   */
  updateTransaction(transactionId, updates, fiscalYear = null) {
    const key = fiscalYear ? `transactions_${fiscalYear}` : 'transactions';
    const transactions = this.getData(key) || [];
    const index = transactions.findIndex(t => t.id === transactionId);

    if (index >= 0) {
      const oldTransaction = transactions[index];
      transactions[index] = {
        ...oldTransaction,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Balance is now calculated from Cash Flow projections, not stored incrementally

      this.setData(key, transactions);
      return transactions[index];
    }

    return null;
  }

  /**
   * Delete transaction
   */
  deleteTransaction(transactionId, fiscalYear = null) {
    const key = fiscalYear ? `transactions_${fiscalYear}` : 'transactions';
    const transactions = this.getData(key) || [];
    const transaction = transactions.find(t => t.id === transactionId);

    if (transaction) {
      // Balance is now calculated from Cash Flow projections, not stored incrementally

      const filtered = transactions.filter(t => t.id !== transactionId);
      this.setData(key, filtered);
      return filtered;
    }

    return transactions;
  }

  /**
   * Get all services
   */
  getServices() {
    return this.getData('services') || DEFAULT_DATA.services;
  }

  /**
   * Update service
   */
  updateService(serviceId, updates) {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === serviceId);
    
    if (index >= 0) {
      services[index] = {
        ...services[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.setData('services', services);
      return services[index];
    }
    
    return null;
  }

  /**
   * Export all data as JSON (for backup)
   */
  exportData() {
    return {
      exportDate: new Date().toISOString(),
      settings: this.getSettings(),
      balance: this.getBalance(),
      members: this.getMembers(),
      transactions: this.getTransactions(),
      services: this.getServices()
    };
  }

  /**
   * Import data from JSON (for restore)
   */
  importData(data) {
    if (data.settings) this.setData('settings', data.settings);
    if (data.balance) this.setData('balance', data.balance);
    if (data.members) this.setData('members', data.members);
    if (data.transactions) this.setData('transactions', data.transactions);
    if (data.services) this.setData('services', data.services);
    
    console.log('✅ Data imported successfully');
    return true;
  }

  /**
   * Clear all data (use with caution!)
   */
  clearAllData() {
    const keys = ['settings', 'balance', 'members', 'transactions', 'services'];
    keys.forEach(key => {
      localStorage.removeItem(STORAGE_PREFIX + key);
    });
    this.initialized = false;
    console.log('🗑️ All data cleared');
  }

  /**
   * Get storage statistics
   */
  getStats() {
    return {
      members: this.getMembers().length,
      transactions: this.getTransactions().length,
      services: this.getServices().length,
      balance: this.getBalance().current,
      lastModified: this.getSettings().lastModified
    };
  }

  /**
   * Get budget for fiscal year
   */
  getBudget(fiscalYear) {
    return this.getData(`budget_${fiscalYear}`);
  }

  /**
   * Save budget
   */
  saveBudget(budget) {
    this.setData(`budget_${budget.fiscalYear}`, {
      ...budget,
      updatedAt: new Date().toISOString()
    });
    return budget;
  }

  /**
   * Update specific month in budget
   */
  updateBudgetMonth(fiscalYear, month, updates) {
    const budget = this.getBudget(fiscalYear);
    if (!budget) return null;

    budget.monthlyBudgets[month] = { ...budget.monthlyBudgets[month], ...updates };
    budget.updatedAt = new Date().toISOString();
    this.saveBudget(budget);
    return budget;
  }

  /**
   * Get planned CAPEX projects for fiscal year
   */
  getPlannedCapex(fiscalYear) {
    return this.getData(`capex_${fiscalYear}`) || [];
  }

  /**
   * Save CAPEX project
   */
  saveCapexProject(project) {
    const capex = this.getPlannedCapex(project.fiscalYear);
    const existingIndex = capex.findIndex(p => p.id === project.id);

    if (existingIndex >= 0) {
      capex[existingIndex] = {
        ...project,
        updatedAt: new Date().toISOString()
      };
    } else {
      capex.push({
        ...project,
        id: project.id || `capex_${Date.now()}`,
        createdAt: new Date().toISOString()
      });
    }

    this.setData(`capex_${project.fiscalYear}`, capex);
    return capex;
  }

  /**
   * Delete CAPEX project
   */
  deleteCapexProject(fiscalYear, projectId) {
    const capex = this.getPlannedCapex(fiscalYear);
    const filtered = capex.filter(p => p.id !== projectId);
    this.setData(`capex_${fiscalYear}`, filtered);
    return filtered;
  }

  /**
   * Mark CAPEX project as completed
   */
  completeCapexProject(fiscalYear, projectId, actualAmount) {
    const capex = this.getPlannedCapex(fiscalYear);
    const project = capex.find(p => p.id === projectId);

    if (project) {
      project.completed = true;
      project.completedDate = new Date().toISOString();
      project.actualAmount = actualAmount || project.amount;
      this.setData(`capex_${fiscalYear}`, capex);
    }

    return capex;
  }
}

// Export singleton instance
const storage = new StorageService();
export default storage;
