export default function PortfolioChart({ investments }) {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount_invested, 0);
  const byCity = investments.reduce((acc, inv) => {
    acc[inv.city] = (acc[inv.city] || 0) + inv.amount_invested;
    return acc;
  }, {});

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">Portfolio Distribution</h3>
      <div className="space-y-3">
        {Object.entries(byCity).map(([city, amount]) => (
          <div key={city}>
            <div className="flex justify-between text-sm mb-1">
              <span>{city}</span>
              <span>{((amount / totalInvested) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(amount / totalInvested) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
