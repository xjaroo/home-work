import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { listTasks, updateTaskStatus, createTask } from '../../api/tasks.js';

function localDateYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const today = new Date().toISOString().slice(0, 10);

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
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => localDateYmd());
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
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

  async function handleCreateTask(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || creatingRef.current) return;
    creatingRef.current = true;
    setCreateError('');
    setCreating(true);
    try {
      await createTask({
        title,
        description: newDescription.trim() || undefined,
        dueDate: newDueDate,
      });
      setNewTitle('');
      setNewDescription('');
      setNewDueDate(localDateYmd());
      setTasks(await listTasks());
    } catch (err) {
      setCreateError(err.message || 'Could not create task');
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
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
              <p className="text-sm text-gray-500 mt-1">
                Due: {t.due_date}
                {t.createdByParentName ? ` · From ${t.createdByParentName}` : ' · Your task'}
              </p>
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
      <section className="card-app p-4 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Add a task</h3>
        {createError && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-app mb-3">{createError}</p>
        )}
        <form onSubmit={handleCreateTask} className="space-y-4">
          <label className="block">
            <span className="text-gray-700 text-sm font-medium">Title</span>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="input-app mt-1.5 w-full"
              placeholder="What do you want to do?"
            />
          </label>
          <label className="block">
            <span className="text-gray-700 text-sm font-medium">Description (optional)</span>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="input-app mt-1.5 w-full min-h-[4rem]"
            />
          </label>
          <label className="block">
            <span className="text-gray-700 text-sm font-medium">Due date</span>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              required
              className="input-app mt-1.5 w-full"
            />
          </label>
          <button type="submit" disabled={creating} className="btn-app-primary w-full sm:w-auto">
            {creating ? 'Adding…' : 'Add task'}
          </button>
        </form>
      </section>
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
