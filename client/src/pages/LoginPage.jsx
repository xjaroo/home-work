import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const getRedirect = (u) => {
    if (returnTo && returnTo.startsWith('/')) return returnTo;
    if (u?.is_admin) return '/admin';
    return u?.role === 'parent' ? '/parent' : '/kid';
  };

  React.useEffect(() => {
    if (user) {
      navigate(getRedirect(user), { replace: true });
    }
  }, [user, navigate, returnTo]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const u = await login(email, password);
      navigate(getRedirect(u), { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">Home Work</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-app" role="alert">
              {error}
            </p>
          )}
          <label className="block">
            <span className="text-gray-700 text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              autoComplete="current-password"
              className="input-app mt-1.5"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="btn-app-primary w-full"
          >
            Log in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          No account? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">Register as parent</Link>
        </p>
      </div>
    </div>
  );
}
