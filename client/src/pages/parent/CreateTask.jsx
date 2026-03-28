import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listKids } from '../../api/kids.js';
import { createTask } from '../../api/tasks.js';

function localDateYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CreateTask() {
  const [searchParams] = useSearchParams();
  const defaultKidId = searchParams.get('kidId') || '';
  const [kids, setKids] = useState([]);
  const [kidId, setKidId] = useState(defaultKidId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => localDateYmd());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listKids().then(setKids).catch(console.error);
  }, []);

  useEffect(() => {
    if (defaultKidId) setKidId(defaultKidId);
  }, [defaultKidId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createTask({ kidId, title, description: description || undefined, dueDate });
      navigate('/parent');
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">New task</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-app">{error}</p>
        )}
        <label className="block">
          <span className="text-gray-700 text-sm font-medium">Assign to</span>
          <select
            value={kidId}
            onChange={(e) => setKidId(e.target.value)}
            required
            className="input-app mt-1.5"
          >
            <option value="">Select kid</option>
            {kids.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-gray-700 text-sm font-medium">Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input-app mt-1.5"
          />
        </label>
        <label className="block">
          <span className="text-gray-700 text-sm font-medium">Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="input-app mt-1.5 min-h-[4rem]"
          />
        </label>
        <label className="block">
          <span className="text-gray-700 text-sm font-medium">Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="input-app mt-1.5"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="btn-app-primary w-full"
        >
          Create task
        </button>
      </form>
    </div>
  );
}
