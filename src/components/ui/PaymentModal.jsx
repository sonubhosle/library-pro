import React from 'react';

const PaymentModal = ({ open, fine, amount, onAmountChange, onSubmit, onClose }) => {
  if (!open) return null;

  const handleConfirm = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    onSubmit(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Collect Payment</h2>
        <p className="text-slate-600">
          Enter amount to collect (Total due: ₹{fine?.total || amount})
        </p>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => onAmountChange(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
