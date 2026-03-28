import React, { useState, useEffect } from 'react';
import { listNotifications, markNotificationRead } from '../../api/notifications.js';
import { formatNotificationDisplay } from '../../utils/notificationFormat.js';

export default function NotificationsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listNotifications()
      .then(setList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkRead(id) {
    await markNotificationRead(id);
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
  }

  if (loading) return <p className="text-gray-500 text-base">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Notifications</h2>
      <ul className="space-y-3">
        {list.map((n) => {
          const { title, body } = formatNotificationDisplay(n.type, n.payload_json);
          return (
            <li
              key={n.id}
              className={`card-app p-4 ${n.read_at ? 'bg-gray-50/50 border-gray-200' : 'border-indigo-200'}`}
            >
              <p className="text-base font-medium text-gray-900">{title}</p>
              {body ? (
                <p className="text-sm text-gray-600 mt-1 break-words">{body}</p>
              ) : null}
              <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              {!n.read_at && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n.id)}
                  className="touch-target mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 min-h-[2.75rem]"
                >
                  Mark read
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p className="text-gray-500 text-base">No notifications.</p>}
    </div>
  );
}
