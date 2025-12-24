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

// Month names
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Payment methods
export const PAYMENT_METHODS = {
  ZELLE: 'Zelle',
  WEB_ACH: 'Web ACH',
  WEB_CREDIT: 'Web Credit Card',
  CHECK: 'Check'
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
    'Member Dues',
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
  console.log('📊 calculateMetrics called');
  console.log('  Fiscal Year:', fiscalYear);
  console.log('  Budget exists:', !!budget);

  if (budget) {
    try {
      const monthlyActuals = calculateMonthlyActuals(data.transactions, fiscalYear, data.settings.startDate);
      const currentMonth = getCurrentFiscalMonth();
      const projections = generateCashFlowProjection(budget, monthlyActuals, currentMonth, budget.startingBalance);

      console.log('🔍 CURRENT BALANCE DEBUG:');
      console.log('  Current Month:', currentMonth);
      console.log('  Projections length:', projections.length);
      console.log('  Projections[' + currentMonth + ']:', projections[currentMonth]);
      console.log('  actualBalance:', projections[currentMonth]?.actualBalance);

      // Current Balance = current month's actual balance from Cash Flow
      currentBalance = projections[currentMonth].actualBalance;

      // Projected Year-End = September's budgeted balance
      projectedYearEnd = projections[11].budgetedBalance;

      console.log('  ✅ Current Balance set to:', currentBalance);
    } catch (e) {
      console.error('❌ Error calculating metrics:', e);
      currentBalance = 0;
      projectedYearEnd = 0;
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

  console.log('=== Calculate Monthly Actuals ===');
  console.log('Fiscal Year:', fiscalYear);
  console.log('FY Range: Oct 1, ' + fyStartYear + ' - Sep 30, ' + fyEndYear);
  console.log('Total Transactions to Process:', transactions.length);

  // Group transactions by fiscal month
  transactions.forEach((txn, index) => {
    // Parse date - handle both ISO string and Date objects
    const txnDate = new Date(txn.date);
    const txnMonth = txnDate.getMonth(); // 0-11 (Jan=0)
    const txnYear = txnDate.getFullYear();

    console.log(`🔍 Date Debug for "${txn.description}":`, {
      originalDate: txn.date,
      parsedDate: txnDate.toISOString(),
      getMonth: txnMonth,
      monthName: MONTHS[txnMonth],
      getFullYear: txnYear
    });

    // Check if transaction falls within this fiscal year
    // FY starts Oct 1 of (fiscalYear - 1) and ends Sep 30 of fiscalYear
    const isInFiscalYear =
      (txnYear === fyStartYear && txnMonth >= 9) || // Oct-Dec of start year
      (txnYear === fyEndYear && txnMonth <= 8);     // Jan-Sep of end year

    console.log(`[${index + 1}] ${txn.description}:`, {
      date: txn.date,
      parsedDate: txnDate.toISOString(),
      calendarMonth: txnMonth,
      calendarYear: txnYear,
      isInFiscalYear,
      type: txn.type,
      expenseType: txn.expenseType,
      amount: txn.amount
    });

    if (!isInFiscalYear) {
      console.log(`  ❌ SKIPPED - Outside FY${fiscalYear} range`);
      return; // Skip transactions outside this fiscal year
    }

    // Calculate fiscal month (Oct=0, Nov=1, ..., Sep=11)
    let fiscalMonth;
    console.log(`  📅 Calculating fiscal month: txnMonth=${txnMonth}, txnMonth>=9? ${txnMonth >= 9}`);
    if (txnMonth >= 9) {
      // Oct-Dec of previous calendar year (fiscal months 0-2)
      fiscalMonth = txnMonth - 9;
      console.log(`  📅 Oct-Dec: fiscalMonth = ${txnMonth} - 9 = ${fiscalMonth}`);
    } else {
      // Jan-Sep of current calendar year (fiscal months 3-11)
      fiscalMonth = txnMonth + 3;
      console.log(`  📅 Jan-Sep: fiscalMonth = ${txnMonth} + 3 = ${fiscalMonth}`);
    }

    console.log(`  ✅ INCLUDED - Fiscal Month: ${fiscalMonth} (${MONTHS[txnMonth]})`);

    // Add to appropriate category
    if (txn.type === 'revenue') {
      monthlyActuals[fiscalMonth].revenue += txn.amount;
      monthlyActuals[fiscalMonth].transactionCount += 1;
      console.log(`  💰 Added ${txn.amount} to Revenue for month ${fiscalMonth}`);
    } else if (txn.type === 'expense') {
      if (txn.expenseType === EXPENSE_TYPES.OPEX || txn.expenseType === 'OPEX') {
        monthlyActuals[fiscalMonth].opex += txn.amount;
        monthlyActuals[fiscalMonth].transactionCount += 1;
        console.log(`  💸 Added ${txn.amount} to OPEX for month ${fiscalMonth}`);
      } else if (txn.expenseType === EXPENSE_TYPES.CAPEX || txn.expenseType === 'CAPEX') {
        monthlyActuals[fiscalMonth].capex += txn.amount;
        monthlyActuals[fiscalMonth].transactionCount += 1;
        console.log(`  🏗️ Added ${txn.amount} to CAPEX for month ${fiscalMonth}`);
      } else if (txn.expenseType === EXPENSE_TYPES.GA || txn.expenseType === 'G&A') {
        monthlyActuals[fiscalMonth].ga += txn.amount;
        monthlyActuals[fiscalMonth].transactionCount += 1;
        console.log(`  📊 Added ${txn.amount} to G&A for month ${fiscalMonth}`);
      } else {
        console.log(`  ⚠️ UNRECOGNIZED expenseType: "${txn.expenseType}" - not added to any category`);
      }
    } else {
      console.log(`  ⚠️ UNRECOGNIZED type: "${txn.type}" - not added to any category`);
    }
  });

  // Calculate net for each month
  monthlyActuals.forEach(month => {
    month.net = month.revenue - month.opex - month.capex - month.ga;
  });

  console.log('\n=== Monthly Actuals Summary ===');
  monthlyActuals.forEach((month, idx) => {
    if (month.transactionCount > 0) {
      console.log(`Month ${idx} (${month.monthName}):`, {
        revenue: month.revenue,
        opex: month.opex,
        capex: month.capex,
        ga: month.ga,
        net: month.net,
        transactionCount: month.transactionCount
      });
    }
  });

  const totalTransactions = monthlyActuals.reduce((sum, m) => sum + m.transactionCount, 0);
  console.log(`\nTotal Transactions Processed: ${totalTransactions}`);
  console.log('=== End Monthly Actuals ===\n');

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
// Only warn if end-of-fiscal-year (September, month 11) BUDGETED balance falls below $20,000
export const checkBalanceWarnings = (projections, threshold = 20000) => {
  if (!projections || projections.length === 0) return [];

  const warnings = [];

  // Check only the final month (September, month 11) budgeted balance
  const endOfYearMonth = projections[11]; // September is fiscal month 11

  if (endOfYearMonth && endOfYearMonth.budgetedBalance < 20000) {
    warnings.push({
      month: endOfYearMonth.month,
      monthName: endOfYearMonth.monthName,
      balance: endOfYearMonth.budgetedBalance,
      threshold: 20000,
      deficit: 20000 - endOfYearMonth.budgetedBalance,
      isCritical: endOfYearMonth.budgetedBalance < 0
    });
  }

  return warnings;
};
