import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getInviteInfo, acceptInviteWithSignup, acceptInvite } from '../api/invite.js';

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteInfoLoading, setInviteInfoLoading] = useState(!!token);
  const [inviteInfoError, setInviteInfoError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (done && user?.role === 'parent') navigate('/parent', { replace: true });
  }, [done, user, navigate]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setInviteInfoLoading(true);
    setInviteInfoError('');
    getInviteInfo(token)
      .then((info) => { if (!cancelled) setInviteInfo(info); })
      .catch((err) => { if (!cancelled) setInviteInfoError(err.message || 'Invalid invite link'); })
      .finally(() => { if (!cancelled) setInviteInfoLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid invite link</h1>
          <p className="text-gray-600 mb-4">This link is missing or invalid.</p>
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Go to login</Link>
        </div>
      </div>
    );
  }

  if (authLoading || (inviteInfoLoading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-base">Loading...</p>
      </div>
    );
  }

  if (!user && inviteInfoError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid invite link</h1>
          <p className="text-gray-600 mb-4">{inviteInfoError}</p>
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Go to login</Link>
        </div>
      </div>
    );
  }

  if (!user && inviteInfo) {
    const returnTo = `/invite/accept?token=${encodeURIComponent(token)}`;
    async function handleSignup(e) {
      e.preventDefault();
      setError('');
      if (!name.trim() || password.length < 8) {
        setError('Name is required and password must be at least 8 characters.');
        return;
      }
      setAccepting(true);
      try {
        await acceptInviteWithSignup(token, name.trim(), password);
        await refreshUser();
        setDone(true);
      } catch (err) {
        setError(err.message || 'Could not create account');
      } finally {
        setAccepting(false);
      }
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Join {inviteInfo.familyName}</h1>
          <p className="text-gray-600 mb-5 text-center text-sm">Set up your account to join as a parent.</p>
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-app" role="alert">{error}</p>
            )}
            <label className="block">
              <span className="text-gray-700 text-sm font-medium">Email</span>
              <input
                type="email"
                value={inviteInfo.email}
                readOnly
                className="input-app mt-1.5 bg-gray-50 text-gray-600"
              />
            </label>
            <label className="block">
              <span className="text-gray-700 text-sm font-medium">Your name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={1}
                maxLength={200}
                placeholder="e.g. Min Hong"
                className="input-app mt-1.5"
              />
            </label>
            <label className="block">
              <span className="text-gray-700 text-sm font-medium">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="input-app mt-1.5"
              />
            </label>
            <button
              type="submit"
              disabled={accepting}
              className="btn-app-primary w-full"
            >
              {accepting ? 'Creating account…' : 'Create account & join'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-indigo-600 hover:text-indigo-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  async function handleAccept() {
    setError('');
    setAccepting(true);
    try {
      await acceptInvite(token);
      await refreshUser();
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not accept invite');
    } finally {
      setAccepting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="text-center">
          <p className="text-gray-900 font-medium text-base">You’ve joined the family. Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Join this family as parent?</h1>
        <p className="text-gray-600 mb-4">
          You’ll get the same access as the person who invited you: manage kids, tasks, and money.
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-app mb-4" role="alert">{error}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleAccept}
            disabled={accepting}
            className="btn-app-primary"
          >
            {accepting ? 'Joining…' : 'Join as parent'}
          </button>
          <Link
            to={user.role === 'parent' ? '/parent' : '/kid'}
            className="btn-app border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
