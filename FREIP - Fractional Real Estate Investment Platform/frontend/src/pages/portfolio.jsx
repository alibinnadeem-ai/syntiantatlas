import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import PortfolioChart from '../components/PortfolioChart';
import { useAuthStore } from '../store';
import { investmentApi } from '../utils/api';

export default function Portfolio() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadPortfolio();
  }, [token]);

  const loadPortfolio = async () => {
    setIsLoading(true);
    try {
      const response = await investmentApi.getPortfolio();
      setPortfolio(response.data);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setIsLoading(false);
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
        <h1 className="text-3xl font-bold">My Portfolio</h1>

        {isLoading ? (
          <p className="text-gray-600">Loading portfolio...</p>
        ) : portfolio ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <p className="text-sm opacity-90">Total Invested</p>
                <p className="text-3xl font-bold">PKR {(portfolio.total_invested || 0).toLocaleString()}</p>
              </div>
              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <p className="text-sm opacity-90">Current Value</p>
                <p className="text-3xl font-bold">PKR {((portfolio.total_invested || 0) + (portfolio.total_returns || 0)).toLocaleString()}</p>
              </div>
              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <p className="text-sm opacity-90">Total Returns</p>
                <p className="text-3xl font-bold">PKR {(portfolio.total_returns || 0).toLocaleString()}</p>
              </div>
              <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <p className="text-sm opacity-90">Investments</p>
                <p className="text-3xl font-bold">{portfolio.investment_count || 0}</p>
              </div>
            </div>

            {portfolio.portfolio && portfolio.portfolio.length > 0 && (
              <>
                <PortfolioChart investments={portfolio.portfolio} />

                <div className="card">
                  <h2 className="text-xl font-bold mb-4">Your Investments</h2>
                  <div className="space-y-4">
                    {portfolio.portfolio.map((inv) => (
                      <div key={inv.id} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{inv.property?.title}</h3>
                            <p className="text-sm text-gray-600">{inv.property?.city}</p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {inv.property?.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                          <div>
                            <p className="text-gray-600">Amount Invested</p>
                            <p className="font-semibold">PKR {inv.amount_invested?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Ownership</p>
                            <p className="font-semibold">{inv.ownership_percentage?.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Shares</p>
                            <p className="font-semibold">{inv.shares_owned?.toFixed(4)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Returns</p>
                            <p className="font-semibold text-green-600">PKR {inv.returns_earned?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <p className="text-gray-600">No investments yet</p>
        )}
      </div>
    </Layout>
  );
}
