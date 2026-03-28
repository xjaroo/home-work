import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ParentDashboard from './ParentDashboard.jsx';
import KidsList from './KidsList.jsx';
import KidForm from './KidForm.jsx';
import KidDetail from './KidDetail.jsx';
import CreateTask from './CreateTask.jsx';
import MessagesPage from './MessagesPage.jsx';
import NotificationsPage from './NotificationsPage.jsx';
import InviteParent from './InviteParent.jsx';
import ParentProfile from './ParentProfile.jsx';

const MORE_ROUTES = ['/parent/messages', '/parent/notifications', '/parent/invite', '/parent/admin'];

function mobileTabClass(isActive) {
  return [
    'touch-target flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium min-h-[3rem] min-w-0 transition-colors rounded-app',
    isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600 active:bg-gray-50',
  ].join(' ');
}

export default function ParentLayout() {
  const { user, family, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMessages = location.pathname.includes('/messages');
  const familyName = family?.name || 'Home Work';
  const showMobileBottomNav = !isMessages;
  const moreTabActive = MORE_ROUTES.some((p) => location.pathname === p);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div
      className={[
        'min-h-screen bg-gray-50 flex flex-col min-w-0 overflow-x-hidden',
        showMobileBottomNav ? 'pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0' : '',
      ].join(' ')}
    >
      <header className="bg-white border-b border-gray-200 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-3 flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
        <Link
          to="/parent"
          className="font-semibold text-gray-800 text-base min-w-0 truncate max-w-[min(100%,11rem)] sm:max-w-[50%] md:max-w-none shrink"
        >
          {familyName}
        </Link>
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <Link
            to="/parent/profile"
            className="touch-target inline-flex items-center px-2 text-sm text-gray-600 hover:text-indigo-600 rounded-app max-w-[9rem] truncate"
          >
            {user?.name}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="touch-target inline-flex items-center px-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 rounded-app whitespace-nowrap"
          >
            Log out
          </button>
        </div>
      </header>
      <nav
        className={[
          'bg-white border-b border-gray-200 overflow-x-auto overscroll-x-contain scrollbar-hide touch-pan-x snap-x snap-proximity md:snap-none md:overflow-visible',
          !isMessages ? 'max-md:hidden' : '',
          'md:block',
        ].join(' ')}
        aria-label="Primary"
      >
        <div className="flex gap-1 py-2 min-w-max pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] md:px-3 md:min-w-0 md:flex-wrap">
          <NavLink
            to="/parent"
            end
            className={({ isActive }) =>
              [
                'touch-target inline-flex shrink-0 snap-start items-center px-3 sm:px-4 py-3 text-sm font-medium rounded-app whitespace-nowrap',
                isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
              ].join(' ')
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/parent/kids"
            className={({ isActive }) =>
              [
                'touch-target inline-flex shrink-0 snap-start items-center px-3 sm:px-4 py-3 text-sm font-medium rounded-app whitespace-nowrap',
                isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
              ].join(' ')
            }
          >
            Kids
          </NavLink>
          <NavLink
            to="/parent/tasks/new"
            className={({ isActive }) =>
              [
                'touch-target inline-flex shrink-0 snap-start items-center px-3 sm:px-4 py-3 text-sm font-medium rounded-app whitespace-nowrap',
                isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
              ].join(' ')
            }
          >
            New task
          </NavLink>
          <NavLink
            to="/parent/messages"
            className={({ isActive }) =>
              [
                'touch-target inline-flex shrink-0 snap-start items-center px-3 sm:px-4 py-3 text-sm font-medium rounded-app whitespace-nowrap',
                isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
              ].join(' ')
            }
          >
            Messages
          </NavLink>
          <NavLink
            to="/parent/notifications"
            className={({ isActive }) =>
              [
                'touch-target inline-flex shrink-0 snap-start items-center px-3 sm:px-4 py-3 text-sm font-medium rounded-app whitespace-nowrap',
                isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
              ].join(' ')
            }
          >
            Notifications
          </NavLink>
          <NavLink
            to="/parent/invite"
            className={({ isActive }) =>
              [
                'touch-target inline-flex shrink-0 snap-start items-center px-3 sm:px-4 py-3 text-sm font-medium rounded-app whitespace-nowrap',
                isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
              ].join(' ')
            }
          >
            Invite partner
          </NavLink>
          {isAdmin ? (
            <NavLink
              to="/parent/admin"
              className={({ isActive }) =>
                [
                  'touch-target inline-flex shrink-0 snap-start items-center px-3 sm:px-4 py-3 text-sm font-medium rounded-app whitespace-nowrap',
                  isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
                ].join(' ')
              }
            >
              Admin
            </NavLink>
          ) : null}
        </div>
      </nav>
      {showMobileBottomNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-gray-200 bg-white md:hidden pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] safe-area-pb"
          aria-label="Mobile primary"
        >
          <NavLink to="/parent" end className={({ isActive }) => mobileTabClass(isActive)}>
            Home
          </NavLink>
          <NavLink to="/parent/kids" className={({ isActive }) => mobileTabClass(isActive)}>
            Kids
          </NavLink>
          <NavLink to="/parent/tasks/new" className={({ isActive }) => mobileTabClass(isActive)}>
            New task
          </NavLink>
          <button
            type="button"
            className={mobileTabClass(moreTabActive)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="More navigation"
            onClick={() => setMoreOpen((o) => !o)}
          >
            More
          </button>
        </nav>
      )}
      {moreOpen && showMobileBottomNav && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-app-lg border-t border-gray-200 bg-white shadow-lg md:hidden safe-area-pb max-h-[min(70vh,24rem)] flex flex-col"
            role="dialog"
            aria-label="More links"
          >
            <div className="flex justify-center pt-2 pb-1">
              <span className="h-1 w-10 rounded-full bg-gray-300" aria-hidden />
            </div>
            <ul className="overflow-y-auto px-3 pb-3 pt-1 space-y-1">
              <li>
                <Link
                  to="/parent/messages"
                  className="touch-target flex w-full items-center rounded-app px-4 py-3 text-base font-medium text-gray-800 hover:bg-indigo-50"
                  onClick={() => setMoreOpen(false)}
                >
                  Messages
                </Link>
              </li>
              <li>
                <Link
                  to="/parent/notifications"
                  className="touch-target flex w-full items-center rounded-app px-4 py-3 text-base font-medium text-gray-800 hover:bg-indigo-50"
                  onClick={() => setMoreOpen(false)}
                >
                  Notifications
                </Link>
              </li>
              <li>
                <Link
                  to="/parent/invite"
                  className="touch-target flex w-full items-center rounded-app px-4 py-3 text-base font-medium text-gray-800 hover:bg-indigo-50"
                  onClick={() => setMoreOpen(false)}
                >
                  Invite partner
                </Link>
              </li>
              {isAdmin ? (
                <li>
                  <Link
                    to="/parent/admin"
                    className="touch-target flex w-full items-center rounded-app px-4 py-3 text-base font-medium text-gray-800 hover:bg-indigo-50"
                    onClick={() => setMoreOpen(false)}
                  >
                    Admin
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        </>
      )}
      <main
        className={
          isMessages
            ? 'flex-1 flex flex-col min-h-0 min-w-0 p-0'
            : 'p-4 sm:p-5 flex-1 min-w-0'
        }
      >
        <Routes>
          <Route index element={<ParentDashboard />} />
          <Route path="kids" element={<KidsList />} />
          <Route path="kids/new" element={<KidForm />} />
          <Route path="kids/:kidId" element={<KidDetail />} />
          <Route path="tasks/new" element={<CreateTask />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="invite" element={<InviteParent />} />
          <Route path="profile" element={<ParentProfile />} />
          <Route path="admin/*" element={<Navigate to="/admin/users" replace />} />
          <Route path="*" element={<Navigate to="/parent" replace />} />
        </Routes>
      </main>
    </div>
  );
}
