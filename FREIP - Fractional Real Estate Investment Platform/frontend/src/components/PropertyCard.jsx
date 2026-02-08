export default function PropertyCard({ property, onInvest }) {
  return (
    <div className="card hover:shadow-lg transition">
      <h3 className="text-lg font-bold text-gray-800 mb-2">{property.title}</h3>
      <p className="text-gray-600 text-sm mb-4">{property.address}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-600">Type</p>
          <p className="font-semibold">{property.property_type}</p>
        </div>
        <div>
          <p className="text-gray-600">Area</p>
          <p className="font-semibold">{property.area_sqft} sq ft</p>
        </div>
        <div>
          <p className="text-gray-600">Min Investment</p>
          <p className="font-semibold">PKR {property.min_investment?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-600">Expected Returns</p>
          <p className="font-semibold text-green-600">{property.expected_returns_annual}%</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Funding Progress</span>
          <span>{((property.funding_raised / property.funding_target) * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${(property.funding_raised / property.funding_target) * 100}%` }}
          ></div>
        </div>
      </div>

      <button
        onClick={() => onInvest(property.id)}
        className="btn-primary w-full"
      >
        Invest Now
      </button>
    </div>
  );
}
