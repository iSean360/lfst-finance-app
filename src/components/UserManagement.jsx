/**
 * User Management Component
 * Admin-only interface for managing user roles and permissions
 */

import React, { useState, useEffect } from 'react';
import { Users, Shield, Eye, Edit, Trash2, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import {
  getAllUsers,
  addUser,
  updateUserRole,
  removeUser,
  getUserStats,
  USER_ROLES,
  getCurrentUserId
} from '../services/userService';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const currentUserId = getCurrentUserId();

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, statsData] = await Promise.all([
        getAllUsers(),
        getUserStats()
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (email, role, displayName) => {
    try {
      setError(null);
      await addUser(email, role, displayName);
      setSuccess(`User ${email} added successfully`);
      setShowAddModal(false);
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add user');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setError(null);
      await updateUserRole(userId, newRole);
      setSuccess('User role updated successfully');
      setEditingUser(null);
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleRemoveUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName}? They will lose all access to the system.`)) {
      return;
    }

    try {
      setError(null);
      await removeUser(userId);
      setSuccess(`User ${userName} removed successfully`);
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600 dark:text-slate-400">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage user roles and permissions for LFST</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/40 border-2 border-rose-200 dark:border-rose-700/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900 dark:text-rose-100">Error</p>
            <p className="text-sm text-rose-700 dark:text-rose-200">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/40 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">Success</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-200">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            title="Total Users"
            value={stats.total}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Admins"
            value={stats.admins}
            icon={Shield}
            color="purple"
          />
          <StatCard
            title="Editors"
            value={stats.editors}
            icon={Edit}
            color="emerald"
          />
          <StatCard
            title="Viewers"
            value={stats.viewers}
            icon={Eye}
            color="slate"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={AlertCircle}
            color="amber"
          />
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map(user => (
              <UserRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
                onEditRole={() => setEditingUser(user)}
                onRemove={() => handleRemoveUser(user.id, user.displayName || user.email)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddUser}
        />
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <EditRoleModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateRole}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    slate: 'from-slate-500 to-slate-600',
    amber: 'from-amber-500 to-amber-600'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function UserRow({ user, isCurrentUser, onEditRole, onRemove }) {
  const roleColors = {
    [USER_ROLES.ADMIN]: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50',
    [USER_ROLES.EDITOR]: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50',
    [USER_ROLES.VIEWER]: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
  };

  const roleIcons = {
    [USER_ROLES.ADMIN]: Shield,
    [USER_ROLES.EDITOR]: Edit,
    [USER_ROLES.VIEWER]: Eye
  };

  const RoleIcon = roleIcons[user.role];

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {user.displayName || user.email.split('@')[0]}
            {isCurrentUser && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
          <RoleIcon className="w-3.5 h-3.5" />
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
          user.status === 'active'
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
        }`}>
          {user.status === 'active' ? 'Active' : 'Pending'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onEditRole}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title="Change role"
          >
            <Edit className="w-4 h-4" />
          </button>
          {!isCurrentUser && (
            <button
              onClick={onRemove}
              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
              title="Remove user"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function AddUserModal({ onClose, onSave }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState(USER_ROLES.VIEWER);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter an email address');
      return;
    }
    onSave(email, role, displayName);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add New User</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={USER_ROLES.VIEWER}>Viewer (Read-only)</option>
              <option value={USER_ROLES.EDITOR}>Editor (Can create/edit)</option>
              <option value={USER_ROLES.ADMIN}>Admin (Full access)</option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {role === USER_ROLES.ADMIN && 'Full access including user management'}
              {role === USER_ROLES.EDITOR && 'Can create and edit, but not delete'}
              {role === USER_ROLES.VIEWER && 'Read-only access to all data'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add User
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> The user must sign up separately using this email address. They will appear as "Pending" until they log in for the first time.
          </p>
        </div>
      </div>
    </div>
  );
}

function EditRoleModal({ user, onClose, onSave }) {
  const [role, setRole] = useState(user.role);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === user.role) {
      onClose();
      return;
    }
    onSave(user.id, role);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Change User Role</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <strong>User:</strong> {user.displayName || user.email}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            <strong>Current Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              New Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={USER_ROLES.VIEWER}>Viewer (Read-only)</option>
              <option value={USER_ROLES.EDITOR}>Editor (Can create/edit)</option>
              <option value={USER_ROLES.ADMIN}>Admin (Full access)</option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {role === USER_ROLES.ADMIN && 'Full access including user management'}
              {role === USER_ROLES.EDITOR && 'Can create and edit, but not delete'}
              {role === USER_ROLES.VIEWER && 'Read-only access to all data'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Update Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserManagement;
