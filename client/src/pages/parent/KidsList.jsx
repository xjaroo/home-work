import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listKids, deleteKid } from '../../api/kids.js';

export default function KidsList() {
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const load = () => {
    listKids()
      .then(setKids)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function handleRemove(e, kid) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Remove ${kid.name}? This will deactivate their account.`)) return;
    setRemovingId(kid.id);
    try {
      await deleteKid(kid.id);
      setKids((prev) => prev.filter((k) => k.id !== kid.id));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to remove kid');
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) return <p className="text-gray-500 text-base">Loading...</p>;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-5">
        <h2 className="text-xl font-bold text-gray-900 shrink-0">Kids</h2>
        <Link
          to="/parent/kids/new"
          className="btn-app-primary text-sm w-full sm:w-auto text-center shrink-0"
        >
          Add kid
        </Link>
      </div>
      <ul className="space-y-3">
        {kids.map((kid) => (
          <li key={kid.id} className="card-app flex items-center gap-3 p-4 hover:border-indigo-300">
            <Link to={`/parent/kids/${kid.id}`} className="flex-1 min-w-0 font-medium text-gray-900 text-base">
              {kid.name}
            </Link>
            <button
              type="button"
              onClick={(e) => handleRemove(e, kid)}
              disabled={removingId === kid.id}
              className="touch-target min-h-[2.75rem] rounded-app px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {removingId === kid.id ? 'Removing…' : 'Remove'}
            </button>
          </li>
        ))}
      </ul>
      {kids.length === 0 && (
        <p className="text-gray-500 text-base">No kids yet. Add one to get started.</p>
      )}
    </div>
  );
}
