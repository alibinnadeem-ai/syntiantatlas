
import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import withAuth from '../../components/withAuth';
import { MdDashboard, MdInventory } from 'react-icons/md';
import { FaPlusCircle, FaMoneyBillWave, FaCog, FaChartLine, FaList } from 'react-icons/fa';

const sellerMenuItems = [
  { icon: MdDashboard, label: 'Dashboard', href: '/seller' },
  { icon: FaList, label: 'My Listings', href: '/seller/listings' },
  { icon: FaPlusCircle, label: 'Add New Property', href: '/seller/new-property' },
  { icon: FaMoneyBillWave, label: 'Sales & Earnings', href: '/seller/sales' },
  { icon: FaCog, label: 'Settings', href: '/seller/settings' },
];

function SellerDashboard() {
  return (
    <DashboardLayout menuItems={sellerMenuItems} roleTitle="Seller Panel">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Seller Dashboard</h2>
        <button className="bg-daoblue text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition shadow-lg shadow-blue-500/30 flex items-center gap-2">
          <FaPlusCircle /> Add Property
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Listings"
          value="12"
          icon={MdInventory}
        />
        <StatsCard
          title="Active Properties"
          value="8"
          icon={FaList}
        />
        <StatsCard
          title="Total Earnings"
          value="2.5M PKR"
          icon={FaMoneyBillWave}
        />
        <StatsCard
          title="Views This Month"
          value="1.2k"
          icon={FaChartLine}
        />
      </div>

      {/* Recent Listings Table (Placeholder) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">Recent Listings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Luxury Apartment {i}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">50,000 PKR</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">120</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(SellerDashboard, ['seller', 'admin']);
