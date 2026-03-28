import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import KidTasks from './KidTasks.jsx';
import KidBalance from './KidBalance.jsx';
import MessagesPage from '../parent/MessagesPage.jsx';

export default function KidLayout() {
  const { user, family, logout, impersonatedBy, stopImpersonation } = useAuth();
  const [returningFromTest, setReturningFromTest] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMessages = location.pathname === '/kid/messages';
  const familyName = family?.name || 'Home Work';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleReturnToAdminSession() {
    setReturningFromTest(true);
    try {
      await stopImpersonation();
      navigate('/admin/users');
    } catch (e) {
      console.error(e);
    } finally {
      setReturningFromTest(false);
    }
  }

  return (
    <div
      className={[
        'min-h-screen bg-gray-50 flex flex-col min-w-0 overflow-x-hidden',
        isMessages ? 'h-dvh max-h-dvh overflow-hidden' : '',
        isMessages ? '' : 'pb-20 sm:pb-24',
      ]
        .filter(Boolean)
        .join(' ')}
    >
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
      {impersonatedBy ? (
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-2.5 bg-amber-100 border-b border-amber-200 text-amber-950 text-sm"
          role="status"
        >
          <span className="min-w-0 leading-snug">
            Testing as <span className="font-semibold">{user?.name}</span>
            <span className="text-amber-800"> — signed in as admin {impersonatedBy.name}</span>
          </span>
          <button
            type="button"
            disabled={returningFromTest}
            onClick={handleReturnToAdminSession}
            className="touch-target shrink-0 px-3 py-2 rounded-app font-medium bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-60"
          >
            {returningFromTest ? 'Returning…' : 'Return to admin'}
          </button>
        </div>
      ) : null}
      <main
        className={
          isMessages
            ? 'flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden p-0'
            : 'p-4 sm:p-5 flex-1 min-w-0'
        }
      >
        <Routes>
          <Route index element={<KidTasks />} />
          <Route path="balance" element={<KidBalance />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="*" element={<Navigate to="/kid" replace />} />
        </Routes>
      </main>
      <nav
        className={[
          'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around safe-area-pb z-10',
          isMessages ? 'hidden' : '',
        ].join(' ')}
        aria-hidden={isMessages}
      >
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
