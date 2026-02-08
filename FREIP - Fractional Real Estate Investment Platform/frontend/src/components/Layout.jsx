export default function Layout({ children, user, onLogout }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 hidden md:block">
        <h1 className="text-2xl font-bold mb-8">FREIP</h1>
        <nav className="space-y-4">
          <a href="/dashboard" className="block py-2 px-4 hover:bg-gray-800 rounded">Dashboard</a>
          <a href="/properties" className="block py-2 px-4 hover:bg-gray-800 rounded">Properties</a>
          <a href="/portfolio" className="block py-2 px-4 hover:bg-gray-800 rounded">Portfolio</a>
          <a href="/wallet" className="block py-2 px-4 hover:bg-gray-800 rounded">Wallet</a>
          {user?.role === 'seller' && (
            <a href="/seller" className="block py-2 px-4 hover:bg-gray-800 rounded">My Properties</a>
          )}
          {user?.role === 'super_admin' && (
            <a href="/admin" className="block py-2 px-4 hover:bg-gray-800 rounded">Admin Panel</a>
          )}
        </nav>
        <button onClick={onLogout} className="mt-8 w-full bg-red-600 py-2 rounded hover:bg-red-700">
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Welcome, {user?.email}</h2>
          <div className="text-sm text-gray-600">Role: {user?.role}</div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
