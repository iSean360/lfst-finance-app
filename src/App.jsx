import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Users, Plus,
  FileText, Download, Settings, AlertCircle, BarChart3, Database, Receipt, Calendar, FileCode2, Wrench, ChevronLeft, ChevronRight, Home, BookOpen, Moon, Sun, LogOut
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import storage from './services/storage';
import { calculateMetrics } from './utils/helpers';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Members from './components/Members';
import CashFlow from './components/CashFlow';
import ProfitLoss from './components/ProfitLoss';
import YearEndReport from './components/YearEndReport';
import AppArchitecture from './components/AppArchitecture';
import FeatureGuide from './components/FeatureGuide';
import TransactionModal from './components/TransactionModal';
import Login from './components/Login';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState({
    settings: null,
    balance: null,
    members: [],
    transactions: [],
    services: []
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);
  const [showFeatureGuide, setShowFeatureGuide] = useState(false);
  const [showDeleteYearModal, setShowDeleteYearModal] = useState(false);
  const [deleteYearConfirmText, setDeleteYearConfirmText] = useState('');
  const [yearToDelete, setYearToDelete] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Initialize storage and load data
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing Lockridge Forest Finance App...');
      await storage.initialize();

      await loadData();
    };
    initializeApp();
  }, []);

  // Detect all available fiscal years based on actual data
  const detectAvailableYears = async () => {
    const years = new Set();

    try {
      const allTransactions = await storage.getTransactions();
      allTransactions.forEach(txn => {
        if (txn.fiscalYear) years.add(txn.fiscalYear);
      });

      const allMembers = await storage.getMembers();
      allMembers.forEach(member => {
        if (member.fiscalYear) years.add(member.fiscalYear);
      });

      // Always include the current year from settings
      const settings = await storage.getSettings();
      if (settings.fiscalYear) years.add(settings.fiscalYear);

      // If no years found, default to 2026
      if (years.size === 0) {
        years.add(2026);
      }
    } catch (error) {
      console.error('Error detecting years:', error);
      years.add(2026); // Fallback to 2026
    }

    return Array.from(years).sort((a, b) => b - a); // Descending order
  };

  // Load all data from storage
  const loadData = async (fiscalYear = null) => {
    setIsLoading(true);
    try {
      const settings = await storage.getSettings();

      // Determine which year to load
      const yearToLoad = fiscalYear || selectedFiscalYear || settings.fiscalYear;

      // Detect available years
      const years = await detectAvailableYears();
      setAvailableYears(years);

      // Set selected year if not already set
      if (!selectedFiscalYear) {
        setSelectedFiscalYear(yearToLoad);
      }

      // Load year-specific data from Firestore
      const members = await storage.getMembers(yearToLoad);
      const transactions = await storage.getTransactions(yearToLoad);

      // Load current year services and balance
      const balance = await storage.getBalance();
      const services = await storage.getServices();

      // Update settings with selected year
      const updatedSettings = { ...settings, fiscalYear: yearToLoad };

      setData({
        settings: updatedSettings,
        balance,
        members,
        transactions,
        services
      });

      console.log(`✅ Data loaded successfully for FY${yearToLoad}`);
      console.log('📊 Available years:', years);
      console.log('📊 Stats:', { members: members.length, transactions: transactions.length });
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data from storage
  const refreshData = async () => {
    await loadData();
  };

  // Initiate delete fiscal year process
  const handleDeleteFiscalYear = async (year) => {
    setYearToDelete(year);
    setDeleteYearConfirmText('');
    setShowDeleteYearModal(true);
  };

  // Execute fiscal year deletion after confirmation
  const executeDeleteFiscalYear = async () => {
    if (deleteYearConfirmText !== `DELETE ${yearToDelete}`) {
      alert('⚠️ Confirmation text does not match. Please type exactly: DELETE ' + yearToDelete);
      return;
    }

    try {
      const result = await storage.deleteFiscalYear(yearToDelete);

      // If we deleted the settings fiscal year, reset to 2026
      const currentSettings = await storage.getSettings();
      if (currentSettings.fiscalYear === yearToDelete) {
        await storage.updateSettings({ fiscalYear: 2026 });
      }

      alert(`✅ Successfully deleted ${result.deletedCount} documents for FY${yearToDelete}`);
      setShowDeleteYearModal(false);
      setDeleteYearConfirmText('');
      setYearToDelete(null);

      // Reload with 2026 as the safe default
      await loadData(2026);
      setSelectedFiscalYear(2026);
    } catch (error) {
      console.error('Error deleting fiscal year:', error);
      alert('❌ Failed to delete fiscal year. Please try again.');
    }
  };

  // Calculate metrics
  // Calculate metrics with async budget loading
  const [metrics, setMetrics] = useState({
    currentBalance: 0,
    balance: { current: 0 },
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    annualServiceCosts: 0,
    totalMembers: 0,
    paidMembers: 0,
    unpaidMembers: 0,
    memberRevenue: 0,
    compliance: null,
    projectedYearEnd: 0
  });

  useEffect(() => {
    const calculateAndSetMetrics = async () => {
      const budget = await storage.getBudget(data.settings.fiscalYear);
      const calculatedMetrics = calculateMetrics(data, budget);
      setMetrics(calculatedMetrics);
    };

    if (data.settings?.fiscalYear) {
      calculateAndSetMetrics();
    }
  }, [data]);

  // Handle transaction save (both add and edit)
  const handleSaveTransaction = async (transaction) => {
    console.log('\n💾 SAVING TRANSACTION:', {
      type: transaction.type,
      expenseType: transaction.expenseType,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      majorMaintenanceItemId: transaction.majorMaintenanceItemId,
      isEdit: !!editingTransaction,
      fiscalYear: selectedFiscalYear
    });

    // Clean transaction data - remove undefined, empty strings, and temporary form fields
    const cleanedTransaction = {};
    Object.keys(transaction).forEach(key => {
      const value = transaction[key];
      // Skip undefined, empty strings, and form-only fields
      if (value !== undefined && value !== '' &&
          !['customCategory', 'customPaymentMethod', 'programsIncomeSubCategory'].includes(key)) {
        cleanedTransaction[key] = value;
      }
    });

    console.log('🧹 Cleaned transaction data:', cleanedTransaction);

    try {
      let savedTransaction;
      if (editingTransaction) {
        await storage.updateTransaction(editingTransaction.id, cleanedTransaction, selectedFiscalYear);
        console.log('✅ Transaction updated:', editingTransaction.id);
        savedTransaction = { ...cleanedTransaction, id: editingTransaction.id };
      } else {
        const result = await storage.addTransaction(cleanedTransaction, selectedFiscalYear);
        console.log('✅ Transaction added with ID:', result.id);
        savedTransaction = result;
      }

      // If linked to Major Maintenance item, update the item and budget
      if (cleanedTransaction.majorMaintenanceItemId && cleanedTransaction.type === 'expense' && cleanedTransaction.expenseType === 'OPEX') {
        console.log('🔗 Linking transaction to Major Maintenance item:', cleanedTransaction.majorMaintenanceItemId);

        // Get the Major Maintenance item before updating it (check ALL items, not just current fiscal year)
        const allMajorMaintenanceItems = await storage.getAllMajorMaintenance();
        const maintenanceItem = allMajorMaintenanceItems.find(item => item.id === cleanedTransaction.majorMaintenanceItemId);

        if (!maintenanceItem) {
          console.error('❌ Major Maintenance item not found:', cleanedTransaction.majorMaintenanceItemId);
          throw new Error('Major Maintenance item not found');
        }

        // Check if this is the first transaction for this item
        const isFirstTransaction = !maintenanceItem.linkedTransactions || maintenanceItem.linkedTransactions.length === 0;

        // Update the Major Maintenance item (pass markItemComplete flag)
        await storage.linkMajorMaintenanceToTransaction(
          cleanedTransaction.majorMaintenanceItemId,
          savedTransaction,
          cleanedTransaction.markItemComplete || false
        );
        console.log('✅ Major Maintenance item updated with transaction');

        // Update budget: split transactions across their actual months
        const budget = await storage.getBudget(selectedFiscalYear);
        if (budget && maintenanceItem) {
          const transactionDate = new Date(savedTransaction.date);
          const transactionMonth = transactionDate.getMonth(); // 0-11 (Jan=0)
          const transactionYear = transactionDate.getFullYear();

          // Calculate fiscal month (Oct=0, Nov=1, ..., Sep=11)
          const fyStartYear = selectedFiscalYear - 1;
          const fyEndYear = selectedFiscalYear;

          let transactionFiscalMonth;
          if ((transactionYear === fyStartYear && transactionMonth >= 9) ||
              (transactionYear === fyEndYear && transactionMonth <= 8)) {
            if (transactionMonth >= 9) {
              transactionFiscalMonth = transactionMonth - 9;
            } else {
              transactionFiscalMonth = transactionMonth + 3;
            }

            const plannedMonth = maintenanceItem.month;

            // For first transaction: remove original budget from planned month and update item's month
            if (isFirstTransaction) {
              console.log(`📅 Removing original Major Maintenance budget (${maintenanceItem.budgetAmount}) from planned month ${plannedMonth}`);
              budget.monthlyBudgets[plannedMonth].opex -= maintenanceItem.budgetAmount;

              // Update the maintenance item's month to the transaction's month
              // Store originalMonth so we can restore budget if transactions are deleted
              if (plannedMonth !== transactionFiscalMonth) {
                console.log(`📍 Moving Major Maintenance item from month ${plannedMonth} to month ${transactionFiscalMonth}`);
                await storage.saveMajorMaintenanceItem({
                  ...maintenanceItem,
                  month: transactionFiscalMonth,
                  originalMonth: maintenanceItem.originalMonth ?? plannedMonth // Preserve original planned month
                });
              } else {
                // Even if months are the same, store originalMonth for future reference
                await storage.saveMajorMaintenanceItem({
                  ...maintenanceItem,
                  originalMonth: maintenanceItem.originalMonth ?? plannedMonth
                });
              }
            }

            // Update this transaction's amount in its month
            if (editingTransaction) {
              // For edits: calculate the delta (new amount - old amount)
              const oldAmount = editingTransaction.amount || 0;
              const amountDelta = savedTransaction.amount - oldAmount;
              console.log(`💰 Updating Major Maintenance transaction in month ${transactionFiscalMonth}: old=${oldAmount}, new=${savedTransaction.amount}, delta=${amountDelta}`);
              budget.monthlyBudgets[transactionFiscalMonth].opex += amountDelta;
            } else {
              // For new transactions: add the full amount
              console.log(`💰 Adding Major Maintenance transaction (${savedTransaction.amount}) to month ${transactionFiscalMonth}`);
              budget.monthlyBudgets[transactionFiscalMonth].opex += savedTransaction.amount;
            }

            await storage.saveBudget(budget);
            console.log('✅ Budget updated to reflect actual transaction month and amount');
          }
        }
      }

      // If linked to CAPEX project, update the project and budget
      if (cleanedTransaction.capexProjectId && cleanedTransaction.type === 'expense' && cleanedTransaction.expenseType === 'CAPEX') {
        console.log('🔗 Linking transaction to CAPEX project:', cleanedTransaction.capexProjectId);

        // Get the CAPEX project before updating it
        const capexProjects = await storage.getPlannedCapex(selectedFiscalYear);
        const capexProject = capexProjects.find(p => p.id === cleanedTransaction.capexProjectId);

        // Check if this is the first transaction for this project
        const isFirstTransaction = !capexProject.linkedTransactions || capexProject.linkedTransactions.length === 0;

        // Update the CAPEX project (pass markItemComplete flag)
        const updatedProject = await storage.linkCapexProjectToTransaction(
          cleanedTransaction.capexProjectId,
          savedTransaction,
          selectedFiscalYear,
          cleanedTransaction.markItemComplete || false
        );
        console.log('✅ CAPEX project updated with transaction');

        // Update budget: split transactions across their actual months
        const budget = await storage.getBudget(selectedFiscalYear);
        if (budget && capexProject) {
          const transactionDate = new Date(savedTransaction.date);
          const transactionMonth = transactionDate.getMonth(); // 0-11 (Jan=0)
          const transactionYear = transactionDate.getFullYear();

          // Calculate fiscal month (Oct=0, Nov=1, ..., Sep=11)
          const fyStartYear = selectedFiscalYear - 1;
          const fyEndYear = selectedFiscalYear;

          let transactionFiscalMonth;
          if ((transactionYear === fyStartYear && transactionMonth >= 9) ||
              (transactionYear === fyEndYear && transactionMonth <= 8)) {
            if (transactionMonth >= 9) {
              transactionFiscalMonth = transactionMonth - 9;
            } else {
              transactionFiscalMonth = transactionMonth + 3;
            }

            const plannedMonth = capexProject.month;

            // For first transaction: remove original budget from planned month and update project's month
            if (isFirstTransaction) {
              console.log(`📅 Removing original CAPEX budget (${capexProject.amount}) from planned month ${plannedMonth}`);
              budget.monthlyBudgets[plannedMonth].capex -= capexProject.amount;

              // Update the CAPEX project's month to the transaction's month
              // Store originalMonth so we can restore budget if transactions are deleted
              if (plannedMonth !== transactionFiscalMonth) {
                console.log(`📍 Moving CAPEX project from month ${plannedMonth} to month ${transactionFiscalMonth}`);
                await storage.saveCapexProject({
                  ...capexProject,
                  month: transactionFiscalMonth,
                  originalMonth: capexProject.originalMonth ?? plannedMonth // Preserve original planned month
                });
              } else {
                // Even if months are the same, store originalMonth for future reference
                await storage.saveCapexProject({
                  ...capexProject,
                  originalMonth: capexProject.originalMonth ?? plannedMonth
                });
              }
            }

            // Update this transaction's amount in its month
            if (editingTransaction) {
              // For edits: calculate the delta (new amount - old amount)
              const oldAmount = editingTransaction.amount || 0;
              const amountDelta = savedTransaction.amount - oldAmount;
              console.log(`💰 Updating CAPEX transaction in month ${transactionFiscalMonth}: old=${oldAmount}, new=${savedTransaction.amount}, delta=${amountDelta}`);
              budget.monthlyBudgets[transactionFiscalMonth].capex += amountDelta;
            } else {
              // For new transactions: add the full amount
              console.log(`💰 Adding CAPEX transaction (${savedTransaction.amount}) to month ${transactionFiscalMonth}`);
              budget.monthlyBudgets[transactionFiscalMonth].capex += savedTransaction.amount;
            }

            await storage.saveBudget(budget);
            console.log('✅ Budget updated to reflect actual transaction month and amount');
          }
        }
      }

      console.log('🔄 Refreshing data...');
      await refreshData();
      setShowTransactionModal(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('❌ Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to sign out?');
    if (confirmLogout) {
      try {
        await signOut(auth);
        // User will be redirected to login automatically by onAuthStateChanged
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
      }
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <Login onLogin={() => setAuthLoading(false)} />;
  }

  // Show loading spinner while data loads
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading financial data...</p>
        </div>
      </div>
    );
  }

  // Navigation items in the requested order
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'cashflow', label: 'Cash Flow', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'pl', label: 'P&L', icon: Receipt },
    { id: 'yearend', label: 'Year-End Report', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:bg-[#0f172a] flex transition-colors">
      {/* Sidebar Navigation */}
      <aside
        className={`bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-[#334155] h-screen sticky top-0 flex flex-col transition-all duration-300 flex-shrink-0 ${sidebarCollapsed && !sidebarHovered ? 'w-16' : 'w-56'}`}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        {/* Logo & Title */}
        <div className={`p-3 border-b border-slate-200 dark:border-slate-700 ${sidebarCollapsed && !sidebarHovered ? 'flex justify-center' : ''}`}>
          {sidebarCollapsed && !sidebarHovered ? (
            <div
              className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg cursor-pointer group relative"
              title="Lockridge Forest S&T"
            >
              <DollarSign className="w-5 h-5 text-white" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Lockridge Forest S&T
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-xs font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: 'Georgia, serif' }}>
                  LFST
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  FY{data.settings?.fiscalYear || 2026}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navigationItems.map(nav => {
            const Icon = nav.icon;
            const isActive = activeView === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setActiveView(nav.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all relative group ${
                  isActive
                    ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-slate-700'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title={(sidebarCollapsed && !sidebarHovered) ? nav.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!(sidebarCollapsed && !sidebarHovered) && (
                  <span className="text-sm font-medium whitespace-nowrap">{nav.label}</span>
                )}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                )}
                {sidebarCollapsed && !sidebarHovered && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {nav.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Hover hint at bottom */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="text-center text-xs text-slate-400 dark:text-slate-500">
            {sidebarCollapsed && !sidebarHovered ? '→' : 'Hover to collapse'}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Fiscal Year Selector */}
                {availableYears.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold block mb-1">
                        Fiscal Year
                      </label>
                      <select
                        value={selectedFiscalYear || data.settings?.fiscalYear}
                        onChange={(e) => {
                          const year = parseInt(e.target.value);
                          setSelectedFiscalYear(year);
                          loadData(year);
                        }}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>
                            FY{year} {year === data.settings?.fiscalYear ? '(Current)' : '(Archived)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleDeleteFiscalYear(selectedFiscalYear || data.settings?.fiscalYear)}
                      className="mt-5 px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      title={`Delete FY${selectedFiscalYear || data.settings?.fiscalYear}`}
                    >
                      Delete Year
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
                    Current Balance
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    ${metrics.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors shadow-sm"
                  title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setShowFeatureGuide(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                  title="Open Feature Guide"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Help</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 rounded-lg shadow-sm hover:shadow-md transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
                <div className="flex flex-col gap-1 relative group">
                  <span className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    {user?.email || 'Treasurer'}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                    Edit Mode
                  </span>
                  <button
                    onClick={() => setShowArchitectureModal(true)}
                    className="absolute -bottom-6 right-0 text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    App Architecture
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-y-auto dark:bg-slate-900 transition-colors">
          {activeView === 'dashboard' && (
            <Dashboard
              metrics={metrics}
              data={data}
              setActiveView={setActiveView}
              onRefresh={refreshData}
            />
          )}
          {activeView === 'cashflow' && (
            <CashFlow
              data={data}
              metrics={metrics}
              onRefresh={refreshData}
            />
          )}
          {activeView === 'pl' && (
            <ProfitLoss
              data={data}
              fiscalYear={selectedFiscalYear}
            />
          )}
          {activeView === 'yearend' && (
            <YearEndReport
              data={data}
              fiscalYear={selectedFiscalYear}
            />
          )}
          {activeView === 'transactions' && (
            <Transactions
              data={data}
              onRefresh={refreshData}
              onEditTransaction={handleEditTransaction}
              fiscalYear={selectedFiscalYear}
            />
          )}
          {activeView === 'members' && (
            <Members
              data={data}
              onRefresh={refreshData}
              fiscalYear={selectedFiscalYear}
            />
          )}
        </main>

        {/* Storage Info Banner */}
        <div className="fixed bottom-3 left-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 shadow-sm max-w-sm text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-blue-900">
              <p className="font-semibold">Data Storage Active</p>
              <p className="text-blue-700">
                Saved to: <span className="font-mono text-xs">C:\Users\seant\OneDrive\LFST-Financial-Data\</span>
              </p>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowTransactionModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all flex items-center justify-center group"
          title="Add New Transaction"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <TransactionModal
          transaction={editingTransaction}
          fiscalYear={selectedFiscalYear}
          onClose={() => {
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          setActiveView={setActiveView}
        />
      )}

      {/* App Architecture Modal */}
      {showArchitectureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">App Architecture</h2>
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AppArchitecture />
            </div>
          </div>
        </div>
      )}

      {/* Delete Fiscal Year Modal */}
      {showDeleteYearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-red-200 bg-red-50">
              <h2 className="text-xl font-bold text-red-900">⚠️ Delete Fiscal Year {yearToDelete}</h2>
              <button
                onClick={() => {
                  setShowDeleteYearModal(false);
                  setDeleteYearConfirmText('');
                  setYearToDelete(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-900">DANGER: This action cannot be undone!</p>
                    <p className="text-sm text-red-800 mt-1">
                      You are about to permanently delete ALL data for Fiscal Year {yearToDelete}, including:
                    </p>
                    <ul className="text-sm text-red-800 mt-2 ml-4 list-disc space-y-1">
                      <li>All members</li>
                      <li>All transactions</li>
                      <li>Budget information</li>
                      <li>CAPEX projects</li>
                      <li>Major maintenance items</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  To confirm, type: <span className="font-mono bg-slate-100 px-2 py-1 rounded">DELETE {yearToDelete}</span>
                </label>
                <input
                  type="text"
                  value={deleteYearConfirmText}
                  onChange={(e) => setDeleteYearConfirmText(e.target.value)}
                  placeholder={`DELETE ${yearToDelete}`}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteYearModal(false);
                    setDeleteYearConfirmText('');
                    setYearToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteFiscalYear}
                  disabled={deleteYearConfirmText !== `DELETE ${yearToDelete}`}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Guide Modal */}
      {showFeatureGuide && (
        <FeatureGuide onClose={() => setShowFeatureGuide(false)} />
      )}
    </div>
  );
}

export default App;
