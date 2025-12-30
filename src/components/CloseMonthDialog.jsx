import React from 'react';
import { X, AlertTriangle, FileText, Lock } from 'lucide-react';

function CloseMonthDialog({ monthIndex, monthName, onGenerateReport, onCloseWithoutReport, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Close {monthName}?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This will lock all data for this month
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/40 border-2 border-amber-300 dark:border-amber-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  What happens when you close a month?
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                  <li>The budget will be updated to match actual values</li>
                  <li>All transactions for this month will be locked</li>
                  <li>Member payment records for this month cannot be modified</li>
                  <li>You can reopen the month later if needed</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Would you like to generate a Monthly Board Meeting Report?
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  The report includes membership updates, financial summaries, CAPEX/OPEX activity,
                  revenue analysis, and a full year cash flow table. You can export it to Word.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-[#334155]">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onCloseWithoutReport}
            className="flex-1 py-3 px-4 bg-slate-600 dark:bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
          >
            Close Without Report
          </button>
          <button
            onClick={onGenerateReport}
            className="flex-1 py-3 px-4 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
          >
            Generate Report & Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CloseMonthDialog;
