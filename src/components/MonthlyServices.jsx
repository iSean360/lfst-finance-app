import React from 'react';
import { Building, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, MONTHS, calculateYearTotal, getCurrentFiscalMonth } from '../utils/helpers';

function MonthlyServices({ data, onRefresh }) {
  const currentMonthIndex = getCurrentFiscalMonth();

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Monthly Services</h2>
        <p className="text-sm text-slate-600">Recurring operational expenses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.services.map(service => {
          const yearTotal = calculateYearTotal(service.monthlyAmounts);
          
          return (
            <div key={service.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{service.name}</h3>
                  <p className="text-sm text-slate-600">
                    Annual: {formatCurrency(yearTotal)}
                  </p>
                  {service.notes && (
                    <p className="text-xs text-slate-500 mt-1">{service.notes}</p>
                  )}
                </div>
                <Building className="w-8 h-8 text-slate-400" />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {MONTHS.map((month, idx) => {
                  const amount = service.monthlyAmounts?.[idx] || 0;
                  const isPaid = idx < currentMonthIndex;
                  
                  return (
                    <div key={month} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        {isPaid ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-300" />
                        )}
                        <span className="text-sm font-medium text-slate-700">{month}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {service.autoPayEnabled && (
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                  <CheckCircle className="w-3 h-3" />
                  <span>Auto-Pay Enabled</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MonthlyServices;
