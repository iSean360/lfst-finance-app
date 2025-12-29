import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Calendar, Users, DollarSign, TrendingUp, Home, FileSpreadsheet, FileDown } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import storage from '../services/storage';
import * as XLSX from 'xlsx';

function YearEndReport({ data, fiscalYear }) {
  const [reportView, setReportView] = useState('summary'); // 'summary', 'irs-990', 'comparison', 'assets', 'major-opex'
  const [multiYearData, setMultiYearData] = useState([]);
  const [signature, setSignature] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [majorMaintenanceItems, setMajorMaintenanceItems] = useState([]);

  const members = data.members || [];
  const transactions = data.transactions || [];
  const budget = data.budget || {};

  // Load multi-year data for comparison - dynamically load only years with actual data
  useEffect(() => {
    const loadMultiYearData = async () => {
      const years = [];

      // Try to load last 5 years (including current year)
      for (let year = fiscalYear - 4; year <= fiscalYear; year++) {
        try {
          const yearMembers = await storage.getMembers(year);
          const yearTransactions = await storage.getTransactions(year);
          const yearBudget = await storage.getBudget(year);

          // Only include years that have actual data
          if (yearMembers.length > 0 || yearTransactions.length > 0 || yearBudget) {
            years.push({
              year,
              members: yearMembers || [],
              transactions: yearTransactions || [],
              budget: yearBudget || {}
            });
          }
        } catch (error) {
          console.log(`No data found for FY${year}`);
        }
      }

      setMultiYearData(years);
    };

    loadMultiYearData();

    // Load signature for this fiscal year
    const savedSignature = localStorage.getItem(`lfst_treasurer_signature_${fiscalYear}`);
    if (savedSignature) {
      try {
        setSignature(JSON.parse(savedSignature));
      } catch (e) {
        console.error('Failed to load signature:', e);
      }
    }

    // Load major maintenance items that had activity in this fiscal year
    const loadMajorMaintenance = async () => {
      try {
        // Get ALL major maintenance items, not just ones created in this fiscal year
        const allItems = await storage.getAllMajorMaintenance();

        // Filter to items that had a transaction in this fiscal year
        const itemsInFiscalYear = allItems.filter(item => {
          if (!item.lastOccurrence?.fiscalYear) return false;
          return item.lastOccurrence.fiscalYear === fiscalYear;
        });

        setMajorMaintenanceItems(itemsInFiscalYear || []);
      } catch (error) {
        console.error('Error loading major maintenance items:', error);
        setMajorMaintenanceItems([]);
      }
    };

    loadMajorMaintenance();
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
      discountsApplied: {},
      totalDiscounts: 0,
      totalMembershipDuesRealized: 0,
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

      // Track discounts
      const allDiscounts = [
        ...(dues.discounts || []),
        ...(dues.customDiscounts || [])
      ];

      allDiscounts.forEach(discount => {
        if (discount.applied) {
          const label = discount.label || discount.type;
          if (!revenue.discountsApplied[label]) {
            revenue.discountsApplied[label] = 0;
          }
          revenue.discountsApplied[label] += Math.abs(discount.amount || 0);
        }
      });

      // Add to total membership dues realized
      revenue.totalMembershipDuesRealized += dues.totalRealized || 0;
    });

    // Calculate total discounts
    revenue.totalDiscounts = Object.values(revenue.discountsApplied).reduce((sum, amt) => sum + amt, 0);

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

  // Capital Assets Schedule - Build from CAPEX transactions
  const capitalAssets = [];

  // Get all CAPEX transactions from all fiscal years up to current year
  // This will show the complete capital assets schedule
  const allCapexTransactions = multiYearData.reduce((acc, yearData) => {
    const yearCapex = yearData.transactions.filter(t => t.type === 'expense' && t.expenseType === 'CAPEX');
    return [...acc, ...yearCapex];
  }, []);

  // Also include current year CAPEX transactions if not already loaded
  const currentYearCapex = transactions.filter(t => t.type === 'expense' && t.expenseType === 'CAPEX');
  const allCapex = [...allCapexTransactions, ...currentYearCapex];

  // Map CAPEX transactions to capital assets
  // Group by description to avoid duplicates
  const assetMap = new Map();
  allCapex.forEach(txn => {
    const key = txn.description || txn.category || 'Unnamed Asset';
    if (!assetMap.has(key)) {
      assetMap.set(key, {
        description: key,
        acquisitionDate: txn.date,
        cost: Math.abs(txn.amount),
        usefulLife: txn.usefulLife || 10 // Default to 10 years if not specified
      });
    } else {
      // If asset already exists, add to cost (multiple purchases of same asset)
      const existing = assetMap.get(key);
      existing.cost += Math.abs(txn.amount);
    }
  });

  capitalAssets.push(...assetMap.values());

  // Calculate depreciation for capital assets
  const calculateDepreciation = (asset) => {
    const acquisitionYear = new Date(asset.acquisitionDate).getFullYear();
    const yearsInService = fiscalYear - acquisitionYear;
    const annualDepreciation = asset.cost / asset.usefulLife;
    const accumulatedDepreciation = Math.min(annualDepreciation * yearsInService, asset.cost);
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
    ];

    // Add discounts if any
    if (Object.keys(metrics.revenue.discountsApplied).length > 0) {
      revenueData.push(['Discounts Applied', '']);
      Object.entries(metrics.revenue.discountsApplied).forEach(([label, amount]) => {
        revenueData.push([`  ${label}`, -amount]);
      });
      revenueData.push(['Total Membership Dues Realized', metrics.revenue.totalMembershipDuesRealized]);
    }

    revenueData.push(['Outside Tennis Dues', metrics.revenue.outsideTennisDues]);

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
    ];

    // Add discounts to Form 990 data if any
    if (Object.keys(metrics.revenue.discountsApplied).length > 0) {
      Object.entries(metrics.revenue.discountsApplied).forEach(([label, amount]) => {
        form990Data.push(['', `  Discount: ${label}`, -amount]);
      });
      form990Data.push(['', 'Total Membership Dues Realized', metrics.revenue.totalMembershipDuesRealized]);
    }

    form990Data.push(
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
      ['Management & General %', `${metrics.managementGeneralPercent.toFixed(1)}%`]
    );

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Year-End Report</h1>
          <p className="text-slate-600 dark:text-slate-200 mt-1">Fiscal Year {fiscalYear} (October {fiscalYear - 1} - September {fiscalYear})</p>
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
      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-[#334155] dark:border-[#334155] p-1 flex gap-1 no-print">
        <button
          onClick={() => setReportView('summary')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            reportView === 'summary'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#334155]'
          }`}
        >
          Summary Report
        </button>
        <button
          onClick={() => setReportView('irs-990')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            reportView === 'irs-990'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#334155]'
          }`}
        >
          IRS Form 990
        </button>
        <button
          onClick={() => setReportView('comparison')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            reportView === 'comparison'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#334155]'
          }`}
        >
          Multi-Year Comparison
        </button>
        <button
          onClick={() => setReportView('assets')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            reportView === 'assets'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#334155]'
          }`}
        >
          Capital Assets
        </button>
        <button
          onClick={() => setReportView('major-opex')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            reportView === 'major-opex'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#334155]'
          }`}
        >
          Major OPEX
        </button>
      </div>

      {/* SUMMARY REPORT VIEW */}
      {reportView === 'summary' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] dark:border-[#334155] print:shadow-none print:border-0">
          <div className="p-8 space-y-8">

            {/* Report Header */}
            <div className="text-center border-b-2 border-slate-200 dark:border-[#334155] pb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Lockridge Forest Swim & Tennis Club
              </h1>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Annual Financial Report
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-200">
                Fiscal Year {fiscalYear}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
                Period: October 1, {fiscalYear - 1} through September 30, {fiscalYear}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-300 italic mt-3">
                Prepared for IRS Filing & Annual Member Meeting
              </p>
            </div>

            {/* Executive Summary */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-emerald-600 dark:border-emerald-700">
                Executive Summary
              </h2>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/50 p-4 rounded-lg border border-emerald-200 dark:border-emerald-600">
                  <p className="text-sm text-emerald-700 dark:text-emerald-200 font-medium mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">{formatCurrency(metrics.revenue.total)}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/50 p-4 rounded-lg border border-rose-200 dark:border-rose-600">
                  <p className="text-sm text-rose-700 dark:text-rose-200 font-medium mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-rose-900 dark:text-rose-200">{formatCurrency(metrics.expenses.total)}</p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  metrics.netIncome >= 0 ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-600' : 'bg-amber-50 dark:bg-amber-900/50 border-amber-200 dark:border-amber-600'
                }`}>
                  <p className={`text-sm font-medium mb-1 ${
                    metrics.netIncome >= 0 ? 'text-blue-700 dark:text-blue-200' : 'text-amber-700 dark:text-amber-200'
                  }`}>Net Income</p>
                  <p className={`text-2xl font-bold ${
                    metrics.netIncome >= 0 ? 'text-blue-900 dark:text-blue-200' : 'text-amber-900 dark:text-amber-200'
                  }`}>{formatCurrency(metrics.netIncome)}</p>
                </div>
              </div>
            </div>

            {/* Membership Report */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-blue-600 dark:border-blue-700">
                Membership Report
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-[#334155]">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Total Active Members (Paid Dues)</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-[#f8fafc]">{metrics.members.total}</span>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-200">Inside Community (Primary Members)</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-200">{metrics.members.inside}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-200">Outside Community (Non-Resident Members)</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-200">{metrics.members.outside}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-300 italic mt-2 bg-slate-50 dark:bg-transparent p-3 rounded border border-transparent dark:border-[#334155]">
                    Per bylaws, outside members must not exceed 50% of total membership.
                    Current ratio: {metrics.members.total > 0 ? ((metrics.members.outside / metrics.members.total) * 100).toFixed(1) : 0}% outside members.
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Detail */}
            <div className="page-break-before">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-emerald-600 dark:border-emerald-700">
                Revenue Detail - Sources of Income
              </h2>

              <div className="space-y-4">
                {/* Membership Dues */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Membership Dues</h3>
                  <div className="ml-4 space-y-1">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-700 dark:text-slate-300">Annual Membership Dues ({metrics.members.total} members)</span>
                      <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.revenue.membershipDues)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-700 dark:text-slate-300">Initiation Fees (New Members)</span>
                      <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.revenue.initiationFees)}</span>
                    </div>

                    {/* Discounts Applied */}
                    {Object.keys(metrics.revenue.discountsApplied).length > 0 && (
                      <div className="mt-2 ml-2">
                        <div className="text-sm font-medium text-rose-700 mb-1">Discounts Applied:</div>
                        {Object.entries(metrics.revenue.discountsApplied).map(([label, amount]) => (
                          <div key={label} className="flex justify-between py-1 ml-4">
                            <span className="text-sm text-slate-600 dark:text-slate-200">{label}</span>
                            <span className="text-sm text-rose-600 dark:text-rose-200">-{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between py-1 border-t border-slate-200 dark:border-[#334155] dark:border-[#334155] mt-1">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">Total Membership Dues Realized</span>
                      <span className="font-bold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.revenue.totalMembershipDuesRealized)}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-transparent p-2 rounded mt-2 border border-transparent dark:border-[#334155]">
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
                        <span className="text-slate-700 dark:text-slate-300">Non-Member Tennis Court Access</span>
                        <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.revenue.outsideTennisDues)}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-transparent p-2 rounded mt-2">
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
                            <span className="text-slate-700 dark:text-slate-300">{category}</span>
                            <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-transparent p-2 rounded mt-2">
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
                            <span className="text-slate-700 dark:text-slate-300">{category}</span>
                            <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Total Revenue */}
                <div className="flex justify-between py-3 mt-4 bg-emerald-50 dark:bg-emerald-900/50 px-4 rounded-lg border-2 border-emerald-300 dark:border-emerald-600">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">TOTAL REVENUE</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(metrics.revenue.total)}</span>
                </div>
              </div>
            </div>

            {/* Expense Detail */}
            <div className="page-break-before">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-rose-600 dark:border-rose-700">
                Expense Detail - Community Benefit Expenditures
              </h2>

              <div className="space-y-6">
                {/* Operating Expenses */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Operating Expenses (OPEX)</h3>
                  <p className="text-xs text-slate-600 dark:text-blue-100 italic mb-3 bg-blue-50 dark:bg-blue-900/50 p-3 rounded border border-blue-200 dark:border-blue-600">
                    <strong className="dark:text-blue-50">Community Benefit:</strong> Operating expenses maintain the pool, tennis courts, and facilities
                    for member use and safety. These recurring expenses ensure year-round facility availability and compliance
                    with health and safety regulations.
                  </p>
                  <div className="ml-4 space-y-1">
                    {Object.entries(metrics.expenses.opex)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, amount]) => (
                        <div key={category} className="flex justify-between py-1">
                          <span className="text-slate-700 dark:text-slate-300">{category}</span>
                          <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    <div className="flex justify-between py-2 border-t border-slate-200 dark:border-[#334155] mt-2">
                      <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">Total Operating Expense</span>
                      <span className="font-bold text-rose-600">{formatCurrency(metrics.expenses.opexTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Capital Expenses */}
                {Object.keys(metrics.expenses.capex).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Capital Improvements (CAPEX)</h3>
                    <p className="text-xs text-slate-600 dark:text-blue-100 italic mb-3 bg-blue-50 dark:bg-blue-900/50 p-3 rounded border border-blue-200 dark:border-blue-600">
                      <strong className="dark:text-blue-50">Community Benefit:</strong> Capital improvements enhance facility value and member experience.
                      These one-time investments extend facility life, improve safety, and maintain property values for the
                      entire community.
                    </p>
                    <div className="ml-4 space-y-1">
                      {Object.entries(metrics.expenses.capex)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, amount]) => (
                          <div key={category} className="flex justify-between py-1">
                            <span className="text-slate-700 dark:text-slate-300">{category}</span>
                            <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-2 border-t border-slate-200 dark:border-[#334155] mt-2">
                        <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">Total Capital Improvement</span>
                        <span className="font-bold text-rose-600">{formatCurrency(metrics.expenses.capexTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* G&A */}
                {Object.keys(metrics.expenses.ga).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">General & Administrative (G&A)</h3>
                    <p className="text-xs text-slate-600 dark:text-blue-100 italic mb-3 bg-blue-50 dark:bg-blue-900/50 p-3 rounded border border-blue-200 dark:border-blue-600">
                      <strong className="dark:text-blue-50">Community Benefit:</strong> Administrative expenses ensure proper club governance, financial management,
                      legal compliance, and transparent operations for all members.
                    </p>
                    <div className="ml-4 space-y-1">
                      {Object.entries(metrics.expenses.ga)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, amount]) => (
                          <div key={category} className="flex justify-between py-1">
                            <span className="text-slate-700 dark:text-slate-300">{category}</span>
                            <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-2 border-t border-slate-200 dark:border-[#334155] mt-2">
                        <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">Total G&A</span>
                        <span className="font-bold text-rose-600">{formatCurrency(metrics.expenses.gaTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Expenses */}
                <div className="flex justify-between py-3 mt-4 bg-rose-50 dark:bg-rose-900/50 px-4 rounded-lg border-2 border-rose-300 dark:border-rose-600">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">TOTAL EXPENSES</span>
                  <span className="text-lg font-bold text-rose-700 dark:text-rose-300">{formatCurrency(metrics.expenses.total)}</span>
                </div>
              </div>
            </div>

            {/* Financial Position */}
            <div className="page-break-before">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-blue-600 dark:border-blue-700">
                Financial Position
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-[#334155]">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Beginning Balance (October 1, {fiscalYear - 1})</span>
                  <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.startingBalance)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-[#334155]">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Total Revenue (FY{fiscalYear})</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(metrics.revenue.total)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-[#334155]">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Total Expenses (FY{fiscalYear})</span>
                  <span className="font-semibold text-rose-700 dark:text-rose-300">-{formatCurrency(metrics.expenses.total)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-[#334155]">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Net Income (FY{fiscalYear})</span>
                  <span className={`font-bold ${metrics.netIncome >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {formatCurrency(metrics.netIncome)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-blue-50 dark:bg-blue-900/50 px-4 rounded-lg border-2 border-blue-300 dark:border-blue-600 mt-3">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Ending Cash Position (September 30, {fiscalYear})</span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(metrics.cashPosition)}</span>
                </div>
              </div>
            </div>

            {/* Replacement Reserve Requirement (Bylaw 7.6) */}
            <div className="page-break-before">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-blue-600 dark:border-blue-700">
                Replacement Reserve Requirement (Bylaw 7.6)
              </h2>

              <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg border border-blue-200 dark:border-blue-600 mb-6">
                <p className="text-sm text-slate-700 dark:text-blue-100 leading-relaxed">
                  <strong className="dark:text-blue-50">Bylaw 7.6(a):</strong> The board should take no less than 15% of the current year collected
                  dues and designate such funds to cover necessary future club maintenance and improvements.
                </p>
              </div>

              <div className="space-y-4">
                {/* Calculation */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Reserve Calculation</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-[#334155]">
                      <span className="text-slate-700 dark:text-slate-200">Total Revenue (FY{fiscalYear})</span>
                      <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.revenue.total)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-[#334155]">
                      <span className="text-slate-700 dark:text-slate-200">Required Reserve (15%)</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(metrics.revenue.total * 0.15)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-[#334155]">
                      <span className="text-slate-700 dark:text-slate-200">Total Expenses (FY{fiscalYear})</span>
                      <span className="font-semibold text-rose-700 dark:text-rose-300">{formatCurrency(metrics.expenses.total)}</span>
                    </div>
                    <div className="flex justify-between py-3 bg-slate-50 dark:bg-slate-700 px-4 rounded-lg border-2 border-slate-300 dark:border-slate-500">
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Net Income (Revenue - Expenses)</span>
                      <span className={`text-lg font-bold ${metrics.netIncome >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                        {formatCurrency(metrics.netIncome)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compliance Status */}
                {metrics.netIncome >= (metrics.revenue.total * 0.15) ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/50 border-2 border-emerald-300 dark:border-emerald-600 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">✅</div>
                      <div>
                        <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                          Reserve Requirement Met
                        </h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-200 mb-2">
                          Net income of {formatCurrency(metrics.netIncome)} exceeds the 15% reserve requirement
                          of {formatCurrency(metrics.revenue.total * 0.15)}.
                        </p>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">
                          Surplus above requirement: {formatCurrency(metrics.netIncome - (metrics.revenue.total * 0.15))}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50 dark:bg-rose-900/50 border-2 border-rose-300 dark:border-rose-600 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">⚠️</div>
                      <div>
                        <h3 className="text-lg font-bold text-rose-900 dark:text-rose-100 mb-2">
                          Reserve Requirement Not Met
                        </h3>
                        <p className="text-sm text-rose-700 dark:text-rose-200 mb-2">
                          Net income of {formatCurrency(metrics.netIncome)} falls short of the 15% reserve requirement
                          of {formatCurrency(metrics.revenue.total * 0.15)}.
                        </p>
                        <p className="text-sm font-semibold text-rose-800 dark:text-rose-100">
                          Shortfall: {formatCurrency((metrics.revenue.total * 0.15) - metrics.netIncome)}
                        </p>
                        <p className="text-xs text-rose-600 dark:text-rose-200 mt-2 italic">
                          The Board should review expenses and revenue strategies to meet bylaw compliance in future years.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="bg-slate-50 dark:bg-transparent p-4 rounded-lg border border-slate-200 dark:border-[#334155]">
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    <strong>Note:</strong> This reserve requirement ensures the club maintains adequate funds for future
                    maintenance and improvements. Per Bylaw 7.6(b), the board can approve spending up to the current year
                    reserve amount plus any carry-over funds from prior years. Expenditures exceeding the reserve require
                    membership approval per Bylaw 7.6(c).
                  </p>
                </div>
              </div>
            </div>

            {/* Certification Statement */}
            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-500 rounded-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Treasurer's Certification</h3>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                I certify that this financial report accurately represents the financial activities of Lockridge Forest
                Swim & Tennis Club for Fiscal Year {fiscalYear}. All revenue was collected and deposited in accordance
                with club bylaws. All expenditures were made for the benefit of club members and facilities, in furtherance
                of the club's nonprofit purpose as a community recreational organization.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-8">
                <div>
                  <div className="border-b-2 border-slate-400 dark:border-slate-500 pb-1 mb-2 min-h-[60px] flex items-end">
                    {signature ? (
                      <span className="text-2xl font-script text-slate-900 dark:text-slate-100" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                        {signature.name}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500 italic">Not signed</span>
                    )}
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-300">Treasurer Signature</span>
                </div>
                <div>
                  <div className="border-b-2 border-slate-400 dark:border-slate-500 pb-1 mb-2 min-h-[60px] flex items-end">
                    {signature ? (
                      <span className="text-lg text-slate-900 dark:text-slate-100">{signature.date}</span>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500 italic">Not dated</span>
                    )}
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-300">Date</span>
                </div>
              </div>
              <div className="mt-4 flex gap-3 no-print">
                {!signature ? (
                  <button
                    onClick={() => setShowSignatureModal(true)}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign Report
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (window.confirm('Remove signature from this report?')) {
                        localStorage.removeItem(`lfst_treasurer_signature_${fiscalYear}`);
                        setSignature(null);
                      }
                    }}
                    className="px-4 py-2 bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Remove Signature
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-300 mt-8 pt-6 border-t border-slate-200 dark:border-[#334155]">
              <p>Lockridge Forest Swim & Tennis Club - A Georgia Nonprofit Community Association</p>
              <p className="mt-1">Report Generated: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      )}

      {/* IRS FORM 990 VIEW */}
      {reportView === 'irs-990' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] dark:border-[#334155] print:shadow-none print:border-0">
          <div className="p-8 space-y-8">

            {/* IRS Form Header */}
            <div className="text-center border-b-2 border-slate-200 dark:border-[#334155] pb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                IRS Form 990 - Supporting Documentation
              </h1>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Lockridge Forest Swim & Tennis Club
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-200">
                Fiscal Year {fiscalYear} (October {fiscalYear - 1} - September {fiscalYear})
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-300 italic mt-3">
                501(c)(7) Social and Recreational Club
              </p>
            </div>

            {/* Part VIII - Statement of Revenue */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-emerald-600 dark:border-emerald-700">
                Part VIII - Statement of Revenue
              </h2>

              <div className="border border-slate-300 dark:border-[#334155] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Line</th>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Description</th>
                      <th className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200 dark:border-[#334155]">
                      <td className="p-3 text-slate-600 dark:text-slate-300">1a</td>
                      <td className="p-3 text-slate-900 dark:text-slate-100">Membership Dues</td>
                      <td className="p-3 text-right font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.revenue.membershipDues)}</td>
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-[#334155]">
                      <td className="p-3 text-slate-600 dark:text-slate-300">1b</td>
                      <td className="p-3 text-slate-900 dark:text-slate-100">Initiation Fees</td>
                      <td className="p-3 text-right font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.revenue.initiationFees)}</td>
                    </tr>
                    {Object.keys(metrics.revenue.discountsApplied).length > 0 && (
                      <>
                        {Object.entries(metrics.revenue.discountsApplied).map(([label, amount]) => (
                          <tr key={label} className="border-b border-slate-200 dark:border-[#334155] bg-rose-50 dark:bg-rose-900/30">
                            <td className="p-3 text-slate-600 dark:text-slate-300"></td>
                            <td className="p-3 text-slate-700 dark:text-slate-200 pl-8">Discount: {label}</td>
                            <td className="p-3 text-right font-semibold text-rose-600 dark:text-rose-300">-{formatCurrency(amount)}</td>
                          </tr>
                        ))}
                        <tr className="border-b border-slate-200 dark:border-[#334155] bg-slate-100 dark:bg-slate-700">
                          <td className="p-3 text-slate-600 dark:text-slate-300"></td>
                          <td className="p-3 text-slate-900 dark:text-slate-100 font-semibold">Total Membership Dues Realized</td>
                          <td className="p-3 text-right font-bold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.revenue.totalMembershipDuesRealized)}</td>
                        </tr>
                      </>
                    )}
                    <tr className="border-b border-slate-200 dark:border-[#334155]">
                      <td className="p-3 text-slate-600 dark:text-slate-300">1c</td>
                      <td className="p-3 text-slate-900 dark:text-slate-100">Outside Tennis Dues (Non-Member Access)</td>
                      <td className="p-3 text-right font-semibold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.revenue.outsideTennisDues)}</td>
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-[#334155]">
                      <td className="p-3 text-slate-600 dark:text-slate-300">2</td>
                      <td className="p-3 text-slate-900 dark:text-slate-100">Program Service Revenue</td>
                      <td className="p-3 text-right font-semibold text-slate-900 dark:text-[#f8fafc]">
                        {formatCurrency(Object.values(metrics.revenue.programsIncome).reduce((sum, amt) => sum + amt, 0))}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-[#334155]">
                      <td className="p-3 text-slate-600 dark:text-slate-300">3-11</td>
                      <td className="p-3 text-slate-900 dark:text-slate-100">Other Revenue</td>
                      <td className="p-3 text-right font-semibold text-slate-900 dark:text-[#f8fafc]">
                        {formatCurrency(Object.values(metrics.revenue.otherIncome).reduce((sum, amt) => sum + amt, 0))}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50 dark:bg-emerald-900/50 border-t-2 border-emerald-600 dark:border-emerald-600">
                      <td className="p-3 text-slate-900 dark:text-slate-100 font-bold">12</td>
                      <td className="p-3 text-slate-900 dark:text-slate-100 font-bold">TOTAL REVENUE</td>
                      <td className="p-3 text-right font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(metrics.revenue.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part IX - Statement of Functional Expenses */}
            <div className="page-break-before">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-rose-600 dark:border-rose-700">
                Part IX - Statement of Functional Expenses
              </h2>

              <div className="border border-slate-300 dark:border-[#334155] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Expense Category</th>
                      <th className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Total Expenses</th>
                      <th className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Program Services</th>
                      <th className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Management & General</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200 dark:border-[#334155] bg-blue-50 dark:bg-blue-900/40">
                      <td className="p-3 text-slate-900 dark:text-slate-100 font-semibold" colSpan="4">Operating Expenses (OPEX)</td>
                    </tr>
                    {Object.entries(metrics.expenses.opex).map(([category, amount]) => (
                      <tr key={category} className="border-b border-slate-200 dark:border-[#334155]">
                        <td className="p-3 text-slate-700 dark:text-slate-200 pl-6">{category}</td>
                        <td className="p-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(amount)}</td>
                        <td className="p-3 text-right text-blue-700 dark:text-blue-300">{formatCurrency(amount)}</td>
                        <td className="p-3 text-right text-slate-400 dark:text-slate-500">$0.00</td>
                      </tr>
                    ))}
                    <tr className="border-b border-slate-300 dark:border-[#334155] bg-slate-50 dark:bg-slate-700">
                      <td className="p-3 text-slate-900 dark:text-slate-100 font-semibold pl-6">OPEX Subtotal</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.expenses.opexTotal)}</td>
                      <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(metrics.expenses.opexTotal)}</td>
                      <td className="p-3 text-right text-slate-400 dark:text-slate-500">$0.00</td>
                    </tr>

                    {Object.keys(metrics.expenses.capex).length > 0 && (
                      <>
                        <tr className="border-b border-slate-200 dark:border-[#334155] bg-blue-50 dark:bg-blue-900/40">
                          <td className="p-3 text-slate-900 dark:text-slate-100 font-semibold" colSpan="4">Capital Improvements (CAPEX)</td>
                        </tr>
                        {Object.entries(metrics.expenses.capex).map(([category, amount]) => (
                          <tr key={category} className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-200 pl-6">{category}</td>
                            <td className="p-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(amount)}</td>
                            <td className="p-3 text-right text-blue-700 dark:text-blue-300">{formatCurrency(amount)}</td>
                            <td className="p-3 text-right text-slate-400 dark:text-slate-500">$0.00</td>
                          </tr>
                        ))}
                        <tr className="border-b border-slate-300 dark:border-[#334155] bg-slate-50 dark:bg-slate-700">
                          <td className="p-3 text-slate-900 dark:text-slate-100 font-semibold pl-6">CAPEX Subtotal</td>
                          <td className="p-3 text-right font-bold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.expenses.capexTotal)}</td>
                          <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(metrics.expenses.capexTotal)}</td>
                          <td className="p-3 text-right text-slate-400 dark:text-slate-500">$0.00</td>
                        </tr>
                      </>
                    )}

                    {Object.keys(metrics.expenses.ga).length > 0 && (
                      <>
                        <tr className="border-b border-slate-200 dark:border-[#334155] bg-amber-50 dark:bg-amber-900/40">
                          <td className="p-3 text-slate-900 dark:text-slate-100 font-semibold" colSpan="4">General & Administrative (G&A)</td>
                        </tr>
                        {Object.entries(metrics.expenses.ga).map(([category, amount]) => (
                          <tr key={category} className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-200 pl-6">{category}</td>
                            <td className="p-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(amount)}</td>
                            <td className="p-3 text-right text-slate-400 dark:text-slate-500">$0.00</td>
                            <td className="p-3 text-right text-amber-700 dark:text-amber-300">{formatCurrency(amount)}</td>
                          </tr>
                        ))}
                        <tr className="border-b border-slate-300 dark:border-[#334155] bg-slate-50 dark:bg-slate-700">
                          <td className="p-3 text-slate-900 dark:text-slate-100 font-semibold pl-6">G&A Subtotal</td>
                          <td className="p-3 text-right font-bold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(metrics.expenses.gaTotal)}</td>
                          <td className="p-3 text-right text-slate-400 dark:text-slate-500">$0.00</td>
                          <td className="p-3 text-right font-bold text-amber-700 dark:text-amber-300">{formatCurrency(metrics.expenses.gaTotal)}</td>
                        </tr>
                      </>
                    )}

                    <tr className="bg-rose-50 dark:bg-rose-900/50 border-t-2 border-rose-600 dark:border-rose-600">
                      <td className="p-3 text-slate-900 dark:text-slate-100 font-bold">TOTAL EXPENSES</td>
                      <td className="p-3 text-right font-bold text-rose-700 dark:text-rose-300">{formatCurrency(metrics.expenses.total)}</td>
                      <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(metrics.expenses.programServices)}</td>
                      <td className="p-3 text-right font-bold text-amber-700 dark:text-amber-300">{formatCurrency(metrics.expenses.managementGeneral)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Functional Allocation Summary */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-600">
                  <p className="text-sm text-blue-700 dark:text-blue-200 font-medium mb-1">Program Services</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{metrics.programServicesPercent.toFixed(1)}%</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">{formatCurrency(metrics.expenses.programServices)} of total expenses</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/50 p-4 rounded-lg border-2 border-amber-200 dark:border-amber-600">
                  <p className="text-sm text-amber-700 dark:text-amber-200 font-medium mb-1">Management & General</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">{metrics.managementGeneralPercent.toFixed(1)}%</p>
                  <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">{formatCurrency(metrics.expenses.managementGeneral)} of total expenses</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-50 dark:bg-transparent rounded-lg border border-slate-200 dark:border-[#334155]">
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  <strong>Note for IRS:</strong> OPEX and CAPEX expenses are classified as Program Services because they directly support
                  the club's exempt purpose of providing recreational facilities and activities for members. G&A expenses cover administrative
                  overhead necessary for club operations.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-300 mt-8 pt-6 border-t border-slate-200 dark:border-[#334155]">
              <p>Form 990 Supporting Documentation - Lockridge Forest Swim & Tennis Club</p>
              <p className="mt-1">Report Generated: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-YEAR COMPARISON VIEW */}
      {reportView === 'comparison' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] dark:border-[#334155] print:shadow-none print:border-0">
          <div className="p-8 space-y-8">

            {/* Header */}
            <div className="text-center border-b-2 border-slate-200 dark:border-[#334155] pb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Multi-Year Financial Comparison
              </h1>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Lockridge Forest Swim & Tennis Club
              </h2>
              {multiYearData.length > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-300 italic mt-3">
                  Fiscal Years {multiYearData[0]?.year} through {multiYearData[multiYearData.length - 1]?.year}
                </p>
              )}
            </div>

            {multiYearData.length > 0 && (() => {
              const yearMetrics = multiYearData.map(y => calculateMetrics(y.members, y.transactions, y.budget));

              return (
                <div className="space-y-8">
                  {/* Membership Trends */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-blue-600 dark:border-blue-700">
                      Membership Trends
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                          <tr>
                            <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Metric</th>
                            {multiYearData.map(y => (
                              <th key={y.year} className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">
                                FY{y.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Total Members</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right font-semibold text-slate-900 dark:text-[#f8fafc]">{m.members.total}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Inside Members</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-emerald-700 dark:text-emerald-300">{m.members.inside}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Outside Members</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-blue-700 dark:text-blue-300">{m.members.outside}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Revenue Trends */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-emerald-600 dark:border-emerald-700">
                      Revenue Trends
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                          <tr>
                            <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Revenue Source</th>
                            {multiYearData.map(y => (
                              <th key={y.year} className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">
                                FY{y.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Membership Dues</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(m.revenue.membershipDues)}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Initiation Fees</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(m.revenue.initiationFees)}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Outside Tennis Dues</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(m.revenue.outsideTennisDues)}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Programs Income</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900 dark:text-slate-100">
                                {formatCurrency(Object.values(m.revenue.programsIncome).reduce((sum, amt) => sum + amt, 0))}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Other Income</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900 dark:text-slate-100">
                                {formatCurrency(Object.values(m.revenue.otherIncome).reduce((sum, amt) => sum + amt, 0))}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-emerald-50 dark:bg-emerald-900/50 border-t-2 border-emerald-600 dark:border-emerald-600">
                            <td className="p-3 text-slate-900 dark:text-slate-100 font-bold">TOTAL REVENUE</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(m.revenue.total)}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expense Trends */}
                  <div className="page-break-before">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-rose-600 dark:border-rose-700">
                      Expense Trends
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                          <tr>
                            <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Expense Type</th>
                            {multiYearData.map(y => (
                              <th key={y.year} className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">
                                FY{y.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Operating Expenses (OPEX)</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(m.expenses.opexTotal)}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Capital Improvements (CAPEX)</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(m.expenses.capexTotal)}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">General & Administrative (G&A)</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(m.expenses.gaTotal)}</td>
                            ))}
                          </tr>
                          <tr className="bg-rose-50 dark:bg-rose-900/50 border-t-2 border-rose-600 dark:border-rose-600">
                            <td className="p-3 text-slate-900 dark:text-slate-100 font-bold">TOTAL EXPENSES</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right font-bold text-rose-700 dark:text-rose-300">{formatCurrency(m.expenses.total)}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Net Income & Cash Position */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-blue-600 dark:border-blue-700">
                      Net Income & Cash Position
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                          <tr>
                            <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Metric</th>
                            {multiYearData.map(y => (
                              <th key={y.year} className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">
                                FY{y.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Net Income</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className={`p-3 text-right font-semibold ${m.netIncome >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                {formatCurrency(m.netIncome)}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Ending Cash Position</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right font-bold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(m.cashPosition)}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Functional Allocation Trends */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-purple-600 dark:border-purple-700">
                      Functional Allocation Trends
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                          <tr>
                            <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Allocation</th>
                            {multiYearData.map(y => (
                              <th key={y.year} className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">
                                FY{y.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Program Services %</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-blue-700 dark:text-blue-300 font-semibold">{m.programServicesPercent.toFixed(1)}%</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 dark:border-[#334155]">
                            <td className="p-3 text-slate-700 dark:text-slate-300">Management & General %</td>
                            {yearMetrics.map((m, i) => (
                              <td key={i} className="p-3 text-right text-amber-700 dark:text-amber-300 font-semibold">{m.managementGeneralPercent.toFixed(1)}%</td>
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
            <div className="text-center text-xs text-slate-500 dark:text-slate-300 mt-8 pt-6 border-t border-slate-200 dark:border-[#334155]">
              <p>Multi-Year Financial Comparison - Lockridge Forest Swim & Tennis Club</p>
              <p className="mt-1">Report Generated: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      )}

      {/* CAPITAL ASSETS VIEW */}
      {reportView === 'assets' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] dark:border-[#334155] print:shadow-none print:border-0">
          <div className="p-8 space-y-8">

            {/* Header */}
            <div className="text-center border-b-2 border-slate-200 dark:border-[#334155] pb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Capital Assets Schedule
              </h1>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Lockridge Forest Swim & Tennis Club
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-200">
                As of September 30, {fiscalYear}
              </p>
            </div>

            {/* Assets Table */}
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-300 dark:border-[#334155] rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Asset Description</th>
                      <th className="text-center p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Acquisition Date</th>
                      <th className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Original Cost</th>
                      <th className="text-center p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Useful Life</th>
                      <th className="text-center p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Years in Service</th>
                      <th className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Annual Depreciation</th>
                      <th className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Accumulated Depreciation</th>
                      <th className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Net Book Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depreciatedAssets.map((asset, index) => (
                      <tr key={index} className="border-b border-slate-200 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="p-3 text-slate-900 dark:text-slate-100">{asset.description}</td>
                        <td className="p-3 text-center text-slate-700 dark:text-slate-300">{new Date(asset.acquisitionDate).toLocaleDateString()}</td>
                        <td className="p-3 text-right text-slate-900 dark:text-slate-100 font-semibold">{formatCurrency(asset.cost)}</td>
                        <td className="p-3 text-center text-slate-700 dark:text-slate-300">{asset.usefulLife} years</td>
                        <td className="p-3 text-center text-slate-700 dark:text-slate-300">{asset.yearsInService} years</td>
                        <td className="p-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(asset.annualDepreciation)}</td>
                        <td className="p-3 text-right text-rose-700 dark:text-rose-300">{formatCurrency(asset.accumulatedDepreciation)}</td>
                        <td className="p-3 text-right text-blue-700 dark:text-blue-300 font-semibold">{formatCurrency(asset.bookValue)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 dark:bg-slate-700 border-t-2 border-slate-400 dark:border-slate-500">
                      <td className="p-3 text-slate-900 dark:text-slate-100 font-bold" colSpan="2">TOTALS</td>
                      <td className="p-3 text-right text-slate-900 dark:text-slate-100 font-bold">{formatCurrency(totalAssetCost)}</td>
                      <td className="p-3" colSpan="3"></td>
                      <td className="p-3 text-right text-rose-700 dark:text-rose-300 font-bold">{formatCurrency(totalAccumulatedDepreciation)}</td>
                      <td className="p-3 text-right text-blue-700 dark:text-blue-300 font-bold">{formatCurrency(totalBookValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-transparent p-4 rounded-lg border-2 border-slate-200 dark:border-[#334155]">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-1">Total Asset Cost</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-[#f8fafc]">{formatCurrency(totalAssetCost)}</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/50 p-4 rounded-lg border-2 border-rose-200 dark:border-rose-600">
                <p className="text-sm text-rose-700 dark:text-rose-200 font-medium mb-1">Accumulated Depreciation</p>
                <p className="text-2xl font-bold text-rose-900 dark:text-rose-200">{formatCurrency(totalAccumulatedDepreciation)}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-600">
                <p className="text-sm text-blue-700 dark:text-blue-200 font-medium mb-1">Net Book Value</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{formatCurrency(totalBookValue)}</p>
              </div>
            </div>

            {/* Depreciation Note */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/50 rounded-lg border border-amber-200 dark:border-amber-600">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-2">Depreciation Method</h3>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                Straight-line depreciation is used for all capital assets. Annual depreciation is calculated as:
                <strong> Original Cost ÷ Useful Life</strong>. Accumulated depreciation represents
                the total depreciation expense recorded since acquisition and cannot exceed the original cost.
              </p>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-300 mt-8 pt-6 border-t border-slate-200 dark:border-[#334155]">
              <p>Capital Assets Schedule - Lockridge Forest Swim & Tennis Club</p>
              <p className="mt-1">Report Generated: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      )}

      {/* MAJOR OPEX EXPENDITURES VIEW */}
      {reportView === 'major-opex' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-[#334155] print:shadow-none print:border-0">
          <div className="p-8 space-y-8">

            {/* Header */}
            <div className="text-center border-b-2 border-slate-200 dark:border-[#334155] pb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Major Operating Expenditures (OPEX)
              </h1>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Lockridge Forest Swim & Tennis Club
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-200">
                Fiscal Year {fiscalYear} (October 1, {fiscalYear - 1} - September 30, {fiscalYear})
              </p>
            </div>

            {/* OPEX Expenditures Table */}
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-300 dark:border-[#334155] rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Date</th>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Description</th>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Category</th>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Recurrence Schedule</th>
                      <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Next Due</th>
                      <th className="text-right p-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-[#334155]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {majorMaintenanceItems
                      .filter(item => item.lastOccurrence?.date)
                      .sort((a, b) => new Date(b.lastOccurrence.date) - new Date(a.lastOccurrence.date))
                      .map((item, index) => {
                        const nextDueYear = item.nextDueDateMin ? new Date(item.nextDueDateMin).getFullYear() : 'TBD';

                        // Display reminder year
                        let recurrenceSchedule;
                        if (item.trackingEnabled === false) {
                          recurrenceSchedule = 'N/A - No tracking';
                        } else if (item.alertYear) {
                          recurrenceSchedule = `Reminder: ${item.alertYear}`;
                        } else {
                          recurrenceSchedule = 'N/A';
                        }

                        return (
                          <tr key={index} className="border-b border-slate-200 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="p-3 text-slate-700 dark:text-slate-300">{new Date(item.lastOccurrence.date).toLocaleDateString()}</td>
                            <td className="p-3 text-slate-900 dark:text-slate-100">{item.name}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{item.category || 'OPEX'}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{recurrenceSchedule}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{nextDueYear}</td>
                            <td className="p-3 text-right text-rose-700 dark:text-rose-300 font-semibold">{formatCurrency(Math.abs(item.lastOccurrence.amount))}</td>
                          </tr>
                        );
                      })}
                    <tr className="bg-slate-100 dark:bg-slate-700 border-t-2 border-slate-400 dark:border-slate-500">
                      <td className="p-3 text-slate-900 dark:text-slate-100 font-bold" colSpan="5">TOTAL MAJOR OPEX</td>
                      <td className="p-3 text-right text-rose-700 dark:text-rose-300 font-bold">
                        {formatCurrency(
                          majorMaintenanceItems
                            .filter(item => item.lastOccurrence?.amount)
                            .reduce((sum, item) => sum + Math.abs(item.lastOccurrence.amount), 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-rose-600 dark:border-rose-700">
                Major OPEX by Category
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(
                  majorMaintenanceItems
                    .filter(item => item.lastOccurrence?.amount)
                    .reduce((acc, item) => {
                      const cat = item.category || 'OPEX';
                      acc[cat] = (acc[cat] || 0) + Math.abs(item.lastOccurrence.amount);
                      return acc;
                    }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const totalMajorOpex = majorMaintenanceItems
                      .filter(item => item.lastOccurrence?.amount)
                      .reduce((sum, item) => sum + Math.abs(item.lastOccurrence.amount), 0);

                    return (
                      <div key={category} className="bg-rose-50 dark:bg-rose-900/50 p-4 rounded-lg border-2 border-rose-200 dark:border-rose-600">
                        <p className="text-sm text-rose-700 dark:text-rose-200 font-medium mb-1">{category}</p>
                        <p className="text-2xl font-bold text-rose-900 dark:text-rose-200">{formatCurrency(amount)}</p>
                        <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">
                          {((amount / totalMajorOpex) * 100).toFixed(1)}% of total Major OPEX
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-rose-50 dark:bg-rose-900/50 p-4 rounded-lg border-2 border-rose-200 dark:border-rose-600">
                <p className="text-sm text-rose-700 dark:text-rose-200 font-medium mb-1">Total Major OPEX</p>
                <p className="text-2xl font-bold text-rose-900 dark:text-rose-200">
                  {formatCurrency(
                    majorMaintenanceItems
                      .filter(item => item.lastOccurrence?.amount)
                      .reduce((sum, item) => sum + Math.abs(item.lastOccurrence.amount), 0)
                  )}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-600">
                <p className="text-sm text-blue-700 dark:text-blue-200 font-medium mb-1">Number of Items</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {majorMaintenanceItems.filter(item => item.lastOccurrence?.date).length}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/50 p-4 rounded-lg border-2 border-amber-200 dark:border-amber-600">
                <p className="text-sm text-amber-700 dark:text-amber-200 font-medium mb-1">Average per Item</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                  {formatCurrency(
                    majorMaintenanceItems
                      .filter(item => item.lastOccurrence?.amount)
                      .reduce((sum, item) => sum + Math.abs(item.lastOccurrence.amount), 0) /
                    Math.max(1, majorMaintenanceItems.filter(item => item.lastOccurrence?.date).length)
                  )}
                </p>
              </div>
            </div>

            {/* Information Note */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-600">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">About Operating Expenditures (OPEX)</h3>
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                Operating Expenditures (OPEX) represent the day-to-day costs of running the club facilities and programs.
                These include maintenance, utilities, supplies, and other recurring expenses necessary to keep the club
                operational. Unlike Capital Expenditures (CAPEX), OPEX items are fully expensed in the year incurred
                and do not get depreciated over multiple years.
              </p>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-300 mt-8 pt-6 border-t border-slate-200 dark:border-[#334155]">
              <p>Major Operating Expenditures Report - Lockridge Forest Swim & Tennis Club</p>
              <p className="mt-1">Report Generated: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Sign Financial Report</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              By signing this report, you certify that the information presented is accurate and complete for FY{fiscalYear}.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const name = formData.get('name');
                if (name.trim()) {
                  const signatureData = {
                    name: name.trim(),
                    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    timestamp: new Date().toISOString()
                  };
                  localStorage.setItem(`lfst_treasurer_signature_${fiscalYear}`, JSON.stringify(signatureData));
                  setSignature(signatureData);
                  setShowSignatureModal(false);
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Treasurer Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#0f172a] dark:text-slate-100"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Your signature will be displayed in cursive font on the report
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default YearEndReport;
