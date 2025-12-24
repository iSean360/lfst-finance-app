import React, { useState } from 'react';
import { Upload, Download, Database, CheckCircle, AlertCircle, FileText } from 'lucide-react';

function ImportData({ onRefresh }) {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const importFY2024SampleData = async () => {
    setImporting(true);
    setImportStatus(null);

    try {
      console.log('📥 Starting FY2024 data import...');
      const response = await fetch('/fy2024-archived-data.json');
      console.log('📥 Fetch response:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Data loaded:', data);

      // Import each data type
      console.log('💾 Saving to localStorage...');
      localStorage.setItem('lfst_finance_budget_2024', JSON.stringify(data.budget_2024));
      localStorage.setItem('lfst_finance_capex_2024', JSON.stringify(data.capex_2024));
      localStorage.setItem('lfst_finance_transactions_2024', JSON.stringify(data.transactions_2024));
      localStorage.setItem('lfst_finance_members_2024', JSON.stringify(data.members_2024));

      console.log('✅ All data saved to localStorage');

      setImportStatus({
        success: true,
        message: 'FY2024 archived data imported successfully!',
        details: [
          `Budget: ${data.budget_2024.monthlyBudgets.length} months`,
          `CAPEX Projects: ${data.capex_2024.length}`,
          `Transactions: ${data.transactions_2024.length}`,
          `Members: ${data.members_2024.length}`,
          'Data stored in localStorage - check Application tab to verify'
        ]
      });

      console.log('🔄 Refreshing app in 2 seconds...');
      setTimeout(() => {
        onRefresh();
      }, 2000);
    } catch (error) {
      console.error('❌ Import failed:', error);
      setImportStatus({
        success: false,
        message: 'Failed to import data',
        details: [error.message, 'Check console for details']
      });
    } finally {
      setImporting(false);
    }
  };

  const exportCurrentData = () => {
    const exportData = {
      budget_2026: JSON.parse(localStorage.getItem('lfst_finance_budget_2026') || 'null'),
      capex_2026: JSON.parse(localStorage.getItem('lfst_finance_capex_2026') || '[]'),
      data: JSON.parse(localStorage.getItem('lfst_finance_data') || '{}')
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lfst-fy2026-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Import the data
        if (data.budget_2026) {
          localStorage.setItem('lfst_finance_budget_2026', JSON.stringify(data.budget_2026));
        }
        if (data.capex_2026) {
          localStorage.setItem('lfst_finance_capex_2026', JSON.stringify(data.capex_2026));
        }
        if (data.data) {
          localStorage.setItem('lfst_finance_data', JSON.stringify(data.data));
        }

        setImportStatus({
          success: true,
          message: 'Data imported from file successfully!',
          details: ['Refresh the page to see imported data']
        });

        setTimeout(() => {
          onRefresh();
        }, 2000);
      } catch (error) {
        setImportStatus({
          success: false,
          message: 'Failed to import file',
          details: [error.message]
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">data managemen</h1>
            <p className="text-sm text-slate-600">Import archived data or export current data</p>
          </div>
        </div>

        {/* Import Status */}
        {importStatus && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            importStatus.success
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-start gap-3">
              {importStatus.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${
                  importStatus.success ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {importStatus.message}
                </p>
                {importStatus.details && (
                  <ul className={`mt-2 text-sm ${
                    importStatus.success ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {importStatus.details.map((detail, idx) => (
                      <li key={idx}>• {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Sample Data */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Import Sample Data</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Load FY2024 archived data (Oct 2023 - Sep 2024) with sample transactions, budget, CAPEX, and members.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="text-xs font-semibold text-slate-700 mb-2">Includes:</h3>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✓ Complete FY2024 budget</li>
                <li>✓ 1 completed CAPEX project</li>
                <li>✓ 15 sample transactions</li>
                <li>✓ 4 member records</li>
                <li>✓ Starting balance: $42,500</li>
              </ul>
            </div>
            <button
              onClick={importFY2024SampleData}
              disabled={importing}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  Load FY2024 Sample Data
                </>
              )}
            </button>
          </div>

          {/* Import from File */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-violet-600" />
              <h2 className="text-lg font-bold text-slate-900">Import from File</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Upload a previously exported JSON file to restore data.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-xs text-slate-600">
                Select a JSON file exported from this application. This will replace current FY2026 data.
              </p>
            </div>
            <label className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-5 h-5" />
              Choose File to Import
              <input
                type="file"
                accept=".json"
                onChange={importFromFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Export Current Data */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Export Current Data</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Download all FY2026 data as a JSON file for backup or archiving.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="text-xs font-semibold text-slate-700 mb-2">Exports:</h3>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✓ FY2026 budget</li>
                <li>✓ All CAPEX projects</li>
                <li>✓ All transactions</li>
                <li>✓ All member records</li>
                <li>✓ Settings & balance</li>
              </ul>
            </div>
            <button
              onClick={exportCurrentData}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export FY2026 Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportData;
