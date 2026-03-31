import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  fetchAdminUsers,
  fetchAdminFamilies,
  createAdminFamily,
  createAdminParentInvite,
  patchAdminUser,
  deactivateAdminUser,
  reactivateAdminUser,
  permanentlyDeleteAdminUser,
  impersonateAdminAsKid,
} from '../../api/admin.js';

function statusLabel(row) {
  return row.deleted_at ? 'Deactivated' : 'Active';
}

function sortMembers(a, b) {
  const order = (r) => (r.role === 'parent' ? 0 : 1);
  if (order(a) !== order(b)) return order(a) - order(b);
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

function groupUsersByFamily(userRows) {
  const map = new Map();
  for (const row of userRows) {
    const fid = row.family_id || '';
    const key = fid || '__no_family__';
    if (!map.has(key)) {
      map.set(key, {
        familyId: fid || null,
        familyName: fid ? row.family_name || 'Unnamed family' : 'No family',
        members: [],
      });
    }
    map.get(key).members.push(row);
  }
  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    members: [...g.members].sort(sortMembers),
  }));
  groups.sort((a, b) =>
    a.familyName.localeCompare(b.familyName, undefined, { sensitivity: 'base' })
  );
  return groups;
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('parent');
  const [isAdminFlag, setIsAdminFlag] = useState(false);
  const [familyId, setFamilyId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [openingKidTest, setOpeningKidTest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [createFamilyError, setCreateFamilyError] = useState('');
  const [parentInviteFamilyId, setParentInviteFamilyId] = useState('');
  const [parentInviteEmail, setParentInviteEmail] = useState('');
  const [creatingParentInvite, setCreatingParentInvite] = useState(false);
  const [parentInviteError, setParentInviteError] = useState('');
  const [latestOnboardingLink, setLatestOnboardingLink] = useState('');
  const [latestOnboardingEmail, setLatestOnboardingEmail] = useState('');

  const selected = rows.find((r) => r.id === selectedId) || null;

  const familyGroups = useMemo(() => groupUsersByFamily(rows), [rows]);

  const reload = useCallback(async () => {
    setLoadError('');
    const [userList, famList] = await Promise.all([fetchAdminUsers(), fetchAdminFamilies()]);
    setRows(userList);
    setFamilies(famList);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await reload();
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    if (!selected) {
      setName('');
      setEmail('');
      setRole('parent');
      setIsAdminFlag(false);
      setFamilyId('');
      setNewPassword('');
      setFormError('');
      return;
    }
    setName(selected.name);
    setEmail(selected.email);
    setRole(selected.role);
    setIsAdminFlag(Boolean(selected.is_admin));
    setFamilyId(selected.family_id || '');
    setNewPassword('');
    setFormError('');
  }, [selected?.id]);

  useEffect(() => {
    if (!families.length) {
      setParentInviteFamilyId('');
      return;
    }
    setParentInviteFamilyId((prev) => {
      if (prev && families.some((f) => f.id === prev)) return prev;
      return families[0].id;
    });
  }, [families]);

  async function handleSave(e) {
    e.preventDefault();
    if (!selected) return;
    setFormError('');
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        is_admin: isAdminFlag,
        family_id: familyId,
      };
      if (newPassword.trim()) body.password = newPassword.trim();
      await patchAdminUser(selected.id, body);
      await reload();
      if (selected.id === currentUser?.id) await refreshUser();
      setNewPassword('');
    } catch (err) {
      setFormError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveUser() {
    if (
      !selected ||
      !window.confirm(
        `Remove ${selected.email}? They will no longer be able to sign in. You can reactivate or permanently delete the record afterward.`
      )
    ) {
      return;
    }
    setFormError('');
    try {
      await deactivateAdminUser(selected.id);
      await reload();
      if (selected.id === currentUser?.id) await refreshUser();
      setSelectedId(null);
    } catch (err) {
      setFormError(err.message || 'Remove failed');
    }
  }

  async function handleReactivate() {
    if (!selected) return;
    setFormError('');
    try {
      await reactivateAdminUser(selected.id);
      await reload();
    } catch (err) {
      setFormError(err.message || 'Reactivate failed');
    }
  }

  async function handleOpenAsKidForTesting() {
    if (!selected || selected.role !== 'kid' || selected.deleted_at) return;
    setFormError('');
    setOpeningKidTest(true);
    try {
      await impersonateAdminAsKid(selected.id);
      await refreshUser();
      navigate('/kid');
    } catch (err) {
      setFormError(err.message || 'Could not open kid account');
    } finally {
      setOpeningKidTest(false);
    }
  }

  async function handlePermanentDelete() {
    if (
      !selected ||
      !selected.deleted_at ||
      !window.confirm(
        `Permanently delete ${selected.email}? This removes their profile and related tasks, messages, and money records. This cannot be undone.`
      )
    ) {
      return;
    }
    setFormError('');
    try {
      await permanentlyDeleteAdminUser(selected.id);
      await reload();
      setSelectedId(null);
    } catch (err) {
      setFormError(err.message || 'Delete failed');
    }
  }

  async function handleCreateFamily(e) {
    e.preventDefault();
    setCreateFamilyError('');
    setCreatingFamily(true);
    try {
      await createAdminFamily(newFamilyName.trim());
      setNewFamilyName('');
      await reload();
    } catch (err) {
      setCreateFamilyError(err.message || 'Could not create family');
    } finally {
      setCreatingFamily(false);
    }
  }

  async function handleCreateParentInvite(e) {
    e.preventDefault();
    setParentInviteError('');
    setCreatingParentInvite(true);
    try {
      const result = await createAdminParentInvite({
        family_id: parentInviteFamilyId,
        email: parentInviteEmail.trim(),
      });
      setLatestOnboardingLink(result.onboardingUrl || '');
      setLatestOnboardingEmail(result.email || parentInviteEmail.trim());
      setParentInviteEmail('');
      await reload();
    } catch (err) {
      setParentInviteError(err.message || 'Could not create onboarding link');
    } finally {
      setCreatingParentInvite(false);
    }
  }

  async function handleCopyOnboardingLink() {
    if (!latestOnboardingLink) return;
    try {
      await navigator.clipboard.writeText(latestOnboardingLink);
    } catch {
      setParentInviteError('Could not copy the link. Please copy it manually.');
    }
  }

  if (loading) {
    return (
      <div className="card-app p-8 text-center text-gray-500">Loading accounts…</div>
    );
  }

  if (loadError) {
    return (
      <div className="card-app p-6">
        <p className="text-red-600">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-w-0">
      <div className="card-app flex-1 min-w-0 overflow-hidden">
        <div className="px-4 py-3 sm:py-3.5 border-b border-gray-200">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">All users</h1>
          <p className="text-sm text-gray-500 mt-1 leading-snug">
            {rows.length} accounts · {familyGroups.length}{' '}
            {familyGroups.length === 1 ? 'family' : 'families'}
          </p>
          <p className="text-xs text-gray-400 mt-1.5 md:hidden">Tap a row to edit below.</p>
        </div>
        <div className="md:hidden overflow-y-auto max-h-[min(52vh,28rem)] overscroll-y-contain border-t border-gray-100">
          {familyGroups.map((group, gIdx) => (
            <section
              key={group.familyId || '__no_family__'}
              className={gIdx > 0 ? 'border-t-2 border-slate-200' : ''}
            >
              <div className="sticky top-0 z-[1] bg-slate-100/95 backdrop-blur-sm px-4 py-2.5 border-b border-slate-200/80">
                <h2 className="font-semibold text-slate-800 text-base leading-snug">{group.familyName}</h2>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  {group.members.length} {group.members.length === 1 ? 'account' : 'accounts'}
                </p>
                {group.familyId ? (
                  <p
                    className="text-[11px] font-mono text-slate-400 truncate mt-1"
                    title={group.familyId}
                  >
                    {group.familyId}
                  </p>
                ) : null}
              </div>
              <ul className="divide-y divide-gray-100">
                {group.members.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className={[
                        'w-full text-left px-4 py-3.5 flex flex-col gap-1.5 min-h-[3.25rem] transition-colors',
                        selectedId === row.id
                          ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-200'
                          : 'bg-white active:bg-gray-50',
                        row.deleted_at ? 'opacity-70' : '',
                      ].join(' ')}
                    >
                      <span className="font-medium text-gray-900">{row.name}</span>
                      <span className="text-sm text-gray-600 break-all">{row.email}</span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                        <span className="text-gray-700 capitalize">
                          {row.role}
                          {row.is_admin ? (
                            <span className="text-amber-700 font-medium"> · admin</span>
                          ) : null}
                        </span>
                        <span
                          className={
                            row.deleted_at ? 'text-red-600 font-medium' : 'text-green-700 font-medium'
                          }
                        >
                          {statusLabel(row)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto max-h-[min(70vh,32rem)] lg:max-h-none">
          <table className="w-full text-sm text-left min-w-[36rem]">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-3 py-2.5 sm:py-3 font-medium">Name</th>
                <th className="px-3 py-2.5 sm:py-3 font-medium">Email</th>
                <th className="px-3 py-2.5 sm:py-3 font-medium">Role</th>
                <th className="px-3 py-2.5 sm:py-3 font-medium">Status</th>
              </tr>
            </thead>
            {familyGroups.map((group, idx) => (
              <tbody
                key={group.familyId || '__no_family__'}
                className={idx > 0 ? 'border-t-2 border-slate-200' : ''}
              >
                <tr className="bg-slate-100/90">
                  <td colSpan={4} className="px-3 py-2.5 sm:py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="font-semibold text-slate-800">{group.familyName}</span>
                      <span className="text-xs text-slate-500 tabular-nums text-right min-w-0">
                        {group.members.length} {group.members.length === 1 ? 'account' : 'accounts'}
                        {group.familyId ? (
                          <span className="ml-2 font-mono text-slate-400 break-all">{group.familyId}</span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                </tr>
                {group.members.map((row) => (
                  <tr
                    key={row.id}
                    className={[
                      'cursor-pointer border-b border-gray-100 hover:bg-indigo-50/60',
                      selectedId === row.id ? 'bg-indigo-50' : 'bg-white',
                      row.deleted_at ? 'opacity-70' : '',
                    ].join(' ')}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <td className="px-3 py-2.5 sm:py-3 pl-4 sm:pl-5 font-medium text-gray-900 align-middle">
                      {row.name}
                    </td>
                    <td className="px-3 py-2.5 sm:py-3 text-gray-700 break-all align-middle max-w-[14rem] lg:max-w-none">
                      {row.email}
                    </td>
                    <td className="px-3 py-2.5 sm:py-3 text-gray-700 whitespace-nowrap align-middle">
                      {row.role}
                      {row.is_admin ? (
                        <span className="ml-1 text-xs font-medium text-amber-700">admin</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 sm:py-3 whitespace-nowrap align-middle">
                      <span
                        className={
                          row.deleted_at ? 'text-red-600 font-medium' : 'text-green-700 font-medium'
                        }
                      >
                        {statusLabel(row)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>

      <div className="card-app w-full lg:w-[22rem] xl:w-[26rem] shrink-0">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Add family</h2>
        </div>
        <form className="p-4 space-y-3 border-b border-gray-200" onSubmit={handleCreateFamily}>
          {createFamilyError ? (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-app" role="alert">
              {createFamilyError}
            </p>
          ) : null}
          <label className="block">
            <span className="text-gray-700 text-sm font-medium">Family name</span>
            <input
              className="input-app mt-1"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              placeholder="e.g. Kim Family"
              required
            />
          </label>
          <button type="submit" disabled={creatingFamily} className="btn-app-primary w-full">
            {creatingFamily ? 'Creating…' : 'Create family'}
          </button>
        </form>

        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Add parent</h2>
        </div>
        <form className="p-4 space-y-3 border-b border-gray-200" onSubmit={handleCreateParentInvite}>
          {parentInviteError ? (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-app" role="alert">
              {parentInviteError}
            </p>
          ) : null}
          <label className="block">
            <span className="text-gray-700 text-sm font-medium">Family</span>
            <select
              className="input-app mt-1"
              value={parentInviteFamilyId}
              onChange={(e) => setParentInviteFamilyId(e.target.value)}
              required
            >
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || f.id}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-gray-700 text-sm font-medium">Parent email</span>
            <input
              type="email"
              className="input-app mt-1"
              value={parentInviteEmail}
              onChange={(e) => setParentInviteEmail(e.target.value)}
              placeholder="parent@example.com"
              required
            />
          </label>
          <button type="submit" disabled={creatingParentInvite} className="btn-app-primary w-full">
            {creatingParentInvite ? 'Generating…' : 'Generate onboarding link'}
          </button>
          {latestOnboardingLink ? (
            <div className="rounded-app border border-green-200 bg-green-50 p-3">
              <p className="text-xs text-green-800 mb-2">Share this onboarding URL with {latestOnboardingEmail}:</p>
              <div className="flex gap-2">
                <input type="text" className="input-app bg-white" value={latestOnboardingLink} readOnly />
                <button
                  type="button"
                  className="btn-app border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  onClick={handleCopyOnboardingLink}
                >
                  Copy
                </button>
              </div>
            </div>
          ) : null}
        </form>

        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Edit account</h2>
        </div>
        {!selected ? (
          <p className="p-4 text-sm text-gray-500">Select a user from the list.</p>
        ) : (
          <form className="p-4 space-y-4" onSubmit={handleSave}>
            {formError ? (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-app" role="alert">
                {formError}
              </p>
            ) : null}
            <label className="block">
              <span className="text-gray-700 text-sm font-medium">Name</span>
              <input
                className="input-app mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-gray-700 text-sm font-medium">Email</span>
              <input
                type="email"
                className="input-app mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-gray-700 text-sm font-medium">Role</span>
              <select
                className="input-app mt-1"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="parent">Parent</option>
                <option value="kid">Kid</option>
              </select>
            </label>
            <label className="block">
              <span className="text-gray-700 text-sm font-medium">Family</span>
              <select
                className="input-app mt-1"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
                required
              >
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || f.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 touch-target cursor-pointer">
              <input
                type="checkbox"
                checked={isAdminFlag}
                onChange={(e) => setIsAdminFlag(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-800">Platform admin</span>
            </label>
            <label className="block">
              <span className="text-gray-700 text-sm font-medium">New password</span>
              <input
                type="password"
                className="input-app mt-1"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Leave blank to keep current"
              />
              <span className="text-xs text-gray-500 mt-1 block">Min 8 chars, one letter and one number.</span>
            </label>
            <div className="flex flex-col gap-2 pt-2">
              <button type="submit" disabled={saving} className="btn-app-primary w-full">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {selected.role === 'kid' && !selected.deleted_at ? (
                <div className="rounded-app border border-amber-200 bg-amber-50/90 px-3 py-2.5 space-y-2">
                  <p className="text-xs text-amber-900 leading-snug">
                    Sign in as this kid in a new session layer: you will see the kid app. Use “Return to admin” on
                    the kid home screen when finished.
                  </p>
                  <button
                    type="button"
                    disabled={saving || openingKidTest}
                    className="btn-app w-full border border-amber-300 text-amber-950 bg-white hover:bg-amber-100/80"
                    onClick={handleOpenAsKidForTesting}
                  >
                    {openingKidTest ? 'Opening…' : 'Open kid app (testing)'}
                  </button>
                </div>
              ) : null}
              {selected.deleted_at ? (
                <>
                  <button
                    type="button"
                    className="btn-app w-full border border-gray-200 text-gray-800 hover:bg-gray-50"
                    onClick={handleReactivate}
                  >
                    Reactivate account
                  </button>
                  <button
                    type="button"
                    className="btn-app w-full border border-red-300 text-red-800 hover:bg-red-50"
                    onClick={handlePermanentDelete}
                  >
                    Permanently delete
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-app w-full border border-red-200 text-red-700 hover:bg-red-50"
                  onClick={handleRemoveUser}
                >
                  Remove user
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
