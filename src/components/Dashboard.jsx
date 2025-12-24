import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, ChevronRight, AlertCircle, CreditCard, FileText, AlertTriangle, Home, Clock, Package } from 'lucide-react';
import { formatCurrency, MONTHS, calculateYearTotal, checkBylawCompliance, RESIDENCE_TYPE, calculateBudgetPerformance, calculateMonthlyActuals, getCurrentFiscalMonth } from '../utils/helpers';
import storage from '../services/storage';

// Helper function to calculate depreciation status
const getDepreciationStatus = (project) => {
  if (!project.installDate || !project.depreciationYears) {
    return null;
  }

  // Parse install date and normalize to midnight
  const installDate = new Date(project.installDate);
  installDate.setHours(0, 0, 0, 0);

  // Calculate depreciation end date
  const depreciationEndDate = new Date(installDate);
  depreciationEndDate.setFullYear(depreciationEndDate.getFullYear() + project.depreciationYears);

  // Normalize current date to midnight for fair comparison
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Calculate years remaining using days (more accurate than milliseconds)
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.ceil((depreciationEndDate - now) / msPerDay);
  const yearsRemaining = Math.max(0, daysRemaining / 365.25);

  if (yearsRemaining <= 0) {
    return { status: 'fully_depreciated', yearsRemaining: 0, endDate: depreciationEndDate };
  } else if (yearsRemaining <= 1) {
    return { status: 'critical', yearsRemaining, endDate: depreciationEndDate };
  } else if (yearsRemaining <= 2) {
    return { status: 'warning', yearsRemaining, endDate: depreciationEndDate };
  } else {
    return { status: 'good', yearsRemaining, endDate: depreciationEndDate };
  }
};

function CapexDepreciationWidget({ fiscalYear, setActiveView }) {
  const capexProjects = storage.getPlannedCapex(fiscalYear);
  const completedProjects = capexProjects.filter(p => p.completed && p.installDate && p.depreciationYears);

  if (completedProjects.length === 0) {
    return null;
  }

  // Get projects with warnings
  const projectsWithWarnings = completedProjects
    .map(p => ({ ...p, depreciationStatus: getDepreciationStatus(p) }))
    .filter(p => p.depreciationStatus && (p.depreciationStatus.status === 'critical' || p.depreciationStatus.status === 'warning'))
    .sort((a, b) => a.depreciationStatus.yearsRemaining - b.depreciationStatus.yearsRemaining);

  const criticalCount = projectsWithWarnings.filter(p => p.depreciationStatus.status === 'critical').length;
  const warningCount = projectsWithWarnings.filter(p => p.depreciationStatus.status === 'warning').length;

  // If no warnings, show compact view
  if (projectsWithWarnings.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Capital Assets</h3>
              <p className="text-sm text-slate-600">{completedProjects.length} assets tracked • All depreciation schedules healthy</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('cashflow')}
            className="py-2 px-4 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    );
  }

  const status = criticalCount > 0 ? 'critical' : 'warning';
  const statusColors = {
    critical: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-600' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' }
  };

  const colors = statusColors[status];

  return (
    <div className={`${colors.bg} border-2 ${colors.border} rounded-2xl p-6`}>
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <AlertTriangle className={`w-5 h-5 ${colors.icon}`} />
        Capital Asset Depreciation Alerts
      </h3>

      <p className="text-sm text-slate-700 mb-4">
        {criticalCount > 0 && (
          <span className="font-semibold text-rose-700">
            {criticalCount} asset{criticalCount !== 1 ? 's' : ''} fully depreciating within 1 year
          </span>
        )}
        {criticalCount > 0 && warningCount > 0 && <span> • </span>}
        {warningCount > 0 && (
          <span className="font-semibold text-amber-700">
            {warningCount} asset{warningCount !== 1 ? 's' : ''} depreciating within 2 years
          </span>
        )}
      </p>

      <div className="space-y-3 mb-4">
        {projectsWithWarnings.slice(0, 3).map(project => {
          const status = project.depreciationStatus;
          const isCritical = status.status === 'critical';

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
                      <strong>Installed:</strong> {new Date(project.installDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                    </p>
                    <p>
                      <strong>Depreciation:</strong> {project.depreciationYears} years
                    </p>
                    <p>
                      <strong>Fully Depreciated:</strong> {status.endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className={`text-right font-bold ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                  <p className="text-2xl">{status.yearsRemaining.toFixed(1)}</p>
                  <p className="text-xs">years left</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projectsWithWarnings.length > 3 && (
        <p className="text-sm text-slate-600 mb-4">
          +{projectsWithWarnings.length - 3} more asset{projectsWithWarnings.length - 3 !== 1 ? 's' : ''} approaching depreciation
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('cashflow')}
          className="flex-1 py-2 px-4 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          View All Assets
        </button>
        <button
          onClick={() => setActiveView('cashflow')}
          className={`flex-1 py-2 px-4 ${criticalCount > 0 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'} text-white rounded-lg text-sm font-medium transition-colors`}
        >
          Plan Replacements
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

  // Color coding
  const status = percentage > 0.50 ? 'violation' : percentage > 0.45 ? 'warning' : 'good';
  const statusColors = {
    good: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: '✅', barColor: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '⚠️', barColor: 'bg-amber-500' },
    violation: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: '🔴', barColor: 'bg-rose-500' }
  };

  const colors = statusColors[status];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl p-6`}>
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        {colors.icon} Bylaw Compliance Status
      </h3>

      <p className="text-sm text-slate-700 mb-3">
        Outside Member Limit: <span className="font-semibold">50% Maximum</span>
      </p>

      {/* Progress bar */}
      <div className="relative w-full h-8 bg-slate-200 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all ${colors.barColor}`}
          style={{ width: `${Math.min(percentage * 100, 100)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-900">
            {(percentage * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-slate-600">Inside Neighborhood</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {count.inside}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {count.total > 0 ? ((count.inside / count.total) * 100).toFixed(1) : 0}% of total
          </p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-slate-600">Outside Neighborhood</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {count.outside}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {count.total > 0 ? ((count.outside / count.total) * 100).toFixed(1) : 0}% of total
          </p>
        </div>
      </div>

      {/* Warning/Alert */}
      {!compliant && (
        <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 mb-4`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Approaching limit:</span> Consider monitoring outside member applications carefully.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('members')}
          className="flex-1 py-2 px-4 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          View Member Details
        </button>
        <button
          onClick={() => setActiveView('reports')}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Generate Report
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
              const catData = performance[cat.key];

              return (
                <tr key={cat.key}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{cat.label}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(catData.budget)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">{formatCurrency(catData.actual)}</td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${
                    Math.abs(catData.variance) < 0.01 ? 'text-slate-500' :
                    (cat.isRevenue ? catData.variance > 0 : catData.variance < 0) ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {catData.variance > 0 ? '+' : ''}{formatCurrency(catData.variance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Math.abs(catData.variance) < 0.01 ? (
                      <span className="text-slate-500">On Track</span>
                    ) : cat.isRevenue ? (
                      catData.variance > 0 ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4" /> Over
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center justify-center gap-1">
                          <TrendingDown className="w-4 h-4" /> Under
                        </span>
                      )
                    ) : (
                      catData.variance < 0 ? (
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

function Dashboard({ metrics, data, setActiveView, onRefresh }) {
  // Calculate budget performance
  const currentMonth = getCurrentFiscalMonth();
  const budget = storage.getBudget(data.settings.fiscalYear);
  const actuals = budget ? calculateMonthlyActuals(
    data.transactions,
    data.settings.fiscalYear,
    data.settings.startDate
  ) : [];
  const performance = budget && actuals.length > 0
    ? calculateBudgetPerformance(budget, actuals, currentMonth)
    : null;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Current Balance"
          value={formatCurrency(metrics.currentBalance)}
          subtitle="Wells Fargo Checking"
          icon={DollarSign}
          color="blue"
          trend={metrics.netIncome > 0 ? `+${((metrics.netIncome / metrics.currentBalance) * 100).toFixed(1)}%` : null}
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

      {/* Bylaw Compliance Widget */}
      {data.members && data.members.length > 0 && (
        <BylawComplianceWidget members={data.members} setActiveView={setActiveView} />
      )}

      {/* Budget Performance - YTD */}
      {performance && (
        <BudgetPerformanceWidget performance={performance} />
      )}

      {/* CAPEX Depreciation Widget */}
      <CapexDepreciationWidget fiscalYear={data.settings?.fiscalYear} setActiveView={setActiveView} />

      {/* Alerts */}
      {metrics.unpaidMembers > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
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
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color, trend }) {
  const colorStyles = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    violet: 'from-violet-500 to-violet-600',
    amber: 'from-amber-500 to-amber-600'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorStyles[color]} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
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
