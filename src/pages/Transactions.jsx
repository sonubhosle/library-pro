import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import useUiStore from '../store/uiStore';

const Transactions = () => {
  const { addToast } = useUiStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await window.electron.ipc.invoke('transactions:getAll');
        if (result.success) {
          setTransactions(result.data);
        } else {
          addToast(result.error || 'Failed to load transactions', 'error');
        }
      } catch (e) {
        addToast('Error loading transactions', 'error');
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">All Transactions</h2>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-xs font-bold uppercase text-slate-400">Student</th>
              <th className="p-4 text-xs font-bold uppercase text-slate-400">Book</th>
              <th className="p-4 text-xs font-bold uppercase text-slate-400">Type</th>
              <th className="p-4 text-xs font-bold uppercase text-slate-400">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-slate-100">
                <td className="p-4 text-sm text-slate-700">{t.student?.name}</td>
                <td className="p-4 text-sm text-slate-700">{t.book?.title}</td>
                <td className="p-4 text-sm text-slate-700 capitalize">{t.type}</td>
                <td className="p-4 text-sm text-slate-700">
                  {new Date(t.date * 1000).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
