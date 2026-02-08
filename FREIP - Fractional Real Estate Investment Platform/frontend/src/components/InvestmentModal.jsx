import { useState } from 'react';
import { investmentApi } from '../utils/api';

export default function InvestmentModal({ property, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInvest = async () => {
    if (!amount || amount < property.min_investment) {
      setError(`Minimum investment is PKR ${property.min_investment}`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await investmentApi.invest({
        property_id: property.id,
        amount: parseFloat(amount),
      });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Investment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">{property.title}</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Investment Amount (PKR)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min: PKR ${property.min_investment}`}
            className="input-field"
            disabled={isLoading}
          />
        </div>

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        <div className="flex gap-4">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>
            Cancel
          </button>
          <button onClick={handleInvest} className="btn-primary flex-1" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Invest'}
          </button>
        </div>
      </div>
    </div>
  );
}
