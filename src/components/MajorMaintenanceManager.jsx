import React, { useState } from 'react';
import { X, Plus, Save, Trash2, CheckCircle, Edit2, DollarSign, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { formatCurrency, getFiscalMonthName } from '../utils/helpers';
import storage from '../services/storage';
import {
  INFLATION_RATE,
  SUBCATEGORY_NAME,
  calculateInflatedCost,
  calculateNextDueDates,
  calculateYearsUntil
} from '../constants/majorMaintenance';

// Helper to get status for dashboard display
const getMaintenanceStatus = (item) => {
  if (!item.lastOccurrence || !item.nextDueDateMin) {
    return null;
  }

  const yearsUntil = calculateYearsUntil(item.nextDueDateMin);

  if (yearsUntil === null) return null;
  if (yearsUntil < 0) return { status: 'overdue', yearsUntil: 0 };
  if (yearsUntil <= 1) return { status: 'critical', yearsUntil };
  if (yearsUntil <= 2) return { status: 'warning', yearsUntil };
  return { status: 'good', yearsUntil };
};

function MajorMaintenanceManager({ items, fiscalYear, budget, onSave, onClose }) {
  const [itemList, setItemList] = useState(items || []);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleAddNew = () => {
    setEditingItem({
      id: null,
      name: '',
      description: '',
      budgetAmount: 0,
      month: 0,
      fiscalYear,
      recurrenceYearsMin: 7,
      recurrenceYearsMax: 10,
      lastOccurrence: null,
      nextDueDateMin: null,
      nextDueDateMax: null,
      nextExpectedCost: null,
      manualNextDate: null,
      manualExpectedCost: null,
      notes: '',
      isMajorMaintenance: true,
      completed: false
    });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item });
    setShowForm(true);
  };

  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this Major Maintenance item? This will also remove it from the budget.')) {
      // Delete from storage
      storage.deleteMajorMaintenanceItem(fiscalYear, itemId);

      // Update local state
      const updated = itemList.filter(i => i.id !== itemId);
      setItemList(updated);

      // DON'T update budget here - let handleSaveAll do it to avoid double subtraction
      // The handleSaveAll function will properly recalculate by removing all old items
      // and adding back current items, which handles deletions correctly
    }
  };

  const handleSaveItem = () => {
    const errors = [];

    if (!editingItem.name || editingItem.name.trim() === '') {
      errors.push('Item name is required');
    }

    if (!editingItem.budgetAmount || editingItem.budgetAmount <= 0) {
      errors.push('Budget amount must be greater than 0');
    }

    if (!editingItem.recurrenceYearsMin || editingItem.recurrenceYearsMin <= 0) {
      errors.push('Minimum recurrence years must be greater than 0');
    }

    if (!editingItem.recurrenceYearsMax || editingItem.recurrenceYearsMax <= 0) {
      errors.push('Maximum recurrence years must be greater than 0');
    }

    if (editingItem.recurrenceYearsMax < editingItem.recurrenceYearsMin) {
      errors.push('Maximum recurrence years must be >= minimum years');
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const itemToSave = {
      ...editingItem,
      id: editingItem.id || `majormaint_${Date.now()}`,
      category: 'OPEX',
      subcategory: SUBCATEGORY_NAME,
      isMajorMaintenance: true,
      updatedAt: new Date().toISOString()
    };

    if (!editingItem.id) {
      itemToSave.createdAt = new Date().toISOString();
    }

    // If there's a lastOccurrence, recalculate next due dates based on new recurrence schedule
    if (itemToSave.lastOccurrence && itemToSave.lastOccurrence.date) {
      const lastDate = new Date(itemToSave.lastOccurrence.date);
      const lastAmount = itemToSave.lastOccurrence.amount;

      // Calculate next due dates using the updated recurrence values
      const nextDueDates = calculateNextDueDates(
        lastDate,
        itemToSave.recurrenceYearsMin,
        itemToSave.recurrenceYearsMax
      );

      // Calculate inflated cost
      const yearsUntil = calculateYearsUntil(nextDueDates.min);
      const inflatedCost = calculateInflatedCost(lastAmount, yearsUntil);

      itemToSave.nextDueDateMin = nextDueDates.min;
      itemToSave.nextDueDateMax = nextDueDates.max;
      itemToSave.nextExpectedCost = inflatedCost;

      console.log(`📅 Recalculated next due dates for ${itemToSave.name}:`, {
        nextDueDateMin: nextDueDates.min,
        nextDueDateMax: nextDueDates.max,
        nextExpectedCost: inflatedCost
      });
    }

    const existingIndex = itemList.findIndex(i => i.id === itemToSave.id);
    let updated;

    if (existingIndex >= 0) {
      updated = [...itemList];
      updated[existingIndex] = itemToSave;
    } else {
      updated = [...itemList, itemToSave];
    }

    setItemList(updated);
    setShowForm(false);
    setEditingItem(null);
  };

  const handleSaveAll = () => {
    // Save all items to storage
    itemList.forEach(item => {
      console.log('💾 Saving Major Maintenance item:', item.name, 'Month:', item.month);
      storage.saveMajorMaintenanceItem(item);
    });

    // Update budget OPEX values based on Major Maintenance items
    if (budget) {
      const updatedBudget = { ...budget };

      // Calculate the delta for each month by comparing old items with new items
      const oldItemsByMonth = {};
      const newItemsByMonth = {};

      // Group old items by month
      items.forEach(item => {
        if (item.month !== null && item.month !== undefined) {
          if (!oldItemsByMonth[item.month]) oldItemsByMonth[item.month] = 0;
          oldItemsByMonth[item.month] += item.budgetAmount;
        }
      });

      // Group new items by month
      itemList.forEach(item => {
        if (item.month !== null && item.month !== undefined) {
          if (!newItemsByMonth[item.month]) newItemsByMonth[item.month] = 0;
          newItemsByMonth[item.month] += item.budgetAmount;
        }
      });

      // Apply the delta for each month
      for (let month = 0; month < 12; month++) {
        const oldAmount = oldItemsByMonth[month] || 0;
        const newAmount = newItemsByMonth[month] || 0;
        const delta = newAmount - oldAmount;

        if (delta !== 0) {
          updatedBudget.monthlyBudgets[month].opex += delta;
          console.log(`Month ${month}: Old=${oldAmount}, New=${newAmount}, Delta=${delta}, New OPEX=${updatedBudget.monthlyBudgets[month].opex}`);
        }
      }

      // Save updated budget
      storage.saveBudget(updatedBudget);
    }

    onSave(itemList);
  };

  const totalBudgeted = itemList.reduce((sum, i) => sum + i.budgetAmount, 0);
  const completedItems = itemList.filter(i => i.completed && i.lastOccurrence);
  const totalSpent = completedItems.reduce((sum, i) => sum + i.lastOccurrence.amount, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Major Maintenance Manager</h2>
              <p className="text-sm text-slate-600">Fiscal Year {fiscalYear} - Recurring OPEX Expenses</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-slate-600 mb-1">Total Budgeted</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBudgeted)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {itemList.length} item{itemList.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs text-slate-600 mb-1">Completed (Last Time)</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {completedItems.length} occurrence{completedItems.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs text-slate-600 mb-1">Upcoming (2 Years)</p>
                <p className="text-2xl font-bold text-amber-600">
                  {itemList.filter(i => {
                    const status = getMaintenanceStatus(i);
                    return status && (status.status === 'critical' || status.status === 'warning');
                  }).length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Items need attention</p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">About Major Maintenance</p>
                  <p className="mb-2">Track large recurring OPEX expenses like parking lot sealing, pool resurfacing, etc. These items:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Budget in the current year like regular OPEX</li>
                    <li>Track historical occurrences with recurrence intervals</li>
                    <li>Calculate inflation-adjusted future costs (3% annually)</li>
                    <li>Show alerts 2 years before next occurrence</li>
                    <li>Are excluded from year-end rollover (must be manually budgeted each time)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Add New Button */}
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New Major Maintenance Item
              </button>
            )}

            {/* Item Form */}
            {showForm && (
              <div className="bg-slate-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-4">
                  {editingItem.id ? 'Edit Major Maintenance Item' : 'New Major Maintenance Item'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Parking Lot Seal & Stripe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="2"
                      placeholder="Brief description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Budget Amount *
                      </label>
                      <div className="relative">
                        <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.01"
                          value={editingItem.budgetAmount}
                          onChange={(e) => setEditingItem({ ...editingItem, budgetAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Budget Month *
                      </label>
                      <select
                        value={editingItem.month}
                        onChange={(e) => setEditingItem({ ...editingItem, month: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const monthInfo = getFiscalMonthName(i, fiscalYear);
                          return (
                            <option key={i} value={i}>
                              {monthInfo.monthName} ({monthInfo.calendarDate})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Recurrence Tracking */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recurrence Schedule
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Minimum Years Between Occurrences *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={editingItem.recurrenceYearsMin || 7}
                          onChange={(e) => setEditingItem({ ...editingItem, recurrenceYearsMin: parseInt(e.target.value) || 7 })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Maximum Years Between Occurrences *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={editingItem.recurrenceYearsMax || 10}
                          onChange={(e) => setEditingItem({ ...editingItem, recurrenceYearsMax: parseInt(e.target.value) || 10 })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Set the expected range (e.g., "7-10 years"). Dashboard will alert you 2 years before minimum due date.
                    </p>
                  </div>

                  {/* Historical Data (if exists) */}
                  {editingItem.lastOccurrence && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Last Occurrence</h4>
                      <div className="text-xs text-slate-700 space-y-1">
                        <p><strong>Date:</strong> {new Date(editingItem.lastOccurrence.date).toLocaleDateString()}</p>
                        <p><strong>Amount:</strong> {formatCurrency(editingItem.lastOccurrence.amount)}</p>
                        <p><strong>Next Due (Range):</strong> {new Date(editingItem.nextDueDateMin).toLocaleDateString()} - {new Date(editingItem.nextDueDateMax).toLocaleDateString()}</p>
                        <p><strong>Expected Cost:</strong> {formatCurrency(editingItem.nextExpectedCost)} (with {(INFLATION_RATE * 100).toFixed(0)}% inflation)</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={editingItem.notes}
                      onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="2"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingItem(null);
                      }}
                      className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveItem}
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Item
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Item List */}
            <div>
              <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-3">
                All Major Maintenance Items ({itemList.length})
              </h3>

              {itemList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 mb-2">No Major Maintenance items yet</p>
                  <p className="text-sm text-slate-400">Click "Add New Major Maintenance Item" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itemList
                    .sort((a, b) => {
                      // Sort by next due date, then by month
                      if (a.nextDueDateMin && b.nextDueDateMin) {
                        return new Date(a.nextDueDateMin) - new Date(b.nextDueDateMin);
                      }
                      if (a.nextDueDateMin) return -1;
                      if (b.nextDueDateMin) return 1;
                      return a.month - b.month;
                    })
                    .map((item) => {
                      const monthInfo = getFiscalMonthName(item.month, fiscalYear);
                      const status = getMaintenanceStatus(item);

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            status?.status === 'critical'
                              ? 'bg-rose-50 border-rose-200'
                              : status?.status === 'warning'
                              ? 'bg-amber-50 border-amber-200'
                              : item.completed
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-white border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-slate-900">{item.name}</h4>
                                {status && status.status === 'critical' && (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Due in {status.yearsUntil.toFixed(1)} years
                                  </span>
                                )}
                                {status && status.status === 'warning' && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Due in {status.yearsUntil.toFixed(1)} years
                                  </span>
                                )}
                                {status && status.status === 'overdue' && (
                                  <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    OVERDUE
                                  </span>
                                )}
                              </div>

                              {item.description && (
                                <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                <span>📅 Budgeted: {monthInfo.monthName} {monthInfo.calendarDate.split('-')[0]}</span>
                                <span>💰 Budget: {formatCurrency(item.budgetAmount)}</span>
                                <span>🔄 Every {item.recurrenceYearsMin}-{item.recurrenceYearsMax} years</span>
                              </div>

                              {item.lastOccurrence && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <div className="text-xs text-slate-600">
                                    <p className="font-medium">Last Occurrence:</p>
                                    <p className="mt-1">
                                      <strong>Date:</strong> {new Date(item.lastOccurrence.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} |{' '}
                                      <strong>Cost:</strong> {formatCurrency(item.lastOccurrence.amount)}
                                    </p>
                                    <p>
                                      <strong>Next Due:</strong> {new Date(item.nextDueDateMin).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {new Date(item.nextDueDateMax).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} |{' '}
                                      <strong>Expected:</strong> {formatCurrency(item.nextExpectedCost)}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {item.notes && (
                                <p className="text-xs text-slate-500 mt-2 italic">Note: {item.notes}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-xl font-bold text-slate-900">
                                  {formatCurrency(item.budgetAmount)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Budgeted
                                </p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Edit item"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MajorMaintenanceManager;
