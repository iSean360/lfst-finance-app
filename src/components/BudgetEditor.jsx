import React, { useState } from 'react';
import { X, DollarSign, Save } from 'lucide-react';
import { formatCurrency, MONTHS, getFiscalMonthName } from '../utils/helpers';

function BudgetEditor({ budget, fiscalYear, startingBalance, onSave, onClose }) {
  const [formData, setFormData] = useState(
    budget || {
      id: `budget_fy${fiscalYear}`,
      fiscalYear,
      startingBalance,
      lowBalanceThreshold: 5000,
      monthlyBudgets: Array.from({ length: 12 }, (_, i) => {
        const monthInfo = getFiscalMonthName(i, fiscalYear);
        return {
          month: i,
          monthName: monthInfo.monthName,
          calendarDate: monthInfo.calendarDate,
          revenue: 0,
          opex: 0,
          capex: 0,
          ga: 0,
          notes: ''
        };
      }),
      createdAt: new Date().toISOString()
    }
  );

  const [errors, setErrors] = useState([]);

  const updateMonth = (monthIdx, field, value) => {
    const updated = { ...formData };
    // Allow empty string or parse as float
    updated.monthlyBudgets[monthIdx][field] = value === '' ? 0 : parseFloat(value) || 0;
    setFormData(updated);
  };

  const calculateMonthlyNet = (month) => {
    return month.revenue - month.opex - month.capex - month.ga;
  };

  const calculateYearlyTotals = () => {
    const totals = {
      revenue: 0,
      opex: 0,
      capex: 0,
      ga: 0,
      net: 0
    };

    formData.monthlyBudgets.forEach(month => {
      totals.revenue += month.revenue;
      totals.opex += month.opex;
      totals.capex += month.capex;
      totals.ga += month.ga;
    });

    totals.net = totals.revenue - totals.opex - totals.capex - totals.ga;
    return totals;
  };

  const handleSave = () => {
    const validationErrors = [];

    if (formData.startingBalance < 0) {
      validationErrors.push('Starting balance cannot be negative');
    }

    if (formData.lowBalanceThreshold < 0) {
      validationErrors.push('Low balance threshold cannot be negative');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSave(formData);
  };

  const totals = calculateYearlyTotals();
  const projectedEndingBalance = formData.startingBalance + totals.net;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Budget Editor</h2>
              <p className="text-sm text-slate-600">Fiscal Year {fiscalYear}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-rose-900 mb-2">Please fix the following errors:</p>
                <ul className="text-sm text-rose-700 list-disc pl-5 space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Settings */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-4">Budget Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Starting Balance (Oct {fiscalYear - 1})
                  </label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.startingBalance}
                      onChange={(e) => setFormData({ ...formData, startingBalance: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Low Balance Warning Threshold
                  </label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.lowBalanceThreshold}
                      onChange={(e) => setFormData({ ...formData, lowBalanceThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-3">Year Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Starting Balance</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(formData.startingBalance)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Projected Net (Year)</p>
                  <p className={`text-xl font-bold ${totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Projected Ending Balance</p>
                  <p className={`text-xl font-bold ${projectedEndingBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                    {formatCurrency(projectedEndingBalance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Budgets */}
            <div>
              <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-4">Monthly Budgets</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Month</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Revenue</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">OPEX</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">CAPEX</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">G&A</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {formData.monthlyBudgets.map((month, idx) => {
                      const net = calculateMonthlyNet(month);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {month.monthName}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={month.revenue}
                              onChange={(e) => updateMonth(idx, 'revenue', e.target.value)}
                              className="w-full px-3 py-2 text-sm text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={month.opex}
                              onChange={(e) => updateMonth(idx, 'opex', e.target.value)}
                              className="w-full px-3 py-2 text-sm text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={month.capex}
                              className="w-full px-3 py-2 text-sm text-right border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                              placeholder="0.00"
                              readOnly
                              title="CAPEX is managed through Projects - not directly editable"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={month.ga}
                              onChange={(e) => updateMonth(idx, 'ga', e.target.value)}
                              className="w-full px-3 py-2 text-sm text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-semibold ${
                            net >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {net >= 0 ? '+' : ''}{formatCurrency(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">TOTAL</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600">{formatCurrency(totals.revenue)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-rose-600">{formatCurrency(totals.opex)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-rose-600">{formatCurrency(totals.capex)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-rose-600">{formatCurrency(totals.ga)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${
                        totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Budget
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetEditor;
