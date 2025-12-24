import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, ArrowRight, Archive, TrendingUp } from 'lucide-react';
import { formatCurrency, MONTHS, calculateMonthlyActuals, getCurrentFiscalMonth } from '../utils/helpers';
import storage from '../services/storage';

function YearEndWizard({ currentYear, data, onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [reviewing, setReviewing] = useState(false);
  const [reviewData, setReviewData] = useState(null);

  // Step 1: Review current year
  const reviewCurrentYear = async () => {
    setReviewing(true);

    // Load current year data
    const budget = await storage.getBudget(currentYear);
    const capex = await storage.getPlannedCapex(currentYear);
    const majorMaintenance = await storage.getMajorMaintenanceItems(currentYear);
    const transactions = data.transactions;

    // Calculate actuals
    const monthlyActuals = calculateMonthlyActuals(
      transactions,
      currentYear,
      data.settings.startDate
    );

    // Separate Major Maintenance transactions from regular OPEX
    const majorMaintenanceTransactions = transactions.filter(t =>
      t.type === 'expense' &&
      t.expenseType === 'OPEX' &&
      t.majorMaintenanceItemId
    );

    const majorMaintenanceTotal = majorMaintenanceTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate totals
    const totals = monthlyActuals.reduce((acc, month) => ({
      revenue: acc.revenue + month.revenue,
      opex: acc.opex + month.opex,
      capex: acc.capex + month.capex,
      ga: acc.ga + month.ga,
      transactionCount: acc.transactionCount + month.transactionCount
    }), { revenue: 0, opex: 0, capex: 0, ga: 0, transactionCount: 0 });

    // Separate regular OPEX from Major Maintenance
    const regularOpex = totals.opex - majorMaintenanceTotal;

    setReviewData({
      budget,
      capex,
      majorMaintenance,
      monthlyActuals,
      totals,
      transactions,
      majorMaintenanceTransactions,
      majorMaintenanceTotal,
      regularOpex
    });

    setReviewing(false);
  };

  // Step 2: Create next year budget from actuals
  const createNextYearBudget = () => {
    const nextYear = currentYear + 1;

    console.log('📋 Creating FY' + nextYear + ' budget from FY' + currentYear + ' actuals...');
    console.log('Monthly Actuals:', reviewData.monthlyActuals);
    console.log('Major Maintenance items to exclude:', reviewData.majorMaintenance);

    // Calculate Major Maintenance budgeted amounts by month
    const majorMaintenanceByMonth = new Array(12).fill(0);
    reviewData.majorMaintenance.forEach(item => {
      if (item.month !== null && item.month !== undefined) {
        majorMaintenanceByMonth[item.month] += item.budgetAmount;
      }
    });

    // Use actuals from current year as baseline for next year
    // EXCEPT CAPEX which starts at $0
    // EXCEPT Major Maintenance which must be manually budgeted
    const nextYearBudget = {
      id: `budget_fy${nextYear}`,
      fiscalYear: nextYear,
      startingBalance: reviewData.budget.startingBalance + reviewData.totals.revenue - reviewData.totals.opex - reviewData.totals.capex - reviewData.totals.ga,
      lowBalanceThreshold: reviewData.budget.lowBalanceThreshold,
      monthlyBudgets: reviewData.monthlyActuals.map((actual, idx) => {
        // Subtract Major Maintenance from OPEX actuals for rollover
        const majorMaintenanceAmount = majorMaintenanceByMonth[idx] || 0;
        const adjustedOpex = actual.opex - majorMaintenanceAmount;

        const monthBudget = {
          month: idx,
          monthName: MONTHS[(idx + 9) % 12],
          calendarDate: `${idx >= 3 ? nextYear : nextYear - 1}-${String(((idx + 9) % 12) + 1).padStart(2, '0')}`,
          revenue: actual.revenue, // Use actual from prior year
          opex: Math.max(0, adjustedOpex), // Use actual from prior year, MINUS Major Maintenance
          capex: 0.00,             // CAPEX starts at $0 - add projects manually
          ga: actual.ga,           // Use actual from prior year
          notes: `Based on FY${currentYear} actuals${majorMaintenanceAmount > 0 ? ' (Major Maintenance excluded)' : ''}`
        };

        console.log(`  Month ${idx} (${monthBudget.monthName}):`, {
          revenue: actual.revenue,
          opexActual: actual.opex,
          majorMaintenance: majorMaintenanceAmount,
          opexAdjusted: monthBudget.opex,
          ga: actual.ga
        });

        return monthBudget;
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('✅ Next year budget created (Major Maintenance excluded):', nextYearBudget);
    return nextYearBudget;
  };

  // Step 3: Execute year-end close
  const executeYearEnd = () => {
    try {
      // Create next year budget
      const nextYearBudget = createNextYearBudget();
      storage.saveBudget(nextYearBudget);

      // Roll over members to next year (reset payment status)
      const currentMembers = data.members || [];
      const nextYearMembers = currentMembers.map(member => ({
        ...member,
        id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // New ID for new year
        datePaid: null,
        paymentMethod: null,
        checkNumber: null,
        yearJoined: currentYear + 1,
        previousYearMember: member.id // Track original member ID
      }));

      // Save rolled-over members to next year
      const nextYearKey = `lfst_finance_members_${currentYear + 1}`;
      localStorage.setItem(nextYearKey, JSON.stringify(nextYearMembers));
      console.log(`✅ Rolled over ${nextYearMembers.length} members to FY${currentYear + 1}`);

      // Update settings to track archived years
      const settings = data.settings;
      const archivedYears = settings.archivedYears || [];
      if (!archivedYears.includes(currentYear)) {
        archivedYears.push(currentYear);
      }

      // Update current year to next year
      const updatedSettings = {
        ...settings,
        fiscalYear: currentYear + 1,
        startDate: `${currentYear}-10-01`,
        archivedYears: archivedYears.sort(),
        lastModified: new Date().toISOString()
      };

      storage.updateSettings(updatedSettings);

      // Mark current year as archived (just metadata, data stays editable)
      localStorage.setItem(`lfst_finance_archived_${currentYear}`, JSON.stringify({
        archivedDate: new Date().toISOString(),
        finalBalance: nextYearBudget.startingBalance,
        transactionCount: reviewData.totals.transactionCount,
        memberCount: currentMembers.length
      }));

      onComplete();
    } catch (error) {
      console.error('Year-end close failed:', error);
      alert('Failed to close year: ' + error.message);
    }
  };

  // Initialize review when component loads
  React.useEffect(() => {
    if (step === 1) {
      reviewCurrentYear();
    }
  }, [step]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Archive className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Year-End Close & Archive</h2>
              <p className="text-blue-100 text-sm">Close FY{currentYear} and create FY{currentYear + 1}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-between">
            {[
              { num: 1, label: 'Review Year' },
              { num: 2, label: 'Preview Budget' },
              { num: 3, label: 'Confirm & Close' }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-2 ${step >= s.num ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step >= s.num ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                  }`}>
                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </div>
                {idx < 2 && <ArrowRight className="w-5 h-5 opacity-50" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {reviewing ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Analyzing FY{currentYear} data...</p>
            </div>
          ) : (
            <>
              {/* Step 1: Review Current Year */}
              {step === 1 && reviewData && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">FY{currentYear} Year-End Summary</h3>
                    <p className="text-sm text-slate-600 mb-6">
                      Review the fiscal year data before closing. You can still edit transactions after archiving.
                    </p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200">
                      <p className="text-xs text-emerald-700 font-medium mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-emerald-900">{formatCurrency(reviewData.totals.revenue)}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-4 border-2 border-rose-200">
                      <p className="text-xs text-rose-700 font-medium mb-1">Regular OPEX</p>
                      <p className="text-2xl font-bold text-rose-900">{formatCurrency(reviewData.regularOpex)}</p>
                      <p className="text-xs text-rose-600 mt-1">Routine operations</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                      <p className="text-xs text-purple-700 font-medium mb-1">Major Maintenance</p>
                      <p className="text-2xl font-bold text-purple-900">{formatCurrency(reviewData.majorMaintenanceTotal)}</p>
                      <p className="text-xs text-purple-600 mt-1">{reviewData.majorMaintenanceTransactions.length} large projects</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                      <p className="text-xs text-amber-700 font-medium mb-1">Total CAPEX</p>
                      <p className="text-2xl font-bold text-amber-900">{formatCurrency(reviewData.totals.capex)}</p>
                    </div>
                  </div>

                  {/* OPEX Breakdown */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-3">OPEX Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">Regular Operating Expenses</span>
                        <span className="font-medium text-slate-900">{formatCurrency(reviewData.regularOpex)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">Major Maintenance (Recurring Large Projects)</span>
                        <span className="font-medium text-purple-900">{formatCurrency(reviewData.majorMaintenanceTotal)}</span>
                      </div>
                      <div className="border-t border-slate-300 pt-2 mt-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-slate-900">Total OPEX</span>
                          <span className="text-slate-900">{formatCurrency(reviewData.totals.opex)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className={`rounded-xl p-6 border-2 ${
                    reviewData.totals.revenue - reviewData.totals.opex - reviewData.totals.capex - reviewData.totals.ga >= 0
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Net Income (FY{currentYear})</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {formatCurrency(reviewData.totals.revenue - reviewData.totals.opex - reviewData.totals.capex - reviewData.totals.ga)}
                        </p>
                      </div>
                      <TrendingUp className={`w-12 h-12 ${
                        reviewData.totals.revenue - reviewData.totals.opex - reviewData.totals.capex - reviewData.totals.ga >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`} />
                    </div>
                  </div>

                  {/* Major Maintenance Items */}
                  {reviewData.majorMaintenanceTransactions && reviewData.majorMaintenanceTransactions.length > 0 && (
                    <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-3">Major Maintenance Expenses ({reviewData.majorMaintenanceTransactions.length})</h4>
                      <div className="space-y-2">
                        {reviewData.majorMaintenanceTransactions.map(txn => {
                          const mmItem = reviewData.majorMaintenance?.find(m => m.id === txn.majorMaintenanceItemId);
                          return (
                            <div key={txn.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-2 border border-purple-200">
                              <div className="flex-1">
                                <div className="font-medium text-purple-900">{txn.description}</div>
                                {mmItem && (
                                  <div className="text-xs text-purple-700 mt-0.5">
                                    {mmItem.name} • Next due: {mmItem.nextDueDateMin ? new Date(mmItem.nextDueDateMin).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Not scheduled'}
                                  </div>
                                )}
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {new Date(txn.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                              <span className="font-bold text-purple-900 ml-4">
                                {formatCurrency(txn.amount)}
                              </span>
                            </div>
                          );
                        })}
                        <div className="border-t border-purple-300 pt-2 mt-2">
                          <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-purple-900">Total Major Maintenance</span>
                            <span className="text-purple-900">{formatCurrency(reviewData.majorMaintenanceTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CAPEX Projects */}
                  {reviewData.capex && reviewData.capex.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-3">CAPEX Projects ({reviewData.capex.length})</h4>
                      <div className="space-y-2">
                        {reviewData.capex.map(project => (
                          <div key={project.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">
                              {project.completed ? '✅' : '⏳'} {project.name}
                            </span>
                            <span className="font-medium text-slate-900">
                              {formatCurrency(project.actualAmount || project.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Preview Next Year Budget */}
              {step === 2 && reviewData && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">FY{currentYear + 1} Budget Preview</h3>
                    <p className="text-sm text-slate-600 mb-6">
                      Budget created from FY{currentYear} actuals. CAPEX starts at $0 - add projects in Manage Projects.
                    </p>
                  </div>

                  {/* Starting Balance */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">FY{currentYear + 1} Starting Balance</p>
                        <p className="text-3xl font-bold text-blue-900">
                          {formatCurrency(reviewData.budget.startingBalance + reviewData.totals.revenue - reviewData.totals.opex - reviewData.totals.capex - reviewData.totals.ga)}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          = FY{currentYear} starting balance + net income
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Budget Preview */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Month</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">Revenue</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">OPEX</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">CAPEX</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">G&A</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {reviewData.monthlyActuals.map((actual, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {MONTHS[(idx + 9) % 12]}
                              </td>
                              <td className="px-4 py-3 text-right text-emerald-600">
                                {formatCurrency(actual.revenue)}
                              </td>
                              <td className="px-4 py-3 text-right text-rose-600">
                                {formatCurrency(actual.opex)}
                              </td>
                              <td className="px-4 py-3 text-right text-amber-600">
                                $0.00
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600">
                                {formatCurrency(actual.ga)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900">
                        <p className="font-semibold mb-1">CAPEX Note</p>
                        <p>CAPEX is set to $0.00 for all months. Add specific projects in "Manage Projects" after creating the new year.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm & Close */}
              {step === 3 && reviewData && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Confirm Year-End Close</h3>
                    <p className="text-sm text-slate-600 mb-6">
                      Please review and confirm the year-end close operation.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-900">Archive FY{currentYear}</p>
                        <p className="text-sm text-slate-600">Data remains editable for future corrections</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-900">Create FY{currentYear + 1} Budget</p>
                        <p className="text-sm text-slate-600">Based on FY{currentYear} actuals (CAPEX excluded)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-900">Set Active Year to FY{currentYear + 1}</p>
                        <p className="text-sm text-slate-600">New transactions will use FY{currentYear + 1}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-900">Starting Balance: {formatCurrency(reviewData.budget.startingBalance + reviewData.totals.revenue - reviewData.totals.opex - reviewData.totals.capex - reviewData.totals.ga)}</p>
                        <p className="text-sm text-slate-600">Carried forward from FY{currentYear} ending balance</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Ready to Proceed?</p>
                        <p>This will close FY{currentYear} and create FY{currentYear + 1}. You can still edit FY{currentYear} data after closing.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-8 py-4 rounded-b-2xl flex items-center justify-between border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
          >
            Cancel
          </button>

          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={reviewing}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={executeYearEnd}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Close Year & Create FY{currentYear + 1}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default YearEndWizard;
