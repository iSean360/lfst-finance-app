import React from 'react';
import { Download, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { exportToJSON } from '../utils/helpers';

function Reports({ data, metrics }) {
  const handleExport = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      fiscalYear: data.settings?.fiscalYear,
      balance: data.balance,
      metrics,
      members: data.members,
      transactions: data.transactions,
      services: data.services
    };
    
    exportToJSON(exportData, `LFST-Financial-Report-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Financial Reports</h2>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="prose max-w-none">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            {formatDate(new Date())} – Financial Update
          </h3>
          
          <div className="space-y-6 text-slate-700">
            <section>
              <h4 className="font-bold text-slate-900 mb-2">Treasurer Comments:</h4>
              <p>
                As of {formatDate(new Date())}, forecasting end of year bank balance {formatCurrency(metrics.projectedYearEnd)}.
              </p>
              <p>
                Current cash balance of {formatCurrency(metrics.currentBalance)}.
              </p>
            </section>

            <section>
              <h4 className="font-bold text-slate-900 mb-2">Membership</h4>
              <p>
                {metrics.paidMembers} paid members ({metrics.unpaidMembers} unpaid)
              </p>
              <p>
                Total dues revenue: {formatCurrency(metrics.memberRevenue)}
              </p>
            </section>

            <section>
              <h4 className="font-bold text-slate-900 mb-2">Operations</h4>
              <p>
                {formatCurrency(metrics.annualServiceCosts)} annual OPEX from recurring services
              </p>
              <p>
                {formatCurrency(metrics.totalExpenses)} YTD total expenses
              </p>
            </section>

            <section>
              <h4 className="font-bold text-slate-900 mb-2">Transaction Summary</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Total Revenue: {formatCurrency(metrics.totalRevenue)}</li>
                <li>Total Expenses: {formatCurrency(metrics.totalExpenses)}</li>
                <li>Net Income: {formatCurrency(metrics.netIncome)}</li>
                <li>Total Transactions: {metrics.ytdTransactions}</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
