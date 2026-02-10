'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Transaction } from '@/types';
import { format } from 'date-fns';
import {
  FiCreditCard,
  FiArrowUpCircle,
  FiArrowDownCircle,
  FiTrendingUp,
  FiX,
  FiDollarSign,
  FiLoader,
} from 'react-icons/fi';

type ModalType = 'deposit' | 'withdraw' | null;

interface ModalFormState {
  amount: string;
  paymentMethod: string;
}

const PAYMENT_METHODS = ['Bank Transfer', 'JazzCash', 'EasyPaisa'];

function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'deposit':
      return <FiArrowDownCircle className="text-green-500 text-xl" />;
    case 'withdrawal':
      return <FiArrowUpCircle className="text-red-500 text-xl" />;
    case 'investment':
      return <FiTrendingUp className="text-dao-blue text-xl" />;
    case 'dividend':
      return <FiDollarSign className="text-purple-500 text-xl" />;
    default:
      return <FiCreditCard className="text-gray-400 text-xl" />;
  }
}

function getStatusBadge(status: string | null) {
  const s = status?.toLowerCase() ?? 'unknown';
  const styles: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[s] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

/* ─── Skeleton Loaders ─── */
function BalanceSkeleton() {
  return (
    <div className="rounded-2xl p-8 animate-pulse" style={{ background: 'linear-gradient(135deg, #0b7ef1 0%, #04338C 100%)' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-white/20" />
        <div>
          <div className="h-4 w-28 bg-white/20 rounded mb-2" />
          <div className="h-3 w-20 bg-white/10 rounded" />
        </div>
      </div>
      <div className="h-10 w-56 bg-white/20 rounded mb-1" />
      <div className="h-4 w-32 bg-white/10 rounded" />
    </div>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100" />
        <div>
          <div className="h-4 w-24 bg-gray-100 rounded mb-1" />
          <div className="h-3 w-16 bg-gray-50 rounded" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 w-20 bg-gray-100 rounded mb-1" />
        <div className="h-3 w-14 bg-gray-50 rounded" />
      </div>
    </div>
  );
}

/* ─── Modal Component ─── */
function TransactionModal({
  type,
  balance,
  onClose,
}: {
  type: 'deposit' | 'withdraw';
  balance: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ModalFormState>({
    amount: '',
    paymentMethod: PAYMENT_METHODS[0],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { amount: number; paymentMethod?: string }) =>
      type === 'deposit' ? api.deposit(data) : api.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSuccess(
        type === 'deposit'
          ? 'Deposit submitted successfully!'
          : 'Withdrawal submitted successfully!',
      );
      setForm({ amount: '', paymentMethod: PAYMENT_METHODS[0] });
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Something went wrong. Please try again.',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 100) {
      setError('Minimum amount is PKR 100.');
      return;
    }
    if (type === 'withdraw' && amount > balance) {
      setError('Amount exceeds your wallet balance.');
      return;
    }

    mutation.mutate({ amount, paymentMethod: form.paymentMethod });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {type === 'withdraw' && (
            <p className="text-sm text-gray-500">
              Available balance:{' '}
              <span className="font-semibold text-gray-900">
                PKR {formatCurrency(balance)}
              </span>
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (PKR)
            </label>
            <input
              type="number"
              min={100}
              max={type === 'withdraw' ? balance : undefined}
              step="0.01"
              placeholder="Enter amount (min 100)"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm((f) => ({ ...f, paymentMethod: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue outline-none transition bg-white"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !!success}
            className={`w-full font-semibold py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2
              ${
                type === 'deposit'
                  ? 'btn-blue'
                  : 'btn-secondary'
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {mutation.isPending && (
              <FiLoader className="animate-spin" />
            )}
            {mutation.isPending
              ? 'Processing...'
              : success
                ? 'Done'
                : `Confirm ${type === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Wallet Page ─── */
export default function WalletPage() {
  const [modalType, setModalType] = useState<ModalType>(null);

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.getWallet(),
  });

  const balance = wallet ? parseFloat(wallet.balance) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* ─── Balance Card ─── */}
      {isLoading ? (
        <BalanceSkeleton />
      ) : (
        <div
          className="rounded-2xl p-8 text-white"
          style={{
            background: 'linear-gradient(135deg, #0b7ef1 0%, #04338C 100%)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <FiCreditCard className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-100">Wallet Balance</p>
              <p className="text-xs text-blue-200">Available funds</p>
            </div>
          </div>
          <p className="text-4xl font-bold tracking-tight mb-1">
            PKR {formatCurrency(balance)}
          </p>
          <p className="text-sm text-blue-200">
            Updated just now
          </p>
        </div>
      )}

      {/* ─── Action Buttons ─── */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setModalType('deposit')}
          className="btn-blue flex items-center justify-center gap-2 py-4 rounded-xl text-base"
        >
          <FiArrowDownCircle className="text-xl" />
          Deposit Funds
        </button>
        <button
          onClick={() => setModalType('withdraw')}
          className="btn-secondary flex items-center justify-center gap-2 py-4 rounded-xl text-base"
        >
          <FiArrowUpCircle className="text-xl" />
          Withdraw Funds
        </button>
      </div>

      {/* ─── Recent Transactions ─── */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Transactions
        </h2>

        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <TransactionRowSkeleton key={i} />
            ))}
          </div>
        ) : !wallet?.recentTransactions?.length ? (
          <div className="text-center py-12 text-gray-400">
            <FiCreditCard className="mx-auto text-4xl mb-3" />
            <p className="text-sm">No transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {wallet.recentTransactions.map((tx: Transaction) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {tx.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === 'deposit' || tx.type === 'dividend'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'deposit' || tx.type === 'dividend' ? '+' : '-'}
                    PKR {formatCurrency(tx.amount)}
                  </p>
                  {getStatusBadge(tx.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modal ─── */}
      {modalType && (
        <TransactionModal
          type={modalType}
          balance={balance}
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  );
}
