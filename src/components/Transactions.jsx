import React, { useState, useEffect, useMemo } from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, sortTransactionsByDate, getCategoriesByType, getRevenueCategories } from '../utils/helpers';
import storage from '../services/storage';

function Transactions({ data, onRefresh, onEditTransaction, fiscalYear }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [yearFilter, setYearFilter] = useState('current'); // 'current' or 'all'
  const [allTransactions, setAllTransactions] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // Load all transactions when yearFilter changes
  useEffect(() => {
    const loadAllTransactions = async () => {
      if (yearFilter === 'all') {
        const allYears = await storage.getAllFiscalYears();
        setAvailableYears(allYears);

        const allTxns = [];
        for (const year of allYears) {
          const yearTxns = await storage.getTransactions(year);
          allTxns.push(...yearTxns);
        }
        setAllTransactions(allTxns);
      } else {
        setAllTransactions(data.transactions);
      }
    };
    loadAllTransactions();
  }, [yearFilter, data.transactions]);

  // Reset category filter when type changes
  useEffect(() => {
    setFilterCategory('all');
  }, [filterType]);

  const transactionsToFilter = yearFilter === 'all' ? allTransactions : data.transactions;

  const filteredTransactions = useMemo(() => {
    return sortTransactionsByDate(transactionsToFilter).filter(t => {
      // Enhanced search: description, category, notes, amount, year
      const searchLower = searchQuery.toLowerCase();
      const amountStr = t.amount?.toString() || '';
      const yearStr = new Date(t.date).getFullYear().toString();

      const matchesSearch = t.description?.toLowerCase().includes(searchLower) ||
                           t.category?.toLowerCase().includes(searchLower) ||
                           t.notes?.toLowerCase().includes(searchLower) ||
                           amountStr.includes(searchLower) ||
                           yearStr.includes(searchQuery);
      const matchesFilter = filterCategory === 'all' || t.category === filterCategory;

      // Type filter: revenue, opex, capex, ga
      let matchesType = true;
      if (filterType !== 'all') {
        if (filterType === 'revenue') {
          matchesType = t.type === 'revenue';
        } else if (filterType === 'opex') {
          matchesType = t.type === 'expense' && t.expenseType === 'OPEX';
        } else if (filterType === 'capex') {
          matchesType = t.type === 'expense' && t.expenseType === 'CAPEX';
        } else if (filterType === 'ga') {
          matchesType = t.type === 'expense' && t.expenseType === 'G&A';
        }
      }

      return matchesSearch && matchesFilter && matchesType;
    });
  }, [transactionsToFilter, searchQuery, filterCategory, filterType]);

  // Calculate totals - memoized to prevent recalculation on every render
  const { totalRevenue, totalExpenses, netTotal } = useMemo(() => {
    const revenue = filteredTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalRevenue: revenue,
      totalExpenses: expenses,
      netTotal: revenue - expenses
    };
  }, [filteredTransactions]);

  // Get categories based on selected type filter - memoized to prevent recalculation
  const availableCategories = useMemo(() => {
    if (filterType === 'all') {
      // Return all unique categories from all transactions
      const allCategories = [...new Set(data.transactions.map(t => t.category))].filter(Boolean);
      return allCategories;
    } else if (filterType === 'revenue') {
      return getRevenueCategories();
    } else if (filterType === 'opex') {
      return getCategoriesByType('OPEX');
    } else if (filterType === 'capex') {
      return getCategoriesByType('CAPEX');
    } else if (filterType === 'ga') {
      return getCategoriesByType('G&A');
    }
    return [];
  }, [filterType, data.transactions]);

  const handleDelete = async (id) => {
    // Find the transaction to check if it's linked to CAPEX or Major Maintenance
    const transaction = data.transactions.find(t => t.id === id);

    if (!transaction) {
      alert('Transaction not found');
      return;
    }

    const isLinkedToCapex = transaction.capexProjectId;
    const isLinkedToMajorMaintenance = transaction.majorMaintenanceItemId;

    const confirmMessage = isLinkedToCapex || isLinkedToMajorMaintenance
      ? 'This transaction is linked to a budgeted item. Deleting it will update the budget accordingly. Are you sure you want to delete?'
      : 'Are you sure you want to delete this transaction?';

    if (window.confirm(confirmMessage)) {
      try {
        // If linked to CAPEX or Major Maintenance, update the budget
        if (isLinkedToCapex || isLinkedToMajorMaintenance) {
          const budget = await storage.getBudget(fiscalYear);

          if (budget) {
            // Calculate the fiscal month for this transaction
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getMonth(); // 0-11 (Jan=0)
            const transactionYear = transactionDate.getFullYear();

            const fyStartYear = fiscalYear - 1;
            const fyEndYear = fiscalYear;

            let transactionFiscalMonth;
            if ((transactionYear === fyStartYear && transactionMonth >= 9) ||
                (transactionYear === fyEndYear && transactionMonth <= 8)) {
              if (transactionMonth >= 9) {
                transactionFiscalMonth = transactionMonth - 9;
              } else {
                transactionFiscalMonth = transactionMonth + 3;
              }

              // Remove the transaction amount from the budget
              if (isLinkedToCapex) {
                budget.monthlyBudgets[transactionFiscalMonth].capex -= transaction.amount;
                console.log(`✅ Removed CAPEX transaction amount ${transaction.amount} from month ${transactionFiscalMonth}`);
              } else if (isLinkedToMajorMaintenance) {
                budget.monthlyBudgets[transactionFiscalMonth].opex -= transaction.amount;
                console.log(`✅ Removed OPEX transaction amount ${transaction.amount} from month ${transactionFiscalMonth}`);
              }

              await storage.saveBudget(budget);
            }
          }

          // Update the linked CAPEX project or Major Maintenance item
          if (isLinkedToCapex) {
            const capexProjects = await storage.getPlannedCapex(fiscalYear);
            const project = capexProjects.find(p => p.id === transaction.capexProjectId);

            if (project && project.linkedTransactions) {
              // Remove this transaction from the project's linkedTransactions array
              const updatedTransactions = project.linkedTransactions.filter(t => t.id !== id);

              const updatedProject = {
                ...project,
                linkedTransactions: updatedTransactions
              };

              // If this was the last transaction, restore the original budget
              if (updatedTransactions.length === 0) {
                // Restore original budget to the original planned month
                const originalMonth = project.originalMonth ?? project.month;
                console.log(`🔄 Restoring original CAPEX budget (${project.amount}) to original month ${originalMonth}`);

                // Add the original budget amount back to the original month
                budget.monthlyBudgets[originalMonth].capex += project.amount;
                await storage.saveBudget(budget);

                // Reset the project's month back to the original
                updatedProject.month = originalMonth;
              }

              await storage.saveCapexProject(updatedProject);
              console.log(`✅ Removed transaction from CAPEX project's linked transactions`);
            }
          } else if (isLinkedToMajorMaintenance) {
            const maintenanceItems = await storage.getMajorMaintenanceItems(fiscalYear);
            const item = maintenanceItems.find(i => i.id === transaction.majorMaintenanceItemId);

            if (item && item.linkedTransactions) {
              // Remove this transaction from the item's linkedTransactions array
              const updatedTransactions = item.linkedTransactions.filter(t => t.id !== id);

              // If this was the last transaction, restore the original budget
              const updatedItem = {
                ...item,
                linkedTransactions: updatedTransactions
              };

              if (updatedTransactions.length === 0) {
                updatedItem.lastOccurrence = null;
                updatedItem.completed = false;

                // Restore original budget to the original planned month
                const originalMonth = item.originalMonth ?? item.month;
                console.log(`🔄 Restoring original budget (${item.budgetAmount}) to original month ${originalMonth}`);

                // Add the original budget amount back to the original month
                budget.monthlyBudgets[originalMonth].opex += item.budgetAmount;
                await storage.saveBudget(budget);

                // Reset the item's month back to the original
                updatedItem.month = originalMonth;
              }

              await storage.saveMajorMaintenanceItem(updatedItem);
              console.log(`✅ Removed transaction from Major Maintenance item's linked transactions`);
            }
          }
        }

        // Delete the transaction
        await storage.deleteTransaction(id, fiscalYear);
        console.log(`✅ Transaction deleted: ${id}`);

        // Refresh data
        onRefresh();
      } catch (error) {
        console.error('❌ Error deleting transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Transaction History</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search: description, amount, year, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
            />
          </div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="current">FY{fiscalYear} Only</option>
            <option value="all">All Years</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="revenue">Revenue</option>
            <option value="opex">OPEX</option>
            <option value="capex">CAPEX</option>
            <option value="ga">G&A</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 max-w-[200px] truncate"
          >
            <option value="all">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-transparent border-b border-slate-200 dark:border-[#334155]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#334155]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <p className="font-medium">No transactions found</p>
                    <p className="text-sm mt-1">Click the + button to add your first transaction</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  // Determine transaction type label
                  let typeLabel = 'Revenue';
                  let typeColor = 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200';

                  if (t.type === 'expense') {
                    if (t.expenseType === 'OPEX') {
                      // Check if this is a Major Maintenance (Major OPEX) transaction
                      if (t.isMajorMaintenance || t.majorMaintenanceItemId) {
                        typeLabel = 'Major OPEX';
                        typeColor = 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200';
                      } else {
                        typeLabel = 'OPEX';
                        typeColor = 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-200';
                      }
                    } else if (t.expenseType === 'CAPEX') {
                      typeLabel = 'CAPEX';
                      typeColor = 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200';
                    } else if (t.expenseType === 'G&A') {
                      typeLabel = 'G&A';
                      typeColor = 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200';
                    }
                  }

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(t.date)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 ${typeColor} rounded-full text-xs font-medium`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-[#f8fafc]">{t.description}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-full text-xs font-medium">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{t.paymentMethod}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={`font-semibold ${t.type === 'revenue' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                          {t.type === 'revenue' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEditTransaction(t)}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-300" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {filteredTransactions.length > 0 && (
                <tr className="bg-slate-100 dark:bg-slate-700 font-bold border-t-2 border-slate-300 dark:border-[#334155]">
                  <td colSpan="5" className="px-6 py-4 text-sm text-slate-900 dark:text-[#f8fafc] text-right">
                    TOTALS:
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="space-y-1">
                      <div className="text-emerald-600 dark:text-emerald-300">+{formatCurrency(totalRevenue)}</div>
                      <div className="text-rose-600 dark:text-rose-300">-{formatCurrency(totalExpenses)}</div>
                      <div className={`text-lg ${netTotal >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                        {netTotal >= 0 ? '+' : ''}{formatCurrency(netTotal)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Transactions;
