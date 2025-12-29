/**
 * Permission Guard Components
 * Conditionally render UI elements based on user permissions
 */

import React, { useState, useEffect } from 'react';
import { hasPermission, PERMISSIONS } from '../services/userService';

/**
 * Permission Guard - Hides content if user doesn't have permission
 *
 * @param {string} permission - Required permission (from PERMISSIONS)
 * @param {React.ReactNode} children - Content to conditionally render
 * @param {React.ReactNode} fallback - Optional content to show when permission denied
 * @param {boolean} showFallback - Whether to show fallback or nothing (default: nothing)
 */
export function PermissionGuard({ permission, children, fallback = null, showFallback = false }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      setLoading(true);
      const allowed = await hasPermission(permission);
      setHasAccess(allowed);
      setLoading(false);
    };

    checkPermission();
  }, [permission]);

  if (loading) {
    return null; // Or a loading spinner if desired
  }

  if (!hasAccess) {
    return showFallback ? fallback : null;
  }

  return <>{children}</>;
}

/**
 * Permission Button - Disables button if user doesn't have permission
 *
 * @param {string} permission - Required permission
 * @param {function} onClick - Click handler
 * @param {string} className - CSS classes
 * @param {React.ReactNode} children - Button content
 * @param {boolean} disabled - Additional disabled state
 * @param {string} disabledTitle - Tooltip when disabled due to permissions
 */
export function PermissionButton({
  permission,
  onClick,
  className = '',
  children,
  disabled = false,
  disabledTitle = 'You don\'t have permission to perform this action',
  ...props
}) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      setLoading(true);
      const allowed = await hasPermission(permission);
      setHasAccess(allowed);
      setLoading(false);
    };

    checkPermission();
  }, [permission]);

  const isDisabled = disabled || !hasAccess || loading;
  const title = !hasAccess && !disabled ? disabledTitle : props.title;

  return (
    <button
      onClick={onClick}
      className={className}
      disabled={isDisabled}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Multiple Permission Guard - Requires ALL specified permissions
 *
 * @param {string[]} permissions - Array of required permissions
 * @param {React.ReactNode} children - Content to conditionally render
 * @param {React.ReactNode} fallback - Optional fallback content
 */
export function MultiPermissionGuard({ permissions = [], children, fallback = null }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      setLoading(true);
      const results = await Promise.all(
        permissions.map(permission => hasPermission(permission))
      );
      const allAllowed = results.every(allowed => allowed === true);
      setHasAccess(allAllowed);
      setLoading(false);
    };

    if (permissions.length > 0) {
      checkPermissions();
    } else {
      setHasAccess(true);
      setLoading(false);
    }
  }, [permissions]);

  if (loading) {
    return null;
  }

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Any Permission Guard - Requires ANY of the specified permissions
 *
 * @param {string[]} permissions - Array of permissions (user needs at least one)
 * @param {React.ReactNode} children - Content to conditionally render
 * @param {React.ReactNode} fallback - Optional fallback content
 */
export function AnyPermissionGuard({ permissions = [], children, fallback = null }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      setLoading(true);
      const results = await Promise.all(
        permissions.map(permission => hasPermission(permission))
      );
      const anyAllowed = results.some(allowed => allowed === true);
      setHasAccess(anyAllowed);
      setLoading(false);
    };

    if (permissions.length > 0) {
      checkPermissions();
    } else {
      setHasAccess(false);
      setLoading(false);
    }
  }, [permissions]);

  if (loading) {
    return null;
  }

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Hook to check permission programmatically
 *
 * @param {string} permission - Permission to check
 * @returns {object} { hasAccess: boolean, loading: boolean }
 */
export function usePermission(permission) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      setLoading(true);
      const allowed = await hasPermission(permission);
      setHasAccess(allowed);
      setLoading(false);
    };

    checkPermission();
  }, [permission]);

  return { hasAccess, loading };
}

export default PermissionGuard;
