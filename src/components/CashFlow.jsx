import React, { useState, useEffect } from 'react';
import { AlertTriangle, Edit3, Plus, CheckCircle, TrendingUp, TrendingDown, DollarSign, Eye, Archive } from 'lucide-react';
import {
  formatCurrency,
  getCurrentFiscalMonth,
  calculateMonthlyActuals,
  generateCashFlowProjection,
  calculateBudgetPerformance,
  checkBalanceWarnings,
  MONTHS
} from '../utils/helpers';
import storage from '../services/storage';
import BudgetEditor from './BudgetEditor';
import CapexManager from './CapexManager';
import YearEndWizard from './YearEndWizard';

// Warning banner for no budget
function NoBudgetWarning({ onCreateBudget }) {
  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900 mb-2">No Budget Set</h3>
          <p className="text-sm text-amber-800 mb-4">
            You haven't created a budget for this fiscal year yet. Create a budget to start tracking your cash flow projections and monitor your financial performance.
          </p>
          <button
            onClick={onCreateBudget}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">FY{budget.fiscalYear} Annual Summary</h3>
        <div className="flex gap-2">
          {showRefreshButton && (
            <button
              onClick={onRefreshFromPriorYear}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              title="Update budget using latest actuals from prior year"
            >
              <TrendingUp className="w-4 h-4" />
              Refresh from FY{budget.fiscalYear - 1} Actuals
            </button>
          )}
          <button
            onClick={onCloseYear}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <Archive className="w-4 h-4" />
            Close Year & Create Next Year
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-600 mb-2 uppercase tracking-wide font-semibold">Projected Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(projectedRevenue)}</p>
          <p className="text-xs text-slate-500 mt-1">Budgeted</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-600 mb-2 uppercase tracking-wide font-semibold">Actual Revenue</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(actualRevenue)}</p>
          <p className="text-xs text-slate-500 mt-1">Year to Date</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-600 mb-2 uppercase tracking-wide font-semibold">Projected Net (Year)</p>
          <p className={`text-2xl font-bold ${projectedNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {projectedNet >= 0 ? '+' : ''}{formatCurrency(projectedNet)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {projectedNet >= 0 ? 'Surplus' : 'Deficit'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-600 mb-2 uppercase tracking-wide font-semibold">Projected Ending Balance</p>
          <p className={`text-2xl font-bold ${endingBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatCurrency(endingBalance)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Sep {budget.fiscalYear}</p>
        </div>
      </div>
    </div>
  );
}

// Balance warnings banner
function BalanceWarnings({ projections, threshold }) {
  const warnings = checkBalanceWarnings(projections, threshold);

  if (warnings.length === 0) return null;

  const criticalWarnings = warnings.filter(w => w.isCritical);
  const lowBalanceWarnings = warnings.filter(w => !w.isCritical);

  return (
    <div className="space-y-3 animate-slide-up">
      {criticalWarnings.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-rose-900 mb-2">Critical: Negative Balance Projected</h3>
              <p className="text-sm text-rose-800 mb-3">
                Your projected balance will go negative in the following months:
              </p>
              <ul className="text-sm text-rose-700 space-y-1">
                {criticalWarnings.map(w => (
                  <li key={w.month}>
                    • <strong>{w.monthName}</strong>: {formatCurrency(w.balance)} (deficit of {formatCurrency(Math.abs(w.balance))})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {lowBalanceWarnings.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 mb-2">End-of-Year Balance Warning</h3>
              <p className="text-sm text-amber-800 mb-3">
                Your projected end-of-fiscal-year balance will fall below the $20,000 minimum needed to carry into next season:
              </p>
              <ul className="text-sm text-amber-700 space-y-1">
                {lowBalanceWarnings.map(w => (
                  <li key={w.month}>
                    • <strong>{w.monthName}</strong>: {formatCurrency(w.balance)} ({formatCurrency(w.deficit)} below minimum)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Cash flow projection table
function CashFlowTable({ projections, currentMonth, onEditBudget, onCloseMonth, fiscalYear, plannedCapex, onViewCapexProject }) {
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">
          FY{fiscalYear} Monthly Cash Flow - Budget vs Actual
        </h2>
        <button
          onClick={onEditBudget}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Edit Budget
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th rowSpan="2" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200">
                Month
              </th>
              <th colSpan="2" className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200 bg-emerald-50">
                Revenue
              </th>
              <th colSpan="2" className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200 bg-rose-50">
                OPEX
              </th>
              <th colSpan="2" className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200 bg-amber-50">
                CAPEX
              </th>
              <th colSpan="2" className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200">
                Net
              </th>
              <th colSpan="2" className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200">
                Balance
              </th>
              <th rowSpan="2" className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
            <tr className="border-t border-slate-200">
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 bg-emerald-50">Budget</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 border-r border-slate-200 bg-emerald-50">Actual</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 bg-rose-50">Budget</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 border-r border-slate-200 bg-rose-50">Actual</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 bg-amber-50">Budget</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 border-r border-slate-200 bg-amber-50">Actual</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Budget</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 border-r border-slate-200">Actual</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Budget</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 border-r border-slate-200">Actual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projections.map((proj, idx) => {
              // Combine OPEX and G&A for display
              const opexBudget = proj.opexBudget + proj.gaBudget;
              const opexActual = proj.opex + proj.ga;

              return (
                <tr
                  key={idx}
                  className={`${
                    proj.isCurrent ? 'bg-blue-50' : proj.isPast ? 'bg-white' : 'bg-slate-50'
                  } hover:bg-slate-100 transition-colors`}
                >
                  <td className="px-3 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">
                    {proj.monthName}
                    {proj.isCurrent && <span className="ml-2 text-xs text-blue-600 font-semibold">← Current</span>}
                  </td>

                  {/* Revenue */}
                  <td className="px-3 py-3 text-right text-slate-500">
                    {formatCurrency(proj.revenueBudget)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-emerald-600 border-r border-slate-200">
                    {proj.isActual ? formatCurrency(proj.revenue) : '-'}
                  </td>

                  {/* OPEX (including G&A) */}
                  <td className="px-3 py-3 text-right text-slate-500">
                    {formatCurrency(opexBudget)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-rose-600 border-r border-slate-200">
                    {proj.isActual ? formatCurrency(opexActual) : '-'}
                  </td>

                  {/* CAPEX */}
                  <td className="px-3 py-3 text-right text-slate-500">
                    {(() => {
                      const monthProjects = plannedCapex?.filter(p => p.month === idx) || [];
                      const hasProjects = monthProjects.length > 0;
                      const projectsList = monthProjects.map(p => `${p.name} (${formatCurrency(p.amount)})`).join(', ');

                      if (proj.capexBudget > 0 && hasProjects) {
                        return (
                          <div className="flex items-center justify-end gap-2">
                            <span>{formatCurrency(proj.capexBudget)}</span>
                            <button
                              onClick={onViewCapexProject}
                              className="group relative"
                              title="View CAPEX projects"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-500 hover:text-amber-700 transition-colors" />
                              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                                <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
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
                  <td className="px-3 py-3 text-right font-semibold text-amber-700 border-r border-slate-200">
                    {proj.isActual && proj.capex > 0 ? formatCurrency(proj.capex) : '-'}
                  </td>

                  {/* Net */}
                  <td className={`px-3 py-3 text-right ${proj.budgetedNet >= 0 ? 'text-slate-500' : 'text-rose-400'}`}>
                    {formatCurrency(proj.budgetedNet)}
                  </td>
                  <td className={`px-3 py-3 text-right font-bold border-r border-slate-200 ${
                    proj.isActual ? (proj.actualNet >= 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-400'
                  }`}>
                    {proj.isActual ? formatCurrency(proj.actualNet) : '-'}
                  </td>

                  {/* Balance - Budgeted */}
                  <td className={`px-3 py-3 text-right font-bold ${
                    proj.budgetedBalance < 0 ? 'text-rose-600' : proj.budgetedBalance < 5000 ? 'text-amber-600' : 'text-slate-900'
                  }`}>
                    {formatCurrency(proj.budgetedBalance)}
                  </td>

                  {/* Balance - Actual */}
                  <td className={`px-3 py-3 text-right font-bold border-r border-slate-200 ${
                    proj.actualBalance < 0 ? 'text-rose-600' : proj.actualBalance < 5000 ? 'text-amber-600' : 'text-slate-900'
                  }`}>
                    {proj.isActual ? formatCurrency(proj.actualBalance) : '-'}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 text-center">
                    {proj.isPast && (
                      <button
                        onClick={() => onCloseMonth(idx)}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        title="Close month - lock in actuals as budget"
                      >
                        Close
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Totals Row */}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <td className="px-3 py-3 text-left text-slate-900 border-r border-slate-200">
                TOTALS
              </td>

              {/* Revenue Totals */}
              <td className="px-3 py-3 text-right text-emerald-700">
                {formatCurrency(totals.revenueBudget)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-emerald-600 border-r border-slate-200">
                {formatCurrency(totals.revenueActual)}
              </td>

              {/* OPEX Totals */}
              <td className="px-3 py-3 text-right text-rose-700">
                {formatCurrency(totals.opexBudget)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-rose-600 border-r border-slate-200">
                {formatCurrency(totals.opexActual)}
              </td>

              {/* CAPEX Totals */}
              <td className="px-3 py-3 text-right text-amber-700">
                {formatCurrency(totals.capexBudget)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-amber-600 border-r border-slate-200">
                {formatCurrency(totals.capexActual)}
              </td>

              {/* Net Totals */}
              <td className={`px-3 py-3 text-right ${totals.netBudget >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(totals.netBudget)}
              </td>
              <td className={`px-3 py-3 text-right font-bold border-r border-slate-200 ${
                totals.netActual >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatCurrency(totals.netActual)}
              </td>

              {/* Balance Totals - empty cells */}
              <td className="px-3 py-3"></td>
              <td className="px-3 py-3 border-r border-slate-200"></td>

              {/* Actions - empty cell */}
              <td className="px-3 py-3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Planned CAPEX widget
function PlannedCapexWidget({ projects, onManage }) {
  const totalPlanned = projects.filter(p => !p.completed).reduce((sum, p) => sum + p.amount, 0);
  const totalCompleted = projects.filter(p => p.completed).reduce((sum, p) => sum + (p.actualAmount || p.amount), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Planned Capital Expenditures</h3>
        <button
          onClick={onManage}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Manage Projects
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Planned (Pending)</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPlanned)}</p>
          <p className="text-xs text-slate-500 mt-1">{projects.filter(p => !p.completed).length} projects</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCompleted)}</p>
          <p className="text-xs text-slate-500 mt-1">{projects.filter(p => p.completed).length} projects</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-lg">
          No CAPEX projects planned for this fiscal year
        </p>
      ) : (
        <div className="space-y-2">
          {projects.map(project => (
            <div
              key={project.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                project.completed
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  {project.completed && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  {project.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {MONTHS[project.month]} {project.fiscalYear}
                  {project.description && ` • ${project.description}`}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(project.amount)}
                </p>
                {project.completed && project.actualAmount && project.actualAmount !== project.amount && (
                  <p className="text-xs text-slate-500">
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

// Budget performance widget
function BudgetPerformanceWidget({ performance }) {
  const categories = [
    { key: 'revenue', label: 'Revenue', isRevenue: true },
    { key: 'opex', label: 'OPEX', isRevenue: false },
    { key: 'capex', label: 'CAPEX', isRevenue: false },
    { key: 'ga', label: 'G&A', isRevenue: false },
    { key: 'net', label: 'Net', isRevenue: false }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Budget Performance - YTD</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Budget YTD</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actual YTD</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Variance</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {categories.map(cat => {
              const data = performance[cat.key];
              const isUnder = cat.isRevenue ? data.variance < 0 : data.variance < 0;
              const isOver = cat.isRevenue ? data.variance > 0 : data.variance > 0;

              return (
                <tr key={cat.key}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{cat.label}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(data.budget)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">{formatCurrency(data.actual)}</td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${
                    Math.abs(data.variance) < 0.01 ? 'text-slate-500' :
                    (cat.isRevenue ? data.variance > 0 : data.variance < 0) ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {data.variance > 0 ? '+' : ''}{formatCurrency(data.variance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Math.abs(data.variance) < 0.01 ? (
                      <span className="text-slate-500">On Track</span>
                    ) : cat.isRevenue ? (
                      data.variance > 0 ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4" /> Over
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center justify-center gap-1">
                          <TrendingDown className="w-4 h-4" /> Under
                        </span>
                      )
                    ) : (
                      data.variance < 0 ? (
                        <span className="text-emerald-600">✓ Under</span>
                      ) : (
                        <span className="text-rose-600">⚠️ Over</span>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main CashFlow component
function CashFlow({ data, metrics, onRefresh }) {
  const [budget, setBudget] = useState(null);
  const [plannedCapex, setPlannedCapex] = useState([]);
  const [projections, setProjections] = useState([]);
  const [actuals, setActuals] = useState([]);
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [showCapexManager, setShowCapexManager] = useState(false);
  const [showYearEndWizard, setShowYearEndWizard] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(getCurrentFiscalMonth());

  useEffect(() => {
    loadData();
  }, [data]);

  const loadData = () => {
    // Load budget and CAPEX
    const budgetData = storage.getBudget(data.settings.fiscalYear);
    const capexData = storage.getPlannedCapex(data.settings.fiscalYear);

    setBudget(budgetData);
    setPlannedCapex(capexData);

    if (budgetData) {
      // Enhanced debug logging
      console.log('\n=== CASH FLOW LOAD DATA ===');
      console.log('Fiscal Year:', data.settings.fiscalYear);
      console.log('Current Fiscal Month:', currentMonth);
      console.log('Total Transactions:', data.transactions.length);
      console.log('Budget Starting Balance:', budgetData.startingBalance);

      // Show details of recent transactions
      console.log('\n📋 Last 5 Transactions:');
      data.transactions.slice(-5).forEach((txn, idx) => {
        console.log(`  ${idx + 1}. ${txn.description}:`, {
          date: txn.date,
          type: txn.type,
          expenseType: txn.expenseType,
          amount: txn.amount,
          createdAt: txn.createdAt
        });
      });

      // Calculate actuals from transactions
      const monthlyActuals = calculateMonthlyActuals(
        data.transactions,
        data.settings.fiscalYear,
        data.settings.startDate
      );
      console.log('\n📊 Monthly Actuals Summary:');
      monthlyActuals.forEach((actual, month) => {
        if (actual.transactionCount > 0) {
          console.log(`  Month ${month}: ${actual.transactionCount} transactions, Revenue: ${actual.revenue}, OPEX: ${actual.opex}, CAPEX: ${actual.capex}, G&A: ${actual.ga}`);
        }
      });
      setActuals(monthlyActuals);

      // Generate projections
      const proj = generateCashFlowProjection(
        budgetData,
        monthlyActuals,
        currentMonth,
        budgetData.startingBalance
      );
      console.log('\n💰 Current Month Projection:');
      if (proj[currentMonth]) {
        console.log('  Actual Balance:', proj[currentMonth].actualBalance);
        console.log('  Is Actual:', proj[currentMonth].isActual);
        console.log('  Revenue:', proj[currentMonth].revenue);
        console.log('  OPEX:', proj[currentMonth].opex);
        console.log('  CAPEX:', proj[currentMonth].capex);
      }
      console.log('=== END CASH FLOW DEBUG ===\n');

      setProjections(proj);
    }
  };

  const handleSaveBudget = (newBudget) => {
    storage.saveBudget(newBudget);
    setShowBudgetEditor(false);
    onRefresh();
  };

  const handleCloseMonth = (monthIndex) => {
    if (!budget || !actuals) return;

    const confirmation = window.confirm(
      `Close ${MONTHS[monthIndex]}? This will update the budget to match actual values and cannot be undone.`
    );

    if (!confirmation) return;

    const updatedBudget = { ...budget };
    const actualMonth = actuals[monthIndex];

    // Update budget to match actuals
    updatedBudget.monthlyBudgets[monthIndex] = {
      ...updatedBudget.monthlyBudgets[monthIndex],
      revenue: actualMonth.revenue,
      opex: actualMonth.opex,
      capex: actualMonth.capex,
      ga: actualMonth.ga
    };

    storage.saveBudget(updatedBudget);
    onRefresh();
  };

  const handleSaveCapex = (projects) => {
    setPlannedCapex(projects);
    setShowCapexManager(false);
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
      console.log(`📊 Refreshing FY${currentYear} budget from FY${priorYear} actuals...`);

      // Load prior year transactions
      const priorYearTransactions = JSON.parse(
        localStorage.getItem(`lfst_finance_transactions_${priorYear}`) || '[]'
      ) || [];

      console.log(`  Found ${priorYearTransactions.length} transactions in FY${priorYear}`);

      // Calculate actuals from prior year
      const priorYearActuals = calculateMonthlyActuals(
        priorYearTransactions,
        priorYear,
        `${priorYear - 1}-10-01`
      );

      console.log('  Prior year actuals:', priorYearActuals);

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

      console.log('  ✅ Budget updated:', updatedBudget);

      storage.saveBudget(updatedBudget);
      onRefresh();

      alert(`Budget refreshed successfully from FY${priorYear} actuals!`);
    } catch (error) {
      console.error('❌ Error refreshing budget:', error);
      alert('Failed to refresh budget: ' + error.message);
    }
  };

  const performance = budget && actuals.length > 0
    ? calculateBudgetPerformance(budget, actuals, currentMonth)
    : null;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Warning Banners */}
      {!budget && <NoBudgetWarning onCreateBudget={() => setShowBudgetEditor(true)} />}

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

      {budget && projections.length > 0 && (
        <BalanceWarnings
          projections={projections}
          threshold={budget.lowBalanceThreshold || 5000}
        />
      )}

      {/* Cash Flow Projection Table */}
      {budget && projections.length > 0 && (
        <CashFlowTable
          projections={projections}
          currentMonth={currentMonth}
          onEditBudget={() => setShowBudgetEditor(true)}
          onCloseMonth={handleCloseMonth}
          fiscalYear={data.settings.fiscalYear}
          plannedCapex={plannedCapex}
          onViewCapexProject={() => setShowCapexManager(true)}
        />
      )}

      {/* Planned CAPEX Projects */}
      {budget && (
        <PlannedCapexWidget
          projects={plannedCapex}
          onManage={() => setShowCapexManager(true)}
        />
      )}

      {/* Budget vs Actual YTD */}
      {performance && (
        <BudgetPerformanceWidget performance={performance} />
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
    </div>
  );
}

export default CashFlow;
