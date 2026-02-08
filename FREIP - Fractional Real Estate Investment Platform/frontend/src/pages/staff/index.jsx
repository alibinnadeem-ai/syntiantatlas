
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import withAuth from '../../components/withAuth';
import { MdDashboard, MdAssignment, MdCalendarToday } from 'react-icons/md';
import { FaUserClock, FaTasks } from 'react-icons/fa';

const staffMenuItems = [
    { icon: MdDashboard, label: 'My Dashboard', href: '/staff' },
    { icon: FaTasks, label: 'My Tasks', href: '/staff/tasks' },
    { icon: MdCalendarToday, label: 'Calendar', href: '/staff/calendar' },
    { icon: MdAssignment, label: 'Reports', href: '/staff/reports' },
];

function StaffDashboard() {
    const [userRole, setUserRole] = useState('Staff');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        // Display capitalized role, e.g., "operations_manager" -> "Operations Manager"
        if (user.role) {
            setUserRole(user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        }
    }, []);

    return (
        <DashboardLayout menuItems={staffMenuItems} roleTitle={userRole}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Staff Portal</h2>
                <span className="bg-blue-100 text-daoblue px-3 py-1 rounded-full text-sm font-medium">
                    {userRole}
                </span>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Pending Tasks"
                    value="5"
                    icon={FaTasks}
                />
                <StatsCard
                    title="Upcoming Appointments"
                    value="3"
                    icon={MdCalendarToday}
                />
                <StatsCard
                    title="Hours Logged"
                    value="32.5"
                    icon={FaUserClock}
                />
            </div>

            {/* Task List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">Priority Tasks</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" className="h-5 w-5 text-daoblue" />
                            <div>
                                <p className="font-medium text-gray-800">Review KYC for User #405</p>
                                <p className="text-xs text-red-500">Due Today</p>
                            </div>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" className="h-5 w-5 text-daoblue" />
                            <div>
                                <p className="font-medium text-gray-800">Update Property Details for Listing #22</p>
                                <p className="text-xs text-gray-500">Due Tomorrow</p>
                            </div>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">In Progress</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(StaffDashboard, ['staff', 'admin', 'operations_manager', 'appointment_setter']);
