// Currency formatting
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Date formatting
export const formatDate = (dateString) => {
  if (!dateString) return '-';

  // Parse date string as local date to avoid timezone issues
  // If date is in format YYYY-MM-DD, treat it as local date
  const parts = dateString.split('-');
  if (parts.length === 3) {
    // Create date in local timezone
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  // Fallback for other date formats
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Alert status calculation for CAPEX projects
export const getCapexAlertStatus = (project) => {
  if (!project.alertYear || project.trackingEnabled === false) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const yearsUntil = project.alertYear - currentYear;

  if (yearsUntil <= 0) {
    return { status: 'overdue', yearsUntil: 0, alertYear: project.alertYear };
  } else if (yearsUntil <= 1) {
    return { status: 'critical', yearsUntil, alertYear: project.alertYear };
  } else if (yearsUntil <= 2) {
    return { status: 'warning', yearsUntil, alertYear: project.alertYear };
  } else {
    return { status: 'good', yearsUntil, alertYear: project.alertYear };
  }
};

// Alert status calculation for Major Maintenance items
export const getMaintenanceAlertStatus = (item) => {
  if (!item.nextDueDateMin || item.trackingEnabled === false) {
    return null;
  }

  const nextDue = new Date(item.nextDueDateMin);
  const now = new Date();
  const yearsUntil = (nextDue - now) / (1000 * 60 * 60 * 24 * 365.25);
  const monthsUntil = Math.round(yearsUntil * 12);

  // Alert thresholds: critical = 6 months, warning = 2 years
  if (yearsUntil <= 0) {
    return { status: 'overdue', yearsUntil: 0, monthsUntil: 0 };
  } else if (yearsUntil <= 0.5) {
    return { status: 'critical', yearsUntil, monthsUntil };
  } else if (yearsUntil <= 2) {
    return { status: 'warning', yearsUntil, monthsUntil };
  } else {
    return { status: 'good', yearsUntil, monthsUntil };
  }
};

// Month names
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Payment methods
export const PAYMENT_METHODS = {
  BILLPAY: 'BillPay',
  AUTOPAY: 'AutoPay',
  PAYPAL: 'PayPal',
  ZELLE: 'Zelle',
  WEB_ACH: 'Web ACH',
  WEB_CREDIT: 'Web Credit Card',
  CHECK: 'Check',
  OTHER: 'Other'
};

// Dues structure
export const DUES_STRUCTURE = {
  BASE_DUES: 675.00,
  FEES: {
    INITIATION: 500.00,
    LATE_PAYMENT: 25.00,
    RETURNED_CHECK: 35.00
  },
  DISCOUNTS: {
    SINGLE_SENIOR: -200.00,
    EARLY_BIRD: -50.00,
    BOARD_MEMBER: -100.00
  }
};

// Member types
export const MEMBER_TYPES = {
  NEW: 'New',
  RETURN: 'Return'
};

// Member status
export const MEMBER_STATUS = {
  FAMILY: 'Family',
  SINGLE_SENIOR: 'Single/Senior'
};

// Residence type
export const RESIDENCE_TYPE = {
  INSIDE: 'Inside',
  OUTSIDE: 'Outside'
};

// Bylaw limits
export const BYLAW_LIMITS = {
  MAX_OUTSIDE_PERCENTAGE: 0.50  // 50%
};

// Expense type classification
export const EXPENSE_TYPES = {
  OPEX: 'OPEX',
  CAPEX: 'CAPEX',
  GA: 'G&A'
};

// Legacy CATEGORIES object (kept for backward compatibility)
export const CATEGORIES = {
  MEMBER_DUES: 'Member Dues',
  OUTSIDE_TENNIS_DUES: 'Outside Tennis Dues',
  DONATIONS: 'Donations/Sponsorships',
  SOCIAL_EVENTS: 'Social Events',
  GUEST_FEES: 'Guest Fees',
  LATE_FEES: 'Late Fees',
  INTEREST_INCOME: 'Interest Income',
  OTHER_REVENUE: 'Other Revenue',
  OTHER_EXPENSE: 'Other Expense'
};

// Revenue categories
export const getRevenueCategories = () => {
  return [
    'Outside Tennis Dues',
    'Donations/Sponsorships',
    'Social Events',
    'Guest Fees',
    'Facility Rental',
    'Programs Income',
    'Other'
  ];
};

// Programs Income sub-categories
export const getProgramsIncomeCategories = () => {
  return [
    'Fall Festival/Chili Cookoff',
    'Mardi Gras',
    'Memorial Day',
    'July 4th',
    'Loktoberfest',
    'Labor Day',
    'Kentucky Derby',
    'Other'
  ];
};

// Get categories by expense type
export const getCategoriesByType = (expenseType) => {
  if (expenseType === EXPENSE_TYPES.OPEX) {
    return [
      'Georgia Power - Pump and Tennis Lights (Acct# 51518-53007)',
      'Georgia Power - TAJ (Acct# 33918-81005)',
      'Georgia Power - Bathhouse (Acct# 50528-53002)',
      'Pool Telephone',
      'Trash Service',
      'Property Landscaping and Lawn Surface',
      'Mosquito Service',
      'Water Service',
      'Pool Service Contract',
      'Programs / Membership Expenses Reimbursed',
      'Pool Lifeguards Outside of Contract',
      'Pool / Upkeep Related Supplies',
      'Pool Related Repairs',
      'Pool Water Treatment & Outside of Contracted Service',
      'Pool Pump House Repairs (Motors, Filter, Electric)',
      'Small Tools & Equipment',
      'Buildings Repairs and Ground Maintenance',
      'Mosquito / Insect Spray of Property',
      'Tennis Court Supplies',
      'Tennis: Lights Repair / Bulb Replacement',
      'Tennis Court Crack Repair',
      'Other'
    ];
  } else if (expenseType === EXPENSE_TYPES.CAPEX) {
    return [
      'Pool Furniture',
      'Pool Renovations / Building Structure Repair',
      'Appliances and Similar Items',
      'Pump House (Motor, Filters)',
      'Tennis Court Armor Repair / LED Lights',
      'Tennis Court Wind Screens',
      'Playground Equipment',
      'Parking Lot Reseal / Restripe',
      'Other'
    ];
  } else if (expenseType === EXPENSE_TYPES.GA) {
    return [
      'Gwinnett County Environmental Pool Permit & Fees',
      'Gwinnett County Requires Annual Backflow Inspection',
      'Liability Insurance',
      'Tennis - Reservation System',
      'Membership Recruiting Expenses (Printing, Mail, etc.)',
      'Computer Related, Website Expenses',
      'PO Box Rental',
      'General and Administrative Exp - Other',
      'St. of Ga. Sec. of State - Annual Registration as Non-Profit',
      'Gwinnett County Real Estate Tax',
      'Professional Fees / Fed Tax',
      'Other'
    ];
  }
  return [];
};

// Calculate year total from monthly amounts
export const calculateYearTotal = (monthlyAmounts) => {
  if (!monthlyAmounts || !Array.isArray(monthlyAmounts)) return 0;
  return monthlyAmounts.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
};

// Get current fiscal month (0-11, where 0 = October for FY starting Oct 1)
export const getCurrentFiscalMonth = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-11 (Jan=0, Dec=11)

  // If current month is Oct-Dec (9,10,11), it's fiscal months 0,1,2
  // If current month is Jan-Sep (0-8), it's fiscal months 3-11
  if (month >= 9) {
    return month - 9; // Oct=0, Nov=1, Dec=2
  } else {
    return month + 3; // Jan=3, Feb=4, ..., Sep=11
  }
};

// Calculate dues breakdown
export const calculateDues = (baseDues, fees, discounts, customDiscounts = []) => {
  const totalFees = fees.filter(f => f.applied).reduce((sum, f) => sum + f.amount, 0);
  const standardDiscounts = discounts.filter(d => d.applied).reduce((sum, d) => sum + d.amount, 0);
  const customDiscountsTotal = customDiscounts.filter(d => d.applied).reduce((sum, d) => sum + d.amount, 0);
  const totalDiscounts = standardDiscounts + customDiscountsTotal;
  const totalValue = baseDues + totalFees;
  const totalRealized = totalValue + totalDiscounts; // discounts are negative

  return {
    totalFees,
    totalDiscounts,
    totalValue,
    totalRealized
  };
};

// Check bylaw compliance
export const checkBylawCompliance = (members) => {
  const total = members.length;
  if (total === 0) return {
    compliant: true,
    percentage: 0,
    count: { inside: 0, outside: 0, total: 0 }
  };

  const inside = members.filter(m => m.residence === RESIDENCE_TYPE.INSIDE).length;
  const outside = members.filter(m => m.residence === RESIDENCE_TYPE.OUTSIDE).length;
  const outsidePercentage = outside / total;
  const compliant = outsidePercentage <= BYLAW_LIMITS.MAX_OUTSIDE_PERCENTAGE;
  const maxOutside = Math.floor(total * BYLAW_LIMITS.MAX_OUTSIDE_PERCENTAGE);

  return {
    compliant,
    percentage: outsidePercentage,
    count: { inside, outside, total },
    limit: BYLAW_LIMITS.MAX_OUTSIDE_PERCENTAGE,
    overLimit: Math.max(0, outside - maxOutside)
  };
};

// Calculate metrics with residence breakdown
export const calculateMemberMetrics = (members) => {
  const compliance = checkBylawCompliance(members);

  return {
    totalMembers: members.length,
    paidMembers: members.filter(m => m.datePaid).length,
    unpaidMembers: members.filter(m => !m.datePaid).length,
    totalRevenue: members.reduce((sum, m) => sum + (m.dues?.totalRealized || m.totalRealized || 0), 0),
    compliance
  };
};

// Calculate metrics for dashboard
export const calculateMetrics = (data, budget = null) => {
  const totalRevenue = data.transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = data.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const memberMetrics = calculateMemberMetrics(data.members || []);

  let currentBalance = 0;
  let projectedYearEnd = 0;

  // Get budget and calculate from Cash Flow
  const fiscalYear = data.settings?.fiscalYear;

  if (budget) {
    try {
      const monthlyActuals = calculateMonthlyActuals(data.transactions, fiscalYear, data.settings.startDate);
      const currentMonth = getCurrentFiscalMonth();

      // Use budget.startingBalance if set, otherwise fall back to data.balance.current
      const startingBalance = budget.startingBalance || data.balance?.current || 0;

      // Log if we're using a fallback
      if (!budget.startingBalance && data.balance?.current) {
        console.warn('⚠️ Budget startingBalance not set, using balance.current:', data.balance.current);
      }

      const projections = generateCashFlowProjection(budget, monthlyActuals, currentMonth, startingBalance);

      // Current Balance = current month's actual balance from Cash Flow
      currentBalance = projections[currentMonth].actualBalance;

      // Projected Year-End = September's budgeted balance
      projectedYearEnd = projections[11].budgetedBalance;
    } catch (e) {
      console.error('❌ Error calculating metrics:', e);
      // Fallback to data.balance.current if available
      currentBalance = data.balance?.current || 0;
      projectedYearEnd = 0;
    }
  } else {
    // No budget exists - use data.balance.current as fallback
    currentBalance = data.balance?.current || 0;
    if (currentBalance > 0) {
      console.warn('⚠️ No budget found, using balance.current:', currentBalance);
    }
  }

  return {
    currentBalance,
    balance: { ...data.balance, current: currentBalance },
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    annualServiceCosts: data.services ? data.services.reduce((sum, s) => sum + calculateYearTotal(s.monthlyAmounts), 0) : 0,
    totalMembers: memberMetrics.totalMembers,
    paidMembers: memberMetrics.paidMembers,
    unpaidMembers: memberMetrics.unpaidMembers,
    memberRevenue: memberMetrics.totalRevenue,
    compliance: memberMetrics.compliance,
    projectedYearEnd
  };
};

// Export data to JSON
export const exportToJSON = (data, filename) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'data.json';
  link.click();
  URL.revokeObjectURL(url);
};

// Sort transactions by most recently entered (createdAt), not by transaction date
export const sortTransactionsByDate = (transactions) => {
  return [...transactions].sort((a, b) => {
    const aCreated = new Date(a.createdAt || a.date);
    const bCreated = new Date(b.createdAt || b.date);
    return bCreated - aCreated;
  });
};

// Validate transaction
export const validateTransaction = (transaction) => {
  const errors = [];

  if (!transaction.description || transaction.description.trim() === '') {
    errors.push('Description is required');
  }

  if (!transaction.amount || transaction.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!transaction.date) {
    errors.push('Date is required');
  }

  if (!transaction.category) {
    errors.push('Category is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get fiscal month name with calendar date
export const getFiscalMonthName = (fiscalMonth, fiscalYear) => {
  // Fiscal month 0 = October of previous calendar year
  // Fiscal month 3 = January of fiscal year
  const calendarMonth = (fiscalMonth + 9) % 12;
  const calendarYear = fiscalMonth >= 3 ? fiscalYear : fiscalYear - 1;

  return {
    monthName: MONTHS[calendarMonth],
    calendarDate: `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`,
    fiscalMonth
  };
};

// Calculate monthly actuals from transactions
export const calculateMonthlyActuals = (transactions, fiscalYear, startDate) => {
  // Initialize 12 months with zeros
  const monthlyActuals = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    ...getFiscalMonthName(i, fiscalYear),
    revenue: 0,
    opex: 0,
    capex: 0,
    ga: 0,
    net: 0,
    transactionCount: 0
  }));

  if (!transactions || transactions.length === 0) {
    return monthlyActuals;
  }

  // Fiscal year runs from Oct 1 (year-1) to Sep 30 (year)
  const fyStartYear = fiscalYear - 1;
  const fyEndYear = fiscalYear;

  // Group transactions by fiscal month
  transactions.forEach((txn, index) => {
    // Parse date - handle both ISO string and Date objects
    const txnDate = new Date(txn.date);
    const txnMonth = txnDate.getMonth(); // 0-11 (Jan=0)
    const txnYear = txnDate.getFullYear();

    // Check if transaction falls within this fiscal year
    // FY starts Oct 1 of (fiscalYear - 1) and ends Sep 30 of fiscalYear
    const isInFiscalYear =
      (txnYear === fyStartYear && txnMonth >= 9) || // Oct-Dec of start year
      (txnYear === fyEndYear && txnMonth <= 8);     // Jan-Sep of end year

    if (!isInFiscalYear) {
      return; // Skip transactions outside this fiscal year
    }

    // Calculate fiscal month (Oct=0, Nov=1, ..., Sep=11)
    let fiscalMonth;
    if (txnMonth >= 9) {
      // Oct-Dec of previous calendar year (fiscal months 0-2)
      fiscalMonth = txnMonth - 9;
    } else {
      // Jan-Sep of current calendar year (fiscal months 3-11)
      fiscalMonth = txnMonth + 3;
    }

    // Add to appropriate category
    if (txn.type === 'revenue') {
      monthlyActuals[fiscalMonth].revenue += txn.amount;
      monthlyActuals[fiscalMonth].transactionCount += 1;
    } else if (txn.type === 'expense') {
      if (txn.expenseType === EXPENSE_TYPES.OPEX || txn.expenseType === 'OPEX') {
        monthlyActuals[fiscalMonth].opex += txn.amount;
        monthlyActuals[fiscalMonth].transactionCount += 1;
      } else if (txn.expenseType === EXPENSE_TYPES.CAPEX || txn.expenseType === 'CAPEX') {
        monthlyActuals[fiscalMonth].capex += txn.amount;
        monthlyActuals[fiscalMonth].transactionCount += 1;
      } else if (txn.expenseType === EXPENSE_TYPES.GA || txn.expenseType === 'G&A') {
        monthlyActuals[fiscalMonth].ga += txn.amount;
        monthlyActuals[fiscalMonth].transactionCount += 1;
      } else {
        console.warn(`Unrecognized expenseType: "${txn.expenseType}" for transaction: ${txn.description}`);
      }
    } else {
      console.warn(`Unrecognized transaction type: "${txn.type}" for transaction: ${txn.description}`);
    }
  });

  // Calculate net for each month
  monthlyActuals.forEach(month => {
    month.net = month.revenue - month.opex - month.capex - month.ga;
  });

  return monthlyActuals;
};

// Generate cash flow projection with running balance
export const generateCashFlowProjection = (budget, actuals, currentMonth, startingBalance) => {
  if (!budget) return [];

  let actualBalance = startingBalance;
  let budgetedBalance = startingBalance;
  const projections = [];

  for (let i = 0; i < 12; i++) {
    const budgetMonth = budget.monthlyBudgets[i];
    const actualMonth = actuals[i];
    const isPast = i <= currentMonth;  // Include current month to show actuals
    const isCurrent = i === currentMonth;

    // A month has actuals if it has any transactions, regardless of past/future
    const hasActuals = actualMonth.transactionCount > 0;

    // Calculate actual net (only from actual transactions)
    const actualNet = actualMonth.revenue - actualMonth.opex - actualMonth.capex - actualMonth.ga;
    actualBalance += actualNet;

    // Calculate budgeted net (always from budget)
    const budgetedNet = budgetMonth.revenue - budgetMonth.opex - budgetMonth.capex - budgetMonth.ga;
    budgetedBalance += budgetedNet;

    projections.push({
      month: i,
      ...getFiscalMonthName(i, budget.fiscalYear),
      isPast,
      isCurrent,
      isActual: hasActuals,  // Show actuals if there are any transactions
      // Actual values
      revenue: actualMonth.revenue,
      opex: actualMonth.opex,
      capex: actualMonth.capex,
      ga: actualMonth.ga,
      actualNet,
      actualBalance,
      // Budget values
      revenueBudget: budgetMonth.revenue,
      opexBudget: budgetMonth.opex,
      capexBudget: budgetMonth.capex,
      gaBudget: budgetMonth.ga,
      budgetedNet,
      budgetedBalance,
      transactionCount: actualMonth.transactionCount
    });
  }

  return projections;
};

/**
 * Check if a date falls within a specific fiscal year
 * Fiscal year runs from October 1 to September 30
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {number} fiscalYear - The fiscal year to check against
 * @returns {boolean} - True if date is within the fiscal year
 */
export const isDateInFiscalYear = (dateString, fiscalYear) => {
  if (!dateString || !fiscalYear) return false;

  const date = new Date(dateString);
  const fyStart = new Date(fiscalYear - 1, 9, 1); // October 1 of previous year
  const fyEnd = new Date(fiscalYear, 8, 30); // September 30 of fiscal year

  return date >= fyStart && date <= fyEnd;
};

/**
 * Get the fiscal year range as a human-readable string
 * @param {number} fiscalYear - The fiscal year
 * @returns {string} - e.g., "October 1, 2025 - September 30, 2026"
 */
export const getFiscalYearRange = (fiscalYear) => {
  const startDate = new Date(fiscalYear - 1, 9, 1);
  const endDate = new Date(fiscalYear, 8, 30);

  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const start = startDate.toLocaleDateString('en-US', options);
  const end = endDate.toLocaleDateString('en-US', options);

  return `${start} - ${end}`;
};

// Calculate YTD budget vs actual performance
export const calculateBudgetPerformance = (budget, actuals, currentMonth) => {
  if (!budget || !actuals) {
    return {
      revenue: { budget: 0, actual: 0, variance: 0 },
      opex: { budget: 0, actual: 0, variance: 0 },
      capex: { budget: 0, actual: 0, variance: 0 },
      ga: { budget: 0, actual: 0, variance: 0 },
      net: { budget: 0, actual: 0, variance: 0 }
    };
  }

  // Sum up through current month (inclusive)
  const performance = {
    revenue: { budget: 0, actual: 0, variance: 0 },
    opex: { budget: 0, actual: 0, variance: 0 },
    capex: { budget: 0, actual: 0, variance: 0 },
    ga: { budget: 0, actual: 0, variance: 0 },
    net: { budget: 0, actual: 0, variance: 0 }
  };

  for (let i = 0; i <= currentMonth; i++) {
    const budgetMonth = budget.monthlyBudgets[i];
    const actualMonth = actuals[i];

    performance.revenue.budget += budgetMonth.revenue;
    performance.revenue.actual += actualMonth.revenue;

    // Combine OPEX and G&A
    performance.opex.budget += budgetMonth.opex + budgetMonth.ga;
    performance.opex.actual += actualMonth.opex + actualMonth.ga;

    performance.capex.budget += budgetMonth.capex;
    performance.capex.actual += actualMonth.capex;

    // Keep ga as separate tracking but always 0 (for backward compatibility)
    performance.ga.budget += 0;
    performance.ga.actual += 0;
  }

  // Calculate net (G&A is already included in OPEX, so no need to subtract it separately)
  performance.net.budget = performance.revenue.budget - performance.opex.budget - performance.capex.budget;
  performance.net.actual = performance.revenue.actual - performance.opex.actual - performance.capex.actual;

  // Calculate variances (positive = over budget for expenses, under for revenue)
  performance.revenue.variance = performance.revenue.actual - performance.revenue.budget;
  performance.opex.variance = performance.opex.actual - performance.opex.budget;
  performance.capex.variance = performance.capex.actual - performance.capex.budget;
  performance.ga.variance = 0; // Always 0 since G&A is combined with OPEX
  performance.net.variance = performance.net.actual - performance.net.budget;

  return performance;
};

// Check for balance warnings
// Only warn if end-of-fiscal-year (September, month 11) BUDGETED balance falls below threshold
export const checkBalanceWarnings = (projections, threshold = 20000) => {
  if (!projections || projections.length === 0) {
    return [];
  }

  const warnings = [];

  // Check only the final month (September, month 11) budgeted balance
  const endOfYearMonth = projections[11]; // September is fiscal month 11

  if (endOfYearMonth && endOfYearMonth.budgetedBalance < threshold) {
    const warning = {
      month: endOfYearMonth.month,
      monthName: endOfYearMonth.monthName,
      balance: endOfYearMonth.budgetedBalance,
      threshold: threshold,
      deficit: threshold - endOfYearMonth.budgetedBalance,
      isCritical: endOfYearMonth.budgetedBalance < 0
    };
    warnings.push(warning);
  }

  return warnings;
};

/**
 * Check if a date falls in a closed month
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {object} budget - Budget object with closedMonths array
 * @param {number} fiscalYear - Current fiscal year
 * @returns {object} - { isClosed: boolean, fiscalMonth: number, monthName: string }
 */
export const isMonthClosed = (dateString, budget, fiscalYear) => {
  if (!dateString || !budget || !budget.closedMonths) {
    return { isClosed: false, fiscalMonth: null, monthName: null };
  }

  const date = new Date(dateString);
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();

  // Only check if date is in current fiscal year
  if (!isDateInFiscalYear(dateString, fiscalYear)) {
    return { isClosed: false, fiscalMonth: null, monthName: null };
  }

  // Calculate fiscal month
  let fiscalMonth;
  if (month >= 9) {
    fiscalMonth = month - 9; // Oct=0, Nov=1, Dec=2
  } else {
    fiscalMonth = month + 3; // Jan=3, ..., Sep=11
  }

  const isClosed = budget.closedMonths.includes(fiscalMonth);

  return {
    isClosed,
    fiscalMonth,
    monthName: MONTHS[month]
  };
};

/**
 * Calculate revenue breakdown by category for a specific month
 * @param {array} transactions - All transactions
 * @param {number} monthIndex - Fiscal month index (0-11)
 * @param {number} fiscalYear - Fiscal year
 * @param {object} budget - Budget object
 * @returns {object} - Revenue breakdown with actual, budgeted, variance, and byCategory
 */
const calculateRevenueBreakdown = (transactions, monthIndex, fiscalYear, budget) => {
  // Calculate calendar month and year from fiscal month
  const calendarMonth = (monthIndex + 9) % 12; // Oct=9, Nov=10, ..., Sep=8
  const calendarYear = fiscalYear - 1 + Math.floor((monthIndex + 9) / 12);

  const monthStart = new Date(calendarYear, calendarMonth, 1);
  const monthEnd = new Date(calendarYear, calendarMonth + 1, 0); // Last day of month

  const monthTransactions = transactions.filter(t => {
    if (t.type !== 'revenue') return false;
    const txnDate = new Date(t.date);
    return txnDate >= monthStart && txnDate <= monthEnd;
  });

  const breakdown = {};
  monthTransactions.forEach(t => {
    const category = t.category || 'Other';
    breakdown[category] = (breakdown[category] || 0) + t.amount;
  });

  const total = Object.values(breakdown).reduce((sum, amt) => sum + amt, 0);
  const budgeted = budget?.monthlyBudgets[monthIndex]?.revenue || 0;

  return {
    actual: total,
    budgeted,
    variance: total - budgeted,
    byCategory: breakdown
  };
};

/**
 * Generate board meeting report data for a specific month
 * @param {number} monthIndex - Fiscal month index (0-11)
 * @param {number} fiscalYear - Fiscal year
 * @param {object} budget - Budget data
 * @param {array} transactions - All transactions
 * @param {array} members - All members
 * @param {array} plannedCapex - Planned CAPEX projects
 * @param {array} majorMaintenance - Major maintenance items
 * @returns {object} - Structured report data
 */
export const generateBoardReportData = (
  monthIndex,
  fiscalYear,
  budget,
  transactions,
  members,
  plannedCapex,
  majorMaintenance
) => {
  // Calculate monthly actuals through the closing month
  const startDate = `${fiscalYear - 1}-10-01`;
  const monthlyActuals = calculateMonthlyActuals(transactions, fiscalYear, startDate);
  const projections = generateCashFlowProjection(
    budget,
    monthlyActuals,
    monthIndex,
    budget.startingBalance
  );

  const closingMonthData = projections[monthIndex];
  const monthInfo = getFiscalMonthName(monthIndex, fiscalYear);

  // 1. Membership Updates
  const newMembers = members.filter(m => m.type === 'New' || m.type === 'New Member');
  const returningMembers = members.filter(m => m.type === 'Return' || m.type === 'Returning');

  // 2. Financial Summary
  const financialSummary = {
    budgetedNetIncome: budget.monthlyBudgets[monthIndex].revenue -
                        budget.monthlyBudgets[monthIndex].opex -
                        budget.monthlyBudgets[monthIndex].capex -
                        budget.monthlyBudgets[monthIndex].ga,
    actualNetIncome: closingMonthData.actualNet,
    budgetedCashBalance: closingMonthData.budgetedBalance,
    actualCashBalance: closingMonthData.actualBalance
  };

  // 3. CAPEX Activity - completed in this month
  const capexInMonth = plannedCapex.filter(p => {
    if (!p.linkedTransactions || p.linkedTransactions.length === 0) return false;
    // Check if any linked transactions occurred in this month
    return p.linkedTransactions.some(txn => {
      const txnDate = new Date(txn.date);
      const txnMonth = txnDate.getMonth();
      const txnFiscalMonth = txnMonth >= 9 ? txnMonth - 9 : txnMonth + 3;
      return txnFiscalMonth === monthIndex;
    });
  });

  // Upcoming CAPEX (rest of fiscal year)
  const upcomingCapex = plannedCapex.filter(p =>
    p.month > monthIndex && !p.completed
  );

  // 4. Major OPEX Activity - completed in this month
  const opexInMonth = majorMaintenance.filter(m => {
    if (!m.linkedTransactions || m.linkedTransactions.length === 0) return false;
    // Check if any linked transactions occurred in this month
    return m.linkedTransactions.some(txn => {
      const txnDate = new Date(txn.date);
      const txnMonth = txnDate.getMonth();
      const txnFiscalMonth = txnMonth >= 9 ? txnMonth - 9 : txnMonth + 3;
      return txnFiscalMonth === monthIndex;
    });
  });

  // Upcoming Major OPEX (rest of fiscal year)
  const upcomingOpex = majorMaintenance.filter(m =>
    m.month > monthIndex && !m.completed
  );

  // 5. Revenue Analysis
  const revenueBreakdown = calculateRevenueBreakdown(transactions, monthIndex, fiscalYear, budget);

  // 6. Cash Flow Visualization - use full projections array

  // 7. Planned CAPEX List - all projects

  return {
    monthIndex,
    monthName: monthInfo.monthName,
    calendarDate: monthInfo.calendarDate,
    fiscalYear,
    membership: {
      total: members.length,
      new: newMembers.length,
      returning: returningMembers.length,
      newMemberNames: newMembers.map(m => m.name)
    },
    financial: financialSummary,
    capex: {
      completed: capexInMonth,
      upcoming: upcomingCapex
    },
    majorOpex: {
      completed: opexInMonth,
      upcoming: upcomingOpex
    },
    revenue: revenueBreakdown,
    cashFlow: projections,
    plannedCapexList: plannedCapex
  };
};
