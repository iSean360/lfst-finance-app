/**
 * Major Maintenance - Constants and Types
 *
 * This file defines the data structure and constants for tracking
 * major recurring OPEX expenses (e.g., parking lot sealing, pool resurfacing)
 */

// Major Maintenance Item Structure
export const MAJOR_MAINTENANCE_STRUCTURE = {
  id: 'String - unique identifier',
  fiscalYear: 'Number - fiscal year this budget item belongs to',
  name: 'String - name of the maintenance item',
  description: 'String - detailed description',
  category: 'String - always "OPEX"',
  subcategory: 'String - always "Major Maintenance"',

  // Budget Planning
  budgetAmount: 'Number - budgeted amount for this occurrence',
  month: 'Number - fiscal month (0-11) when budgeted',

  // Recurrence Tracking
  recurrenceYearsMin: 'Number - minimum years between occurrences',
  recurrenceYearsMax: 'Number - maximum years between occurrences',

  // Historical Tracking (most recent occurrence only)
  lastOccurrence: {
    date: 'String - YYYY-MM-DD of last completion',
    amount: 'Number - actual amount spent',
    transactionId: 'String - linked transaction ID',
    fiscalYear: 'Number - fiscal year of last occurrence'
  },

  // Future Planning
  nextDueDateMin: 'String - YYYY-MM-DD (lastOccurrence.date + recurrenceYearsMin)',
  nextDueDateMax: 'String - YYYY-MM-DD (lastOccurrence.date + recurrenceYearsMax)',
  nextExpectedCost: 'Number - inflation-adjusted cost from last occurrence',

  // Manual Overrides
  manualNextDate: 'String - YYYY-MM-DD (optional manual override)',
  manualExpectedCost: 'Number - (optional manual override)',
  notes: 'String - additional notes',

  // Metadata
  isMajorMaintenance: 'Boolean - always true',
  completed: 'Boolean - true when linked to transaction',
  createdAt: 'String - ISO timestamp',
  updatedAt: 'String - ISO timestamp'
};

// Constants
export const INFLATION_RATE = 0.03; // 3% annual inflation
export const DASHBOARD_WARNING_YEARS = 2; // Show on dashboard when 2 years out
export const SUBCATEGORY_NAME = 'Major Maintenance';

// Helper to create a new Major Maintenance item
export const createMajorMaintenanceItem = ({
  fiscalYear,
  name,
  description = '',
  budgetAmount,
  month,
  recurrenceYearsMin,
  recurrenceYearsMax,
  notes = ''
}) => {
  return {
    id: `majormaint_${Date.now()}`,
    fiscalYear,
    name,
    description,
    category: 'OPEX',
    subcategory: SUBCATEGORY_NAME,
    budgetAmount,
    month,
    recurrenceYearsMin,
    recurrenceYearsMax,
    lastOccurrence: null,
    nextDueDateMin: null,
    nextDueDateMax: null,
    nextExpectedCost: null,
    manualNextDate: null,
    manualExpectedCost: null,
    notes,
    isMajorMaintenance: true,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Helper to calculate inflation-adjusted cost
export const calculateInflatedCost = (originalAmount, years) => {
  return originalAmount * Math.pow(1 + INFLATION_RATE, years);
};

// Helper to calculate next due dates
export const calculateNextDueDates = (lastOccurrenceDate, minYears, maxYears) => {
  if (!lastOccurrenceDate) return { min: null, max: null };

  const lastDate = new Date(lastOccurrenceDate);

  const minDate = new Date(lastDate);
  minDate.setFullYear(minDate.getFullYear() + minYears);

  const maxDate = new Date(lastDate);
  maxDate.setFullYear(maxDate.getFullYear() + maxYears);

  return {
    min: minDate.toISOString().split('T')[0], // YYYY-MM-DD
    max: maxDate.toISOString().split('T')[0]  // YYYY-MM-DD
  };
};

// Helper to calculate years until next occurrence
export const calculateYearsUntil = (targetDate) => {
  if (!targetDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const years = (target - now) / msPerYear;

  return years;
};

// Helper to determine if item should show on dashboard
export const shouldShowOnDashboard = (item) => {
  if (!item.lastOccurrence || !item.nextDueDateMin) return false;

  const yearsUntil = calculateYearsUntil(item.nextDueDateMin);
  return yearsUntil !== null && yearsUntil <= DASHBOARD_WARNING_YEARS && yearsUntil >= 0;
};

// Helper to update item when transaction is linked
export const linkTransactionToMajorMaintenance = (item, transaction) => {
  const nextDueDates = calculateNextDueDates(
    transaction.date,
    item.recurrenceYearsMin,
    item.recurrenceYearsMax
  );

  const yearsUntilMin = calculateYearsUntil(nextDueDates.min);
  const inflatedCost = calculateInflatedCost(
    transaction.amount,
    item.recurrenceYearsMin
  );

  return {
    ...item,
    lastOccurrence: {
      date: transaction.date,
      amount: transaction.amount,
      transactionId: transaction.id,
      fiscalYear: transaction.fiscalYear
    },
    nextDueDateMin: nextDueDates.min,
    nextDueDateMax: nextDueDates.max,
    nextExpectedCost: inflatedCost,
    completed: true,
    updatedAt: new Date().toISOString()
  };
};

export default {
  INFLATION_RATE,
  DASHBOARD_WARNING_YEARS,
  SUBCATEGORY_NAME,
  MAJOR_MAINTENANCE_STRUCTURE,
  createMajorMaintenanceItem,
  calculateInflatedCost,
  calculateNextDueDates,
  calculateYearsUntil,
  shouldShowOnDashboard,
  linkTransactionToMajorMaintenance
};
