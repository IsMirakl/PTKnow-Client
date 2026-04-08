import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { normalizeRole } from '../utils/roleUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading, isInitialized } = useAuth();

  if (!isInitialized || isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!requiredRole) {
    return <>{children}</>;
  }

  const userRole = normalizeRole(user.role);
  const hasAccess = Array.isArray(requiredRole)
    ? requiredRole.map(normalizeRole).includes(userRole)
    : userRole === normalizeRole(requiredRole);

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
