import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { listTasks, updateTaskStatus } from '../../api/tasks.js';

const now = new Date();
const today = now.toISOString().slice(0, 10);

function groupTasks(tasks) {
  const overdue = [];
  const dueToday = [];
  const upcoming = [];
  const done = [];
  for (const t of tasks) {
    if (['done', 'approved', 'archived'].includes(t.status)) {
      done.push(t);
    } else if (t.due_date < today) {
      overdue.push(t);
    } else if (t.due_date === today) {
      dueToday.push(t);
    } else {
      upcoming.push(t);
    }
  }
  return { overdue, dueToday, upcoming, done };
}

export default function KidTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const load = useCallback(async () => {
    try {
      const list = await listTasks();
      setTasks(list);
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
    const onTask = () => load();
    socket.on('task:created', onTask);
    socket.on('task:updated', onTask);
    socket.on('task:status_changed', onTask);
    return () => {
      socket.off('task:created', onTask);
      socket.off('task:updated', onTask);
      socket.off('task:status_changed', onTask);
    };
  }, [socket, load]);

  async function setStatus(taskId, status) {
    await updateTaskStatus(taskId, status);
    setTasks(await listTasks());
  }

  if (loading) return <p className="text-gray-500 text-base">Loading...</p>;

  const { overdue, dueToday, upcoming, done } = groupTasks(tasks);

  function TaskList({ list, title, statusColor }) {
    if (list.length === 0) return null;
    return (
      <section className="mb-6">
        <h3 className={`text-base font-semibold mb-3 ${statusColor || 'text-gray-800'}`}>{title}</h3>
        <ul className="space-y-3">
          {list.map((t) => (
            <li key={t.id} className="card-app p-4">
              <p className="font-medium text-gray-900 text-base">{t.title}</p>
              {t.description && <p className="text-sm text-gray-600 mt-1">{t.description}</p>}
              <p className="text-sm text-gray-500 mt-1">Due: {t.due_date}{t.createdByParentName ? ` · From ${t.createdByParentName}` : ''}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.status === 'todo' && (
                  <button
                    type="button"
                    onClick={() => setStatus(t.id, 'in_progress')}
                    className="btn-app btn-app-primary text-sm"
                  >
                    Start
                  </button>
                )}
                {t.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => setStatus(t.id, 'done')}
                    className="touch-target min-h-[2.75rem] rounded-app px-4 py-3 text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">My Tasks</h2>
      <TaskList list={overdue} title="Overdue" statusColor="text-red-600" />
      <TaskList list={dueToday} title="Today" statusColor="text-amber-600" />
      <TaskList list={upcoming} title="Upcoming" />
      <TaskList list={done} title="Done" />
      {tasks.length === 0 && (
        <p className="text-gray-500">No tasks yet.</p>
      )}
    </div>
  );
}
