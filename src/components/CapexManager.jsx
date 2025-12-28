import React, { useState } from 'react';
import { X, Plus, Save, Trash2, CheckCircle, Edit2, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency, getFiscalMonthName } from '../utils/helpers';
import storage from '../services/storage';
import CurrencyInput from './CurrencyInput';

// Helper function to calculate alert status
const getAlertStatus = (project) => {
  if (!project.alertYear || project.trackingEnabled === false) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const yearsUntil = project.alertYear - currentYear;

  if (yearsUntil <= 0) {
    return { status: 'overdue', yearsUntil: 0, alertYear: project.alertYear };
  } else if (yearsUntil <= 1) {
    return { status: 'critical', yearsUntil, alertYear: project.alertYear };
  } else if (yearsUntil <= 2) {
    return { status: 'warning', yearsUntil, alertYear: project.alertYear };
  } else {
    return { status: 'good', yearsUntil, alertYear: project.alertYear };
  }
};

function CapexManager({ projects, fiscalYear, budget, onSave, onClose }) {
  const [projectList, setProjectList] = useState(projects || []);
  const [editingProject, setEditingProject] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleAddNew = () => {
    setEditingProject({
      id: null,
      name: '',
      description: '',
      amount: 0,
      month: 0,
      fiscalYear,
      completed: false,
      completedDate: null,
      actualAmount: null,
      alertYear: null, // Year when user wants to be reminded for replacement
      trackingEnabled: true, // Controls whether to track and show alerts
      notes: ''
    });
    setShowForm(true);
  };

  const handleEdit = (project) => {
    setEditingProject({ ...project });
    setShowForm(true);
  };

  const handleDelete = async (projectId) => {
    const project = projectList.find(p => p.id === projectId);
    const hasTransactions = project?.linkedTransactions && project.linkedTransactions.length > 0;

    if (window.confirm('Are you sure you want to delete this project? This will also remove it from the budget and delete any associated transactions.')) {
      // Delete linked transactions if they exist
      if (hasTransactions) {
        for (const txn of project.linkedTransactions) {
          try {
            await storage.deleteTransaction(txn.id, fiscalYear);
            console.log('✅ Deleted linked transaction:', txn.id);
          } catch (error) {
            console.error('❌ Error deleting linked transaction:', error);
          }
        }
      }

      // Delete from storage
      await storage.deleteCapexProject(fiscalYear, projectId);

      // Update local state
      const updated = projectList.filter(p => p.id !== projectId);
      setProjectList(updated);

      // Update budget to recalculate CAPEX without this project
      if (budget) {
        const updatedBudget = { ...budget };

        // Recalculate CAPEX for all months based on remaining projects
        updatedBudget.monthlyBudgets.forEach(month => {
          month.capex = 0;
        });

        updated.forEach(project => {
          if (project.month !== null && project.month !== undefined) {
            updatedBudget.monthlyBudgets[project.month].capex += project.amount;
          }
        });

        await storage.saveBudget(updatedBudget);
      }

      console.log('✅ CAPEX project deleted successfully');
    }
  };

  const handleSaveProject = async () => {
    const errors = [];

    if (!editingProject.name || editingProject.name.trim() === '') {
      errors.push('Project name is required');
    }

    if (!editingProject.amount || editingProject.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const projectToSave = {
      ...editingProject,
      id: editingProject.id || `capex_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };

    if (!editingProject.id) {
      projectToSave.createdAt = new Date().toISOString();
    }

    const existingIndex = projectList.findIndex(p => p.id === projectToSave.id);
    let updated;

    if (existingIndex >= 0) {
      updated = [...projectList];
      updated[existingIndex] = projectToSave;
    } else {
      updated = [...projectList, projectToSave];
    }

    setProjectList(updated);
    setShowForm(false);
    setEditingProject(null);
  };


  const handleSaveAll = () => {
    // Save all projects to storage
    projectList.forEach(project => {
      console.log('💾 Saving CAPEX project:', project.name, 'Month:', project.month);
      storage.saveCapexProject(project);
    });

    // Update budget CAPEX values based on project assignments
    if (budget) {
      const updatedBudget = { ...budget };

      // Reset all CAPEX values to 0
      updatedBudget.monthlyBudgets.forEach(month => {
        month.capex = 0;
      });

      // Calculate total CAPEX per month from projects
      projectList.forEach(project => {
        if (project.month !== null && project.month !== undefined) {
          updatedBudget.monthlyBudgets[project.month].capex += project.amount;
        }
      });

      // Save updated budget
      storage.saveBudget(updatedBudget);
    }

    onSave(projectList);
  };

  const totalPlanned = projectList.filter(p => !p.completed).reduce((sum, p) => sum + p.amount, 0);
  const totalCompleted = projectList.filter(p => p.completed).reduce((sum, p) => sum + (p.actualAmount || p.amount), 0);
  const totalVariance = projectList.filter(p => p.completed).reduce((sum, p) => {
    return sum + ((p.actualAmount || p.amount) - p.amount);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">CAPEX Project Manager</h2>
              <p className="text-sm text-slate-600">Fiscal Year {fiscalYear}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-slate-600 mb-1">Planned (Pending)</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPlanned)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {projectList.filter(p => !p.completed).length} project{projectList.filter(p => !p.completed).length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs text-slate-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCompleted)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {projectList.filter(p => p.completed).length} project{projectList.filter(p => p.completed).length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className={`${totalVariance >= 0 ? 'bg-rose-50' : 'bg-emerald-50'} rounded-xl p-4`}>
                <p className="text-xs text-slate-600 mb-1">Variance</p>
                <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Actual vs Planned</p>
              </div>
            </div>

            {/* Add New Button */}
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New CAPEX Project
              </button>
            )}

            {/* Project Form */}
            {showForm && (
              <div className="bg-slate-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-4">
                  {editingProject.id ? 'Edit Project' : 'New Project'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={editingProject.name}
                      onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Pool Pump House Upgrade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingProject.description}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Brief description of the project..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Planned Amount *
                      </label>
                      <CurrencyInput
                        value={editingProject.amount}
                        onChange={(value) => setEditingProject({ ...editingProject, amount: value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Planned Month *
                      </label>
                      <select
                        value={editingProject.month}
                        onChange={(e) => setEditingProject({ ...editingProject, month: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const monthInfo = getFiscalMonthName(i, fiscalYear);
                          return (
                            <option key={i} value={i}>
                              {monthInfo.monthName} ({monthInfo.calendarDate})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Replacement Reminder - Always show for planning purposes */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Replacement Planning
                    </h4>

                    {/* N/A Option */}
                    <div className="mb-4 pb-4 border-b border-amber-300">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={editingProject.trackingEnabled === false}
                          onChange={(e) => {
                            const isNA = e.target.checked;
                            setEditingProject({
                              ...editingProject,
                              trackingEnabled: !isNA,
                              // Clear alert year when marked as N/A
                              alertYear: isNA ? null : editingProject.alertYear
                            });
                          }}
                          className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-2 focus:ring-slate-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                            N/A - No tracking needed
                          </span>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Check this if this asset doesn't need replacement tracking or alerts
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Replacement Planning (disabled when N/A is checked) */}
                    <div className={editingProject.trackingEnabled === false ? 'opacity-50 pointer-events-none' : ''}>
                      {/* Reminder Year */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Reminder Year
                        </label>
                        <input
                          type="number"
                          min={new Date().getFullYear() + 1}
                          max={new Date().getFullYear() + 100}
                          value={editingProject.alertYear || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, alertYear: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`e.g., ${new Date().getFullYear() + 10}`}
                          disabled={editingProject.trackingEnabled === false}
                        />
                        <p className="text-xs text-slate-600 mt-2">
                          Set the year when you want to be reminded to plan for replacement
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Show completion status (read-only) */}
                  {editingProject.completed && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-sm text-emerald-900">
                        <strong>Status:</strong> Completed via linked transaction{editingProject.linkedTransactions?.length > 1 ? 's' : ''}
                        {editingProject.completedDate && (
                          <span> on {new Date(editingProject.completedDate).toLocaleDateString()}</span>
                        )}
                      </p>
                      {editingProject.actualAmount && (
                        <p className="text-sm text-emerald-900 mt-1">
                          <strong>Total Spent:</strong> {formatCurrency(editingProject.actualAmount)}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={editingProject.notes}
                      onChange={(e) => setEditingProject({ ...editingProject, notes: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="2"
                      placeholder="Additional notes or approval details..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingProject(null);
                      }}
                      className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProject}
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Project
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Project List */}
            <div>
              <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-3">
                All Projects ({projectList.length})
              </h3>

              {projectList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 mb-2">No CAPEX projects yet</p>
                  <p className="text-sm text-slate-400">Click "Add New CAPEX Project" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectList
                    .sort((a, b) => {
                      if (a.completed !== b.completed) return a.completed ? 1 : -1;
                      return a.month - b.month;
                    })
                    .map((project) => {
                      const monthInfo = getFiscalMonthName(project.month, fiscalYear);
                      const variance = project.completed && project.actualAmount
                        ? project.actualAmount - project.amount
                        : 0;
                      const alertStatus = getAlertStatus(project);

                      return (
                        <div
                          key={project.id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            project.completed
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-white border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {project.completed && (
                                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                )}
                                <h4 className="font-semibold text-slate-900">{project.name}</h4>
                                {alertStatus && alertStatus.status === 'overdue' && (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Replacement Overdue
                                  </span>
                                )}
                                {alertStatus && alertStatus.status === 'critical' && (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {alertStatus.yearsUntil} year{alertStatus.yearsUntil !== 1 ? 's' : ''} until reminder
                                  </span>
                                )}
                                {alertStatus && alertStatus.status === 'warning' && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {alertStatus.yearsUntil} year{alertStatus.yearsUntil > 1 ? 's' : ''} until reminder
                                  </span>
                                )}
                              </div>

                              {project.description && (
                                <p className="text-sm text-slate-600 mb-2">{project.description}</p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                <span>📅 {monthInfo.monthName} {monthInfo.calendarDate.split('-')[0]}</span>
                                <span>💰 Planned: {formatCurrency(project.amount)}</span>
                                {project.completed && project.actualAmount && (
                                  <span className={variance !== 0 ? (variance > 0 ? 'text-rose-600' : 'text-emerald-600') : ''}>
                                    ✓ Actual: {formatCurrency(project.actualAmount)}
                                    {variance !== 0 && (
                                      <span className="ml-1">
                                        ({variance > 0 ? '+' : ''}{formatCurrency(variance)})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>

                              {project.notes && (
                                <p className="text-xs text-slate-500 mt-2 italic">Note: {project.notes}</p>
                              )}

                              {project.completed && project.trackingEnabled === false && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <div className="text-xs text-slate-400 italic">
                                    <p>Replacement Reminder: N/A - No tracking</p>
                                  </div>
                                </div>
                              )}
                              {alertStatus && project.trackingEnabled !== false && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <div className="text-xs text-slate-600">
                                    <p className="font-medium">Replacement Planning:</p>
                                    <p className="mt-1">
                                      📆 Reminder Year: {alertStatus.alertYear}
                                    </p>
                                    {alertStatus.yearsUntil > 0 && (
                                      <p className={`font-semibold ${
                                        alertStatus.status === 'critical' ? 'text-rose-600' :
                                        alertStatus.status === 'warning' ? 'text-amber-600' : 'text-slate-600'
                                      }`}>
                                        {alertStatus.yearsUntil} year{alertStatus.yearsUntil !== 1 ? 's' : ''} until reminder
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-xl font-bold text-slate-900">
                                  {formatCurrency(project.completed ? (project.actualAmount || project.amount) : project.amount)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {project.completed ? 'Completed' : 'Planned'}
                                </p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleEdit(project)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Edit project"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(project.id)}
                                  className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                  title="Delete project"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CapexManager;
