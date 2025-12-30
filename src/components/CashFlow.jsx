import React, { useState, useEffect } from 'react';
import { AlertTriangle, Edit3, Plus, CheckCircle, TrendingUp, TrendingDown, DollarSign, Eye, Archive, Wrench } from 'lucide-react';
import {
  formatCurrency,
  getCurrentFiscalMonth,
  calculateMonthlyActuals,
  generateCashFlowProjection,
  MONTHS
} from '../utils/helpers';
import storage from '../services/storage';
import BudgetEditor from './BudgetEditor';
import CapexManager from './CapexManager';
import MajorMaintenanceManager from './MajorMaintenanceManager';
import YearEndWizard from './YearEndWizard';
import CloseMonthDialog from './CloseMonthDialog';
import MonthlyBoardReport from './MonthlyBoardReport';

// Warning banner for no budget
function NoBudgetWarning({ onCreateBudget }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/40 border-2 border-amber-200 dark:border-amber-700/50 rounded-2xl p-6 animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-2">No Budget Set</h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
            You haven't created a budget for this fiscal year yet. Create a budget to start tracking your cash flow projections and monitor your financial performance.
          </p>
          <button
            onClick={onCreateBudget}
            className="px-4 py-2 bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create Budget
          </button>
        </div>
      </div>
    </div>
  );
}

// Year Summary widget
function YearSummaryWidget({ budget, projections, onCloseYear, onRefreshFromPriorYear, showRefreshButton }) {
  if (!budget || !projections || projections.length === 0) return null;

  const lastMonth = projections[11]; // September (month 11)

  // Calculate totals
  const projectedRevenue = projections.reduce((sum, p) => sum + p.revenueBudget, 0);
  const actualRevenue = projections.reduce((sum, p) => sum + p.revenue, 0);
  const projectedNet = projectedRevenue - projections.reduce((sum, p) => sum + p.opexBudget + p.capexBudget + p.gaBudget, 0);
  const endingBalance = lastMonth.budgetedBalance;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">FY{budget.fiscalYear} Annual Summary</h3>
        <div className="flex gap-2">
          {showRefreshButton && (
            <button
              onClick={onRefreshFromPriorYear}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
              title="Update budget using latest actuals from prior year"
            >
              <TrendingUp className="w-4 h-4" />
              Refresh from FY{budget.fiscalYear - 1} Actuals
            </button>
          )}
          <button
            onClick={onCloseYear}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <Archive className="w-4 h-4" />
            Close Year & Create Next Year
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f172a] rounded-xl p-4 shadow-sm border border-transparent dark:border-[#334155]">
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide font-semibold">Projected Revenue</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{formatCurrency(projectedRevenue)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Budgeted</p>
        </div>
        <div className="bg-white dark:bg-[#0f172a] rounded-xl p-4 shadow-sm border border-transparent dark:border-[#334155]">
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide font-semibold">Actual Revenue</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(actualRevenue)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Year to Date</p>
        </div>
        <div className="bg-white dark:bg-[#0f172a] rounded-xl p-4 shadow-sm border border-transparent dark:border-[#334155]">
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide font-semibold">Projected Net (Year)</p>
          <p className={`text-2xl font-bold ${projectedNet >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
            {projectedNet >= 0 ? '+' : ''}{formatCurrency(projectedNet)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {projectedNet >= 0 ? 'Surplus' : 'Deficit'}
          </p>
        </div>
        <div className="bg-white dark:bg-[#0f172a] rounded-xl p-4 shadow-sm border border-transparent dark:border-[#334155]">
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide font-semibold">Projected Ending Balance</p>
          <p className={`text-2xl font-bold ${endingBalance >= 0 ? 'text-slate-900 dark:text-[#f8fafc]' : 'text-rose-600 dark:text-rose-300'}`}>
            {formatCurrency(endingBalance)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sep {budget.fiscalYear}</p>
        </div>
      </div>
    </div>
  );
}

// Cash flow projection table
function CashFlowTable({ projections, currentMonth, onEditBudget, onCloseMonth, onReopenMonth, budget, fiscalYear, plannedCapex, onViewCapexProject, majorMaintenanceItems, onViewMajorMaintenance }) {
  // Calculate totals
  const totals = projections.reduce((acc, proj) => ({
    revenueBudget: acc.revenueBudget + proj.revenueBudget,
    revenueActual: acc.revenueActual + (proj.isActual ? proj.revenue : 0),
    opexBudget: acc.opexBudget + proj.opexBudget + proj.gaBudget,
    opexActual: acc.opexActual + (proj.isActual ? proj.opex + proj.ga : 0),
    capexBudget: acc.capexBudget + proj.capexBudget,
    capexActual: acc.capexActual + (proj.isActual ? proj.capex : 0),
    netBudget: acc.netBudget + proj.budgetedNet,
    netActual: acc.netActual + (proj.isActual ? proj.actualNet : 0),
  }), {
    revenueBudget: 0,
    revenueActual: 0,
    opexBudget: 0,
    opexActual: 0,
    capexBudget: 0,
    capexActual: 0,
    netBudget: 0,
    netActual: 0,
  });

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-[#334155] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-[#334155] flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          FY{fiscalYear} Monthly Cash Flow - Budget vs Actual
        </h2>
        <button
          onClick={onEditBudget}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Edit Budget
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-transparent">
            <tr>
              <th rowSpan="2" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider border-r border-slate-200 dark:border-[#334155]">
                Month
              </th>
              <th colSpan="2" className="px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider border-r border-slate-200 dark:border-[#334155] bg-emerald-50 dark:bg-emerald-900/40">
                Revenue
              </th>
              <th colSpan="2" className="px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider border-r border-slate-200 dark:border-[#334155] bg-rose-50 dark:bg-rose-900/40">
                OPEX
              </th>
              <th colSpan="2" className="px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider border-r border-slate-200 dark:border-[#334155] bg-amber-50 dark:bg-amber-900/40">
                CAPEX
              </th>
              <th colSpan="2" className="px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider border-r border-slate-200 dark:border-[#334155]">
                Net
              </th>
              <th colSpan="2" className="px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider border-r border-slate-200 dark:border-[#334155]">
                Balance
              </th>
              <th rowSpan="2" className="px-3 py-3 text-center text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">
                Actions
              </th>
            </tr>
            <tr className="border-t border-slate-200 dark:border-[#334155]">
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 bg-emerald-50 dark:bg-emerald-900/40">Budget</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-[#334155] bg-emerald-50 dark:bg-emerald-900/40">Actual</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 bg-rose-50 dark:bg-rose-900/40">Budget</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-[#334155] bg-rose-50 dark:bg-rose-900/40">Actual</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/40">Budget</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-[#334155] bg-amber-50 dark:bg-amber-900/40">Actual</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Budget</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-[#334155]">Actual</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Budget</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-[#334155]">Actual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#334155]">
            {projections.map((proj, idx) => {
              // Combine OPEX and G&A for display
              const opexBudget = proj.opexBudget + proj.gaBudget;
              const opexActual = proj.opex + proj.ga;

              return (
                <tr
                  key={idx}
                  className={`${
                    proj.isCurrent ? 'bg-blue-50 dark:bg-blue-900/40' : proj.isPast ? 'bg-white dark:bg-[#1e293b]' : 'bg-slate-50 dark:bg-transparent'
                  } hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors`}
                >
                  <td className="px-3 py-3 text-sm font-medium text-slate-900 dark:text-[#f8fafc] border-r border-slate-200 dark:border-[#334155]">
                    {proj.monthName}
                    {proj.isCurrent && <span className="ml-2 text-xs text-blue-600 dark:text-blue-300 font-semibold">← Current</span>}
                  </td>

                  {/* Revenue */}
                  <td className="px-3 py-3 text-right text-slate-500 dark:text-slate-400">
                    {formatCurrency(proj.revenueBudget)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-300 border-r border-slate-200 dark:border-[#334155]">
                    {proj.isActual ? formatCurrency(proj.revenue) : '-'}
                  </td>

                  {/* OPEX (including G&A) */}
                  <td className="px-3 py-3 text-right text-slate-500 dark:text-slate-400">
                    {(() => {
                      const monthMaintenanceItems = majorMaintenanceItems?.filter(m => m.month === idx) || [];
                      const hasMaintenanceItems = monthMaintenanceItems.length > 0;
                      const maintenanceList = hasMaintenanceItems
                        ? monthMaintenanceItems.map(m => `${m.name} (${formatCurrency(m.budgetAmount)})`).join(', ')
                        : 'No major maintenance budgeted for this month';

                      // Show eye icon if there are major maintenance items budgeted
                      if (hasMaintenanceItems) {
                        return (
                          <div className="flex items-center justify-end gap-2">
                            <span>{formatCurrency(opexBudget)}</span>
                            <button
                              onClick={onViewMajorMaintenance}
                              className="group relative"
                              title="View Major Maintenance items"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors" />
                              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                                <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                  {maintenanceList}
                                </div>
                              </div>
                            </button>
                          </div>
                        );
                      } else {
                        return formatCurrency(opexBudget);
                      }
                    })()}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-rose-600 dark:text-rose-300 border-r border-slate-200 dark:border-[#334155]">
                    {proj.isActual ? formatCurrency(opexActual) : '-'}
                  </td>

                  {/* CAPEX */}
                  <td className="px-3 py-3 text-right text-slate-500 dark:text-slate-400">
                    {(() => {
                      const monthProjects = plannedCapex?.filter(p => p.month === idx) || [];
                      const hasProjects = monthProjects.length > 0;
                      const projectsList = hasProjects
                        ? monthProjects.map(p => `${p.name} (${formatCurrency(p.amount)})`).join(', ')
                        : 'No projects planned for this month';

                      // Show eye icon if there's a budget OR projects (not just both)
                      if (proj.capexBudget > 0 || hasProjects) {
                        return (
                          <div className="flex items-center justify-end gap-2">
                            <span>{formatCurrency(proj.capexBudget)}</span>
                            <button
                              onClick={onViewCapexProject}
                              className="group relative"
                              title="View CAPEX projects"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-300 transition-colors" />
                              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                                <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                  {projectsList}
                                </div>
                              </div>
                            </button>
                          </div>
                        );
                      } else {
                        return formatCurrency(proj.capexBudget);
                      }
                    })()}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-amber-700 dark:text-amber-300 border-r border-slate-200 dark:border-[#334155]">
                    {proj.isActual && proj.capex > 0 ? formatCurrency(proj.capex) : '-'}
                  </td>

                  {/* Net */}
                  <td className={`px-3 py-3 text-right ${proj.budgetedNet >= 0 ? 'text-slate-500 dark:text-slate-400' : 'text-rose-400'}`}>
                    {formatCurrency(proj.budgetedNet)}
                  </td>
                  <td className={`px-3 py-3 text-right font-bold border-r border-slate-200 dark:border-[#334155] ${
                    proj.isActual ? (proj.actualNet >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300') : 'text-slate-400'
                  }`}>
                    {proj.isActual ? formatCurrency(proj.actualNet) : '-'}
                  </td>

                  {/* Balance - Budgeted */}
                  <td className={`px-3 py-3 text-right font-bold ${
                    proj.budgetedBalance < 0 ? 'text-rose-600 dark:text-rose-300' : proj.budgetedBalance < 5000 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-900 dark:text-[#f8fafc]'
                  }`}>
                    {formatCurrency(proj.budgetedBalance)}
                  </td>

                  {/* Balance - Actual */}
                  <td className={`px-3 py-3 text-right font-bold border-r border-slate-200 dark:border-[#334155] ${
                    proj.actualBalance < 0 ? 'text-rose-600 dark:text-rose-300' : proj.actualBalance < 5000 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-900 dark:text-[#f8fafc]'
                  }`}>
                    {proj.isActual ? formatCurrency(proj.actualBalance) : '-'}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 text-center">
                    {proj.isPast && (
                      budget?.closedMonths?.includes(idx) ? (
                        <button
                          onClick={() => onReopenMonth(idx)}
                          className="px-3 py-1 text-xs bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md transition-colors"
                          title="Re-open month - allow modifications"
                        >
                          Re-open
                        </button>
                      ) : (
                        <button
                          onClick={() => onCloseMonth(idx)}
                          className="px-3 py-1 text-xs bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md transition-colors"
                          title="Close month - lock in actuals as budget"
                        >
                          Close
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Totals Row */}
            <tr className="bg-slate-100 dark:bg-slate-700 font-bold border-t-2 border-slate-300 dark:border-[#334155]">
              <td className="px-3 py-3 text-left text-slate-900 dark:text-[#f8fafc] border-r border-slate-200 dark:border-[#334155]">
                TOTALS
              </td>

              {/* Revenue Totals */}
              <td className="px-3 py-3 text-right text-emerald-700 dark:text-emerald-300">
                {formatCurrency(totals.revenueBudget)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-300 border-r border-slate-200 dark:border-[#334155]">
                {formatCurrency(totals.revenueActual)}
              </td>

              {/* OPEX Totals */}
              <td className="px-3 py-3 text-right text-rose-700 dark:text-rose-300">
                {formatCurrency(totals.opexBudget)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-rose-600 dark:text-rose-300 border-r border-slate-200 dark:border-[#334155]">
                {formatCurrency(totals.opexActual)}
              </td>

              {/* CAPEX Totals */}
              <td className="px-3 py-3 text-right text-amber-700 dark:text-amber-300">
                {formatCurrency(totals.capexBudget)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-amber-600 dark:text-amber-300 border-r border-slate-200 dark:border-[#334155]">
                {formatCurrency(totals.capexActual)}
              </td>

              {/* Net Totals */}
              <td className={`px-3 py-3 text-right ${totals.netBudget >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {formatCurrency(totals.netBudget)}
              </td>
              <td className={`px-3 py-3 text-right font-bold border-r border-slate-200 dark:border-[#334155] ${
                totals.netActual >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
              }`}>
                {formatCurrency(totals.netActual)}
              </td>

              {/* Balance Totals - empty cells */}
              <td className="px-3 py-3"></td>
              <td className="px-3 py-3 border-r border-slate-200 dark:border-[#334155]"></td>

              {/* Actions - empty cell */}
              <td className="px-3 py-3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Major Maintenance widget
function MajorMaintenanceWidget({ items, onManage }) {
  const totalBudgeted = items.reduce((sum, i) => sum + i.budgetAmount, 0);
  const completedItems = items.filter(i => i.completed && i.lastOccurrence);
  const upcomingItems = items.filter(i => {
    if (!i.lastOccurrence || !i.nextDueDateMin) return false;
    const yearsUntil = (new Date(i.nextDueDateMin) - new Date()) / (1000 * 60 * 60 * 24 * 365.25);
    return yearsUntil <= 2 && yearsUntil >= 0;
  });

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-[#334155] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Major Maintenance (Non-recurring OPEX)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Large recurring expenses tracked for long-term planning</p>
        </div>
        <button
          onClick={onManage}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Wrench className="w-4 h-4" />
          Manage Items
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/40 rounded-lg p-4 border border-transparent dark:border-blue-700/50">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Budgeted This Year</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{formatCurrency(totalBudgeted)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/40 rounded-lg p-4 border border-transparent dark:border-emerald-700/50">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">With History</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{completedItems.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tracking recurrence</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/40 rounded-lg p-4 border border-transparent dark:border-amber-700/50">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Due Within 2 Years</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">{upcomingItems.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Need planning</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 bg-slate-50 dark:bg-transparent rounded-lg border border-transparent dark:border-[#334155]">
          No Major Maintenance items tracked yet
        </p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 3).map(item => {
            const isUpcoming = upcomingItems.includes(item);
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isUpcoming
                    ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700/50'
                    : 'bg-slate-50 dark:bg-transparent border-slate-200 dark:border-[#334155]'
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-[#f8fafc] flex items-center gap-2">
                    {isUpcoming && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300" />}
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Budgeted: {formatCurrency(item.budgetAmount)} • Recurs every {item.recurrenceYearsMin}-{item.recurrenceYearsMax} years
                    {item.lastOccurrence && (
                      <span> • Last: {new Date(item.lastOccurrence.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
          {items.length > 3 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center pt-2">
              +{items.length - 3} more item{items.length - 3 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Planned CAPEX widget
function PlannedCapexWidget({ projects, onManage }) {
  const totalPlanned = projects.filter(p => !p.completed).reduce((sum, p) => sum + p.amount, 0);
  const totalCompleted = projects.filter(p => p.completed).reduce((sum, p) => sum + (p.actualAmount || p.amount), 0);

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-[#334155] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Planned Capital Expenditures</h3>
        <button
          onClick={onManage}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Manage Projects
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/40 rounded-lg p-4 border border-transparent dark:border-blue-700/50">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Planned (Pending)</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{formatCurrency(totalPlanned)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{projects.filter(p => !p.completed).length} projects</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/40 rounded-lg p-4 border border-transparent dark:border-emerald-700/50">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{formatCurrency(totalCompleted)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{projects.filter(p => p.completed).length} projects</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 bg-slate-50 dark:bg-transparent rounded-lg border border-transparent dark:border-[#334155]">
          No CAPEX projects planned for this fiscal year
        </p>
      ) : (
        <div className="space-y-2">
          {projects.map(project => (
            <div
              key={project.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                project.completed
                  ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700/50'
                  : 'bg-slate-50 dark:bg-transparent border-slate-200 dark:border-[#334155]'
              }`}
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-[#f8fafc] flex items-center gap-2">
                  {project.completed && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />}
                  {project.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {MONTHS[project.month]} {project.fiscalYear}
                  {project.description && ` • ${project.description}`}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">
                  {formatCurrency(project.amount)}
                </p>
                {project.completed && project.actualAmount && project.actualAmount !== project.amount && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Actual: {formatCurrency(project.actualAmount)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// Main CashFlow component
function CashFlow({ data, metrics, onRefresh }) {
  const [budget, setBudget] = useState(null);
  const [plannedCapex, setPlannedCapex] = useState([]);
  const [majorMaintenanceItems, setMajorMaintenanceItems] = useState([]);
  const [projections, setProjections] = useState([]);
  const [actuals, setActuals] = useState([]);
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [showCapexManager, setShowCapexManager] = useState(false);
  const [showMajorMaintenanceManager, setShowMajorMaintenanceManager] = useState(false);
  const [showYearEndWizard, setShowYearEndWizard] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(getCurrentFiscalMonth());
  const [showCloseMonthDialog, setShowCloseMonthDialog] = useState(false);
  const [closingMonthIndex, setClosingMonthIndex] = useState(null);
  const [showBoardReport, setShowBoardReport] = useState(false);

  useEffect(() => {
    loadData();
  }, [data]);

  const loadData = async () => {
    // Load budget, CAPEX, and Major Maintenance in parallel for better performance
    const [budgetData, capexData, majorMaintenanceData] = await Promise.all([
      storage.getBudget(data.settings.fiscalYear),
      storage.getPlannedCapex(data.settings.fiscalYear),
      storage.getMajorMaintenanceItems(data.settings.fiscalYear)
    ]);

    setBudget(budgetData);
    setPlannedCapex(capexData);
    setMajorMaintenanceItems(majorMaintenanceData);

    if (budgetData) {
      // Calculate actuals from transactions
      const monthlyActuals = calculateMonthlyActuals(
        data.transactions,
        data.settings.fiscalYear,
        data.settings.startDate
      );
      setActuals(monthlyActuals);

      // Generate projections
      const proj = generateCashFlowProjection(
        budgetData,
        monthlyActuals,
        currentMonth,
        budgetData.startingBalance
      );

      setProjections(proj);
    }
  };

  // FIX: Reset negative CAPEX budgets to $0.00
  const fixNegativeCapex = async () => {
    if (!budget) return;

    // Find all months with negative CAPEX
    const negativeMonths = budget.monthlyBudgets
      .map((month, idx) => ({ month: idx, capex: month.capex, monthName: MONTHS[idx] }))
      .filter(m => m.capex < 0);

    if (negativeMonths.length === 0) return;

    const monthsList = negativeMonths.map(m => `${m.monthName} (${formatCurrency(m.capex)})`).join('\n');

    const confirmation = window.confirm(
      `Reset CAPEX budgets to $0.00 for the following months?\n\n${monthsList}\n\nThis will fix the negative budget issue.`
    );

    if (!confirmation) return;

    const updatedBudget = { ...budget };

    // Reset all negative CAPEX months to 0
    negativeMonths.forEach(({ month }) => {
      updatedBudget.monthlyBudgets[month].capex = 0;
      console.log(`✅ Reset ${MONTHS[month]} CAPEX to $0.00`);
    });

    updatedBudget.updatedAt = new Date().toISOString();

    await storage.saveBudget(updatedBudget);

    console.log('✅ All negative CAPEX budgets reset to $0.00');
    onRefresh();
  };

  const handleSaveBudget = (newBudget) => {
    storage.saveBudget(newBudget);
    setShowBudgetEditor(false);
    onRefresh();
  };

  const handleCloseMonth = (monthIndex) => {
    setClosingMonthIndex(monthIndex);
    setShowCloseMonthDialog(true);
  };

  const handleCloseMonthWithoutReport = async () => {
    if (!budget || !actuals || closingMonthIndex === null) return;

    const updatedBudget = { ...budget };
    const actualMonth = actuals[closingMonthIndex];

    // Update budget to match actuals
    updatedBudget.monthlyBudgets[closingMonthIndex] = {
      ...updatedBudget.monthlyBudgets[closingMonthIndex],
      revenue: actualMonth.revenue,
      opex: actualMonth.opex,
      capex: actualMonth.capex,
      ga: actualMonth.ga
    };

    // Add month to closedMonths array (initialize if it doesn't exist)
    if (!updatedBudget.closedMonths) {
      updatedBudget.closedMonths = [];
    }
    if (!updatedBudget.closedMonths.includes(closingMonthIndex)) {
      updatedBudget.closedMonths.push(closingMonthIndex);
    }

    await storage.saveBudget(updatedBudget);
    setShowCloseMonthDialog(false);
    onRefresh();
  };

  const handleGenerateReport = () => {
    setShowCloseMonthDialog(false);
    setShowBoardReport(true);
  };

  const handleReportComplete = async () => {
    // Close the month after report is done
    await handleCloseMonthWithoutReport();
    setShowBoardReport(false);
  };

  const handleReopenMonth = (monthIndex) => {
    if (!budget) return;

    const confirmation = window.confirm(
      `Re-open ${MONTHS[monthIndex]}?\n\nThis will allow modifications to:\n- All transactions for this month\n- All membership items for this month\n- OPEX and CAPEX budgets for this month\n\nThe month can be closed again later.`
    );

    if (!confirmation) return;

    const updatedBudget = { ...budget };

    // Remove month from closedMonths array
    if (updatedBudget.closedMonths) {
      updatedBudget.closedMonths = updatedBudget.closedMonths.filter(m => m !== monthIndex);
    }

    storage.saveBudget(updatedBudget);
    onRefresh();
  };

  const handleSaveCapex = (projects) => {
    setPlannedCapex(projects);
    setShowCapexManager(false);
    onRefresh();
  };

  const handleSaveMajorMaintenance = (items) => {
    setMajorMaintenanceItems(items);
    setShowMajorMaintenanceManager(false);
    onRefresh();
  };

  const handleRefreshFromPriorYear = () => {
    const currentYear = data.settings.fiscalYear;
    const priorYear = currentYear - 1;

    const confirmation = window.confirm(
      `Refresh FY${currentYear} budget using current actuals from FY${priorYear}?\n\nThis will update all monthly budget amounts (except CAPEX) based on the latest FY${priorYear} transactions. This cannot be undone.`
    );

    if (!confirmation) return;

    try {
      // Load prior year transactions
      const priorYearTransactions = JSON.parse(
        localStorage.getItem(`lfst_finance_transactions_${priorYear}`) || '[]'
      ) || [];

      // Calculate actuals from prior year
      const priorYearActuals = calculateMonthlyActuals(
        priorYearTransactions,
        priorYear,
        `${priorYear - 1}-10-01`
      );

      // Update current year budget with prior year actuals
      const updatedBudget = { ...budget };
      updatedBudget.monthlyBudgets = updatedBudget.monthlyBudgets.map((month, idx) => {
        const priorActual = priorYearActuals[idx];
        return {
          ...month,
          revenue: priorActual.revenue,
          opex: priorActual.opex,
          // CAPEX stays as is (don't overwrite with prior year)
          ga: priorActual.ga,
          notes: `Refreshed from FY${priorYear} actuals on ${new Date().toLocaleDateString()}`
        };
      });

      updatedBudget.updatedAt = new Date().toISOString();

      storage.saveBudget(updatedBudget);
      onRefresh();

      alert(`Budget refreshed successfully from FY${priorYear} actuals!`);
    } catch (error) {
      console.error('❌ Error refreshing budget:', error);
      alert('Failed to refresh budget: ' + error.message);
    }
  };


  return (
    <div className="space-y-6 animate-slide-up">
      {/* Warning Banners */}
      {!budget && <NoBudgetWarning onCreateBudget={() => setShowBudgetEditor(true)} />}

      {/* Fix Negative CAPEX Budget Button */}
      {budget && budget.monthlyBudgets.some(m => m.capex < 0) && (
        <div className="bg-rose-50 dark:bg-rose-900/40 border-2 border-rose-200 dark:border-rose-700/50 rounded-2xl p-6 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-rose-500 dark:bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200 mb-2">Negative CAPEX Budget Detected</h3>
              <p className="text-sm text-rose-800 dark:text-rose-200 mb-4">
                One or more months have negative CAPEX budget values. This may have been caused by a deletion bug and needs to be fixed.
              </p>
              <button
                onClick={fixNegativeCapex}
                className="px-4 py-2 bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Fix Negative CAPEX Budgets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Year Summary */}
      {budget && projections.length > 0 && (
        <YearSummaryWidget
          budget={budget}
          projections={projections}
          onCloseYear={() => setShowYearEndWizard(true)}
          onRefreshFromPriorYear={handleRefreshFromPriorYear}
          showRefreshButton={
            budget.notes?.includes('Based on FY') ||
            budget.monthlyBudgets[0]?.notes?.includes('Based on FY') ||
            budget.monthlyBudgets[0]?.notes?.includes('Refreshed from FY')
          }
        />
      )}

      {/* Cash Flow Projection Table */}
      {budget && projections.length > 0 && (
        <CashFlowTable
          projections={projections}
          currentMonth={currentMonth}
          onEditBudget={() => setShowBudgetEditor(true)}
          onCloseMonth={handleCloseMonth}
          onReopenMonth={handleReopenMonth}
          budget={budget}
          fiscalYear={data.settings.fiscalYear}
          plannedCapex={plannedCapex}
          onViewCapexProject={() => setShowCapexManager(true)}
          majorMaintenanceItems={majorMaintenanceItems}
          onViewMajorMaintenance={() => setShowMajorMaintenanceManager(true)}
        />
      )}

      {/* Major Maintenance Items & Planned CAPEX Projects - Side by Side */}
      {budget && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MajorMaintenanceWidget
            items={majorMaintenanceItems}
            onManage={() => setShowMajorMaintenanceManager(true)}
          />
          <PlannedCapexWidget
            projects={plannedCapex}
            onManage={() => setShowCapexManager(true)}
          />
        </div>
      )}


      {/* Budget Editor Modal */}
      {showBudgetEditor && (
        <BudgetEditor
          budget={budget}
          fiscalYear={data.settings.fiscalYear}
          startingBalance={data.balance.current}
          onSave={handleSaveBudget}
          onClose={() => setShowBudgetEditor(false)}
        />
      )}

      {/* CAPEX Manager Modal */}
      {showCapexManager && (
        <CapexManager
          projects={plannedCapex}
          fiscalYear={data.settings.fiscalYear}
          budget={budget}
          onSave={handleSaveCapex}
          onClose={() => setShowCapexManager(false)}
        />
      )}

      {/* Major Maintenance Manager Modal */}
      {showMajorMaintenanceManager && (
        <MajorMaintenanceManager
          items={majorMaintenanceItems}
          fiscalYear={data.settings.fiscalYear}
          budget={budget}
          onSave={handleSaveMajorMaintenance}
          onClose={() => setShowMajorMaintenanceManager(false)}
        />
      )}

      {/* Year-End Wizard Modal */}
      {showYearEndWizard && (
        <YearEndWizard
          currentYear={data.settings.fiscalYear}
          data={data}
          onComplete={() => {
            setShowYearEndWizard(false);
            onRefresh();
          }}
          onCancel={() => setShowYearEndWizard(false)}
        />
      )}

      {/* Close Month Dialog */}
      {showCloseMonthDialog && (
        <CloseMonthDialog
          monthIndex={closingMonthIndex}
          monthName={MONTHS[closingMonthIndex]}
          onGenerateReport={handleGenerateReport}
          onCloseWithoutReport={handleCloseMonthWithoutReport}
          onCancel={() => setShowCloseMonthDialog(false)}
        />
      )}

      {/* Monthly Board Report */}
      {showBoardReport && (
        <MonthlyBoardReport
          monthIndex={closingMonthIndex}
          fiscalYear={data.settings.fiscalYear}
          budget={budget}
          transactions={data.transactions}
          members={data.members}
          plannedCapex={plannedCapex}
          majorMaintenanceItems={majorMaintenanceItems}
          onComplete={handleReportComplete}
          onClose={() => setShowBoardReport(false)}
        />
      )}
    </div>
  );
}

export default CashFlow;
