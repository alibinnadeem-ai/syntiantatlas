import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuthStore } from '../store';
import { propertyApi } from '../utils/api';

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    router.push('/login');
    return null;
  }

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const response = await propertyApi.getAll({ status: 'active' });
      setProperties(response.data.properties);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout user={user} onLogout={() => {
      localStorage.removeItem('token');
      useAuthStore.setState({ user: null, token: null });
      router.push('/login');
    }}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-sm opacity-90">Total Invested</p>
            <p className="text-3xl font-bold">PKR 2.5M</p>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-sm opacity-90">Current Value</p>
            <p className="text-3xl font-bold">PKR 2.9M</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-sm opacity-90">Total Returns</p>
            <p className="text-3xl font-bold">PKR 375K</p>
          </div>
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <p className="text-sm opacity-90">Properties</p>
            <p className="text-3xl font-bold">12</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Featured Properties</h2>
          {isLoading ? (
            <p className="text-gray-600">Loading properties...</p>
          ) : (
            <button onClick={loadProperties} className="btn-primary">
              Load Properties
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
