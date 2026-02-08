import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuthStore } from '../store';
import { transactionApi, userApi } from '../utils/api';

export default function Wallet() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadWalletData();
  }, [token]);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const [walletRes, transRes] = await Promise.all([
        userApi.getWallet(),
        transactionApi.getHistory()
      ]);
      setWallet(walletRes.data);
      setTransactions(transRes.data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount) return;
    try {
      await transactionApi.deposit({
        amount: parseFloat(depositAmount),
        payment_method: 'card',
        gateway: 'stripe'
      });
      setDepositAmount('');
      loadWalletData();
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  if (!token) return null;

  return (
    <Layout user={user} onLogout={() => {
      localStorage.removeItem('token');
      useAuthStore.setState({ user: null, token: null });
      router.push('/login');
    }}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Wallet & Transactions</h1>

        {isLoading ? (
          <p className="text-gray-600">Loading wallet...</p>
        ) : (
          <>
            {/* Wallet Balance */}
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <p className="text-sm opacity-90 mb-2">Current Balance</p>
              <p className="text-5xl font-bold">PKR {(wallet?.wallet_balance || 0).toLocaleString()}</p>
              <p className="text-sm opacity-75 mt-2">Currency: {wallet?.currency || 'PKR'}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-4 font-semibold ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('deposit')}
                className={`py-2 px-4 font-semibold ${
                  activeTab === 'deposit'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                Deposit Funds
              </button>
            </div>

            {/* Deposit Tab */}
            {activeTab === 'deposit' && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Add Funds</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (PKR)</label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="input-field"
                    />
                  </div>
                  <select className="input-field">
                    <option>Bank Transfer</option>
                    <option>Credit Card</option>
                    <option>JazzCash</option>
                    <option>EasyPaisa</option>
                  </select>
                  <button onClick={handleDeposit} className="btn-primary w-full">
                    Deposit Funds
                  </button>
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && transactions && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card">
                    <p className="text-gray-600 text-sm">Total Deposits</p>
                    <p className="text-2xl font-bold">PKR {(transactions.summary?.total_deposits || 0).toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-gray-600 text-sm">Total Withdrawals</p>
                    <p className="text-2xl font-bold">PKR {(transactions.summary?.total_withdrawals || 0).toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-gray-600 text-sm">Total Invested</p>
                    <p className="text-2xl font-bold">PKR {(transactions.summary?.total_investments || 0).toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-gray-600 text-sm">Total Dividends</p>
                    <p className="text-2xl font-bold text-green-600">PKR {(transactions.summary?.total_dividends || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
                  {transactions.transactions && transactions.transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.transactions.slice(0, 10).map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center p-3 border-b last:border-b-0">
                          <div>
                            <p className="font-semibold capitalize">{tx.type}</p>
                            <p className="text-sm text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${tx.type === 'deposit' || tx.type === 'dividend' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'deposit' || tx.type === 'dividend' ? '+' : '-'}PKR {tx.amount?.toLocaleString()}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No transactions yet</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
