import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText } from 'lucide-react';
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
          <h1 className="text-3xl font-bold text-slate-900">Profit & Loss Statement</h1>
          <p className="text-slate-600 mt-1">Fiscal Year {fiscalYear}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          netIncome >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
        }`}>
          {netIncome >= 0 ? (
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-rose-600" />
          )}
          <span className={`text-sm font-medium ${
            netIncome >= 0 ? 'text-emerald-900' : 'text-rose-900'
          }`}>
            Net Income: {formatCurrency(netIncome)}
          </span>
        </div>
      </div>

      {/* P&L Sheet */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-8">

          {/* REVENUE SECTION */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-200">
              REVENUE
            </h2>

            {/* Membership Section */}
            <div className="ml-4 space-y-2">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Total Number of Memberships</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{membershipMetrics.memberCount}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-sm text-slate-700 ml-6">Membership Income</span>
                <span className="text-sm text-slate-900">{formatCurrency(membershipMetrics.totalMembershipIncome)}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-sm text-slate-700 ml-6">Initiation Fee Income</span>
                <span className="text-sm text-slate-900">{formatCurrency(membershipMetrics.totalInitiationFees)}</span>
              </div>

              {/* Discounts Applied */}
              {Object.keys(membershipMetrics.discountsApplied).length > 0 && (
                <div className="ml-6 mt-2">
                  <div className="text-sm font-medium text-rose-700 mb-1">Discounts Applied:</div>
                  {Object.entries(membershipMetrics.discountsApplied).map(([label, amount]) => (
                    <div key={label} className="flex justify-between py-1 ml-4">
                      <span className="text-sm text-slate-600">{label}</span>
                      <span className="text-sm text-rose-600">-{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between py-2 border-t border-slate-200 mt-2">
                <span className="text-sm font-semibold text-slate-900 ml-6">Total Membership Dues Realized</span>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(membershipMetrics.totalMembershipDuesRealized)}</span>
              </div>
            </div>

            {/* Other Income */}
            {Object.keys(revenue.otherIncome).length > 0 && (
              <div className="ml-4 mt-4 space-y-2">
                <div className="text-sm font-semibold text-slate-900">Other Income</div>
                {Object.entries(revenue.otherIncome).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                  <div key={category} className="flex justify-between py-1 ml-6">
                    <span className="text-sm text-slate-700">{category}</span>
                    <span className="text-sm text-slate-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Programs Income */}
            {Object.keys(revenue.programsIncome).length > 0 && (
              <div className="ml-4 mt-4 space-y-2">
                <div className="text-sm font-semibold text-slate-900">Programs Income</div>
                {Object.entries(revenue.programsIncome).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                  <div key={category} className="flex justify-between py-1 ml-6">
                    <span className="text-sm text-slate-700">{category}</span>
                    <span className="text-sm text-slate-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Total Revenue */}
            <div className="flex justify-between py-3 mt-4 border-t-2 border-slate-300 bg-emerald-50 px-4 rounded-lg">
              <span className="text-base font-bold text-slate-900">TOTAL REVENUE</span>
              <span className="text-base font-bold text-emerald-700">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>

          {/* EXPENSES SECTION */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-200">
              EXPENSES
            </h2>

            {/* Operating Expenses (OPEX) */}
            <div className="ml-4 space-y-2">
              <div className="text-sm font-semibold text-slate-900">Operating Expenses</div>
              {Object.entries(expenses.opex).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                <div key={category} className="flex justify-between py-1 ml-6">
                  <span className="text-sm text-slate-700">{category}</span>
                  <span className="text-sm text-slate-900">{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t border-slate-200 mt-2 ml-6">
                <span className="text-sm font-semibold text-slate-900">Total Operating Expense</span>
                <span className="text-sm font-bold text-rose-600">{formatCurrency(expenses.opexTotal)}</span>
              </div>
            </div>

            {/* Capital Expenses (CAPEX) */}
            {Object.keys(expenses.capex).length > 0 && (
              <div className="ml-4 mt-4 space-y-2">
                <div className="text-sm font-semibold text-slate-900">Capital Expenses</div>
                {Object.entries(expenses.capex).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                  <div key={category} className="flex justify-between py-1 ml-6">
                    <span className="text-sm text-slate-700">{category}</span>
                    <span className="text-sm text-slate-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t border-slate-200 mt-2 ml-6">
                  <span className="text-sm font-semibold text-slate-900">Total Capital Improvement</span>
                  <span className="text-sm font-bold text-rose-600">{formatCurrency(expenses.capexTotal)}</span>
                </div>
              </div>
            )}

            {/* G&A */}
            {Object.keys(expenses.ga).length > 0 && (
              <div className="ml-4 mt-4 space-y-2">
                <div className="text-sm font-semibold text-slate-900">G&A</div>
                {Object.entries(expenses.ga).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                  <div key={category} className="flex justify-between py-1 ml-6">
                    <span className="text-sm text-slate-700">{category}</span>
                    <span className="text-sm text-slate-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t border-slate-200 mt-2 ml-6">
                  <span className="text-sm font-semibold text-slate-900">Total G&A</span>
                  <span className="text-sm font-bold text-rose-600">{formatCurrency(expenses.gaTotal)}</span>
                </div>
              </div>
            )}

            {/* Total Overall Expense */}
            <div className="flex justify-between py-3 mt-4 border-t-2 border-slate-300 bg-rose-50 px-4 rounded-lg">
              <span className="text-base font-bold text-slate-900">TOTAL OVERALL EXPENSE</span>
              <span className="text-base font-bold text-rose-700">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>

          {/* NET INCOME */}
          <div className={`flex justify-between py-4 border-t-4 ${
            netIncome >= 0 ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
          } px-4 rounded-lg`}>
            <span className="text-xl font-bold text-slate-900">NET INCOME</span>
            <span className={`text-xl font-bold ${
              netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-900">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-rose-50 rounded-xl p-4 border-2 border-rose-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            <span className="text-sm font-semibold text-rose-900">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-rose-700">{formatCurrency(totalExpenses)}</p>
        </div>

        <div className={`rounded-xl p-4 border-2 ${
          netIncome >= 0
            ? 'bg-blue-50 border-blue-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-5 h-5 ${
              netIncome >= 0 ? 'text-blue-600' : 'text-amber-600'
            }`} />
            <span className={`text-sm font-semibold ${
              netIncome >= 0 ? 'text-blue-900' : 'text-amber-900'
            }`}>
              Net Income
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            netIncome >= 0 ? 'text-blue-700' : 'text-amber-700'
          }`}>
            {formatCurrency(netIncome)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProfitLoss;
