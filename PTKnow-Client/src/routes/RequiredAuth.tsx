import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

interface RequiredAuthProps {
  children: React.ReactNode;
  redirectTo?: string | null;
  fallback?: React.ReactNode;
}

const RequiredAuth: React.FC<RequiredAuthProps> = ({
  children,
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

  return <>{children}</>;
};

export default RequiredAuth;
