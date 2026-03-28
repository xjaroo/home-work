import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import KidTasks from './KidTasks.jsx';
import KidBalance from './KidBalance.jsx';
import KidMessages from './KidMessages.jsx';

export default function KidLayout() {
  const { user, family, logout } = useAuth();
  const navigate = useNavigate();
  const familyName = family?.name || 'Home Work';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col min-w-0 overflow-x-hidden pb-20 sm:pb-24">
      <header className="bg-white border-b border-gray-200 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-3 flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
        <Link
          to="/kid"
          className="font-semibold text-gray-800 text-base min-w-0 truncate max-w-[min(100%,11rem)] sm:max-w-[50%] md:max-w-none shrink"
        >
          {familyName}
        </Link>
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <span className="text-sm text-gray-600 max-w-[9rem] truncate">{user?.name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="touch-target inline-flex items-center px-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 rounded-app"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="p-4 sm:p-5 flex-1">
        <Routes>
          <Route index element={<KidTasks />} />
          <Route path="balance" element={<KidBalance />} />
          <Route path="messages" element={<KidMessages />} />
          <Route path="*" element={<Navigate to="/kid" replace />} />
        </Routes>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around safe-area-pb z-10">
        <Link to="/kid" className="touch-target flex flex-1 flex-col items-center justify-center py-3 text-gray-600 hover:text-indigo-600 active:bg-gray-50 text-sm font-medium min-h-[3rem]">
          <span>Tasks</span>
        </Link>
        <Link to="/kid/balance" className="touch-target flex flex-1 flex-col items-center justify-center py-3 text-gray-600 hover:text-indigo-600 active:bg-gray-50 text-sm font-medium min-h-[3rem]">
          <span>Balance</span>
        </Link>
        <Link to="/kid/messages" className="touch-target flex flex-1 flex-col items-center justify-center py-3 text-gray-600 hover:text-indigo-600 active:bg-gray-50 text-sm font-medium min-h-[3rem]">
          <span>Messages</span>
        </Link>
      </nav>
    </div>
  );
}
