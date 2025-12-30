# Diagnose and Fix Balance Issue

The current balance showing $0.00 is likely due to the budget's `startingBalance` field being undefined or 0.

## Quick Fix - Use Browser Console

1. **Open the deployed Firebase app** in your browser
2. **Open Developer Console** (F12 or Ctrl+Shift+I)
3. **Go to Console tab**
4. **Paste and run this code:**

```javascript
// Check current budget data
const storage = (await import('./services/storage.js')).default;
const budget = await storage.getBudget(2026);
console.log('Current budget:', budget);
console.log('Starting Balance:', budget?.startingBalance);

// If startingBalance is undefined, null, or 0, fix it:
if (!budget?.startingBalance || budget.startingBalance === 0) {
  console.log('⚠️ Starting balance is not set!');
  console.log('Fixing by setting to $18,500 (default)...');

  const updatedBudget = {
    ...budget,
    startingBalance: 18500.00
  };

  await storage.saveBudget(updatedBudget);
  console.log('✅ Budget fixed! Refresh the page.');

  // Reload the page to see the fix
  window.location.reload();
} else {
  console.log('✅ Starting balance is already set:', budget.startingBalance);
  console.log('The issue might be something else. Check:');
  console.log('1. Are transactions loading?');
  console.log('2. Any console errors?');
  console.log('3. Try hard refresh (Ctrl+Shift+R)');
}
```

## Alternative - Through the App UI

1. Go to **Cash Flow** page
2. Click **Edit Budget** button (if it exists)
3. Check if the **Starting Balance** field is filled in
4. If it's empty or $0, set it to your actual starting balance for FY2026
5. Save the budget

## If Budget Doesn't Exist

If you haven't created a budget yet:

1. Go to **Cash Flow** page
2. You should see a "Create Budget" button
3. Fill in:
   - **Starting Balance**: Your actual balance on October 1, 2025
   - **Low Balance Threshold**: e.g., $5,000
   - Monthly budgets for revenue and expenses
4. Save the budget

## Root Cause

The `calculateMetrics` function in `src/utils/helpers.js` calculates the current balance from:
```javascript
const projections = generateCashFlowProjection(budget, monthlyActuals, currentMonth, budget.startingBalance);
currentBalance = projections[currentMonth].actualBalance;
```

If `budget.startingBalance` is undefined or 0, then `actualBalance` starts at 0 and shows $0.00 on the dashboard.

## Expected Budget Structure

```json
{
  "id": "budget_fy2026",
  "fiscalYear": 2026,
  "startingBalance": 18500.00,  // ← This must be set!
  "lowBalanceThreshold": 5000.00,
  "monthlyBudgets": [ ... ]
}
```
