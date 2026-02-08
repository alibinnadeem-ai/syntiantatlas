
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    FaHome, FaChartPie, FaBuilding, FaExchangeAlt, FaUserFriends,
    FaFileInvoiceDollar, FaCog, FaSignOutAlt, FaBars, FaTimes, FaWallet, FaBell
} from 'react-icons/fa';
import { BiBuildings, BiSupport } from 'react-icons/bi';
import { MdDashboard, MdOutlineInventory } from 'react-icons/md';

const SidebarItem = ({ icon: Icon, label, href, active, collapsed }) => (
    <Link href={href}>
        <div className={`flex items-center px-6 py-3 cursor-pointer transition-colors duration-200 
      ${active ? 'text-daoblue border-r-4 border-daoblue bg-blue-50' : 'text-gray-600 hover:text-daoblue hover:bg-gray-50'}
      ${collapsed ? 'justify-center' : ''}
    `}>
            <Icon className={`text-xl ${active ? 'text-daoblue' : 'text-gray-500'}`} />
            {!collapsed && <span className="ml-3 font-medium text-sm">{label}</span>}
        </div>
    </Link>
);

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const menuItems = [
        { icon: MdDashboard, label: 'Portfolio', href: '/dashboard' },
        { icon: FaChartPie, label: 'Active Investments', href: '/active-investments' },
        { icon: FaFileInvoiceDollar, label: 'Income Streams', href: '/income-streams' },
        { icon: FaUserFriends, label: 'My Referrals', href: '/referrals' },
        { icon: FaBuilding, label: 'Projects', href: '/projects' },
        { icon: FaExchangeAlt, label: 'Transactions', href: '/transactions' },
        { icon: MdOutlineInventory, label: 'DAO Listings', href: '/listings' },
        { icon: FaCog, label: 'Settings', href: '/settings' },
    ];

    const toggleSidebar = () => setCollapsed(!collapsed);
    const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-poppins flex">
            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={toggleMobileSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-20' : 'w-64'}
        `}
            >
                <div className="h-16 flex items-center justify-center border-b border-gray-100">
                    <Link href="/">
                        {collapsed ? (
                            <span className="text-2xl font-bold text-daoblue">F</span>
                        ) : (
                            <span className="text-2xl font-bold text-daoblue">FREIP</span>
                        )}
                    </Link>
                </div>

                <nav className="mt-6 flex-1 overflow-y-auto">
                    <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {!collapsed && 'My DAO'}
                    </div>
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={router.pathname === item.href}
                            collapsed={collapsed}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            router.push('/login');
                        }}
                        className={`flex items-center w-full px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors
               ${collapsed ? 'justify-center' : ''}
             `}
                    >
                        <FaSignOutAlt className="text-xl" />
                        {!collapsed && <span className="ml-3 font-medium text-sm">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center">
                        <button
                            onClick={toggleMobileSidebar}
                            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
                        >
                            <FaBars />
                        </button>
                        <button
                            onClick={toggleSidebar}
                            className="hidden lg:block p-2 rounded-md text-gray-600 hover:bg-gray-100 mr-4"
                        >
                            <FaBars />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800 ml-2 capitalize">
                            {router.pathname.split('/')[1]?.replace('-', ' ') || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="hidden md:block bg-daoblue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
                            Book a Meeting
                        </button>
                        <button className="p-2 text-gray-500 hover:text-daoblue transition">
                            <FaWallet className="text-xl" />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-daoblue transition relative">
                            <FaBell className="text-xl" />
                            <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                            <img src="https://ui-avatars.com/api/?name=User&background=0200e1&color=fff" alt="Profile" />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
