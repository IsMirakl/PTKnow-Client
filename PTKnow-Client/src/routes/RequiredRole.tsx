import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { normalizeRole } from '../utils/roleUtils';

interface RequiredRoleProps {
  children: React.ReactNode;
  roles: string | string[];
  redirectTo?: string | null;
  fallback?: React.ReactNode;
}

const RequiredRole: React.FC<RequiredRoleProps> = ({
  children,
  roles,
  redirectTo = '/home',
  fallback = null,
}) => {
  const { user, isLoading, isInitialized } = useAuth();

  if (!isInitialized || isLoading) {
    return null;
  }

  if (!user) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{fallback}</>;
  }

  const allowedRoles = Array.isArray(roles)
    ? roles.map(normalizeRole)
    : [normalizeRole(roles)];
  const hasAccess = allowedRoles.includes(normalizeRole(user.role));

  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RequiredRole;
