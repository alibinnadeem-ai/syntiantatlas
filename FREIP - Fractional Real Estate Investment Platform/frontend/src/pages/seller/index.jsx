import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuthStore } from '../store';
import { propertyApi } from '../utils/api';

export default function SellerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== 'seller') {
      router.push('/login');
      return;
    }
    loadProperties();
  }, [token]);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const response = await propertyApi.getSellerProperties();
      setProperties(response.data.properties || []);
    } catch (error) {
      console.error('Failed to load properties:', error);
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Properties</h1>
          <a href="/seller/new-property" className="btn-primary">
            + Add New Property
          </a>
        </div>

        {isLoading ? (
          <p className="text-gray-600">Loading properties...</p>
        ) : properties.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No properties listed yet</p>
            <a href="/seller/new-property" className="btn-primary inline-block">
              List Your First Property
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card">
                <p className="text-gray-600 text-sm">Total Properties</p>
                <p className="text-3xl font-bold">{properties.length}</p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Total Raised</p>
                <p className="text-3xl font-bold">
                  PKR {properties.reduce((sum, p) => sum + p.funding_raised, 0).toLocaleString()}
                </p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Active Properties</p>
                <p className="text-3xl font-bold">
                  {properties.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Funded Properties</p>
                <p className="text-3xl font-bold">
                  {properties.filter(p => p.status === 'funded').length}
                </p>
              </div>
            </div>

            {/* Properties Table */}
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left p-4">Property Title</th>
                    <th className="text-left p-4">Location</th>
                    <th className="text-left p-4">Funding Target</th>
                    <th className="text-left p-4">Raised</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">{property.title}</td>
                      <td className="p-4">{property.city}</td>
                      <td className="p-4">PKR {property.funding_target?.toLocaleString()}</td>
                      <td className="p-4">PKR {property.funding_raised?.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          property.status === 'active' ? 'bg-green-100 text-green-800' :
                          property.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <a href={`/seller/property/${property.id}`} className="text-blue-600 hover:underline">
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
