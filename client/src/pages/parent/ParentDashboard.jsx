import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { listKids } from '../../api/kids.js';
import { listTasks } from '../../api/tasks.js';
import { getBalance } from '../../api/money.js';

function taskStats(tasks) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const active = tasks.filter((t) => !['done', 'approved', 'archived'].includes(t.status));
  const dueToday = active.filter((t) => t.due_date === today);
  const overdue = active.filter((t) => t.due_date < today);
  const done = tasks.filter((t) => t.status === 'done' || t.status === 'approved');
  const completionRate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  return { dueToday: dueToday.length, overdue: overdue.length, completionRate };
}

export default function ParentDashboard() {
  const [kids, setKids] = useState([]);
  const [tasksByKid, setTasksByKid] = useState({});
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const load = useCallback(async () => {
    try {
      const [kidsList, allTasks] = await Promise.all([listKids(), listTasks()]);
      setKids(kidsList);
      const byKid = {};
      for (const t of allTasks) {
        if (!byKid[t.kid_user_id]) byKid[t.kid_user_id] = [];
        byKid[t.kid_user_id].push(t);
      }
      setTasksByKid(byKid);
      const bal = {};
      for (const k of kidsList) {
        const { balanceCents } = await getBalance(k.id);
        bal[k.id] = balanceCents;
      }
      setBalances(bal);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const onTask = () => {
      listTasks().then((allTasks) => {
        setTasksByKid((prev) => {
          const byKid = {};
          for (const t of allTasks) {
            if (!byKid[t.kid_user_id]) byKid[t.kid_user_id] = [];
            byKid[t.kid_user_id].push(t);
          }
          return byKid;
        });
      });
    };
    socket.on('task:created', onTask);
    socket.on('task:updated', onTask);
    socket.on('task:status_changed', onTask);
    return () => {
      socket.off('task:created', onTask);
      socket.off('task:updated', onTask);
      socket.off('task:status_changed', onTask);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const onBalance = ({ kidId, balanceCents }) => {
      setBalances((b) => ({ ...b, [kidId]: balanceCents }));
    };
    socket.on('money:balance_updated', onBalance);
    return () => socket.off('money:balance_updated', onBalance);
  }, [socket]);

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kids.map((kid) => {
          const tasks = tasksByKid[kid.id] || [];
          const { dueToday, overdue, completionRate } = taskStats(tasks);
          const balanceCents = balances[kid.id] ?? 0;
          return (
            <Link
              key={kid.id}
              to={`/parent/kids/${kid.id}`}
              className="card-app block p-5 hover:border-indigo-300 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 text-base">{kid.name}</h3>
              <ul className="mt-3 text-sm text-gray-600 space-y-1.5">
                <li>Due today: {dueToday}</li>
                <li>Overdue: {overdue}</li>
                <li>Completion: {completionRate}%</li>
                <li>Balance: ${(balanceCents / 100).toFixed(2)}</li>
              </ul>
            </Link>
          );
        })}
      </div>
      {kids.length === 0 && (
        <p className="text-gray-500 text-base">Add kids from the Kids page to get started.</p>
      )}
    </div>
  );
}
