
import DashboardLayout from '../components/DashboardLayout';

export default function Projects() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Project Cards */}
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
            <div className="h-48 bg-gray-200 relative">
              <span className="absolute top-4 left-4 bg-daoblue text-white text-xs font-bold px-2 py-1 rounded">NEW LISTING</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-800 mb-2">Luxury Apartment {item}</h3>
              <p className="text-gray-500 text-sm mb-4">Islamabad, Pakistan</p>
              <div className="flex justify-between items-center">
                <span className="text-daoblue font-bold">50,000 PKR</span>
                <button className="text-sm border border-daoblue text-daoblue px-3 py-1 rounded hover:bg-blue-50">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
