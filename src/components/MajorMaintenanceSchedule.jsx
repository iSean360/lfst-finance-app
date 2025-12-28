import React, { useState, useEffect } from 'react';
import { Search, Calendar, DollarSign, Clock, AlertTriangle, Edit2, TrendingUp, Filter, X } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import storage from '../services/storage';
import { calculateInflatedCost } from '../constants/majorMaintenance';

// Manual Adjustment Modal
function ManualAdjustmentModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    manualNextDate: item.manualNextDate || item.nextDueDateMin || '',
    manualExpectedCost: item.manualExpectedCost || item.nextExpectedCost || 0,
    notes: item.notes || ''
  });

  const handleSave = () => {
    onSave(item.id, formData);
    onClose();
  };

  const handleReset = () => {
    setFormData({
      manualNextDate: '',
      manualExpectedCost: 0,
      notes: formData.notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-slide-up">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Manual Adjustments</h2>
              <p className="text-sm text-slate-600 mt-1">{item.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Calculated Values */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Current Calculated Values</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Next Due Date (Min):</p>
                <p className="font-medium text-slate-900">
                  {item.nextDueDateMin ? new Date(item.nextDueDateMin).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Next Due Date (Max):</p>
                <p className="font-medium text-slate-900">
                  {item.nextDueDateMax ? new Date(item.nextDueDateMax).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Expected Cost (3% inflation):</p>
                <p className="font-medium text-slate-900">{formatCurrency(item.nextExpectedCost || 0)}</p>
              </div>
              <div>
                <p className="text-slate-600">Based On:</p>
                <p className="font-medium text-slate-900">
                  {item.lastOccurrence ? 'Last occurrence' : 'No history'}
                </p>
              </div>
            </div>
          </div>

          {/* Manual Override Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Override Next Due Date
              </label>
              <input
                type="date"
                value={formData.manualNextDate}
                onChange={(e) => setFormData({ ...formData, manualNextDate: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave blank to use calculated date. This overrides the minimum due date.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Override Expected Cost
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.manualExpectedCost}
                  onChange={(e) => setFormData({ ...formData, manualExpectedCost: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Set to 0 to use inflation-calculated cost
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Reason for manual adjustment..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Reset to Calculated
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Adjustments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Timeline View
function TimelineView({ items }) {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Generate timeline from 5 years ago to 15 years in the future
  const startYear = currentYear - 5;
  const endYear = currentYear + 15;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  // Group items by year
  const itemsByYear = {};
  items.forEach(item => {
    // Add last occurrence
    if (item.lastOccurrence) {
      const year = new Date(item.lastOccurrence.date).getFullYear();
      if (year >= startYear && year <= endYear) {
        if (!itemsByYear[year]) itemsByYear[year] = [];
        itemsByYear[year].push({ ...item, type: 'past', date: item.lastOccurrence.date });
      }
    }

    // Add next due (using min date)
    if (item.nextDueDateMin) {
      const year = new Date(item.nextDueDateMin).getFullYear();
      if (year >= startYear && year <= endYear) {
        if (!itemsByYear[year]) itemsByYear[year] = [];
        itemsByYear[year].push({ ...item, type: 'future', date: item.nextDueDateMin });
      }
    }
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Timeline View
      </h3>

      <div className="space-y-4">
        {years.map(year => {
          const yearItems = itemsByYear[year] || [];
          const isCurrentYear = year === currentYear;
          const isPast = year < currentYear;

          return (
            <div
              key={year}
              className={`flex items-start gap-4 ${isCurrentYear ? 'bg-blue-50 -mx-2 px-2 py-2 rounded-lg' : ''}`}
            >
              <div className={`w-20 flex-shrink-0 text-right font-semibold ${
                isCurrentYear ? 'text-blue-600' : isPast ? 'text-slate-400' : 'text-slate-700'
              }`}>
                {year}
                {isCurrentYear && (
                  <div className="text-xs text-blue-600 font-normal">Today</div>
                )}
              </div>

              <div className="flex-1 border-l-2 border-slate-200 pl-4 pb-2 min-h-[40px]">
                {yearItems.length === 0 ? (
                  <div className="text-sm text-slate-400 italic">No scheduled maintenance</div>
                ) : (
                  <div className="space-y-2">
                    {yearItems.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        className={`text-sm p-2 rounded-lg border ${
                          item.type === 'past'
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs mt-1">
                          {item.type === 'past' ? (
                            <>Completed: {formatCurrency(item.lastOccurrence.amount)}</>
                          ) : (
                            <>Expected: {formatCurrency(item.manualExpectedCost || item.nextExpectedCost || 0)}</>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Schedule Component
function MajorMaintenanceSchedule({ data }) {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('nextDueDateMin');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, overdue, completed
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table or timeline

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [items, searchQuery, sortField, sortDirection, filterStatus]);

  const loadItems = async () => {
    const allItems = await storage.getAllMajorMaintenance();
    setItems(allItems);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    const now = new Date();
    if (filterStatus === 'upcoming') {
      filtered = filtered.filter(item => {
        if (!item.nextDueDateMin) return false;
        const nextDue = new Date(item.nextDueDateMin);
        const yearsUntil = (nextDue - now) / (1000 * 60 * 60 * 24 * 365.25);
        return yearsUntil > 0 && yearsUntil <= 2;
      });
    } else if (filterStatus === 'overdue') {
      filtered = filtered.filter(item => {
        if (!item.nextDueDateMin) return false;
        return new Date(item.nextDueDateMin) < now;
      });
    } else if (filterStatus === 'completed') {
      filtered = filtered.filter(item => item.lastOccurrence);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle nested values
      if (sortField === 'lastAmount') {
        aVal = a.lastOccurrence?.amount || 0;
        bVal = b.lastOccurrence?.amount || 0;
      } else if (sortField === 'lastDate') {
        aVal = a.lastOccurrence?.date || '';
        bVal = b.lastOccurrence?.date || '';
      }

      // Handle nulls
      if (!aVal && bVal) return 1;
      if (aVal && !bVal) return -1;
      if (!aVal && !bVal) return 0;

      // Compare
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    setFilteredItems(filtered);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAdjustment = async (itemId, adjustments) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const updatedItem = {
      ...item,
      manualNextDate: adjustments.manualNextDate || null,
      manualExpectedCost: adjustments.manualExpectedCost || null,
      notes: adjustments.notes
    };

    await storage.saveMajorMaintenanceItem(updatedItem);
    await loadItems();
  };

  const calculateStatus = (item) => {
    // Handle items that are marked as N/A
    if (item.trackingEnabled === false) {
      return { status: 'no-schedule', label: 'N/A', color: 'slate' };
    }

    // Check for nextDueDateMin or alertYear
    if (!item.nextDueDateMin && !item.alertYear) {
      return { status: 'no-schedule', label: 'No Schedule', color: 'slate' };
    }

    const now = new Date();
    let nextDue;

    if (item.manualNextDate) {
      nextDue = new Date(item.manualNextDate);
    } else if (item.nextDueDateMin) {
      nextDue = new Date(item.nextDueDateMin);
    } else if (item.alertYear) {
      // Fallback to alertYear if nextDueDateMin not calculated yet
      nextDue = new Date(`${item.alertYear}-01-01`);
    }

    const yearsUntil = (nextDue - now) / (1000 * 60 * 60 * 24 * 365.25);

    if (yearsUntil < 0) return { status: 'overdue', label: 'Overdue', color: 'rose' };
    if (yearsUntil <= 1) return { status: 'critical', label: 'Due Soon', color: 'rose' };
    if (yearsUntil <= 2) return { status: 'warning', label: 'Upcoming', color: 'amber' };
    return { status: 'good', label: 'Scheduled', color: 'emerald' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Major Maintenance Schedule</h1>
            <p className="text-sm text-slate-600 mt-1">
              View and manage all recurring maintenance items across all years
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Timeline
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Items</option>
            <option value="upcoming">Upcoming (2 years)</option>
            <option value="overdue">Overdue</option>
            <option value="completed">With History</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Total Items</p>
            <p className="text-2xl font-bold text-slate-900">{items.length}</p>
          </div>
          <div className="bg-rose-50 rounded-lg p-4">
            <p className="text-sm text-rose-700 mb-1">Overdue</p>
            <p className="text-2xl font-bold text-rose-600">
              {items.filter(i => calculateStatus(i).status === 'overdue').length}
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-amber-700 mb-1">Upcoming (2 yrs)</p>
            <p className="text-2xl font-bold text-amber-600">
              {items.filter(i => {
                const status = calculateStatus(i).status;
                return status === 'critical' || status === 'warning';
              }).length}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4">
            <p className="text-sm text-emerald-700 mb-1">With History</p>
            <p className="text-2xl font-bold text-emerald-600">
              {items.filter(i => i.lastOccurrence).length}
            </p>
          </div>
        </div>
      </div>

      {/* Content - Table or Timeline */}
      {viewMode === 'timeline' ? (
        <TimelineView items={filteredItems} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    className="text-left px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('name')}
                  >
                    Item Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Recurrence</th>
                  <th
                    className="text-left px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('lastDate')}
                  >
                    Last Done {sortField === 'lastDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left px-4 py-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('nextDueDateMin')}
                  >
                    Next Due {sortField === 'nextDueDateMin' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Expected Cost</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const status = calculateStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-slate-500">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {item.trackingEnabled === false ? (
                            <span className="text-slate-400 italic">N/A</span>
                          ) : item.alertYear ? (
                            `Reminder: ${item.alertYear}`
                          ) : (
                            <span className="text-slate-400 italic">Not set</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.lastOccurrence ? (
                            <>
                              <div className="text-slate-900">
                                {new Date(item.lastOccurrence.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                              </div>
                              <div className="text-slate-500">
                                {formatCurrency(item.lastOccurrence.amount)}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Never</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.nextDueDateMin ? (
                            <>
                              <div className="text-slate-900">
                                {new Date(item.manualNextDate || item.nextDueDateMin).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                              </div>
                              {item.manualNextDate && (
                                <div className="text-xs text-blue-600">Manual override</div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Not scheduled</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="text-slate-900">
                            {formatCurrency(item.manualExpectedCost || item.nextExpectedCost || 0)}
                          </div>
                          {item.manualExpectedCost && (
                            <div className="text-xs text-blue-600">Manual override</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowAdjustmentModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Manual adjustments"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {showAdjustmentModal && selectedItem && (
        <ManualAdjustmentModal
          item={selectedItem}
          onClose={() => {
            setShowAdjustmentModal(false);
            setSelectedItem(null);
          }}
          onSave={handleAdjustment}
        />
      )}
    </div>
  );
}

export default MajorMaintenanceSchedule;
