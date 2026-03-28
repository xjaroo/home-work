import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import InviteAcceptPage from '../pages/InviteAcceptPage.jsx';
import ParentLayout from '../pages/parent/ParentLayout.jsx';
import KidLayout from '../pages/kid/KidLayout.jsx';
import AdminLayout from '../pages/admin/AdminLayout.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { AdminRoute } from './AdminRoute.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invite/accept" element={<InviteAcceptPage />} />
      <Route
        path="/parent/*"
        element={
          <ProtectedRoute role="parent">
            <ParentLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kid/*"
        element={
          <ProtectedRoute role="kid">
            <KidLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
