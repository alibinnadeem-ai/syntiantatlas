
import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import withAuth from '../../components/withAuth';
import { MdDashboard, MdPeople, MdSettings, MdSecurity } from 'react-icons/md';
import { FaUserShield, FaServer, FaUsers } from 'react-icons/fa';

const adminMenuItems = [
    { icon: MdDashboard, label: 'Overview', href: '/admin' },
    { icon: MdPeople, label: 'User Management', href: '/admin/users' },
    { icon: FaUserShield, label: 'Staff Management', href: '/admin/staff' },
    { icon: FaServer, label: 'System Health', href: '/admin/system' },
    { icon: MdSettings, label: 'Platform Settings', href: '/admin/settings' },
];

function AdminDashboard() {
    return (
        <DashboardLayout menuItems={adminMenuItems} roleTitle="Super Admin">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">System Overview</h2>
                <div className="flex gap-2">
                    <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                        Export Logs
                    </button>
                    <button className="bg-daoblue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
                        Create Staff
                    </button>
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Users"
                    value="1,245"
                    icon={FaUsers}
                />
                <StatsCard
                    title="Active Sellers"
                    value="48"
                    icon={MdPeople}
                />
                <StatsCard
                    title="Platform Revenue"
                    value="5.4M PKR"
                    icon={MdSecurity}
                />
                <StatsCard
                    title="System Status"
                    value="Healthy"
                    subValues={[{ label: 'Uptime', value: '99.9%' }]}
                    icon={FaServer}
                />
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">Latest System Events</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start p-3 bg-gray-50 rounded-lg">
                            <div className="bg-blue-100 text-daoblue p-2 rounded-full mr-3">
                                <MdSecurity />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">New User Registration</p>
                                <p className="text-xs text-gray-500">2 minutes ago • ID: #883{i}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(AdminDashboard, ['admin']);
