import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import PropertyCard from '../components/PropertyCard';
import InvestmentModal from '../components/InvestmentModal';
import { useAuthStore } from '../store';
import { propertyApi } from '../utils/api';

export default function Properties() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filters, setFilters] = useState({ city: '', property_type: '' });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadProperties();
  }, [token, filters]);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const response = await propertyApi.getAll(filters);
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
          <h1 className="text-3xl font-bold">Browse Properties</h1>
          {user?.role === 'seller' && (
            <a href="/seller/new-property" className="btn-primary">
              + Add Property
            </a>
          )}
        </div>

        {/* Filters */}
        <div className="card flex gap-4">
          <input
            type="text"
            placeholder="Search by city..."
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="input-field"
          />
          <select
            value={filters.property_type}
            onChange={(e) => setFilters({ ...filters, property_type: e.target.value })}
            className="input-field"
          >
            <option value="">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <p className="text-center text-gray-600">Loading properties...</p>
        ) : properties.length === 0 ? (
          <p className="text-center text-gray-600">No properties found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onInvest={(id) => setSelectedProperty(properties.find(p => p.id === id))}
              />
            ))}
          </div>
        )}

        {selectedProperty && (
          <InvestmentModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            onSuccess={() => loadProperties()}
          />
        )}
      </div>
    </Layout>
  );
}
