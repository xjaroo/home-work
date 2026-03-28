import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { getKid, deleteKid, updateKid } from '../../api/kids.js';
import { listTasks } from '../../api/tasks.js';
import { getBalance, getTransactions, addAllowance, addPenalty, approveSpendRequest, declineSpendRequest, removeTransaction } from '../../api/money.js';
import { updateTaskStatus, archiveTask, updateTask, deleteTask } from '../../api/tasks.js';
import { getTxDescription } from '../../utils/money.js';

const TASKS_PAGE_SIZE = 10;
const TX_PAGE_SIZE = 15;

export default function KidDetail() {
  const { kidId } = useParams();
  const navigate = useNavigate();
  const [kid, setKid] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [balanceCents, setBalanceCents] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [allowanceAmount, setAllowanceAmount] = useState('');
  const [allowanceNote, setAllowanceNote] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [penaltyNote, setPenaltyNote] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPage, setTaskPage] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [removingTxId, setRemovingTxId] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const load = useCallback(async () => {
    if (!kidId) return;
    try {
      const [k, taskList, bal, txs] = await Promise.all([
        getKid(kidId),
        listTasks({ kidId }),
        getBalance(kidId).then((r) => r.balanceCents),
        getTransactions(kidId),
      ]);
      setKid(k);
      if (!editing) {
        setEditName(k?.name ?? '');
        setEditEmail(k?.email ?? '');
      }
      setTasks(taskList);
      setBalanceCents(bal);
      setTransactions(txs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [kidId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket || !kidId) return;
    const onTask = () => load();
    const onBalance = ({ kidId: id, balanceCents: cents }) => {
      if (id === kidId) setBalanceCents(cents);
    };
    socket.on('task:created', onTask);
    socket.on('task:updated', onTask);
    socket.on('task:status_changed', onTask);
    socket.on('task:deleted', onTask);
    socket.on('money:balance_updated', onBalance);
    const onTx = () => load();
    socket.on('money:transaction_created', onTx);
    const onTxRemoved = () => load();
    socket.on('money:transaction_removed', onTxRemoved);
    return () => {
      socket.off('task:created', onTask);
      socket.off('task:updated', onTask);
      socket.off('task:status_changed', onTask);
      socket.off('task:deleted', onTask);
      socket.off('money:balance_updated', onBalance);
      socket.off('money:transaction_created', onTx);
      socket.off('money:transaction_removed', onTxRemoved);
    };
  }, [socket, kidId, load]);

  const filteredTasks = useMemo(() => {
    let list = tasks.filter((t) => !['archived'].includes(t.status));
    if (taskSearch.trim()) {
      const q = taskSearch.trim().toLowerCase();
      list = list.filter((t) => (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }
    if (taskStatusFilter !== 'all') list = list.filter((t) => t.status === taskStatusFilter);
    return list;
  }, [tasks, taskSearch, taskStatusFilter]);

  const taskTotalPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PAGE_SIZE));
  const paginatedTasks = useMemo(
    () => filteredTasks.slice((taskPage - 1) * TASKS_PAGE_SIZE, taskPage * TASKS_PAGE_SIZE),
    [filteredTasks, taskPage]
  );

  useEffect(() => {
    setTaskPage(1);
  }, [taskSearch, taskStatusFilter]);

  const filteredTxs = useMemo(() => {
    if (!txSearch.trim()) return transactions;
    const q = txSearch.trim().toLowerCase();
    return transactions.filter((t) => getTxDescription(t).toLowerCase().includes(q));
  }, [transactions, txSearch]);

  const txTotalPages = Math.max(1, Math.ceil(filteredTxs.length / TX_PAGE_SIZE));
  const paginatedTxs = useMemo(
    () => filteredTxs.slice((txPage - 1) * TX_PAGE_SIZE, txPage * TX_PAGE_SIZE),
    [filteredTxs, txPage]
  );

  useEffect(() => {
    setTxPage(1);
  }, [txSearch]);

  const pendingSpend = useMemo(
    () => transactions.filter((t) => t.type === 'spend_request' && t.status === 'pending'),
    [transactions]
  );

  async function handleAddAllowance(e) {
    e.preventDefault();
    const cents = Math.round(parseFloat(allowanceAmount || 0) * 100);
    if (cents <= 0) return;
    await addAllowance(kidId, cents, allowanceNote || undefined);
    setAllowanceAmount('');
    setAllowanceNote('');
    const { balanceCents } = await getBalance(kidId);
    setBalanceCents(balanceCents);
    setTransactions(await getTransactions(kidId));
  }

  async function handleAddPenalty(e) {
    e.preventDefault();
    const cents = Math.round(parseFloat(penaltyAmount || 0) * 100);
    if (cents <= 0) return;
    await addPenalty(kidId, cents, penaltyNote || undefined);
    setPenaltyAmount('');
    setPenaltyNote('');
    const { balanceCents } = await getBalance(kidId);
    setBalanceCents(balanceCents);
    setTransactions(await getTransactions(kidId));
  }

  async function handleApprove(txId) {
    await approveSpendRequest(txId);
    load();
  }

  async function handleDecline(txId) {
    await declineSpendRequest(txId);
    load();
  }

  async function handleRemoveTransaction(tx) {
    if (!window.confirm('Remove this transaction? The balance will be updated. This cannot be undone.')) return;
    setRemovingTxId(tx.id);
    try {
      await removeTransaction(tx.id);
      const [bal, txs] = await Promise.all([getBalance(kidId).then((r) => r.balanceCents), getTransactions(kidId)]);
      setBalanceCents(bal);
      setTransactions(txs);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to remove transaction');
    } finally {
      setRemovingTxId(null);
    }
  }

  async function handleStatusChange(taskId, status) {
    await updateTaskStatus(taskId, status);
    setTasks(await listTasks({ kidId }));
  }

  async function handleArchive(taskId) {
    await archiveTask(taskId);
    setTasks(await listTasks({ kidId }));
  }

  function handleStartEditTask(t) {
    setEditingTaskId(t.id);
    setEditTaskTitle(t.title);
    setEditTaskDescription(t.description ?? '');
    setEditTaskDueDate(t.due_date ?? '');
  }

  function handleCancelEditTask() {
    setEditingTaskId(null);
  }

  async function handleSaveTask(e) {
    e.preventDefault();
    if (!editingTaskId) return;
    setSavingTask(true);
    try {
      await updateTask(editingTaskId, {
        title: editTaskTitle.trim(),
        description: editTaskDescription.trim() || undefined,
        dueDate: editTaskDueDate,
      });
      setEditingTaskId(null);
      setTasks(await listTasks({ kidId }));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update task');
    } finally {
      setSavingTask(false);
    }
  }

  async function handleDeleteTask(t) {
    if (!window.confirm(`Delete task "${t.title}"? This cannot be undone.`)) return;
    setDeletingTaskId(t.id);
    try {
      await deleteTask(t.id);
      setTasks(await listTasks({ kidId }));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete task');
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function handleRemoveAccount() {
    if (!window.confirm(`Remove ${kid.name}? This will deactivate their account.`)) return;
    setRemoving(true);
    try {
      await deleteKid(kidId);
      navigate('/parent/kids');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to remove account');
    } finally {
      setRemoving(false);
    }
  }

  function handleStartEdit() {
    setEditName(kid.name);
    setEditEmail(kid.email);
    setEditPassword('');
    setEditError('');
    setEditing(true);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setEditError('');
    setSaving(true);
    try {
      const payload = { name: editName.trim(), email: editEmail.trim() };
      if (editPassword.trim()) payload.password = editPassword;
      await updateKid(kidId, payload);
      setKid((prev) => (prev ? { ...prev, ...payload } : null));
      setEditing(false);
      setEditPassword('');
    } catch (err) {
      setEditError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !kid) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-800">{kid.name}</h2>
        <div className="flex items-center gap-2">
          <Link to="/parent/kids" className="text-sm text-indigo-600 hover:underline">Back to kids</Link>
          <button type="button" onClick={handleStartEdit} className="text-sm text-indigo-600 hover:underline">
            Edit profile
          </button>
          <button
            type="button"
            onClick={handleRemoveAccount}
            disabled={removing}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {removing ? 'Removing…' : 'Remove account'}
          </button>
        </div>
      </div>

      {editing && (
        <section className="p-4 bg-gray-50 rounded border border-gray-200 max-w-sm">
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <h3 className="font-medium text-gray-800">Edit profile</h3>
            {editError && <p className="text-sm text-red-600" role="alert">{editError}</p>}
            <label className="block">
              <span className="text-gray-700 text-sm">Name</span>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900" />
            </label>
            <label className="block">
              <span className="text-gray-700 text-sm">Email</span>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900" />
            </label>
            <label className="block">
              <span className="text-gray-700 text-sm">New password (leave blank to keep current)</span>
              <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} minLength={8} placeholder="Optional" className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900" />
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded bg-indigo-600 px-3 py-2 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded border border-gray-300 px-3 py-2 text-gray-700 text-sm">Cancel</button>
            </div>
          </form>
        </section>
      )}

      <nav className="flex overflow-x-auto overflow-y-hidden border-b border-gray-200 scrollbar-hide touch-pan-x" role="tablist">
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`shrink-0 touch-target px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
        >
          Tasks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('money')}
          className={`shrink-0 touch-target px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'money' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
        >
          Money
        </button>
      </nav>

      {activeTab === 'tasks' && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <Link to={`/parent/tasks/new?kidId=${kidId}`} className="rounded bg-indigo-600 px-3 py-2 text-white text-sm font-medium">New task</Link>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="search"
                placeholder="Search tasks…"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm w-40"
              />
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
          <ul className="space-y-2">
            {paginatedTasks.map((t) => (
              <li key={t.id} className="p-3 bg-white rounded border border-gray-200">
                {editingTaskId === t.id ? (
                  <form onSubmit={handleSaveTask} className="space-y-2">
                    <label className="block">
                      <span className="text-gray-700 text-sm">Title</span>
                      <input type="text" value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} required maxLength={500} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-gray-900 text-sm" />
                    </label>
                    <label className="block">
                      <span className="text-gray-700 text-sm">Description</span>
                      <textarea value={editTaskDescription} onChange={(e) => setEditTaskDescription(e.target.value)} rows={2} maxLength={2000} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-gray-900 text-sm" />
                    </label>
                    <label className="block">
                      <span className="text-gray-700 text-sm">Due date</span>
                      <input type="date" value={editTaskDueDate} onChange={(e) => setEditTaskDueDate(e.target.value)} required className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-gray-900 text-sm" />
                    </label>
                    <div className="flex gap-2">
                      <button type="submit" disabled={savingTask} className="rounded bg-indigo-600 px-2 py-1 text-white text-sm disabled:opacity-50">{savingTask ? 'Saving…' : 'Save'}</button>
                      <button type="button" onClick={handleCancelEditTask} className="rounded border border-gray-300 px-2 py-1 text-gray-700 text-sm">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="font-medium">{t.title}</span>
                      <span className="ml-2 text-sm text-gray-500">{t.status}</span>
                      <span className="ml-2 text-sm text-gray-500">Due: {t.due_date}</span>
                      {t.createdByParentName && <span className="ml-2 text-sm text-gray-400">By {t.createdByParentName}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleStartEditTask(t)} className="rounded border border-gray-300 px-2 py-1 text-gray-700 text-sm hover:bg-gray-50">Edit</button>
                      <button type="button" onClick={() => handleDeleteTask(t)} disabled={deletingTaskId === t.id} className="rounded border border-red-300 px-2 py-1 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50">{deletingTaskId === t.id ? 'Deleting…' : 'Delete'}</button>
                      {t.status === 'done' && (
                        <>
                          <button type="button" onClick={() => handleStatusChange(t.id, 'approved')} className="rounded bg-green-600 px-2 py-1 text-white text-sm">Approve</button>
                          <button type="button" onClick={() => handleArchive(t.id)} className="rounded bg-gray-500 px-2 py-1 text-white text-sm">Archive</button>
                        </>
                      )}
                      {t.status === 'approved' && (
                        <button type="button" onClick={() => handleArchive(t.id)} className="rounded bg-gray-500 px-2 py-1 text-white text-sm">Archive</button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {filteredTasks.length === 0 && <p className="text-gray-500 text-sm">No tasks match.</p>}
          {taskTotalPages > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <button type="button" onClick={() => setTaskPage((p) => Math.max(1, p - 1))} disabled={taskPage === 1} className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50">
                Previous
              </button>
              <span className="text-gray-600">
                Page {taskPage} of {taskTotalPages}
              </span>
              <button type="button" onClick={() => setTaskPage((p) => Math.min(taskTotalPages, p + 1))} disabled={taskPage === taskTotalPages} className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50">
                Next
              </button>
            </div>
          )}
        </section>
      )}

      {activeTab === 'money' && (
        <section className="space-y-6">
          <div className="p-4 bg-white rounded border border-gray-200 max-w-xs">
            <h3 className="text-sm font-medium text-gray-500">Current balance</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-1">${(balanceCents / 100).toFixed(2)}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <form onSubmit={handleAddAllowance} className="flex flex-wrap gap-2 items-end p-3 bg-green-50 rounded border border-green-200">
              <span className="w-full text-sm font-medium text-green-800">Add allowance (credit)</span>
              <input type="number" step="0.01" min="0" placeholder="Amount" value={allowanceAmount} onChange={(e) => setAllowanceAmount(e.target.value)} className="rounded border border-gray-300 px-2 py-1 w-24" />
              <input type="text" placeholder="Note" value={allowanceNote} onChange={(e) => setAllowanceNote(e.target.value)} className="rounded border border-gray-300 px-2 py-1 flex-1 min-w-0" />
              <button type="submit" className="rounded bg-green-600 px-3 py-1 text-white text-sm">Add</button>
            </form>
            <form onSubmit={handleAddPenalty} className="flex flex-wrap gap-2 items-end p-3 bg-amber-50 rounded border border-amber-200">
              <span className="w-full text-sm font-medium text-amber-800">Add penalty (debit)</span>
              <input type="number" step="0.01" min="0" placeholder="Amount" value={penaltyAmount} onChange={(e) => setPenaltyAmount(e.target.value)} className="rounded border border-gray-300 px-2 py-1 w-24" />
              <input type="text" placeholder="Note" value={penaltyNote} onChange={(e) => setPenaltyNote(e.target.value)} className="rounded border border-gray-300 px-2 py-1 flex-1 min-w-0" />
              <button type="submit" className="rounded bg-amber-600 px-3 py-1 text-white text-sm">Add</button>
            </form>
          </div>

          {pendingSpend.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Pending spend requests</h3>
              <ul className="space-y-2">
                {pendingSpend.map((t) => (
                  <li key={t.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>${(Math.abs(t.amount_cents) / 100).toFixed(2)} – {t.note || 'No note'}</span>
                    <span className="flex gap-2">
                      <button type="button" onClick={() => handleApprove(t.id)} className="text-green-600 text-sm font-medium">Approve</button>
                      <button type="button" onClick={() => handleDecline(t.id)} className="text-red-600 text-sm font-medium">Decline</button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">Transaction history</h3>
              <input
                type="search"
                placeholder="Search by note or type…"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm w-48"
              />
            </div>
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="w-full text-sm text-left min-w-[400px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 font-medium text-gray-700">Date</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Description</th>
                    <th className="px-3 py-2 font-medium text-gray-700">By</th>
                    <th className="px-3 py-2 font-medium text-gray-700 text-right">Credit</th>
                    <th className="px-3 py-2 font-medium text-gray-700 text-right">Debit</th>
                    <th className="px-3 py-2 font-medium text-gray-700 text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTxs.map((t) => {
                    const isCredit = t.amount_cents > 0;
                    const amount = Math.abs(t.amount_cents) / 100;
                    const desc = getTxDescription(t);
                    const canRemove = t.type === 'allowance' || t.type === 'penalty';
                    const byWho = t.createdByUserName || (t.decidedByParentName ? `Decided by ${t.decidedByParentName}` : null) || '—';
                    return (
                      <tr key={t.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2 text-gray-600">{new Date(t.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-gray-900">{desc}</td>
                        <td className="px-3 py-2 text-gray-600 text-sm">{byWho}</td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">{isCredit ? `$${amount.toFixed(2)}` : '—'}</td>
                        <td className="px-3 py-2 text-right text-red-600 font-medium">{!isCredit ? `$${amount.toFixed(2)}` : '—'}</td>
                        <td className="px-3 py-2 text-right">
                          {canRemove && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTransaction(t)}
                              disabled={removingTxId === t.id}
                              className="text-red-600 text-sm font-medium hover:underline disabled:opacity-50"
                            >
                              {removingTxId === t.id ? 'Removing…' : 'Remove'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredTxs.length === 0 && <p className="text-gray-500 text-sm py-2">No transactions.</p>}
            {txTotalPages > 1 && (
              <div className="flex items-center gap-2 text-sm mt-2">
                <button type="button" onClick={() => setTxPage((p) => Math.max(1, p - 1))} disabled={txPage === 1} className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50">
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {txPage} of {txTotalPages}
                </span>
                <button type="button" onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))} disabled={txPage === txTotalPages} className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50">
                  Next
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
