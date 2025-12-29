/**
 * Status Color Schemes
 * Centralized color definitions for consistent status indicators across the app
 */

// Compliance status colors (for bylaws, reserves, etc.)
export const COMPLIANCE_STATUS_COLORS = {
  compliant: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/40',
    border: 'border-emerald-200 dark:border-emerald-700/50',
    text: 'text-emerald-700 dark:text-emerald-200',
    icon: 'text-emerald-600 dark:text-emerald-400',
    barColor: 'bg-emerald-500 dark:bg-emerald-600'
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/40',
    border: 'border-amber-200 dark:border-amber-700/50',
    text: 'text-amber-700 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400',
    barColor: 'bg-amber-500 dark:bg-amber-600'
  },
  violation: {
    bg: 'bg-rose-50 dark:bg-rose-900/40',
    border: 'border-rose-200 dark:border-rose-700/50',
    text: 'text-rose-700 dark:text-rose-200',
    icon: 'text-rose-600 dark:text-rose-400',
    barColor: 'bg-rose-500 dark:bg-rose-600'
  }
};

// Alert status colors (for CAPEX and Major Maintenance alerts)
export const ALERT_STATUS_COLORS = {
  good: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/40',
    border: 'border-emerald-200 dark:border-emerald-700/50',
    text: 'text-emerald-700 dark:text-emerald-200',
    icon: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/40',
    border: 'border-amber-200 dark:border-amber-700/50',
    text: 'text-amber-700 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
  },
  critical: {
    bg: 'bg-rose-50 dark:bg-rose-900/40',
    border: 'border-rose-200 dark:border-rose-700/50',
    text: 'text-rose-700 dark:text-rose-200',
    icon: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
  },
  overdue: {
    bg: 'bg-rose-600 dark:bg-rose-700',
    border: 'border-rose-700 dark:border-rose-800',
    text: 'text-white dark:text-rose-50',
    icon: 'text-rose-100 dark:text-rose-200',
    badge: 'bg-rose-500 text-white dark:bg-rose-600 dark:text-rose-50'
  }
};

// Transaction type colors
export const TRANSACTION_TYPE_COLORS = {
  revenue: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-700/50'
  },
  opex: {
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-700/50'
  },
  capex: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-700/50'
  },
  other: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700/50'
  }
};

// Budget performance colors
export const BUDGET_PERFORMANCE_COLORS = {
  underBudget: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-700/50'
  },
  onTrack: {
    bg: 'bg-blue-50 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-700/50'
  },
  overBudget: {
    bg: 'bg-rose-50 dark:bg-rose-900/40',
    text: 'text-rose-700 dark:text-rose-200',
    border: 'border-rose-200 dark:border-rose-700/50'
  }
};

// Generic status colors for general use
export const STATUS_COLORS = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/40',
    border: 'border-emerald-200 dark:border-emerald-700/50',
    text: 'text-emerald-700 dark:text-emerald-200',
    icon: 'text-emerald-600 dark:text-emerald-400'
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/40',
    border: 'border-amber-200 dark:border-amber-700/50',
    text: 'text-amber-700 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400'
  },
  error: {
    bg: 'bg-rose-50 dark:bg-rose-900/40',
    border: 'border-rose-200 dark:border-rose-700/50',
    text: 'text-rose-700 dark:text-rose-200',
    icon: 'text-rose-600 dark:text-rose-400'
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/40',
    border: 'border-blue-200 dark:border-blue-700/50',
    text: 'text-blue-700 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  neutral: {
    bg: 'bg-slate-50 dark:bg-slate-800/40',
    border: 'border-slate-200 dark:border-slate-700/50',
    text: 'text-slate-700 dark:text-slate-200',
    icon: 'text-slate-600 dark:text-slate-400'
  }
};

/**
 * Helper function to get compliance status colors
 * @param {string} status - 'compliant', 'warning', or 'violation'
 * @returns {object} Color scheme object
 */
export const getComplianceColors = (status) => {
  return COMPLIANCE_STATUS_COLORS[status] || COMPLIANCE_STATUS_COLORS.compliant;
};

/**
 * Helper function to get alert status colors
 * @param {string} status - 'good', 'warning', 'critical', or 'overdue'
 * @returns {object} Color scheme object
 */
export const getAlertColors = (status) => {
  return ALERT_STATUS_COLORS[status] || ALERT_STATUS_COLORS.good;
};

/**
 * Helper function to get transaction type colors
 * @param {string} type - 'revenue', 'opex', 'capex', or 'other'
 * @returns {object} Color scheme object
 */
export const getTransactionTypeColors = (type) => {
  const typeKey = type?.toLowerCase();
  return TRANSACTION_TYPE_COLORS[typeKey] || TRANSACTION_TYPE_COLORS.other;
};

/**
 * Helper function to get budget performance colors
 * @param {number} percentUsed - Percentage of budget used
 * @returns {object} Color scheme object
 */
export const getBudgetPerformanceColors = (percentUsed) => {
  if (percentUsed > 100) return BUDGET_PERFORMANCE_COLORS.overBudget;
  if (percentUsed < 90) return BUDGET_PERFORMANCE_COLORS.underBudget;
  return BUDGET_PERFORMANCE_COLORS.onTrack;
};
