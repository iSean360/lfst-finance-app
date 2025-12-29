import React, { useState, useEffect } from 'react';
import { X, Link } from 'lucide-react';
import { PAYMENT_METHODS, EXPENSE_TYPES, getCategoriesByType, getRevenueCategories, getProgramsIncomeCategories } from '../utils/helpers';
import storage from '../services/storage';
import CurrencyInput from './CurrencyInput';

function TransactionModal({ transaction, fiscalYear, onClose, onSave, setActiveView }) {
  const isEditing = !!transaction;

  const [formData, setFormData] = useState(transaction || {
    type: 'expense',
    expenseType: EXPENSE_TYPES.OPEX,
    category: '',
    programsIncomeSubCategory: '',
    customCategory: '',
    description: '',
    amount: '',
    paymentMethod: PAYMENT_METHODS.BILLPAY,
    customPaymentMethod: '',
    checkNumber: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    majorMaintenanceItemId: '', // For linking OPEX to Major Maintenance
    capexProjectId: '', // For linking CAPEX to projects
    markItemComplete: false // Mark linked CAPEX or Major Maintenance item as complete
  });

  const [errors, setErrors] = useState([]);
  const [customCategories, setCustomCategories] = useState({
    opex: [],
    capex: [],
    ga: [],
    revenue: []
  });
  const [customPaymentMethods, setCustomPaymentMethods] = useState([]);
  const [majorMaintenanceItems, setMajorMaintenanceItems] = useState([]);
  const [capexProjects, setCapexProjects] = useState([]);
  const [budget, setBudget] = useState(null);

  // Load custom categories and payment methods from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('customCategories');
    if (savedCategories) {
      try {
        setCustomCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error('Failed to load custom categories:', e);
      }
    }

    const savedPaymentMethods = localStorage.getItem('customPaymentMethods');
    if (savedPaymentMethods) {
      try {
        setCustomPaymentMethods(JSON.parse(savedPaymentMethods));
      } catch (e) {
        console.error('Failed to load custom payment methods:', e);
      }
    }

    // Load Major Maintenance items for linking
    const loadMajorMaintenance = async () => {
      if (fiscalYear) {
        const items = await storage.getMajorMaintenanceItems(fiscalYear);
        setMajorMaintenanceItems(items);
      }
    };
    loadMajorMaintenance();

    // Load CAPEX projects for linking
    const loadCapexProjects = async () => {
      if (fiscalYear) {
        const projects = await storage.getPlannedCapex(fiscalYear);
        setCapexProjects(projects);
      }
    };
    loadCapexProjects();

    // Load budget for validation
    const loadBudget = async () => {
      if (fiscalYear) {
        const budgetData = await storage.getBudget(fiscalYear);
        setBudget(budgetData);
      }
    };
    loadBudget();
  }, [fiscalYear]);

  // Get available categories with custom ones merged in
  const availableCategories = (() => {
    let baseCategories = formData.type === 'revenue'
      ? getRevenueCategories()
      : getCategoriesByType(formData.expenseType);

    // Add custom categories
    const customKey = formData.type === 'revenue' ? 'revenue' : formData.expenseType?.toLowerCase();
    const customs = customCategories[customKey] || [];

    // Insert custom categories before "Other"
    const otherIndex = baseCategories.indexOf('Other');
    if (otherIndex > -1 && customs.length > 0) {
      return [...baseCategories.slice(0, otherIndex), ...customs, 'Other'];
    }
    return baseCategories;
  })();

  // Get available payment methods with custom ones merged in
  const availablePaymentMethods = (() => {
    const baseMethods = Object.values(PAYMENT_METHODS);

    // Insert custom payment methods before "Other"
    const otherIndex = baseMethods.indexOf('Other');
    if (otherIndex > -1 && customPaymentMethods.length > 0) {
      return [...baseMethods.slice(0, otherIndex), ...customPaymentMethods, 'Other'];
    }
    return baseMethods;
  })();

  const handleTypeChange = (type) => {
    const newExpenseType = type === 'expense' ? EXPENSE_TYPES.OPEX : null;
    const categories = type === 'revenue' ? getRevenueCategories() : getCategoriesByType(newExpenseType);
    setFormData({
      ...formData,
      type,
      expenseType: newExpenseType,
      category: categories[0] || '',
      programsIncomeSubCategory: '',
      customCategory: ''
    });
  };

  const handleExpenseTypeChange = (expenseType) => {
    const categories = getCategoriesByType(expenseType);
    setFormData({
      ...formData,
      expenseType,
      category: categories[0] || '',
      customCategory: ''
    });
  };

  const handleCategoryChange = (category) => {
    setFormData({
      ...formData,
      category,
      programsIncomeSubCategory: category === 'Programs Income' ? '' : formData.programsIncomeSubCategory,
      customCategory: category === 'Other' ? '' : ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalFormData = { ...formData };
    const validationErrors = [];

    // Handle custom category
    if (formData.category === 'Other' && formData.customCategory.trim()) {
      const customKey = formData.type === 'revenue' ? 'revenue' : formData.expenseType?.toLowerCase();
      const updatedCustomCategories = { ...customCategories };

      // Add if not already exists
      if (!updatedCustomCategories[customKey].includes(formData.customCategory.trim())) {
        updatedCustomCategories[customKey] = [...updatedCustomCategories[customKey], formData.customCategory.trim()];
        setCustomCategories(updatedCustomCategories);
        localStorage.setItem('customCategories', JSON.stringify(updatedCustomCategories));
      }

      finalFormData.category = formData.customCategory.trim();
    } else if (formData.category === 'Programs Income' && formData.programsIncomeSubCategory) {
      // For Programs Income, combine category and sub-category
      finalFormData.category = `Programs Income - ${formData.programsIncomeSubCategory}`;
    }

    // Handle custom payment method
    if (formData.paymentMethod === 'Other' && formData.customPaymentMethod.trim()) {
      const updatedCustomPaymentMethods = [...customPaymentMethods];

      // Add if not already exists
      if (!updatedCustomPaymentMethods.includes(formData.customPaymentMethod.trim())) {
        updatedCustomPaymentMethods.push(formData.customPaymentMethod.trim());
        setCustomPaymentMethods(updatedCustomPaymentMethods);
        localStorage.setItem('customPaymentMethods', JSON.stringify(updatedCustomPaymentMethods));
      }

      finalFormData.paymentMethod = formData.customPaymentMethod.trim();
    }

    onSave({ ...finalFormData, amount: parseFloat(finalFormData.amount) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="overflow-y-auto max-h-[90vh]">
        <div className="sticky top-0 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-[#334155] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Member Transaction Notification */}
          {isEditing && transaction.memberId && (
            <div className="bg-blue-50 dark:bg-blue-900/40 border-2 border-blue-200 dark:border-blue-700/50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-2">Member Transaction</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
                    This transaction is tied to a membership and cannot be edited directly. Any changes must be made on the Members page to ensure membership records remain accurate.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (setActiveView) {
                        setActiveView('members');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Close & Go to Members Page
                  </button>
                </div>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-700/50 rounded-lg p-4">
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-200 mb-2">Please fix the following errors:</p>
              <ul className="text-sm text-rose-700 dark:text-rose-300 list-disc pl-5 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Hide form fields if this is a member transaction */}
          {!(isEditing && transaction.memberId) && (
          <>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Transaction Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  formData.type === 'expense'
                    ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-200 border-2 border-rose-500 dark:border-rose-700'
                    : 'bg-slate-100 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-transparent hover:bg-slate-200 dark:hover:bg-[#334155]'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('revenue')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  formData.type === 'revenue'
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 border-2 border-emerald-500 dark:border-emerald-700'
                    : 'bg-slate-100 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-transparent hover:bg-slate-200 dark:hover:bg-[#334155]'
                }`}
              >
                Revenue
              </button>
            </div>
          </div>

          {formData.type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Expense Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleExpenseTypeChange(EXPENSE_TYPES.OPEX)}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors text-sm ${
                    formData.expenseType === EXPENSE_TYPES.OPEX
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border-2 border-blue-500 dark:border-blue-700'
                      : 'bg-slate-100 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-transparent hover:bg-slate-200 dark:hover:bg-[#334155]'
                  }`}
                >
                  OPEX
                </button>
                <button
                  type="button"
                  onClick={() => handleExpenseTypeChange(EXPENSE_TYPES.CAPEX)}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors text-sm ${
                    formData.expenseType === EXPENSE_TYPES.CAPEX
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 border-2 border-purple-500 dark:border-purple-700'
                      : 'bg-slate-100 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-transparent hover:bg-slate-200 dark:hover:bg-[#334155]'
                  }`}
                >
                  CAPEX
                </button>
                <button
                  type="button"
                  onClick={() => handleExpenseTypeChange(EXPENSE_TYPES.GA)}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors text-sm ${
                    formData.expenseType === EXPENSE_TYPES.GA
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200 border-2 border-amber-500 dark:border-amber-700'
                      : 'bg-slate-100 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-2 border-transparent hover:bg-slate-200 dark:hover:bg-[#334155]'
                  }`}
                >
                  G&A
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {formData.expenseType === EXPENSE_TYPES.OPEX && 'Operating expenses - routine operations and maintenance'}
                {formData.expenseType === EXPENSE_TYPES.CAPEX && 'Capital expenditures - major projects and equipment'}
                {formData.expenseType === EXPENSE_TYPES.GA && 'General & Administrative - overhead and administrative costs'}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select category...</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Programs Income Sub-Category */}
          {formData.type === 'revenue' && formData.category === 'Programs Income' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Event Type *</label>
              <select
                value={formData.programsIncomeSubCategory}
                onChange={(e) => setFormData({ ...formData, programsIncomeSubCategory: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select event type...</option>
                {getProgramsIncomeCategories().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Category Input for "Other" */}
          {formData.category === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Custom Category Name *</label>
              <input
                type="text"
                value={formData.customCategory}
                onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter custom category name..."
                required
              />
              <p className="text-xs text-slate-500 mt-1">This category will be saved for future use</p>
            </div>
          )}

          {/* Major Maintenance Linking - Only show for OPEX expenses */}
          {formData.type === 'expense' && formData.expenseType === EXPENSE_TYPES.OPEX && majorMaintenanceItems.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Link className="w-4 h-4 text-blue-600" />
                <label className="block text-sm font-medium text-blue-900">Link to Major Maintenance Item (Optional)</label>
              </div>
              <select
                value={formData.majorMaintenanceItemId}
                onChange={(e) => {
                  const itemId = e.target.value;
                  const selectedItem = majorMaintenanceItems.find(item => item.id === itemId);
                  setFormData({
                    ...formData,
                    majorMaintenanceItemId: itemId,
                    markItemComplete: false,
                    description: selectedItem ? selectedItem.name : formData.description
                  });
                }}
                className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">None - Regular OPEX expense</option>
                {majorMaintenanceItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} - Budgeted: ${item.budgetAmount.toLocaleString()}
                    {item.lastOccurrence && ` (Last: ${new Date(item.lastOccurrence.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })})`}
                  </option>
                ))}
              </select>
              {formData.majorMaintenanceItemId && (
                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.markItemComplete}
                      onChange={(e) => setFormData({ ...formData, markItemComplete: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-blue-900">
                      Mark this maintenance item as complete with this transaction
                    </span>
                  </label>
                  <p className="text-xs text-blue-700 mt-1 ml-6">
                    Check this box if all work for this maintenance cycle is complete
                  </p>
                </div>
              )}
              <p className="text-xs text-blue-700 mt-2">
                Linking this transaction to a Major Maintenance item will track the occurrence and calculate the next due date.
              </p>
            </div>
          )}

          {/* CAPEX Project Linking - Only show for CAPEX expenses */}
          {formData.type === 'expense' && formData.expenseType === EXPENSE_TYPES.CAPEX && capexProjects.length > 0 && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Link className="w-4 h-4 text-purple-600" />
                <label className="block text-sm font-medium text-purple-900">Link to CAPEX Project (Optional)</label>
              </div>
              <select
                value={formData.capexProjectId}
                onChange={(e) => {
                  const projectId = e.target.value;
                  const selectedProject = capexProjects.find(project => project.id === projectId);
                  setFormData({
                    ...formData,
                    capexProjectId: projectId,
                    markItemComplete: false,
                    description: selectedProject ? selectedProject.name : formData.description
                  });
                }}
                className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              >
                <option value="">None - Regular CAPEX expense</option>
                {capexProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} - Budgeted: ${project.amount.toLocaleString()}{project.completed ? ' (Completed)' : ''}
                  </option>
                ))}
              </select>
              {formData.capexProjectId && (
                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.markItemComplete}
                      onChange={(e) => setFormData({ ...formData, markItemComplete: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-purple-900">
                      Mark this project as complete with this transaction
                    </span>
                  </label>
                  <p className="text-xs text-purple-700 mt-1 ml-6">
                    Check this box if this is the final transaction for this project
                  </p>
                </div>
              )}
              <p className="text-xs text-purple-700 mt-2">
                Linking this transaction to a CAPEX project will update the project's actual cost and move the budget to the month when this transaction occurred.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description *
              {(formData.majorMaintenanceItemId || formData.capexProjectId) && (
                <span className="ml-2 text-xs text-slate-500">(Auto-filled from linked item)</span>
              )}
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#0f172a] dark:text-slate-100 dark:border-slate-600"
              placeholder="e.g., Pool pump repair"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount *</label>
            <CurrencyInput
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: value })}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value, customPaymentMethod: '' })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availablePaymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* Custom Payment Method Input for "Other" */}
          {formData.paymentMethod === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Custom Payment Method *</label>
              <input
                type="text"
                value={formData.customPaymentMethod}
                onChange={(e) => setFormData({ ...formData, customPaymentMethod: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter custom payment method..."
                required
              />
              <p className="text-xs text-slate-500 mt-1">This payment method will be saved for future use</p>
            </div>
          )}

          {formData.paymentMethod === PAYMENT_METHODS.CHECK && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Check Number</label>
              <input
                type="text"
                value={formData.checkNumber}
                onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1001"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Additional details..."
            />
          </div>
          {/* Close the conditional that hides form fields for member transactions */}
          </>
          )}

          {/* Only show action buttons if not a member transaction */}
          {!(isEditing && transaction.memberId) && (
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Transaction
            </button>
          </div>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}

export default TransactionModal;
