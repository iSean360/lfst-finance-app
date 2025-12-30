import React, { useState, useEffect } from 'react';
import { X, Download, CheckCircle2 } from 'lucide-react';
import storage from '../services/storage';
import { generateBoardReportData } from '../utils/helpers';
import { exportToWord } from '../utils/reportExport';
import { formatCurrency, formatDate, MONTHS } from '../utils/helpers';

function MonthlyBoardReport({
  monthIndex,
  fiscalYear,
  budget,
  transactions,
  members,
  plannedCapex,
  majorMaintenanceItems,
  onComplete,
  onClose
}) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        const data = generateBoardReportData(
          monthIndex,
          fiscalYear,
          budget,
          transactions,
          members,
          plannedCapex || [],
          majorMaintenanceItems || []
        );

        setReportData(data);
      } catch (error) {
        console.error('Error generating report data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (budget) {
      loadReportData();
    }
  }, [monthIndex, fiscalYear, budget, transactions, members, plannedCapex, majorMaintenanceItems]);

  const handleExportToWord = async () => {
    if (reportData) {
      try {
        await exportToWord(reportData, meetingDate);
      } catch (error) {
        console.error('Error exporting to Word:', error);
        alert('Failed to export to Word. Please try again.');
      }
    }
  };

  if (loading || !reportData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Generating report...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="report-container bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#334155] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
          <div>
            <h1 className="text-2xl font-bold">Monthly Board Meeting Report</h1>
            <p className="text-blue-100 text-sm">{reportData.monthName} {reportData.fiscalYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportToWord}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
              title="Export to Word"
            >
              <Download className="w-4 h-4" />
              Export to Word
            </button>
            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors shadow-lg"
              title="Save report and close month"
            >
              <CheckCircle2 className="w-4 h-4" />
              Done & Close Month
            </button>
            <button
              onClick={onClose}
              className="ml-2 p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content - Scrollable */}
        <div className="report-content flex-1 overflow-y-auto p-8 space-y-8 dark:bg-[#1e293b]">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Monthly Board Meeting Report</h1>
            <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">{reportData.monthName} {reportData.fiscalYear}</h2>

            {/* Meeting Date Input */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Board Meeting Date:</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* 1. Membership Updates */}
          <section>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 border-b-2 border-blue-500 pb-2">
              1. Membership Updates
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/40 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Members</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{reportData.membership.total}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/40 rounded-lg p-4">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">New Members</p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{reportData.membership.new}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Returning Members</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{reportData.membership.returning}</p>
              </div>
            </div>
            {reportData.membership.newMemberNames.length > 0 ? (
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">New Member Names:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                  {reportData.membership.newMemberNames.map((name, idx) => (
                    <li key={idx}>{name}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 italic">No new members this period</p>
            )}
          </section>

          {/* 2. Financial Summary */}
          <section>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 border-b-2 border-blue-500 pb-2">
              2. Financial Summary
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Net Income</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Budgeted:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{formatCurrency(reportData.financial.budgetedNetIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Actual:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{formatCurrency(reportData.financial.actualNetIncome)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Variance:</span>
                    <span className={`font-mono ${reportData.financial.actualNetIncome - reportData.financial.budgetedNetIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(reportData.financial.actualNetIncome - reportData.financial.budgetedNetIncome)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Cash Balance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Budgeted:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{formatCurrency(reportData.financial.budgetedCashBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Actual:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{formatCurrency(reportData.financial.actualCashBalance)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Variance:</span>
                    <span className={`font-mono ${reportData.financial.actualCashBalance - reportData.financial.budgetedCashBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(reportData.financial.actualCashBalance - reportData.financial.budgetedCashBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. CAPEX Activity */}
          <section>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 border-b-2 border-blue-500 pb-2">
              3. Capital Expenditures (CAPEX)
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Completed This Month:</h4>
                {reportData.capex.completed.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                    {reportData.capex.completed.map((p, idx) => (
                      <li key={idx}>
                        {p.name}: {formatCurrency(p.actualAmount || p.amount)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 italic ml-4">None</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Upcoming (Rest of Fiscal Year):</h4>
                {reportData.capex.upcoming.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                    {reportData.capex.upcoming.map((p, idx) => (
                      <li key={idx}>
                        {p.name} ({MONTHS[p.month]}): {formatCurrency(p.amount)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 italic ml-4">None planned</p>
                )}
              </div>
            </div>
          </section>

          {/* 4. Major OPEX Activity */}
          <section>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 border-b-2 border-blue-500 pb-2">
              4. Major Maintenance (OPEX)
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Completed This Month:</h4>
                {reportData.majorOpex.completed.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                    {reportData.majorOpex.completed.map((m, idx) => (
                      <li key={idx}>
                        {m.name}: {formatCurrency(m.lastOccurrence?.amount || m.budgetAmount)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 italic ml-4">None</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Upcoming (Rest of Fiscal Year):</h4>
                {reportData.majorOpex.upcoming.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                    {reportData.majorOpex.upcoming.map((m, idx) => (
                      <li key={idx}>
                        {m.name} ({MONTHS[m.month]}): {formatCurrency(m.budgetAmount)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 italic ml-4">None planned</p>
                )}
              </div>
            </div>
          </section>

          {/* 5. Revenue Analysis */}
          <section>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 border-b-2 border-blue-500 pb-2">
              5. Revenue Analysis
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Budgeted Revenue</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(reportData.revenue.budgeted)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Actual Revenue</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(reportData.revenue.actual)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Variance</p>
                  <p className={`text-2xl font-bold ${reportData.revenue.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(reportData.revenue.variance)}
                  </p>
                </div>
              </div>
              {Object.keys(reportData.revenue.byCategory).length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Revenue by Category:</h4>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="space-y-2">
                      {Object.entries(reportData.revenue.byCategory).map(([category, amount]) => (
                        <div key={category} className="flex justify-between">
                          <span className="text-slate-700 dark:text-slate-300">{category}</span>
                          <span className="font-mono text-slate-900 dark:text-slate-100">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 6. Cash Flow Table */}
          <section>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 border-b-2 border-blue-500 pb-2">
              6. Cash Flow: Budget vs Actual
            </h3>
            <div className="overflow-x-auto -mx-8 px-8">
              <table className="w-full text-xs border-collapse min-w-max print:text-[8pt]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold">Month</th>
                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-semibold">Rev Budget</th>
                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-semibold">Rev Actual</th>
                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-semibold">OPEX Budget</th>
                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-semibold">OPEX Actual</th>
                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-semibold">CAPEX Budget</th>
                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-semibold">CAPEX Actual</th>
                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-semibold">Net Budget</th>
                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-semibold">Net Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.cashFlow.map((p, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-[#1e293b]' : 'bg-slate-50 dark:bg-slate-800'}>
                      <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 font-medium">{p.monthName || MONTHS[idx]}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-mono">{formatCurrency(p.revenueBudget || 0)}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-mono">{p.isActual ? formatCurrency(p.revenue || 0) : '-'}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-mono">{formatCurrency((p.opexBudget || 0) + (p.gaBudget || 0))}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-mono">{p.isActual ? formatCurrency((p.opex || 0) + (p.ga || 0)) : '-'}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-mono">{formatCurrency(p.capexBudget || 0)}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-mono">{p.isActual && p.capex > 0 ? formatCurrency(p.capex) : '-'}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-mono">{formatCurrency(p.budgetedNet || 0)}</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right font-mono">{p.isActual ? formatCurrency(p.actualNet || 0) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Planned CAPEX List */}
          <section>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 border-b-2 border-blue-500 pb-2">
              7. All Planned CAPEX Expenditures
            </h3>
            {reportData.plannedCapexList.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                {reportData.plannedCapexList.map((p, idx) => (
                  <li key={idx}>
                    {p.name} ({MONTHS[p.month]} {p.fiscalYear}): {formatCurrency(p.amount)}
                    {p.completed && <span className="text-emerald-600 dark:text-emerald-400 ml-2">✓ Completed</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 italic ml-4">No CAPEX projects planned</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default MonthlyBoardReport;
