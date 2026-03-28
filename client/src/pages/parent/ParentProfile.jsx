import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { updateProfile } from '../../api/auth.js';
import { updateFamilyName } from '../../api/families.js';

export default function ParentProfile() {
  const { user, family, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingFamily, setSavingFamily] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  useEffect(() => {
    setFamilyName(family?.name ?? '');
  }, [family]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { name: name.trim(), email: email.trim().toLowerCase() };
      if (password.trim()) payload.password = password.trim();
      const { user: updated } = await updateProfile(payload);
      await refreshUser();
      setPassword('');
      if (updated) {
        setName(updated.name ?? '');
        setEmail(updated.email ?? '');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleFamilyNameSubmit(e) {
    e.preventDefault();
    if (!familyName.trim()) return;
    setSavingFamily(true);
    try {
      await updateFamilyName(familyName.trim());
      await refreshUser();
    } catch (err) {
      setError(err.message || 'Failed to update family name');
    } finally {
      setSavingFamily(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Edit your profile</h2>

      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Family name</h3>
        <p className="text-xs text-gray-500 mb-2">Shown in the header for everyone in your family (e.g. Hong Family).</p>
        <form onSubmit={handleFamilyNameSubmit} className="flex gap-2 items-end max-w-md">
          <label className="flex-1 min-w-0">
            <span className="sr-only">Family name</span>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g. Hong Family"
              maxLength={200}
              className="block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
            />
          </label>
          <button
            type="submit"
            disabled={savingFamily || !familyName.trim()}
            className="rounded bg-indigo-600 px-4 py-2 text-white text-sm font-medium disabled:opacity-50"
          >
            {savingFamily ? 'Saving…' : 'Save'}
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Your profile</h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">{error}</p>
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
          <span className="text-gray-700 text-sm">New password (leave blank to keep current)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            placeholder="Optional"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-indigo-600 px-4 py-2 text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
      </section>
    </div>
  );
}
