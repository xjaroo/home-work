import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getFamilyMembers } from '../../api/families.js';
import { createInvite } from '../../api/invite.js';

export default function InviteParent() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [reused, setReused] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getFamilyMembers()
      .then((r) => setMembers(r.members || []))
      .catch(console.error);
  }, []);

  const partners = members.filter((m) => m.role === 'parent');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await createInvite(email.trim());
      setInviteLink(data.inviteLink);
      setInviteEmail(data.email ?? email.trim());
      setReused(data.reused ?? false);
      if (!data.reused) setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to create invite');
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Invite partner</h2>
      {partners.length > 0 && (
        <div className="card-app p-5 max-w-md bg-gray-50/50">
          <p className="text-sm font-medium text-gray-700 mb-2">Partners in your family</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {partners.map((p) => (
              <li key={p.id}>{p.id === user?.id ? `${p.name} (you)` : p.name}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">You and your partners share access to kids, tasks, and messages.</p>
        </div>
      )}
      <p className="text-sm text-gray-600">
        Invited partners will have the same access as you: they can manage kids, tasks, and money. Only one invite per email at a time; creating again for the same email shows the existing link.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-app" role="alert">{error}</p>
        )}
        <label className="block">
          <span className="text-gray-700 text-sm font-medium">Email address to invite</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="partner@example.com"
            className="input-app mt-1.5"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="btn-app-primary"
        >
          {submitting ? 'Creating…' : 'Create invite link'}
        </button>
      </form>
      {inviteLink && (
        <div className="p-5 bg-green-50 rounded-app-lg border border-green-200 max-w-xl">
          {reused ? (
            <p className="text-sm font-medium text-amber-800 mb-2">An invite was already sent to {inviteEmail}. Use the same link below:</p>
          ) : (
            <p className="text-sm font-medium text-green-800 mb-2">Share this link with {inviteEmail}:</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="input-app flex-1 py-2.5 bg-white"
            />
            <button
              type="button"
              onClick={copyLink}
              className="btn-app rounded-app border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-green-700 mt-2">The link expires in 7 days. They must log in with this email to join your family.</p>
        </div>
      )}
    </div>
  );
}
