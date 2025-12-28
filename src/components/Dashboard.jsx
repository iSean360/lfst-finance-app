import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, ChevronRight, AlertCircle, CreditCard, AlertTriangle, Home, Clock, Package, Wrench, Archive, Shield } from 'lucide-react';
import { formatCurrency, MONTHS, calculateYearTotal, checkBylawCompliance, RESIDENCE_TYPE, calculateBudgetPerformance, calculateMonthlyActuals, getCurrentFiscalMonth, generateCashFlowProjection, checkBalanceWarnings } from '../utils/helpers';
import storage from '../services/storage';
import { calculateInflatedCost } from '../constants/majorMaintenance';

// Helper function to calculate CAPEX alert status
const getCapexAlertStatus = (project) => {
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

function CapexDepreciationWidget({ fiscalYear, setActiveView }) {
  const [capexProjects, setCapexProjects] = useState([]);

  useEffect(() => {
    const loadCapexProjects = async () => {
      const projects = await storage.getPlannedCapex(fiscalYear);
      setCapexProjects(projects);
    };

    loadCapexProjects();
  }, [fiscalYear]);

  const trackedProjects = capexProjects.filter(p => p.completed && p.alertYear && p.trackingEnabled !== false);

  if (trackedProjects.length === 0) {
    return null;
  }

  // Get projects with warnings (including overdue)
  const projectsWithWarnings = trackedProjects
    .map(p => ({ ...p, alertStatus: getCapexAlertStatus(p) }))
    .filter(p => p.alertStatus && (p.alertStatus.status === 'critical' || p.alertStatus.status === 'warning' || p.alertStatus.status === 'overdue'))
    .sort((a, b) => a.alertStatus.yearsUntil - b.alertStatus.yearsUntil);

  const criticalCount = projectsWithWarnings.filter(p => p.alertStatus.status === 'critical').length;
  const warningCount = projectsWithWarnings.filter(p => p.alertStatus.status === 'warning').length;
  const overdueCount = projectsWithWarnings.filter(p => p.alertStatus.status === 'overdue').length;

  // If no warnings, show compact view
  if (projectsWithWarnings.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Capital Assets</h3>
              <p className="text-xs text-slate-600">{trackedProjects.length} assets tracked • All replacement reminders on track</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('transactions')}
            className="py-1.5 px-3 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    );
  }

  const status = (criticalCount > 0 || overdueCount > 0) ? 'critical' : 'warning';
  const statusColors = {
    critical: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-600' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' }
  };

  const colors = statusColors[status];

  return (
    <div className={`${colors.bg} border-2 ${colors.border} rounded-2xl p-6`}>
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <AlertTriangle className={`w-5 h-5 ${colors.icon}`} />
        Capital Asset Replacement Alerts
      </h3>

      <p className="text-sm text-slate-700 mb-4">
        {overdueCount > 0 && (
          <span className="font-semibold text-rose-700">
            {overdueCount} asset{overdueCount !== 1 ? 's' : ''} overdue for replacement planning
          </span>
        )}
        {overdueCount > 0 && criticalCount > 0 && <span> • </span>}
        {criticalCount > 0 && (
          <span className="font-semibold text-rose-700">
            {criticalCount} asset{criticalCount !== 1 ? 's' : ''} nearing reminder year
          </span>
        )}
        {(overdueCount > 0 || criticalCount > 0) && warningCount > 0 && <span> • </span>}
        {warningCount > 0 && (
          <span className="font-semibold text-amber-700">
            {warningCount} asset{warningCount !== 1 ? 's' : ''} needs planning soon
          </span>
        )}
      </p>

      <div className="space-y-3 mb-4">
        {projectsWithWarnings.slice(0, 3).map(project => {
          const status = project.alertStatus;
          const isCritical = status.status === 'critical' || status.status === 'overdue';

          return (
            <div key={project.id} className={`bg-white rounded-lg p-4 border ${isCritical ? 'border-rose-300' : 'border-amber-300'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isCritical ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    <h4 className="font-semibold text-slate-900">{project.name}</h4>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>
                      <strong>Reminder Year:</strong> {status.alertYear}
                    </p>
                    <p>
                      <strong>Budgeted Amount:</strong> {formatCurrency(project.amount)}
                    </p>
                    {project.actualAmount && (
                      <p>
                        <strong>Actual Cost:</strong> {formatCurrency(project.actualAmount)}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`text-right font-bold ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                  <p className="text-2xl">{status.yearsUntil}</p>
                  <p className="text-xs">{status.yearsUntil === 0 ? 'overdue' : `year${status.yearsUntil !== 1 ? 's' : ''} until`}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projectsWithWarnings.length > 3 && (
        <p className="text-sm text-slate-600 mb-4">
          +{projectsWithWarnings.length - 3} more asset{projectsWithWarnings.length - 3 !== 1 ? 's' : ''} approaching reminder year
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('transactions')}
          className="flex-1 py-2 px-4 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          View All Transactions
        </button>
        <button
          onClick={() => setActiveView('transactions')}
          className={`flex-1 py-2 px-4 ${criticalCount > 0 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'} text-white rounded-lg text-sm font-medium transition-colors`}
        >
          View Transactions
        </button>
      </div>
    </div>
  );
}

function BylawComplianceWidget({ members, setActiveView }) {
  // Ensure all members have residence field
  const membersWithResidence = members.map(m => ({
    ...m,
    residence: m.residence || RESIDENCE_TYPE.INSIDE
  }));

  const compliance = checkBylawCompliance(membersWithResidence);
  const { compliant, percentage, count, overLimit } = compliance;

  // Color coding - Preserve accent colors in dark mode
  const status = percentage > 0.50 ? 'violation' : percentage > 0.45 ? 'warning' : 'good';
  const statusColors = {
    good: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/40',
      border: 'border-emerald-200 dark:border-emerald-700/50',
      text: 'text-emerald-700 dark:text-emerald-200',
      icon: '✅',
      barColor: 'bg-emerald-500 dark:bg-emerald-600'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/40',
      border: 'border-amber-200 dark:border-amber-700/50',
      text: 'text-amber-700 dark:text-amber-200',
      icon: '⚠️',
      barColor: 'bg-amber-500 dark:bg-amber-600'
    },
    violation: {
      bg: 'bg-rose-50 dark:bg-rose-900/40',
      border: 'border-rose-200 dark:border-rose-700/50',
      text: 'text-rose-700 dark:text-rose-200',
      icon: '🔴',
      barColor: 'bg-rose-500 dark:bg-rose-600'
    }
  };

  const colors = statusColors[status];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        {colors.icon} Bylaw Compliance Status
      </h3>

      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
        Outside Member Limit: <span className="font-semibold">50% Maximum</span>
      </p>

      {/* Progress bar */}
      <div className="relative w-full h-7 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all ${colors.barColor}`}
          style={{ width: `${Math.min(percentage * 100, 100)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {(percentage * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white dark:bg-[#1e293b] border dark:border-[#334155] rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
            <p className="text-xs text-slate-600 dark:text-slate-200">Inside Neighborhood</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-[#f8fafc]">
            {count.inside}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
            {count.total > 0 ? ((count.inside / count.total) * 100).toFixed(1) : 0}% of total
          </p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] border dark:border-[#334155] rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-blue-600 dark:text-blue-300" />
            <p className="text-xs text-slate-600 dark:text-slate-200">Outside Neighborhood</p>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-[#f8fafc]">
            {count.outside}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
            {count.total > 0 ? ((count.outside / count.total) * 100).toFixed(1) : 0}% of total
          </p>
        </div>
      </div>

      {/* Warning/Alert */}
      {!compliant && (
        <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-3 mb-3`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className={`text-sm font-semibold ${colors.text} mb-2`}>
                WARNING: Outside members exceed 50% limit
              </p>
              <ul className={`text-sm ${colors.text} space-y-1`}>
                <li>• {overLimit} outside member{overLimit !== 1 ? 's' : ''} over limit</li>
                <li>• Cannot accept new outside members</li>
                <li>• Consider waitlist for outside applicants</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {compliant && percentage > 0.18 && (
        <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 rounded-lg p-2 mb-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Approaching limit:</span> Consider monitoring outside member applications carefully.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('members')}
          className="flex-1 py-2 px-4 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-[#334155] rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors"
        >
          View Member Details
        </button>
        <button
          onClick={() => setActiveView('reports')}
          className="flex-1 py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}

// Reserve Requirement Widget (15% of revenue per bylaws)
function ReserveRequirementWidget({ metrics, setActiveView }) {
  const requiredReserve = metrics.totalRevenue * 0.15;
  const netIncome = metrics.netIncome;
  const metRequirement = netIncome >= requiredReserve;
  const surplus = netIncome - requiredReserve;

  const status = metRequirement ? 'compliant' : 'violation';
  const statusColors = {
    compliant: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/40',
      border: 'border-emerald-200 dark:border-emerald-700/50',
      text: 'text-emerald-700 dark:text-emerald-200',
      icon: '✅',
      barColor: 'bg-emerald-500 dark:bg-emerald-600'
    },
    violation: {
      bg: 'bg-rose-50 dark:bg-rose-900/40',
      border: 'border-rose-200 dark:border-rose-700/50',
      text: 'text-rose-700 dark:text-rose-200',
      icon: '🔴',
      barColor: 'bg-rose-500 dark:bg-rose-600'
    }
  };

  const colors = statusColors[status];
  const percentage = requiredReserve > 0 ? Math.min((netIncome / requiredReserve), 2) : 0;

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        {colors.icon} Replacement Reserve Requirement (Bylaw 7.6)
      </h3>

      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
        Required Reserve: <span className="font-semibold">15% of Total Revenue</span>
      </p>

      {/* Progress bar */}
      <div className="relative w-full h-7 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all ${colors.barColor}`}
          style={{ width: `${Math.min(percentage * 100, 100)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {(percentage * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white dark:bg-[#1e293b] border dark:border-[#334155] rounded-lg p-2">
          <p className="text-xs text-slate-600 dark:text-slate-200 mb-1">Required Reserve (15%)</p>
          <p className="text-xl font-bold text-slate-900 dark:text-[#f8fafc]">
            {formatCurrency(requiredReserve)}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] border dark:border-[#334155] rounded-lg p-2">
          <p className="text-xs text-slate-600 dark:text-slate-200 mb-1">Net Income (YTD)</p>
          <p className={`text-xl font-bold ${netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
            {formatCurrency(netIncome)}
          </p>
        </div>
      </div>

      {/* Status message */}
      {metRequirement ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <div className="text-emerald-600 dark:text-emerald-300 text-lg">✓</div>
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200 mb-1">
                ✅ Reserve Requirement Met
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-300">
                Net income exceeds 15% requirement by {formatCurrency(surplus)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-3 mb-3`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-200 mb-2">
                ⚠️ WARNING: Reserve Requirement Not Met
              </p>
              <ul className="text-sm text-rose-600 dark:text-rose-300 space-y-1">
                <li>• Shortfall: {formatCurrency(Math.abs(surplus))}</li>
                <li>• Net income below 15% of revenue requirement</li>
                <li>• Review expenses or increase revenue to meet bylaw requirement</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('pl')}
          className="flex-1 py-2 px-4 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-[#334155] rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors"
        >
          View P&L
        </button>
        <button
          onClick={() => setActiveView('yearend')}
          className="flex-1 py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Year-End Report
        </button>
      </div>
    </div>
  );
}

// Budget performance widget
function BudgetPerformanceWidget({ performance }) {
  const categories = [
    { key: 'revenue', label: 'Revenue', isRevenue: true },
    { key: 'opex', label: 'OPEX', isRevenue: false },
    { key: 'capex', label: 'CAPEX', isRevenue: false },
    { key: 'net', label: 'Net', isRevenue: false }
  ];

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-[#334155] p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Budget Performance - YTD</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-transparent">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Budget YTD</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Actual YTD</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Variance</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#334155]">
            {categories.map(cat => {
              const catData = performance[cat.key];

              return (
                <tr key={cat.key} className="hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-[#f8fafc]">{cat.label}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">{formatCurrency(catData.budget)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(catData.actual)}</td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${
                    Math.abs(catData.variance) < 0.01 ? 'text-slate-500 dark:text-slate-400' :
                    (cat.isRevenue ? catData.variance > 0 : catData.variance < 0) ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
                  }`}>
                    {catData.variance > 0 ? '+' : ''}{formatCurrency(catData.variance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Math.abs(catData.variance) < 0.01 ? (
                      <span className="text-slate-500 dark:text-slate-400">On Track</span>
                    ) : cat.isRevenue ? (
                      catData.variance > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-300 flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4" /> Over
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-300 flex items-center justify-center gap-1">
                          <TrendingDown className="w-4 h-4" /> Under
                        </span>
                      )
                    ) : (
                      catData.variance < 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-300">✓ Under</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-300">⚠️ Over</span>
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

function UpcomingMajorMaintenanceWidget({ fiscalYear, setActiveView }) {
  const [upcomingItems, setUpcomingItems] = useState([]);

  useEffect(() => {
    const loadUpcomingMaintenance = async () => {
      const items = await storage.getUpcomingMajorMaintenance();
      setUpcomingItems(items);
    };

    loadUpcomingMaintenance();
  }, [fiscalYear]);

  if (upcomingItems.length === 0) {
    return null;
  }

  // Sort by next due date
  const sortedItems = upcomingItems.sort((a, b) => {
    return new Date(a.nextDueDateMin) - new Date(b.nextDueDateMin);
  });

  // Calculate time until due with intelligent alert timing
  const itemsWithStatus = sortedItems.map(item => {
    const nextDue = new Date(item.nextDueDateMin);
    const now = new Date();
    const yearsUntil = (nextDue - now) / (1000 * 60 * 60 * 24 * 365.25);
    const monthsUntil = Math.round(yearsUntil * 12);

    // Alert thresholds: critical = current year, warning = within 2 years
    const criticalThreshold = 0.5; // 6 months
    const warningThreshold = 2;

    let status;
    if (yearsUntil <= 0) {
      status = 'overdue';
    } else if (yearsUntil <= criticalThreshold) {
      status = 'critical';
    } else if (yearsUntil <= warningThreshold) {
      status = 'warning';
    } else {
      status = 'good';
    }

    return {
      ...item,
      yearsUntil,
      monthsUntil,
      status
    };
  });

  // Filter to only show items that need attention (not "good" status) and have tracking enabled
  const itemsNeedingAttention = itemsWithStatus.filter(i => i.status !== 'good' && i.trackingEnabled !== false);

  const overdueCount = itemsNeedingAttention.filter(i => i.status === 'overdue').length;
  const criticalCount = itemsNeedingAttention.filter(i => i.status === 'critical').length;
  const warningCount = itemsNeedingAttention.filter(i => i.status === 'warning').length;

  if (itemsNeedingAttention.length === 0) {
    return null;
  }

  return (
    <div className={`border-2 rounded-xl p-4 ${
      (overdueCount > 0 || criticalCount > 0)
        ? 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-300'
        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            (overdueCount > 0 || criticalCount > 0) ? 'bg-rose-500' : 'bg-amber-500'
          }`}>
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`font-bold ${(overdueCount > 0 || criticalCount > 0) ? 'text-rose-900' : 'text-amber-900'}`}>
              Upcoming Major Maintenance
            </h3>
            <p className={`text-sm ${(overdueCount > 0 || criticalCount > 0) ? 'text-rose-700' : 'text-amber-700'}`}>
              {overdueCount > 0 && `${overdueCount} overdue • `}
              {criticalCount > 0 && `${criticalCount} critical • `}
              {warningCount > 0 && `${warningCount} needs planning`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveView('transactions')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            (overdueCount > 0 || criticalCount > 0)
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          View Transactions
        </button>
      </div>

      <div className="space-y-3">
        {itemsNeedingAttention.slice(0, 3).map(item => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border-2 ${
              (item.status === 'critical' || item.status === 'overdue')
                ? 'bg-white border-rose-200'
                : 'bg-white border-amber-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-slate-900">{item.name}</h4>
                  {item.status === 'overdue' && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Overdue
                    </span>
                  )}
                  {item.status === 'critical' && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Due Soon
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      <strong>Last Done:</strong> {new Date(item.lastOccurrence.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} ({formatCurrency(item.lastOccurrence.amount)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      <strong>Next Due:</strong> {new Date(item.nextDueDateMin).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} - {new Date(item.nextDueDateMax).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      <strong>Expected Cost:</strong> {formatCurrency(item.nextExpectedCost)} (with 3% inflation)
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${(item.status === 'critical' || item.status === 'overdue') ? 'text-rose-600' : 'text-amber-600'}`}>
                  {item.status === 'overdue' ? Math.abs(item.monthsUntil) : item.monthsUntil} mo
                </p>
                <p className="text-xs text-slate-500">{item.status === 'overdue' ? 'overdue' : 'until due'}</p>
              </div>
            </div>
          </div>
        ))}
        {itemsNeedingAttention.length > 3 && (
          <p className="text-sm text-center text-slate-600 pt-2">
            +{itemsNeedingAttention.length - 3} more item{itemsNeedingAttention.length - 3 !== 1 ? 's' : ''} needing attention
          </p>
        )}
      </div>
    </div>
  );
}

function Dashboard({ metrics, data, setActiveView, onRefresh }) {
  // Calculate budget performance
  const currentMonth = getCurrentFiscalMonth();
  const [budget, setBudget] = useState(null);
  const [actuals, setActuals] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [projections, setProjections] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    const loadBudget = async () => {
      const budgetData = await storage.getBudget(data.settings.fiscalYear);
      setBudget(budgetData);

      const actualsData = budgetData ? calculateMonthlyActuals(
        data.transactions,
        data.settings.fiscalYear,
        data.settings.startDate
      ) : [];
      setActuals(actualsData);

      const performanceData = budgetData && actualsData.length > 0
        ? calculateBudgetPerformance(budgetData, actualsData, currentMonth)
        : null;
      setPerformance(performanceData);

      // Generate cash flow projections for balance warnings
      const projectionsData = budgetData && actualsData.length > 0
        ? generateCashFlowProjection(budgetData, actualsData, currentMonth, data.balance.current)
        : [];
      setProjections(projectionsData);
    };

    loadBudget();
  }, [data.settings.fiscalYear, data.transactions, data.settings.startDate, currentMonth, data.balance.current]);

  return (
    <div className="space-y-3 animate-slide-up">
      {/* ALERTS SECTION - Subtle Banner */}
      <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl shadow-sm">
        <button
          onClick={() => setShowAlerts(!showAlerts)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors group focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-700"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">Alerts</span>
            </div>

            {/* Quick Alert Indicators - Preserve accent colors */}
            <div className="flex items-center gap-3">
              {metrics.unpaidMembers > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/50 rounded-md border border-amber-200 dark:border-amber-800">
                  <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-200" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-200">{metrics.unpaidMembers} unpaid</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-md border border-emerald-200 dark:border-emerald-800">
                <Shield className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-200" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-200">Compliance</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded-md border border-blue-200 dark:border-blue-800">
                <Wrench className="w-3.5 h-3.5 text-blue-700 dark:text-blue-200" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-200">Maintenance</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 dark:bg-purple-900/50 rounded-md border border-purple-200 dark:border-purple-800">
                <Package className="w-3.5 h-3.5 text-purple-700 dark:text-purple-200" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-200">Assets</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
              {showAlerts ? 'Hide details' : 'View details'}
            </span>
            <ChevronRight className={`w-4 h-4 text-red-500 dark:text-red-400 transition-transform ${showAlerts ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {/* Alert Details - Collapsible */}
        {showAlerts && (
          <div className="border-t border-red-200 dark:border-red-900/50 p-4 space-y-3 bg-white dark:bg-[#1e293b]">
            {/* Reserve Requirement Alert (Bylaw 7.6) */}
            <ReserveRequirementWidget metrics={metrics} setActiveView={setActiveView} />

            {/* Bylaw Compliance Alert */}
            {data.members && data.members.length > 0 && (
              <BylawComplianceWidget members={data.members} setActiveView={setActiveView} />
            )}

            {/* CAPEX Depreciation Alert */}
            <CapexDepreciationWidget fiscalYear={data.settings?.fiscalYear} setActiveView={setActiveView} />

            {/* Upcoming Major Maintenance Alert */}
            <UpcomingMajorMaintenanceWidget fiscalYear={data.settings?.fiscalYear} setActiveView={setActiveView} />

            {/* Unpaid Members Alert */}
            {metrics.unpaidMembers > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900 mb-2">Action Items</h3>
                    <ul className="space-y-2 text-sm text-amber-800">
                      <li>• {metrics.unpaidMembers} members have not paid dues for FY{data.settings?.fiscalYear}</li>
                      <li>• Review monthly services payment schedule</li>
                      <li>• Consider generating monthly board report</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* End-of-Year Balance Warning */}
            {budget && projections.length > 0 && (() => {
              const warnings = checkBalanceWarnings(projections, budget.lowBalanceThreshold || 5000);
              const lowBalanceWarnings = warnings.filter(w => !w.isCritical);

              if (lowBalanceWarnings.length === 0) return null;

              return (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-amber-900 mb-2">End-of-Year Balance Warning</h3>
                      <p className="text-sm text-amber-800 mb-3">
                        Your projected end-of-fiscal-year balance will fall below the ${(budget.lowBalanceThreshold || 5000).toLocaleString()} minimum needed to carry into next season:
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
              );
            })()}
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Current Balance"
          value={formatCurrency(metrics.currentBalance)}
          subtitle="Wells Fargo Checking"
          icon={DollarSign}
          color="blue"
          trend={metrics.netIncome > 0 ? `+${((metrics.netIncome / metrics.currentBalance) * 100).toFixed(1)}%` : null}
          trendTooltip="YTD Net Income as % of Balance"
        />
        <MetricCard
          title="Total Members"
          value={metrics.totalMembers}
          subtitle={`${metrics.paidMembers} paid • ${metrics.unpaidMembers} unpaid`}
          icon={Users}
          color="emerald"
        />
        <MetricCard
          title="YTD Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle="All revenue sources"
          icon={TrendingUp}
          color="violet"
        />
        <MetricCard
          title="Projected Ending Balance"
          value={formatCurrency(metrics.projectedYearEnd)}
          subtitle="End of fiscal year (September)"
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Budget Performance - YTD */}
      {performance && (
        <BudgetPerformanceWidget performance={performance} />
      )}
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color, trend, trendTooltip }) {
  const colorStyles = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    violet: 'from-violet-500 to-violet-600',
    amber: 'from-amber-500 to-amber-600'
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${colorStyles[color]} rounded-lg flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span
            className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 rounded-full font-medium border dark:border-emerald-700/30 cursor-help"
            title={trendTooltip || ''}
          >
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-[#f8fafc] mb-1">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-300">{subtitle}</p>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
    >
      <div className="w-10 h-10 bg-slate-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
        <Icon className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
      </div>
      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:translate-x-1 transition-transform" />
    </button>
  );
}

function CashFlowChart({ data }) {
  const monthlyData = MONTHS.map((month, idx) => {
    const serviceTotal = data.services.reduce((sum, s) => sum + (s.monthlyAmounts?.[idx] || 0), 0);
    // Simplified revenue projection - in real use, you'll track actual revenue per month
    const revenue = idx === 3 ? 5000 : idx === 4 ? 45000 : idx === 5 ? 35000 : idx === 6 ? 15000 : 2000;
    
    return {
      month,
      expenses: serviceTotal,
      revenue: revenue
    };
  });

  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.expenses, d.revenue)));

  return (
    <div className="space-y-3">
      {monthlyData.map((d) => (
        <div key={d.month} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 w-8">{d.month}</span>
            <div className="flex-1 mx-3 flex gap-1">
              <div 
                className="h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-sm transition-all hover:opacity-80"
                style={{ width: `${(d.revenue / maxValue) * 100}%` }}
                title={`Revenue: ${formatCurrency(d.revenue)}`}
              ></div>
              <div 
                className="h-6 bg-gradient-to-r from-rose-400 to-rose-500 rounded-sm transition-all hover:opacity-80"
                style={{ width: `${(d.expenses / maxValue) * 100}%` }}
                title={`Expenses: ${formatCurrency(d.expenses)}`}
              ></div>
            </div>
            <span className="text-slate-700 font-medium w-20 text-right">
              {formatCurrency((d.revenue - d.expenses) / 1000)}k
            </span>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-6 text-xs pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
          <span className="text-slate-600">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-rose-500 rounded-sm"></div>
          <span className="text-slate-600">Expenses</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
