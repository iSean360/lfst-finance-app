import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, sortTransactionsByDate, getCategoriesByType, getRevenueCategories } from '../utils/helpers';
import storage from '../services/storage';

function Transactions({ data, onRefresh, onEditTransaction, fiscalYear }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Reset category filter when type changes
  useEffect(() => {
    setFilterCategory('all');
  }, [filterType]);

  const filteredTransactions = sortTransactionsByDate(data.transactions).filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.category?.toLowerCase().includes(searchQuery.toLowerCase());
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

  // Calculate totals
  const totalRevenue = filteredTransactions
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netTotal = totalRevenue - totalExpenses;

  // Get categories based on selected type filter
  const getFilteredCategories = () => {
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
  };

  const availableCategories = getFilteredCategories();

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      storage.deleteTransaction(id, fiscalYear);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Transaction History</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <p className="font-medium">No transactions found</p>
                    <p className="text-sm mt-1">Click the + button to add your first transaction</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  // Determine transaction type label
                  let typeLabel = 'Revenue';
                  let typeColor = 'bg-emerald-100 text-emerald-700';

                  if (t.type === 'expense') {
                    if (t.expenseType === 'OPEX') {
                      typeLabel = 'OPEX';
                      typeColor = 'bg-rose-100 text-rose-700';
                    } else if (t.expenseType === 'CAPEX') {
                      typeLabel = 'CAPEX';
                      typeColor = 'bg-amber-100 text-amber-700';
                    } else if (t.expenseType === 'G&A') {
                      typeLabel = 'G&A';
                      typeColor = 'bg-purple-100 text-purple-700';
                    }
                  }

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(t.date)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 ${typeColor} rounded-full text-xs font-medium`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{t.description}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{t.paymentMethod}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={`font-semibold ${t.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'revenue' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEditTransaction(t)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1 hover:bg-rose-100 rounded transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {filteredTransactions.length > 0 && (
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td colSpan="5" className="px-6 py-4 text-sm text-slate-900 text-right">
                    TOTALS:
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="space-y-1">
                      <div className="text-emerald-600">+{formatCurrency(totalRevenue)}</div>
                      <div className="text-rose-600">-{formatCurrency(totalExpenses)}</div>
                      <div className={`text-lg ${netTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
