/**
 * User Service - Role-Based Access Control (RBAC)
 * Manages user roles and permissions for the LFST club financial system
 */

import { db, auth } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Club ID - all users belong to the same club
const CLUB_ID = 'lfst';

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',      // Full access: create, read, update, delete, manage users
  EDITOR: 'editor',    // Can create/edit but not delete critical data
  VIEWER: 'viewer'     // Read-only access
};

// Permissions
export const PERMISSIONS = {
  // Data operations
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',

  // User management
  MANAGE_USERS: 'manage_users',

  // Financial operations
  APPROVE_BUDGET: 'approve_budget',
  PROCESS_REFUND: 'process_refund',
  DELETE_TRANSACTION: 'delete_transaction'
};

// Role-Permission Matrix
const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.CREATE,
    PERMISSIONS.READ,
    PERMISSIONS.UPDATE,
    PERMISSIONS.DELETE,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.APPROVE_BUDGET,
    PERMISSIONS.PROCESS_REFUND,
    PERMISSIONS.DELETE_TRANSACTION
  ],
  [USER_ROLES.EDITOR]: [
    PERMISSIONS.CREATE,
    PERMISSIONS.READ,
    PERMISSIONS.UPDATE,
    PERMISSIONS.APPROVE_BUDGET,
    PERMISSIONS.PROCESS_REFUND
  ],
  [USER_ROLES.VIEWER]: [
    PERMISSIONS.READ
  ]
};

/**
 * Get the current logged-in user's ID
 */
export const getCurrentUserId = () => {
  return auth.currentUser?.uid || null;
};

/**
 * Get the current logged-in user's email
 */
export const getCurrentUserEmail = () => {
  return auth.currentUser?.email || null;
};

/**
 * Get the current logged-in user's role
 * @returns {Promise<string|null>} User role or null if not found
 */
export const getCurrentUserRole = async () => {
  const userId = getCurrentUserId();
  if (!userId) return null;

  try {
    const userDoc = await getDoc(doc(db, `clubs/${CLUB_ID}/users`, userId));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Get user data by user ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User data or null
 */
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, `clubs/${CLUB_ID}/users`, userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Check if current user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>} True if user has permission
 */
export const hasPermission = async (permission) => {
  const role = await getCurrentUserRole();
  if (!role) return false;

  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if current user is admin
 * @returns {Promise<boolean>}
 */
export const isAdmin = async () => {
  const role = await getCurrentUserRole();
  return role === USER_ROLES.ADMIN;
};

/**
 * Check if current user is editor or higher
 * @returns {Promise<boolean>}
 */
export const canEdit = async () => {
  const role = await getCurrentUserRole();
  return role === USER_ROLES.ADMIN || role === USER_ROLES.EDITOR;
};

/**
 * Get all users in the club (admin only)
 * @returns {Promise<Array>} List of users
 */
export const getAllUsers = async () => {
  if (!await isAdmin()) {
    throw new Error('Only admins can view all users');
  }

  try {
    const usersSnapshot = await getDocs(collection(db, `clubs/${CLUB_ID}/users`));
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

/**
 * Add a new user to the club (admin only)
 * @param {string} email - User email
 * @param {string} role - User role (admin, editor, viewer)
 * @param {string} displayName - User display name
 * @returns {Promise<object>} Created user data
 */
export const addUser = async (email, role, displayName = '') => {
  if (!await isAdmin()) {
    throw new Error('Only admins can add users');
  }

  if (!Object.values(USER_ROLES).includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  try {
    // Note: This creates a user record, but the user must sign up separately
    // In a full implementation, you'd send an invitation email
    const userId = email.replace(/[^a-zA-Z0-9]/g, '_'); // Create safe ID from email
    const userData = {
      email,
      displayName: displayName || email.split('@')[0],
      role,
      status: 'pending', // pending until they sign in
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUserId()
    };

    await setDoc(doc(db, `clubs/${CLUB_ID}/users`, userId), userData);

    console.log('✅ User added:', email, 'with role:', role);
    return { id: userId, ...userData };
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

/**
 * Update user role (admin only)
 * @param {string} userId - User ID to update
 * @param {string} newRole - New role
 * @returns {Promise<void>}
 */
export const updateUserRole = async (userId, newRole) => {
  if (!await isAdmin()) {
    throw new Error('Only admins can update user roles');
  }

  if (!Object.values(USER_ROLES).includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }

  // Prevent removing last admin
  if (newRole !== USER_ROLES.ADMIN) {
    const users = await getAllUsers();
    const adminCount = users.filter(u => u.role === USER_ROLES.ADMIN).length;
    const targetUser = users.find(u => u.id === userId);

    if (adminCount === 1 && targetUser?.role === USER_ROLES.ADMIN) {
      throw new Error('Cannot remove the last admin. Promote another user to admin first.');
    }
  }

  try {
    await updateDoc(doc(db, `clubs/${CLUB_ID}/users`, userId), {
      role: newRole,
      updatedAt: new Date().toISOString(),
      updatedBy: getCurrentUserId()
    });

    console.log('✅ User role updated:', userId, 'to', newRole);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Remove user from club (admin only)
 * @param {string} userId - User ID to remove
 * @returns {Promise<void>}
 */
export const removeUser = async (userId) => {
  if (!await isAdmin()) {
    throw new Error('Only admins can remove users');
  }

  // Prevent removing last admin
  const users = await getAllUsers();
  const adminCount = users.filter(u => u.role === USER_ROLES.ADMIN).length;
  const targetUser = users.find(u => u.id === userId);

  if (adminCount === 1 && targetUser?.role === USER_ROLES.ADMIN) {
    throw new Error('Cannot remove the last admin');
  }

  // Prevent self-removal
  if (userId === getCurrentUserId()) {
    throw new Error('Cannot remove yourself. Have another admin remove you.');
  }

  try {
    await deleteDoc(doc(db, `clubs/${CLUB_ID}/users`, userId));
    console.log('✅ User removed:', userId);
  } catch (error) {
    console.error('Error removing user:', error);
    throw error;
  }
};

/**
 * Initialize user in database on first login
 * Should be called after successful authentication
 * @param {string} userId - Firebase Auth UID
 * @param {string} email - User email
 * @param {string} displayName - User display name
 * @returns {Promise<object>} User data
 */
export const initializeUser = async (userId, email, displayName = '') => {
  try {
    const userDoc = await getDoc(doc(db, `clubs/${CLUB_ID}/users`, userId));

    if (userDoc.exists()) {
      // User exists - update status to active if pending
      const userData = userDoc.data();
      if (userData.status === 'pending') {
        await updateDoc(doc(db, `clubs/${CLUB_ID}/users`, userId), {
          status: 'active',
          lastLoginAt: new Date().toISOString()
        });
      }
      return { id: userId, ...userData };
    } else {
      // First time user - create as viewer by default
      // Admin must upgrade their role manually
      const userData = {
        email,
        displayName: displayName || email.split('@')[0],
        role: USER_ROLES.VIEWER,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      await setDoc(doc(db, `clubs/${CLUB_ID}/users`, userId), userData);
      console.log('✅ New user initialized as viewer:', email);
      return { id: userId, ...userData };
    }
  } catch (error) {
    console.error('Error initializing user:', error);
    throw error;
  }
};

/**
 * Get user statistics
 * @returns {Promise<object>} User stats
 */
export const getUserStats = async () => {
  try {
    const users = await getAllUsers();
    return {
      total: users.length,
      admins: users.filter(u => u.role === USER_ROLES.ADMIN).length,
      editors: users.filter(u => u.role === USER_ROLES.EDITOR).length,
      viewers: users.filter(u => u.role === USER_ROLES.VIEWER).length,
      active: users.filter(u => u.status === 'active').length,
      pending: users.filter(u => u.status === 'pending').length
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      total: 0,
      admins: 0,
      editors: 0,
      viewers: 0,
      active: 0,
      pending: 0
    };
  }
};

export default {
  USER_ROLES,
  PERMISSIONS,
  getCurrentUserId,
  getCurrentUserEmail,
  getCurrentUserRole,
  getUserById,
  hasPermission,
  isAdmin,
  canEdit,
  getAllUsers,
  addUser,
  updateUserRole,
  removeUser,
  initializeUser,
  getUserStats
};
