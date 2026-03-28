import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to={user.role === 'parent' ? '/parent' : '/kid'} replace />;
  return children;
}
