import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import AdminUsersPage from './AdminUsersPage.jsx';

export default function AdminLayout() {
  const { user, logout, isParent, isKid } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const appHome = isParent ? '/parent' : isKid ? '/kid' : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold truncate">Admin</span>
          <span className="text-slate-400 text-sm truncate hidden sm:inline">{user?.email}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(isParent || isKid) && (
            <Link
              to={appHome}
              className="touch-target inline-flex items-center px-3 py-2 text-sm font-medium text-slate-200 hover:text-white rounded-app border border-slate-600 hover:border-slate-500"
            >
              Open app
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="touch-target inline-flex items-center px-3 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 rounded-app"
          >
            Log out
          </button>
        </div>
      </header>
      <nav className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2">
        <Link
          to="/admin/users"
          className="touch-target inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 rounded-app px-3 -mx-1"
        >
          Users
        </Link>
      </nav>
      <main className="flex-1 p-3 sm:p-5 min-w-0 safe-area-pb">
        <Routes>
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="" element={<Navigate to="users" replace />} />
          <Route path="*" element={<Navigate to="users" replace />} />
        </Routes>
      </main>
    </div>
  );
}
