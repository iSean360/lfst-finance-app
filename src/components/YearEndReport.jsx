import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Calendar, Users, DollarSign, TrendingUp, Home, FileSpreadsheet, FileDown } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import * as XLSX from 'xlsx';

function YearEndReport({ data, fiscalYear }) {
  const [reportView, setReportView] = useState('summary'); // 'summary', 'irs-990', 'comparison', 'assets'
  const [multiYearData, setMultiYearData] = useState([]);

  const members = data.members || [];
  const transactions = data.transactions || [];
  const budget = data.budget || {};

  // Load multi-year data for comparison
  useEffect(() => {
    const loadMultiYearData = () => {
      const years = [];
      for (let year = fiscalYear - 4; year <= fiscalYear; year++) {
        const yearKey = `_${year}`;
        const yearMembers = JSON.parse(localStorage.getItem(`lfst_finance_members${yearKey}`) || '[]');
        const yearTransactions = JSON.parse(localStorage.getItem(`lfst_finance_transactions${yearKey}`) || '[]');
        const yearBudget = JSON.parse(localStorage.getItem(`lfst_finance_budget${yearKey}`) || '{}');

        years.push({
          year,
          members: yearMembers,
          transactions: yearTransactions,
          budget: yearBudget
        });
      }
      setMultiYearData(years);
    };

    loadMultiYearData();
  }, [fiscalYear]);

  // Calculate comprehensive metrics for a given year's data
  const calculateMetrics = (yearMembers = members, yearTransactions = transactions, yearBudget = budget) => {
    // Member metrics
    const paidMembers = yearMembers.filter(m => {
      if (m.refunded) {
        const memberDues = m.dues?.totalRealized || m.totalRealized || 0;
        return m.refundAmount < memberDues; // Partial refunds count as paid
      }
      return m.datePaid;
    });

    const insideMembers = paidMembers.filter(m => m.residence === 'Inside');
    const outsideMembers = paidMembers.filter(m => m.residence === 'Outside');

    // Revenue breakdown
    const revenue = {
      membershipDues: 0,
      initiationFees: 0,
      outsideTennisDues: 0,
      otherIncome: {},
      programsIncome: {},
      total: 0
    };

    // Calculate membership revenue from members
    paidMembers.forEach(member => {
      const dues = member.dues || {};

      // Base membership dues
      revenue.membershipDues += dues.baseDues || 0;

      // Initiation fees
      const initiationFee = dues.additionalFees?.find(f => f.type === 'initiation' && f.applied);
      if (initiationFee) {
        revenue.initiationFees += initiationFee.amount || 0;
      }
    });

    // Calculate from transactions
    yearTransactions.forEach(txn => {
      if (txn.type === 'revenue') {
        const amount = Math.abs(txn.amount || 0);
        revenue.total += amount;

        // Outside Tennis Dues (separate tracking)
        if (txn.category === 'Outside Tennis Dues') {
          revenue.outsideTennisDues += amount;
        }
        // Programs Income
        else if (txn.category === 'Programs Income') {
          const subCat = txn.subCategory || 'Other Programs';
          revenue.programsIncome[subCat] = (revenue.programsIncome[subCat] || 0) + amount;
        }
        // Other Income (exclude membership dues already counted)
        else if (txn.category !== 'Member Dues') {
          const cat = txn.category || 'Other';
          revenue.otherIncome[cat] = (revenue.otherIncome[cat] || 0) + amount;
        }
      }
    });

    // Expense breakdown with functional allocation
    const expenses = {
      opex: {},
      capex: {},
      ga: {},
      opexTotal: 0,
      capexTotal: 0,
      gaTotal: 0,
      total: 0,
      // Functional allocation (Program Services vs Admin)
      programServices: 0, // OPEX + CAPEX
      managementGeneral: 0 // G&A
    };

    yearTransactions.forEach(txn => {
      if (txn.type === 'expense') {
        const amount = Math.abs(txn.amount || 0);
        expenses.total += amount;

        if (txn.expenseType === 'OPEX') {
          const cat = txn.category || 'Other';
          expenses.opex[cat] = (expenses.opex[cat] || 0) + amount;
          expenses.opexTotal += amount;
          expenses.programServices += amount;
        } else if (txn.expenseType === 'CAPEX') {
          const cat = txn.category || 'Other';
          expenses.capex[cat] = (expenses.capex[cat] || 0) + amount;
          expenses.capexTotal += amount;
          expenses.programServices += amount;
        } else if (txn.expenseType === 'G&A') {
          const cat = txn.category || 'Other';
          expenses.ga[cat] = (expenses.ga[cat] || 0) + amount;
          expenses.gaTotal += amount;
          expenses.managementGeneral += amount;
        }
      }
    });

    // Calculate allocation percentages
    const programServicesPercent = expenses.total > 0 ? (expenses.programServices / expenses.total * 100) : 0;
    const managementGeneralPercent = expenses.total > 0 ? (expenses.managementGeneral / expenses.total * 100) : 0;

    const netIncome = revenue.total - expenses.total;
    const cashPosition = (yearBudget.startingBalance || 0) + netIncome;

    return {
      members: {
        total: paidMembers.length,
        inside: insideMembers.length,
        outside: outsideMembers.length
      },
      revenue,
      expenses,
      netIncome,
      cashPosition,
      startingBalance: yearBudget.startingBalance || 0,
      programServicesPercent,
      managementGeneralPercent
    };
  };

  const metrics = calculateMetrics();

  // Capital Assets Schedule
  const capitalAssets = [
    { description: 'Pool Infrastructure', acquisitionDate: '2010-05-01', cost: 150000, usefulLife: 25, salvageValue: 10000 },
    { description: 'Tennis Court Resurface', acquisitionDate: '2018-07-15', cost: 35000, usefulLife: 10, salvageValue: 0 },
    { description: 'Pool Equipment & Pumps', acquisitionDate: '2020-03-10', cost: 18000, usefulLife: 15, salvageValue: 1000 },
    { description: 'Clubhouse HVAC System', acquisitionDate: '2019-09-20', cost: 12000, usefulLife: 12, salvageValue: 500 },
    { description: 'Security & Access Control', acquisitionDate: '2021-06-01', cost: 8500, usefulLife: 8, salvageValue: 500 }
  ];

  // Calculate depreciation for capital assets
  const calculateDepreciation = (asset) => {
    const acquisitionYear = new Date(asset.acquisitionDate).getFullYear();
    const yearsInService = fiscalYear - acquisitionYear;
    const annualDepreciation = (asset.cost - asset.salvageValue) / asset.usefulLife;
    const accumulatedDepreciation = Math.min(annualDepreciation * yearsInService, asset.cost - asset.salvageValue);
    const bookValue = asset.cost - accumulatedDepreciation;

    return {
      ...asset,
      yearsInService,
      annualDepreciation,
      accumulatedDepreciation,
      bookValue
    };
  };

  const depreciatedAssets = capitalAssets.map(calculateDepreciation);
  const totalAssetCost = depreciatedAssets.reduce((sum, a) => sum + a.cost, 0);
  const totalAccumulatedDepreciation = depreciatedAssets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
  const totalBookValue = depreciatedAssets.reduce((sum, a) => sum + a.bookValue, 0);

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Tab 1: Summary
    const summaryData = [
      ['Lockridge Forest Swim & Tennis Club'],
      ['Year-End Financial Report'],
      [`Fiscal Year ${fiscalYear}`],
      [],
      ['EXECUTIVE SUMMARY'],
      ['Total Revenue', formatCurrency(metrics.revenue.total)],
      ['Total Expenses', formatCurrency(metrics.expenses.total)],
      ['Net Income', formatCurrency(metrics.netIncome)],
      [],
      ['MEMBERSHIP'],
      ['Total Members', metrics.members.total],
      ['Inside Members', metrics.members.inside],
      ['Outside Members', metrics.members.outside],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Tab 2: Revenue Detail
    const revenueData = [
      ['REVENUE DETAIL - FY' + fiscalYear],
      [],
      ['Category', 'Amount'],
      ['Membership Dues', metrics.revenue.membershipDues],
      ['Initiation Fees', metrics.revenue.initiationFees],
      ['Outside Tennis Dues', metrics.revenue.outsideTennisDues],
    ];

    if (Object.keys(metrics.revenue.programsIncome).length > 0) {
      revenueData.push(['Programs Income', '']);
      Object.entries(metrics.revenue.programsIncome).forEach(([cat, amt]) => {
        revenueData.push([`  ${cat}`, amt]);
      });
    }

    if (Object.keys(metrics.revenue.otherIncome).length > 0) {
      revenueData.push(['Other Income', '']);
      Object.entries(metrics.revenue.otherIncome).forEach(([cat, amt]) => {
        revenueData.push([`  ${cat}`, amt]);
      });
    }

    revenueData.push([], ['TOTAL REVENUE', metrics.revenue.total]);

    const ws2 = XLSX.utils.aoa_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Revenue Detail');

    // Tab 3: Expense Detail
    const expenseData = [
      ['EXPENSE DETAIL - FY' + fiscalYear],
      [],
      ['Category', 'Amount', 'Type'],
      ['Operating Expenses (OPEX)', '', ''],
    ];

    Object.entries(metrics.expenses.opex).forEach(([cat, amt]) => {
      expenseData.push([`  ${cat}`, amt, 'OPEX']);
    });
    expenseData.push(['OPEX Subtotal', metrics.expenses.opexTotal, '']);

    if (Object.keys(metrics.expenses.capex).length > 0) {
      expenseData.push([], ['Capital Expenses (CAPEX)', '', '']);
      Object.entries(metrics.expenses.capex).forEach(([cat, amt]) => {
        expenseData.push([`  ${cat}`, amt, 'CAPEX']);
      });
      expenseData.push(['CAPEX Subtotal', metrics.expenses.capexTotal, '']);
    }

    if (Object.keys(metrics.expenses.ga).length > 0) {
      expenseData.push([], ['General & Administrative (G&A)', '', '']);
      Object.entries(metrics.expenses.ga).forEach(([cat, amt]) => {
        expenseData.push([`  ${cat}`, amt, 'G&A']);
      });
      expenseData.push(['G&A Subtotal', metrics.expenses.gaTotal, '']);
    }

    expenseData.push([], ['TOTAL EXPENSES', metrics.expenses.total, '']);

    const ws3 = XLSX.utils.aoa_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Expense Detail');

    // Tab 4: Form 990 Data
    const form990Data = [
      ['IRS FORM 990 DATA - FY' + fiscalYear],
      [],
      ['PART VIII - STATEMENT OF REVENUE'],
      ['Line', 'Description', 'Amount'],
      ['1a', 'Membership Dues', metrics.revenue.membershipDues],
      ['1b', 'Initiation Fees', metrics.revenue.initiationFees],
      ['2', 'Program Service Revenue', Object.values(metrics.revenue.programsIncome).reduce((sum, amt) => sum + amt, 0)],
      ['3', 'Other Revenue', Object.values(metrics.revenue.otherIncome).reduce((sum, amt) => sum + amt, 0) + metrics.revenue.outsideTennisDues],
      ['12', 'TOTAL REVENUE', metrics.revenue.total],
      [],
      ['PART IX - STATEMENT OF FUNCTIONAL EXPENSES'],
      ['', 'Total', 'Program Services', 'Management & General'],
      ['Operating Expenses', metrics.expenses.opexTotal, metrics.expenses.opexTotal, 0],
      ['Capital Improvements', metrics.expenses.capexTotal, metrics.expenses.capexTotal, 0],
      ['Admin & Overhead', metrics.expenses.gaTotal, 0, metrics.expenses.gaTotal],
      ['TOTAL EXPENSES', metrics.expenses.total, metrics.expenses.programServices, metrics.expenses.managementGeneral],
      [],
      ['Functional Allocation %'],
      ['Program Services %', `${metrics.programServicesPercent.toFixed(1)}%`],
      ['Management & General %', `${metrics.managementGeneralPercent.toFixed(1)}%`],
    ];

    const ws4 = XLSX.utils.aoa_to_sheet(form990Data);
    XLSX.utils.book_append_sheet(wb, ws4, 'Form 990 Data');

    // Tab 5: Capital Assets
    const assetsData = [
      ['CAPITAL ASSETS SCHEDULE - FY' + fiscalYear],
      [],
      ['Description', 'Acquisition Date', 'Original Cost', 'Useful Life (Years)', 'Years in Service', 'Annual Depreciation', 'Accumulated Depreciation', 'Book Value'],
    ];

    depreciatedAssets.forEach(asset => {
      assetsData.push([
        asset.description,
        new Date(asset.acquisitionDate).toLocaleDateString(),
        asset.cost,
        asset.usefulLife,
        asset.yearsInService,
        asset.annualDepreciation,
        asset.accumulatedDepreciation,
        asset.bookValue
      ]);
    });

    assetsData.push([
      'TOTALS',
      '',
      totalAssetCost,
      '',
      '',
      '',
      totalAccumulatedDepreciation,
      totalBookValue
    ]);

    const ws5 = XLSX.utils.aoa_to_sheet(assetsData);
    XLSX.utils.book_append_sheet(wb, ws5, 'Capital Assets');

    // Tab 6: Member Dues Detail
    const memberDuesData = [
      ['MEMBER DUES DETAIL - FY' + fiscalYear],
      [],
      ['Name', 'Residence', 'Date Paid', 'Base Dues', 'Initiation Fee', 'Total Realized', 'Status'],
    ];

    members
      .filter(m => m.datePaid || m.refunded)
      .forEach(member => {
        const dues = member.dues || {};
        const initiationFee = dues.additionalFees?.find(f => f.type === 'initiation' && f.applied);
        const status = member.refunded
          ? (member.refundAmount >= (dues.totalRealized || 0) ? 'Full Refund' : 'Partial Refund')
          : 'Paid';

        memberDuesData.push([
          member.name,
          member.residence,
          member.datePaid ? new Date(member.datePaid).toLocaleDateString() : '',
          dues.baseDues || 0,
          initiationFee?.amount || 0,
          dues.totalRealized || 0,
          status
        ]);
      });

    const ws6 = XLSX.utils.aoa_to_sheet(memberDuesData);
    XLSX.utils.book_append_sheet(wb, ws6, 'Member Dues Detail');

    // Tab 7: Multi-Year Comparison
    if (multiYearData.length > 0) {
      const comparisonData = [
        ['FIVE-YEAR COMPARISON'],
        [],
        ['Metric', ...multiYearData.map(y => `FY${y.year}`)],
      ];

      // Calculate metrics for each year
      const yearMetrics = multiYearData.map(y => calculateMetrics(y.members, y.transactions, y.budget));

      comparisonData.push(
        ['Members', ...yearMetrics.map(m => m.members.total)],
        ['Total Revenue', ...yearMetrics.map(m => m.revenue.total)],
        ['Total Expenses', ...yearMetrics.map(m => m.expenses.total)],
        ['Net Income', ...yearMetrics.map(m => m.netIncome)],
        ['Ending Cash', ...yearMetrics.map(m => m.cashPosition)],
      );

      const ws7 = XLSX.utils.aoa_to_sheet(comparisonData);
      XLSX.utils.book_append_sheet(wb, ws7, 'Multi-Year Comparison');
    }

    // Generate and download
    XLSX.writeFile(wb, `LFST_Financial_Report_FY${fiscalYear}.xlsx`);
  };

  // Export to PDF (using browser print)
  const exportToPDF = (type = 'summary') => {
    // Set view before printing
    const previousView = reportView;
    setReportView(type === 'irs' ? 'irs-990' : 'summary');

    // Trigger print after view updates
    setTimeout(() => {
      window.print();
      setReportView(previousView);
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header - No Print */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Year-End Report</h1>
          <p className="text-slate-600 mt-1">Fiscal Year {fiscalYear} (October {fiscalYear - 1} - September {fiscalYear})</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => exportToPDF('summary')}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Export PDF (Summary)
          </button>
          <button
            onClick={() => exportToPDF('irs')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Export PDF (IRS-Ready)
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* View Tabs - No Print */}
      <div className="bg-white rounded-lg border border-slate-200 p-1 flex gap-1 no-print">
        <button
          onClick={() => setReportView('summary')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            reportView === 'summary'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Summary Report
        </button>
        <button
          onClick={() => setReportView('irs-990')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            reportView === 'irs-990'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          IRS Form 990
        </button>
        <button
          onClick={() => setReportView('comparison')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            reportView === 'comparison'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Multi-Year Comparison
        </button>
        <button
          onClick={() => setReportView('assets')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            reportView === 'assets'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Capital Assets
        </button>
      </div>

      {/* SUMMARY REPORT VIEW */}
      {reportView === 'summary' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-0">
          <div className="p-8 space-y-8">

            {/* Report Header */}
            <div className="text-center border-b-2 border-slate-200 pb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Lockridge Forest Swim & Tennis Club
              </h1>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Annual Financial Report
              </h2>
              <p className="text-lg text-slate-600">
                Fiscal Year {fiscalYear}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Period: October 1, {fiscalYear - 1} through September 30, {fiscalYear}
              </p>
              <p className="text-sm text-slate-500 italic mt-3">
                Prepared for IRS Filing & Annual Member Meeting
              </p>
            </div>

            {/* Executive Summary */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-emerald-600">
                Executive Summary
              </h2>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-700 font-medium mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-900">{formatCurrency(metrics.revenue.total)}</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                  <p className="text-sm text-rose-700 font-medium mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-rose-900">{formatCurrency(metrics.expenses.total)}</p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  metrics.netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <p className={`text-sm font-medium mb-1 ${
                    metrics.netIncome >= 0 ? 'text-blue-700' : 'text-amber-700'
                  }`}>Net Income</p>
                  <p className={`text-2xl font-bold ${
                    metrics.netIncome >= 0 ? 'text-blue-900' : 'text-amber-900'
                  }`}>{formatCurrency(metrics.netIncome)}</p>
                </div>
              </div>
            </div>

            {/* Membership Report */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                Membership Report
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="text-slate-700 font-medium">Total Active Members (Paid Dues)</span>
                  <span className="text-xl font-bold text-slate-900">{metrics.members.total}</span>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Inside Community (Primary Members)</span>
                    <span className="font-semibold text-emerald-700">{metrics.members.inside}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Outside Community (Non-Resident Members)</span>
                    <span className="font-semibold text-blue-700">{metrics.members.outside}</span>
                  </div>
                  <div className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-3 rounded">
                    Per bylaws, outside members must not exceed 50% of total membership.
                    Current ratio: {metrics.members.total > 0 ? ((metrics.members.outside / metrics.members.total) * 100).toFixed(1) : 0}% outside members.
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Detail */}
            <div className="page-break-before">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-emerald-600">
                Revenue Detail - Sources of Income
              </h2>

              <div className="space-y-4">
                {/* Membership Dues */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Membership Dues</h3>
                  <div className="ml-4 space-y-1">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-700">Annual Membership Dues ({metrics.members.total} members)</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(metrics.revenue.membershipDues)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-700">Initiation Fees (New Members)</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(metrics.revenue.initiationFees)}</span>
                    </div>
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded mt-2">
                      Membership dues support pool operations, facility maintenance, utilities, and community programs.
                    </p>
                  </div>
                </div>

                {/* Outside Tennis Dues */}
                {metrics.revenue.outsideTennisDues > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Outside Tennis Dues</h3>
                    <div className="ml-4 space-y-1">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-700">Non-Member Tennis Court Access</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(metrics.revenue.outsideTennisDues)}</span>
                      </div>
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded mt-2">
                        Revenue from non-members who purchase tennis court access passes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Programs Income */}
                {Object.keys(metrics.revenue.programsIncome).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Programs Income</h3>
                    <div className="ml-4 space-y-1">
                      {Object.entries(metrics.revenue.programsIncome)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, amount]) => (
                          <div key={category} className="flex justify-between py-1">
                            <span className="text-slate-700">{category}</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded mt-2">
                        Community events and programs that enhance member engagement and social activities.
                      </p>
                    </div>
                  </div>
                )}

                {/* Other Income */}
                {Object.keys(metrics.revenue.otherIncome).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Other Income</h3>
                    <div className="ml-4 space-y-1">
                      {Object.entries(metrics.revenue.otherIncome)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, amount]) => (
                          <div key={category} className="flex justify-between py-1">
                            <span className="text-slate-700">{category}</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Total Revenue */}
                <div className="flex justify-between py-3 mt-4 bg-emerald-50 px-4 rounded-lg border-2 border-emerald-300">
                  <span className="text-lg font-bold text-slate-900">TOTAL REVENUE</span>
                  <span className="text-lg font-bold text-emerald-700">{formatCurrency(metrics.revenue.total)}</span>
                </div>
              </div>
            </div>

            {/* Expense Detail */}
            <div className="page-break-before">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-rose-600">
                Expense Detail - Community Benefit Expenditures
              </h2>

              <div className="space-y-6">
                {/* Operating Expenses */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Operating Expenses (OPEX)</h3>
                  <p className="text-xs text-slate-600 italic mb-3 bg-blue-50 p-3 rounded border border-blue-200">
                    <strong>Community Benefit:</strong> Operating expenses maintain the pool, tennis courts, and facilities
                    for member use and safety. These recurring expenses ensure year-round facility availability and compliance
                    with health and safety regulations.
                  </p>
                  <div className="ml-4 space-y-1">
                    {Object.entries(metrics.expenses.opex)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, amount]) => (
                        <div key={category} className="flex justify-between py-1">
                          <span className="text-slate-700">{category}</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    <div className="flex justify-between py-2 border-t border-slate-200 mt-2">
                      <span className="font-semibold text-slate-900">Total Operating Expense</span>
                      <span className="font-bold text-rose-600">{formatCurrency(metrics.expenses.opexTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Capital Expenses */}
                {Object.keys(metrics.expenses.capex).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Capital Improvements (CAPEX)</h3>
                    <p className="text-xs text-slate-600 italic mb-3 bg-blue-50 p-3 rounded border border-blue-200">
                      <strong>Community Benefit:</strong> Capital improvements enhance facility value and member experience.
                      These one-time investments extend facility life, improve safety, and maintain property values for the
                      entire community.
                    </p>
                    <div className="ml-4 space-y-1">
                      {Object.entries(metrics.expenses.capex)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, amount]) => (
                          <div key={category} className="flex justify-between py-1">
                            <span className="text-slate-700">{category}</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-2 border-t border-slate-200 mt-2">
                        <span className="font-semibold text-slate-900">Total Capital Improvement</span>
                        <span className="font-bold text-rose-600">{formatCurrency(metrics.expenses.capexTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* G&A */}
                {Object.keys(metrics.expenses.ga).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">General & Administrative (G&A)</h3>
                    <p className="text-xs text-slate-600 italic mb-3 bg-blue-50 p-3 rounded border border-blue-200">
                      <strong>Community Benefit:</strong> Administrative expenses ensure proper club governance, financial management,
                      legal compliance, and transparent operations for all members.
                    </p>
                    <div className="ml-4 space-y-1">
                      {Object.entries(metrics.expenses.ga)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, amount]) => (
                          <div key={category} className="flex justify-between py-1">
                            <span className="text-slate-700">{category}</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-2 border-t border-slate-200 mt-2">
                        <span className="font-semibold text-slate-900">Total G&A</span>
                        <span className="font-bold text-rose-600">{formatCurrency(metrics.expenses.gaTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Expenses */}
                <div className="flex justify-between py-3 mt-4 bg-rose-50 px-4 rounded-lg border-2 border-rose-300">
                  <span className="text-lg font-bold text-slate-900">TOTAL EXPENSES</span>
                  <span className="text-lg font-bold text-rose-700">{formatCurrency(metrics.expenses.total)}</span>
                </div>
              </div>
            </div>

            {/* Financial Position */}
            <div className="page-break-before">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                Financial Position
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-700 font-medium">Beginning Balance (October 1, {fiscalYear - 1})</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(metrics.startingBalance)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-700 font-medium">Total Revenue (FY{fiscalYear})</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(metrics.revenue.total)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-700 font-medium">Total Expenses (FY{fiscalYear})</span>
                  <span className="font-semibold text-rose-700">-{formatCurrency(metrics.expenses.total)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-700 font-medium">Net Income (FY{fiscalYear})</span>
                  <span className={`font-bold ${metrics.netIncome >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                    {formatCurrency(metrics.netIncome)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg border-2 border-blue-300 mt-3">
                  <span className="text-lg font-bold text-slate-900">Ending Cash Position (September 30, {fiscalYear})</span>
                  <span className="text-lg font-bold text-blue-700">{formatCurrency(metrics.cashPosition)}</span>
                </div>
              </div>
            </div>

            {/* Certification Statement */}
            <div className="mt-8 p-6 bg-slate-50 border-2 border-slate-300 rounded-lg">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Treasurer's Certification</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                I certify that this financial report accurately represents the financial activities of Lockridge Forest
                Swim & Tennis Club for Fiscal Year {fiscalYear}. All revenue was collected and deposited in accordance
                with club bylaws. All expenditures were made for the benefit of club members and facilities, in furtherance
                of the club's nonprofit purpose as a community recreational organization.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-8">
                <div>
                  <div className="border-b-2 border-slate-400 pb-1 mb-2">
                    <span className="text-sm text-slate-500">Treasurer Signature</span>
                  </div>
                </div>
                <div>
                  <div className="border-b-2 border-slate-400 pb-1 mb-2">
                    <span className="text-sm text-slate-500">Date</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 mt-8 pt-6 border-t border-slate-200">
              <p>Lockridge Forest Swim & Tennis Club - A Georgia Nonprofit Community Association</p>
              <p className="mt-1">Report Generated: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      )}

      {/* IRS FORM 990 VIEW */}
      {reportView === 'irs-990' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-0">
          <div className="p-8 space-y-8">

            {/* IRS Form Header */}
            <div className="text-center border-b-2 border-slate-200 pb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                IRS Form 990 - Supporting Documentation
              </h1>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Lockridge Forest Swim & Tennis Club
              </h2>
              <p className="text-lg text-slate-600">
                Fiscal Year {fiscalYear} (October {fiscalYear - 1} - September {fiscalYear})
              </p>
              <p className="text-sm text-slate-500 italic mt-3">
                501(c)(7) Social and Recreational Club
              </p>
            </div>

            {/* Part VIII - Statement of Revenue */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-emerald-600">
                Part VIII - Statement of Revenue
              </h2>

              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-300">Line</th>
                      <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-300">Description</th>
                      <th className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-3 text-slate-600">1a</td>
                      <td className="p-3 text-slate-900">Membership Dues</td>
                      <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(metrics.revenue.membershipDues)}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-3 text-slate-600">1b</td>
                      <td className="p-3 text-slate-900">Initiation Fees</td>
                      <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(metrics.revenue.initiationFees)}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-3 text-slate-600">1c</td>
                      <td className="p-3 text-slate-900">Outside Tennis Dues (Non-Member Access)</td>
                      <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(metrics.revenue.outsideTennisDues)}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-3 text-slate-600">2</td>
                      <td className="p-3 text-slate-900">Program Service Revenue</td>
                      <td className="p-3 text-right font-semibold text-slate-900">
                        {formatCurrency(Object.values(metrics.revenue.programsIncome).reduce((sum, amt) => sum + amt, 0))}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-3 text-slate-600">3-11</td>
                      <td className="p-3 text-slate-900">Other Revenue</td>
                      <td className="p-3 text-right font-semibold text-slate-900">
                        {formatCurrency(Object.values(metrics.revenue.otherIncome).reduce((sum, amt) => sum + amt, 0))}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50 border-t-2 border-emerald-600">
                      <td className="p-3 text-slate-900 font-bold">12</td>
                      <td className="p-3 text-slate-900 font-bold">TOTAL REVENUE</td>
                      <td className="p-3 text-right font-bold text-emerald-700">{formatCurrency(metrics.revenue.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part IX - Statement of Functional Expenses */}
            <div className="page-break-before">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-rose-600">
                Part IX - Statement of Functional Expenses
              </h2>

              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-300">Expense Category</th>
                      <th className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">Total Expenses</th>
                      <th className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">Program Services</th>
                      <th className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">Management & General</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200 bg-blue-50">
                      <td className="p-3 text-slate-900 font-semibold" colSpan="4">Operating Expenses (OPEX)</td>
                    </tr>
                    {Object.entries(metrics.expenses.opex).map(([category, amount]) => (
                      <tr key={category} className="border-b border-slate-200">
                        <td className="p-3 text-slate-700 pl-6">{category}</td>
                        <td className="p-3 text-right text-slate-900">{formatCurrency(amount)}</td>
                        <td className="p-3 text-right text-blue-700">{formatCurrency(amount)}</td>
                        <td className="p-3 text-right text-slate-400">$0.00</td>
                      </tr>
                    ))}
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <td className="p-3 text-slate-900 font-semibold pl-6">OPEX Subtotal</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(metrics.expenses.opexTotal)}</td>
                      <td className="p-3 text-right font-bold text-blue-700">{formatCurrency(metrics.expenses.opexTotal)}</td>
                      <td className="p-3 text-right text-slate-400">$0.00</td>
                    </tr>

                    {Object.keys(metrics.expenses.capex).length > 0 && (
                      <>
                        <tr className="border-b border-slate-200 bg-blue-50">
                          <td className="p-3 text-slate-900 font-semibold" colSpan="4">Capital Improvements (CAPEX)</td>
                        </tr>
                        {Object.entries(metrics.expenses.capex).map(([category, amount]) => (
                          <tr key={category} className="border-b border-slate-200">
                            <td className="p-3 text-slate-700 pl-6">{category}</td>
                            <td className="p-3 text-right text-slate-900">{formatCurrency(amount)}</td>
                            <td className="p-3 text-right text-blue-700">{formatCurrency(amount)}</td>
                            <td className="p-3 text-right text-slate-400">$0.00</td>
                          </tr>
                        ))}
                        <tr className="border-b border-slate-300 bg-slate-50">
                          <td className="p-3 text-slate-900 font-semibold pl-6">CAPEX Subtotal</td>
                          <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(metrics.expenses.capexTotal)}</td>
                          <td className="p-3 text-right font-bold text-blue-700">{formatCurrency(metrics.expenses.capexTotal)}</td>
                          <td className="p-3 text-right text-slate-400">$0.00</td>
                        </tr>
                      </>
                    )}

                    {Object.keys(metrics.expenses.ga).length > 0 && (
                      <>
                        <tr className="border-b border-slate-200 bg-amber-50">
                          <td className="p-3 text-slate-900 font-semibold" colSpan="4">General & Administrative (G&A)</td>
                        </tr>
                        {Object.entries(metrics.expenses.ga).map(([category, amount]) => (
                          <tr key={category} className="border-b border-slate-200">
                            <td className="p-3 text-slate-700 pl-6">{category}</td>
                            <td className="p-3 text-right text-slate-900">{formatCurrency(amount)}</td>
                            <td className="p-3 text-right text-slate-400">$0.00</td>
                            <td className="p-3 text-right text-amber-700">{formatCurrency(amount)}</td>
                          </tr>
                        ))}
                        <tr className="border-b border-slate-300 bg-slate-50">
                          <td className="p-3 text-slate-900 font-semibold pl-6">G&A Subtotal</td>
                          <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(metrics.expenses.gaTotal)}</td>
                          <td className="p-3 text-right text-slate-400">$0.00</td>
                          <td className="p-3 text-right font-bold text-amber-700">{formatCurrency(metrics.expenses.gaTotal)}</td>
                        </tr>
                      </>
                    )}

                    <tr className="bg-rose-50 border-t-2 border-rose-600">
                      <td className="p-3 text-slate-900 font-bold">TOTAL EXPENSES</td>
                      <td className="p-3 text-right font-bold text-rose-700">{formatCurrency(metrics.expenses.total)}</td>
                      <td className="p-3 text-right font-bold text-blue-700">{formatCurrency(metrics.expenses.programServices)}</td>
                      <td className="p-3 text-right font-bold text-amber-700">{formatCurrency(metrics.expenses.managementGeneral)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Functional Allocation Summary */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-1">Program Services</p>
                  <p className="text-2xl font-bold text-blue-900">{metrics.programServicesPercent.toFixed(1)}%</p>
                  <p className="text-xs text-blue-600 mt-1">{formatCurrency(metrics.expenses.programServices)} of total expenses</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                  <p className="text-sm text-amber-700 font-medium mb-1">Management & General</p>
                  <p className="text-2xl font-bold text-amber-900">{metrics.managementGeneralPercent.toFixed(1)}%</p>
                  <p className="text-xs text-amber-600 mt-1">{formatCurrency(metrics.expenses.managementGeneral)} of total expenses</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 italic">
                  <strong>Note for IRS:</strong> OPEX and CAPEX expenses are classified as Program Services because they directly support
                  the club's exempt purpose of providing recreational facilities and activities for members. G&A expenses cover administrative
                  overhead necessary for club operations.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 mt-8 pt-6 border-t border-slate-200">
              <p>Form 990 Supporting Documentation - Lockridge Forest Swim & Tennis Club</p>
              <p className="mt-1">Report Generated: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-YEAR COMPARISON VIEW */}
      {reportView === 'comparison' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-0">
          <div className="p-8 space-y-8">

            {/* Header */}
            <div className="text-center border-b-2 border-slate-200 pb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Five-Year Financial Comparison
              </h1>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Lockridge Forest Swim & Tennis Club
              </h2>
              <p className="text-sm text-slate-500 italic mt-3">
                Fiscal Years {fiscalYear - 4} through {fiscalYear}
              </p>
            </div>

            {multiYearData.length > 0 && (() => {
              const yearMetrics = multiYearData.map(y => calculateMetrics(y.members, y.transactions, y.budget));

              return (
                <div className="space-y-8">
                  {/* Membership Trends */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                      Membership Trends
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-300">Metric</th>
                            {multiYearData.map(y => (
                              <th key={y.year} className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">
                                FY{y.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Total Members</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right font-semibold text-slate-900">{m.members.total}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Inside Members</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-emerald-700">{m.members.inside}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Outside Members</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-blue-700">{m.members.outside}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Revenue Trends */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-emerald-600">
                      Revenue Trends
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-300">Revenue Source</th>
                            {multiYearData.map(y => (
                              <th key={y.year} className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">
                                FY{y.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Membership Dues</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900">{formatCurrency(m.revenue.membershipDues)}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Initiation Fees</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900">{formatCurrency(m.revenue.initiationFees)}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Outside Tennis Dues</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900">{formatCurrency(m.revenue.outsideTennisDues)}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Programs Income</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900">
                                {formatCurrency(Object.values(m.revenue.programsIncome).reduce((sum, amt) => sum + amt, 0))}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Other Income</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900">
                                {formatCurrency(Object.values(m.revenue.otherIncome).reduce((sum, amt) => sum + amt, 0))}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-emerald-50 border-t-2 border-emerald-600">
                            <td className="p-3 text-slate-900 font-bold">TOTAL REVENUE</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right font-bold text-emerald-700">{formatCurrency(m.revenue.total)}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expense Trends */}
                  <div className="page-break-before">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-rose-600">
                      Expense Trends
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-300">Expense Type</th>
                            {multiYearData.map(y => (
                              <th key={y.year} className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">
                                FY{y.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Operating Expenses (OPEX)</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900">{formatCurrency(m.expenses.opexTotal)}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Capital Improvements (CAPEX)</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900">{formatCurrency(m.expenses.capexTotal)}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">General & Administrative (G&A)</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900">{formatCurrency(m.expenses.gaTotal)}</td>
                            ))}
                          </tr>
                          <tr className="bg-rose-50 border-t-2 border-rose-600">
                            <td className="p-3 text-slate-900 font-bold">TOTAL EXPENSES</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right font-bold text-rose-700">{formatCurrency(m.expenses.total)}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Net Income & Cash Position */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                      Net Income & Cash Position
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-300">Metric</th>
                            {multiYearData.map(y => (
                              <th key={y.year} className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">
                                FY{y.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Net Income</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className={`p-3 text-right font-semibold ${m.netIncome >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                                {formatCurrency(m.netIncome)}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Ending Cash Position</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right font-bold text-slate-900">{formatCurrency(m.cashPosition)}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Functional Allocation Trends */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                      Functional Allocation Trends
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-300">Allocation</th>
                            {multiYearData.map(y => (
                              <th key={y.year} className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">
                                FY{y.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Program Services %</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-blue-700 font-semibold">{m.programServicesPercent.toFixed(1)}%</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 text-slate-700">Management & General %</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-amber-700 font-semibold">{m.managementGeneralPercent.toFixed(1)}%</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 mt-8 pt-6 border-t border-slate-200">
              <p>Multi-Year Financial Comparison - Lockridge Forest Swim & Tennis Club</p>
              <p className="mt-1">Report Generated: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      )}

      {/* CAPITAL ASSETS VIEW */}
      {reportView === 'assets' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-0">
          <div className="p-8 space-y-8">

            {/* Header */}
            <div className="text-center border-b-2 border-slate-200 pb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Capital Assets Schedule
              </h1>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Lockridge Forest Swim & Tennis Club
              </h2>
              <p className="text-lg text-slate-600">
                As of September 30, {fiscalYear}
              </p>
            </div>

            {/* Assets Table */}
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-300 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-300">Asset Description</th>
                      <th className="text-center p-3 font-semibold text-slate-700 border-b border-slate-300">Acquisition Date</th>
                      <th className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">Original Cost</th>
                      <th className="text-center p-3 font-semibold text-slate-700 border-b border-slate-300">Useful Life</th>
                      <th className="text-center p-3 font-semibold text-slate-700 border-b border-slate-300">Years in Service</th>
                      <th className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">Annual Depreciation</th>
                      <th className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">Accumulated Depreciation</th>
                      <th className="text-right p-3 font-semibold text-slate-700 border-b border-slate-300">Net Book Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depreciatedAssets.map((asset, index) => (
                      <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-3 text-slate-900">{asset.description}</td>
                        <td className="p-3 text-center text-slate-700">{new Date(asset.acquisitionDate).toLocaleDateString()}</td>
                        <td className="p-3 text-right text-slate-900 font-semibold">{formatCurrency(asset.cost)}</td>
                        <td className="p-3 text-center text-slate-700">{asset.usefulLife} years</td>
                        <td className="p-3 text-center text-slate-700">{asset.yearsInService} years</td>
                        <td className="p-3 text-right text-slate-900">{formatCurrency(asset.annualDepreciation)}</td>
                        <td className="p-3 text-right text-rose-700">{formatCurrency(asset.accumulatedDepreciation)}</td>
                        <td className="p-3 text-right text-blue-700 font-semibold">{formatCurrency(asset.bookValue)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 border-t-2 border-slate-400">
                      <td className="p-3 text-slate-900 font-bold" colSpan="2">TOTALS</td>
                      <td className="p-3 text-right text-slate-900 font-bold">{formatCurrency(totalAssetCost)}</td>
                      <td className="p-3" colSpan="3"></td>
                      <td className="p-3 text-right text-rose-700 font-bold">{formatCurrency(totalAccumulatedDepreciation)}</td>
                      <td className="p-3 text-right text-blue-700 font-bold">{formatCurrency(totalBookValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
                <p className="text-sm text-slate-700 font-medium mb-1">Total Asset Cost</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalAssetCost)}</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-lg border-2 border-rose-200">
                <p className="text-sm text-rose-700 font-medium mb-1">Accumulated Depreciation</p>
                <p className="text-2xl font-bold text-rose-900">{formatCurrency(totalAccumulatedDepreciation)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-1">Net Book Value</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalBookValue)}</p>
              </div>
            </div>

            {/* Depreciation Note */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-sm font-bold text-amber-900 mb-2">Depreciation Method</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Straight-line depreciation is used for all capital assets. Annual depreciation is calculated as:
                <strong> (Original Cost - Salvage Value) ÷ Useful Life</strong>. Accumulated depreciation represents
                the total depreciation expense recorded since acquisition and cannot exceed the depreciable amount (cost minus salvage value).
              </p>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 mt-8 pt-6 border-t border-slate-200">
              <p>Capital Assets Schedule - Lockridge Forest Swim & Tennis Club</p>
              <p className="mt-1">Report Generated: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default YearEndReport;
