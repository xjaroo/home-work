import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { getBalance, getTransactions, createSpendRequest } from '../../api/money.js';
import { getTxDescription } from '../../utils/money.js';

const TX_PAGE_SIZE = 15;

export default function KidBalance() {
  const { user } = useAuth();
  const [balanceCents, setBalanceCents] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const socket = useSocket();
  const kidId = user?.id;

  const load = useCallback(async () => {
    if (!kidId) return;
    try {
      const [bal, txs] = await Promise.all([
        getBalance(kidId).then((r) => r.balanceCents),
        getTransactions(kidId),
      ]);
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
    const onBalance = ({ kidId: id, balanceCents: cents }) => {
      if (id === kidId) setBalanceCents(cents);
    };
    socket.on('money:balance_updated', onBalance);
    const onTx = () => load();
    socket.on('money:transaction_created', onTx);
    const onTxRemoved = () => load();
    socket.on('money:transaction_removed', onTxRemoved);
    return () => {
      socket.off('money:balance_updated', onBalance);
      socket.off('money:transaction_created', onTx);
      socket.off('money:transaction_removed', onTxRemoved);
    };
  }, [socket, kidId, load]);

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

  async function handleRequest(e) {
    e.preventDefault();
    setError('');
    const cents = Math.round(parseFloat(amount || 0) * 100);
    if (cents <= 0) {
      setError('Enter a positive amount');
      return;
    }
    if (cents > balanceCents) {
      setError('Amount exceeds balance');
      return;
    }
    setSubmitting(true);
    try {
      await createSpendRequest(kidId, cents, note || undefined);
      setAmount('');
      setNote('');
      load();
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-gray-500 text-base">Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">My Money</h2>

      <div className="card-app p-5 max-w-xs">
        <h3 className="text-sm font-medium text-gray-500">Current balance</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">${(balanceCents / 100).toFixed(2)}</p>
      </div>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Request to spend</h3>
        <form onSubmit={handleRequest} className="space-y-3 max-w-sm">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-app" role="alert">{error}</p>
          )}
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-app"
          />
          <input
            type="text"
            placeholder="What for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input-app"
          />
          <button
            type="submit"
            disabled={submitting}
            className="btn-app-primary w-full"
          >
            {submitting ? 'Requesting…' : 'Request'}
          </button>
        </form>
      </section>

      <section>
        <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">Transaction history</h3>
          <input
            type="search"
            placeholder="Search…"
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            className="input-app py-2 w-40 min-w-0"
          />
        </div>
        <div className="overflow-x-auto rounded-app border border-gray-200">
          <table className="w-full text-sm text-left min-w-[360px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 font-medium text-gray-700">Date</th>
                <th className="px-3 py-2 font-medium text-gray-700">Description</th>
                <th className="px-3 py-2 font-medium text-gray-700">By</th>
                <th className="px-3 py-2 font-medium text-gray-700 text-right">Credit</th>
                <th className="px-3 py-2 font-medium text-gray-700 text-right">Debit</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTxs.map((t) => {
                const isCredit = t.amount_cents > 0;
                const amount = Math.abs(t.amount_cents) / 100;
                const desc = getTxDescription(t);
                const byWho = t.createdByUserName || (t.decidedByParentName ? `Decided by ${t.decidedByParentName}` : null) || '—';
                return (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2 text-gray-600">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-gray-900">{desc}</td>
                    <td className="px-3 py-2 text-gray-600 text-sm">{byWho}</td>
                    <td className="px-3 py-2 text-right text-emerald-600 font-medium">{isCredit ? `$${amount.toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2 text-right text-red-600 font-medium">{!isCredit ? `$${amount.toFixed(2)}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredTxs.length === 0 && <p className="text-gray-500 text-sm py-2">No transactions yet.</p>}
        {txTotalPages > 1 && (
          <div className="flex items-center gap-2 text-sm mt-3">
            <button
              type="button"
              onClick={() => setTxPage((p) => Math.max(1, p - 1))}
              disabled={txPage === 1}
              className="touch-target rounded-app border border-gray-300 px-4 py-2.5 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {txPage} of {txTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
              disabled={txPage === txTotalPages}
              className="touch-target rounded-app border border-gray-300 px-4 py-2.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
