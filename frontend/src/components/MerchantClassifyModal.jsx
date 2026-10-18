import { useState } from 'react';
import { X } from 'lucide-react';

const BUSINESS_CATEGORIES = [
  'Food', 'Grocery', 'Dairy', 'Snacks', 'Beverages', 'Personal Care', 'Household',
  'Health', 'Shopping', 'Medical', 'Fuel', 'Travel', 'Bills', 'Entertainment',
  'Electronics', 'Education', 'Other',
];
const PERSON_CATEGORIES = [
  'Friend', 'Family', 'Rent', 'Loan', 'Salary', 'Gift', 'Other',
];

/**
 * Modal to classify a new merchant
 * Props: merchantName, onSave({ merchantType, category }), onClose
 */
export default function MerchantClassifyModal({ merchantName, onSave, onClose }) {
  const [step, setStep] = useState(1); // 1 = type, 2 = category
  const [merchantType, setMerchantType] = useState('');
  const [category, setCategory] = useState('');

  const categories = merchantType === 'Business' ? BUSINESS_CATEGORIES : PERSON_CATEGORIES;

  const handleTypeSelect = (type) => {
    setMerchantType(type);
    setStep(2);
  };

  const handleSave = () => {
    if (!category) return;
    onSave({ merchantType, category });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-ink">New Merchant Detected</h3>
            <p className="text-xs text-ink-muted mt-0.5 font-medium">{merchantName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {step === 1 ? (
            <>
              <p className="text-sm text-ink-muted mb-4">Who did you pay?</p>
              <div className="grid grid-cols-2 gap-3">
                {['Business', 'Person'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className="border border-gray-200 rounded-lg p-4 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors"
                  >
                    <div className="text-2xl mb-1">{type === 'Business' ? '🏢' : '👤'}</div>
                    <div className="text-sm font-medium text-ink">{type}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(1)} className="text-xs text-primary-500 hover:underline">← Back</button>
                <p className="text-sm text-ink-muted">Select category for this {merchantType.toLowerCase()}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`border rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                      category === cat
                        ? 'border-primary-500 bg-primary-50 text-primary-600'
                        : 'border-gray-200 text-ink-muted hover:border-primary-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={!category}
                className="btn-primary w-full mt-4"
              >
                Save & Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
