import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

function ProfitLoss({ data, fiscalYear }) {
  const members = data.members || [];
  const transactions = data.transactions || [];

  // Calculate Membership Metrics
  const calculateMembershipMetrics = () => {
    const paidMembers = members.filter(m => {
      // Full refunds don't count as paid members
      if (m.refunded) {
        const memberDues = m.dues?.totalRealized || m.totalRealized || 0;
        return m.refundAmount < memberDues; // Only partial refunds count as paid
      }
      return m.datePaid;
    });

    let totalMembershipIncome = 0;
    let totalInitiationFees = 0;
    const discountsApplied = {};

    paidMembers.forEach(member => {
      const dues = member.dues || {};

      // Base membership income
      totalMembershipIncome += dues.baseDues || 0;

      // Initiation fees
      const initiationFee = dues.additionalFees?.find(f => f.type === 'initiation' && f.applied);
      if (initiationFee) {
        totalInitiationFees += initiationFee.amount || 0;
      }

      // Track discounts
      const allDiscounts = [
        ...(dues.discounts || []),
        ...(dues.customDiscounts || [])
      ];

      allDiscounts.forEach(discount => {
        if (discount.applied) {
          const label = discount.label || discount.type;
          if (!discountsApplied[label]) {
            discountsApplied[label] = 0;
          }
          discountsApplied[label] += Math.abs(discount.amount || 0);
        }
      });
    });

    const totalDiscounts = Object.values(discountsApplied).reduce((sum, amt) => sum + amt, 0);
    const totalMembershipDuesRealized = paidMembers.reduce((sum, m) =>
      sum + (m.dues?.totalRealized || m.totalRealized || 0), 0
    );

    return {
      memberCount: paidMembers.length,
      totalMembershipIncome,
      totalInitiationFees,
      discountsApplied,
      totalDiscounts,
      totalMembershipDuesRealized
    };
  };

  // Aggregate transactions by category
  const aggregateTransactions = () => {
    const revenue = {
      otherIncome: {},
      programsIncome: {},
      total: 0
    };

    const expenses = {
      opex: {},
      capex: {},
      ga: {},
      opexTotal: 0,
      capexTotal: 0,
      gaTotal: 0
    };

    transactions.forEach(txn => {
      const amount = Math.abs(txn.amount || 0);

      if (txn.type === 'revenue') {
        revenue.total += amount;

        // Skip membership dues (already counted from members)
        if (txn.category === 'Member Dues') {
          return;
        }

        // Programs Income
        if (txn.category === 'Programs Income') {
          const subCat = txn.subCategory || 'Other';
          if (!revenue.programsIncome[subCat]) {
            revenue.programsIncome[subCat] = 0;
          }
          revenue.programsIncome[subCat] += amount;
        }
        // Other Income
        else {
          const cat = txn.category || 'Other';
          if (!revenue.otherIncome[cat]) {
            revenue.otherIncome[cat] = 0;
          }
          revenue.otherIncome[cat] += amount;
        }
      }
      else if (txn.type === 'expense') {
        // OPEX
        if (txn.expenseType === 'OPEX') {
          const cat = txn.category || 'Other';
          if (!expenses.opex[cat]) {
            expenses.opex[cat] = 0;
          }
          expenses.opex[cat] += amount;
          expenses.opexTotal += amount;
        }
        // CAPEX
        else if (txn.expenseType === 'CAPEX') {
          const cat = txn.category || 'Other';
          if (!expenses.capex[cat]) {
            expenses.capex[cat] = 0;
          }
          expenses.capex[cat] += amount;
          expenses.capexTotal += amount;
        }
        // G&A
        else if (txn.expenseType === 'G&A') {
          const cat = txn.category || 'Other';
          if (!expenses.ga[cat]) {
            expenses.ga[cat] = 0;
          }
          expenses.ga[cat] += amount;
          expenses.gaTotal += amount;
        }
      }
    });

    return { revenue, expenses };
  };

  const membershipMetrics = calculateMembershipMetrics();
  const { revenue, expenses } = aggregateTransactions();

  // Calculate totals
  const totalRevenue = membershipMetrics.totalMembershipDuesRealized +
                       Object.values(revenue.otherIncome).reduce((sum, amt) => sum + amt, 0) +
                       Object.values(revenue.programsIncome).reduce((sum, amt) => sum + amt, 0);

  const totalExpenses = expenses.opexTotal + expenses.capexTotal + expenses.gaTotal;
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Profit & Loss Statement</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Fiscal Year {fiscalYear}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          netIncome >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/40' : 'bg-rose-50 dark:bg-rose-900/40'
        }`}>
          {netIncome >= 0 ? (
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          ) : (
            <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-300" />
          )}
          <span className={`text-sm font-medium ${
            netIncome >= 0 ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'
          }`}>
            Net Income: {formatCurrency(netIncome)}
          </span>
        </div>
      </div>

      {/* P&L Sheet */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] overflow-hidden">
        <div className="p-4 space-y-4">

          {/* REVENUE SECTION */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b-2 border-slate-200 dark:border-[#334155]">
              REVENUE
            </h2>

            {/* Membership Section */}
            <div className="ml-3 space-y-1">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Number of Memberships</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-[#f8fafc]">{membershipMetrics.memberCount}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-sm text-slate-700 dark:text-slate-300 ml-6">Membership Income</span>
                <span className="text-sm text-slate-900 dark:text-[#f8fafc]">{formatCurrency(membershipMetrics.totalMembershipIncome)}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-sm text-slate-700 dark:text-slate-300 ml-6">Initiation Fee Income</span>
                <span className="text-sm text-slate-900 dark:text-[#f8fafc]">{formatCurrency(membershipMetrics.totalInitiationFees)}</span>
              </div>

              {/* Discounts Applied */}
              {Object.keys(membershipMetrics.discountsApplied).length > 0 && (
                <div className="ml-6 mt-2">
                  <div className="text-sm font-medium text-rose-700 dark:text-rose-200 mb-1">Discounts Applied:</div>
                  {Object.entries(membershipMetrics.discountsApplied).map(([label, amount]) => (
                    <div key={label} className="flex justify-between py-1 ml-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                      <span className="text-sm text-rose-600 dark:text-rose-300">-{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between py-1 border-t border-slate-200 dark:border-[#334155] mt-1">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 ml-6">Total Membership Dues Realized</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-300">{formatCurrency(membershipMetrics.totalMembershipDuesRealized)}</span>
              </div>
            </div>

            {/* Other Income */}
            {Object.keys(revenue.otherIncome).length > 0 && (
              <div className="ml-3 mt-2 space-y-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Other Income</div>
                {Object.entries(revenue.otherIncome).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                  <div key={category} className="flex justify-between py-1 ml-6">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{category}</span>
                    <span className="text-sm text-slate-900 dark:text-[#f8fafc]">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Programs Income */}
            {Object.keys(revenue.programsIncome).length > 0 && (
              <div className="ml-3 mt-2 space-y-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Programs Income</div>
                {Object.entries(revenue.programsIncome).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                  <div key={category} className="flex justify-between py-1 ml-6">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{category}</span>
                    <span className="text-sm text-slate-900 dark:text-[#f8fafc]">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Total Revenue */}
            <div className="flex justify-between py-2 mt-2 border-t-2 border-slate-300 dark:border-[#334155] bg-emerald-50 dark:bg-emerald-900/40 px-3 rounded-lg">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">TOTAL REVENUE</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>

          {/* EXPENSES SECTION */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b-2 border-slate-200 dark:border-[#334155]">
              EXPENSES
            </h2>

            {/* Operating Expenses (OPEX) */}
            <div className="ml-3 space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Operating Expenses</div>
              {Object.entries(expenses.opex).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                <div key={category} className="flex justify-between py-1 ml-6">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{category}</span>
                  <span className="text-sm text-slate-900 dark:text-[#f8fafc]">{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 border-t border-slate-200 dark:border-[#334155] mt-1 ml-6">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total Operating Expense</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-300">{formatCurrency(expenses.opexTotal)}</span>
              </div>
            </div>

            {/* Capital Expenses (CAPEX) */}
            {Object.keys(expenses.capex).length > 0 && (
              <div className="ml-3 mt-2 space-y-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Capital Expenses</div>
                {Object.entries(expenses.capex).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                  <div key={category} className="flex justify-between py-1 ml-6">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{category}</span>
                    <span className="text-sm text-slate-900 dark:text-[#f8fafc]">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 border-t border-slate-200 dark:border-[#334155] mt-1 ml-6">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total Capital Improvement</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-300">{formatCurrency(expenses.capexTotal)}</span>
                </div>
              </div>
            )}

            {/* G&A */}
            {Object.keys(expenses.ga).length > 0 && (
              <div className="ml-3 mt-2 space-y-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">G&A</div>
                {Object.entries(expenses.ga).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                  <div key={category} className="flex justify-between py-1 ml-6">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{category}</span>
                    <span className="text-sm text-slate-900 dark:text-[#f8fafc]">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 border-t border-slate-200 dark:border-[#334155] mt-1 ml-6">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total G&A</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-300">{formatCurrency(expenses.gaTotal)}</span>
                </div>
              </div>
            )}

            {/* Total Overall Expense */}
            <div className="flex justify-between py-2 mt-2 border-t-2 border-slate-300 dark:border-[#334155] bg-rose-50 dark:bg-rose-900/40 px-3 rounded-lg">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">TOTAL OVERALL EXPENSE</span>
              <span className="text-sm font-bold text-rose-700 dark:text-rose-300">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>

          {/* NET INCOME */}
          <div className={`flex justify-between py-2 border-t-4 ${
            netIncome >= 0 ? 'border-emerald-600 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/40' : 'border-rose-600 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/40'
          } px-3 rounded-lg`}>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">NET INCOME</span>
            <span className={`text-base font-bold ${
              netIncome >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
            }`}>
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/40 rounded-xl p-3 border-2 border-emerald-200 dark:border-emerald-700/50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Total Revenue</span>
          </div>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-rose-50 dark:bg-rose-900/40 rounded-xl p-3 border-2 border-rose-200 dark:border-rose-700/50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-300" />
            <span className="text-sm font-semibold text-rose-900 dark:text-rose-200">Total Expenses</span>
          </div>
          <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{formatCurrency(totalExpenses)}</p>
        </div>

        <div className={`rounded-xl p-3 border-2 ${
          netIncome >= 0
            ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700/50'
            : 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700/50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-5 h-5 ${
              netIncome >= 0 ? 'text-blue-600 dark:text-blue-300' : 'text-amber-600 dark:text-amber-300'
            }`} />
            <span className={`text-sm font-semibold ${
              netIncome >= 0 ? 'text-blue-900 dark:text-blue-200' : 'text-amber-900 dark:text-amber-200'
            }`}>
              Net Income
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            netIncome >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'
          }`}>
            {formatCurrency(netIncome)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProfitLoss;
