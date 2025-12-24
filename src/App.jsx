import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Users, Plus,
  FileText, Download, Settings, AlertCircle, BarChart3, Database, Receipt, Calendar
} from 'lucide-react';
import storage from './services/storage';
import { calculateMetrics } from './utils/helpers';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Members from './components/Members';
import Reports from './components/Reports';
import CashFlow from './components/CashFlow';
import ProfitLoss from './components/ProfitLoss';
import YearEndReport from './components/YearEndReport';
import ImportData from './components/ImportData';
import TransactionModal from './components/TransactionModal';
import './App.css';

function App() {
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

  // Initialize storage and load data
  useEffect(() => {
    console.log('🚀 Initializing Lockridge Forest Finance App...');
    storage.initialize();
    loadData();
  }, []);

  // Detect all available fiscal years
  const detectAvailableYears = () => {
    const years = new Set();

    // Check for budgets in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('lfst_finance_budget_')) {
        const year = parseInt(key.replace('lfst_finance_budget_', ''));
        if (!isNaN(year)) years.add(year);
      }
    }

    return Array.from(years).sort((a, b) => b - a); // Descending order
  };

  // Load all data from storage
  const loadData = (fiscalYear = null) => {
    setIsLoading(true);
    try {
      const settings = storage.getSettings();

      // Determine which year to load
      const yearToLoad = fiscalYear || selectedFiscalYear || settings.fiscalYear;

      // Detect available years
      const years = detectAvailableYears();
      setAvailableYears(years);

      // Set selected year if not already set
      if (!selectedFiscalYear) {
        setSelectedFiscalYear(yearToLoad);
      }

      // Load year-specific data
      const yearKey = `_${yearToLoad}`;
      const members = JSON.parse(localStorage.getItem(`lfst_finance_members${yearKey}`) || '[]') || storage.getMembers();
      const transactions = JSON.parse(localStorage.getItem(`lfst_finance_transactions${yearKey}`) || '[]') || storage.getTransactions();

      // Load current year services and balance
      const balance = storage.getBalance();
      const services = storage.getServices();

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
  const refreshData = () => {
    loadData();
  };

  // Calculate metrics
  const metrics = calculateMetrics(data);

  // Handle transaction save (both add and edit)
  const handleSaveTransaction = (transaction) => {
    console.log('\n💾 SAVING TRANSACTION:', {
      type: transaction.type,
      expenseType: transaction.expenseType,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      isEdit: !!editingTransaction,
      fiscalYear: selectedFiscalYear
    });

    if (editingTransaction) {
      storage.updateTransaction(editingTransaction.id, transaction, selectedFiscalYear);
      console.log('✅ Transaction updated:', editingTransaction.id);
    } else {
      const result = storage.addTransaction(transaction, selectedFiscalYear);
      console.log('✅ Transaction added with ID:', result.id);
    }

    console.log('🔄 Refreshing data...');
    refreshData();
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Lockridge Forest S&T
                </h1>
                <p className="text-sm text-slate-600">
                  Financial Management • FY{data.settings?.fiscalYear || 2026}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Fiscal Year Selector */}
              {availableYears.length > 1 && (
                <>
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
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>
                          FY{year} {year === data.settings?.fiscalYear ? '(Current)' : '(Archived)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-px h-12 bg-slate-200"></div>
                </>
              )}

              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                  Current Balance
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  ${metrics.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-600">Treasurer</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                  Edit Mode
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'cashflow', label: 'Cash Flow', icon: BarChart3 },
              { id: 'pl', label: 'P&L', icon: Receipt },
              { id: 'yearend', label: 'Year-End Report', icon: Calendar },
              { id: 'transactions', label: 'Transactions', icon: FileText },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'reports', label: 'Reports', icon: Download },
              { id: 'import', label: 'Data Management', icon: Database },
            ].map(nav => {
              const Icon = nav.icon;
              const isActive = activeView === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveView(nav.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                    isActive 
                      ? 'text-blue-700 bg-blue-50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {nav.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
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
        {activeView === 'reports' && (
          <Reports
            data={data}
            metrics={metrics}
          />
        )}
        {activeView === 'import' && (
          <ImportData
            onRefresh={refreshData}
          />
        )}
      </main>

      {/* Storage Info Banner */}
      <div className="fixed bottom-4 left-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shadow-sm max-w-sm">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900">
            <p className="font-semibold mb-0.5">Data Storage Active</p>
            <p className="text-blue-700">
              Changes saved to: <span className="font-mono">C:\Users\seant\OneDrive\LFST-Financial-Data\</span>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      {activeView !== 'reports' && (
        <button
          onClick={() => setShowTransactionModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all flex items-center justify-center group"
          title="Add New Transaction"
        >
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform" />
        </button>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={() => {
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
        />
      )}
    </div>
  );
}

export default App;
