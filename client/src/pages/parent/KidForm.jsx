import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createKid } from '../../api/kids.js';

export default function KidForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createKid({ name, email, password });
      navigate('/parent/kids');
    } catch (err) {
      setError(err.message || 'Failed to create kid');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Add kid</h2>
      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
        <label className="block">
          <span className="text-gray-700 text-sm">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>
        <label className="block">
          <span className="text-gray-700 text-sm">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>
        <label className="block">
          <span className="text-gray-700 text-sm">Password (min 8)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 rounded bg-indigo-600 text-white font-medium disabled:opacity-50"
        >
          Create kid
        </button>
      </form>
    </div>
  );
}
