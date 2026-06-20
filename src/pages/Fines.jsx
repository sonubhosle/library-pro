import React, { useState, useEffect } from 'react';
import {
    IndianRupee,
    Search,
    CheckCircle,
    Clock,
    AlertCircle,
    Download,
    Receipt,
    Wallet,
    TrendingUp,
    AlertTriangle
} from 'lucide-react';
import PaymentModal from '../components/ui/PaymentModal';
import useUiStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

const Fines = () => {
    const { addToast } = useUiStore();
    const { user } = useAuthStore();
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentFine, setPaymentFine] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    const fetchFines = async () => {
        setLoading(true);
        const result = await window.electron.ipc.invoke('fines:getAll', { status: filter });
        if (result.success) {
            setFines(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFines();
    }, [filter]);

    const handleCollect = (fineId, amountDue) => {
        setPaymentFine({ fineId, total: amountDue });
        setPaymentAmount(amountDue.toString());
        setPaymentOpen(true);
    };

    const submitPayment = async () => {
        if (!paymentFine) return;
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            addToast('Invalid payment amount', 'error');
            return;
        }
        const result = await window.electron.ipc.invoke('fines:collectPayment', {
            fineId: paymentFine.fineId,
            amount,
            adminId: user.id || user._id,
            notes: 'Payment collected via dashboard'
        });
        if (result.success) {
            addToast('Payment collected successfully', 'success');
            fetchFines();
        } else {
            addToast(result.error || 'Failed to collect payment', 'error');
        }
        setPaymentOpen(false);
        setPaymentFine(null);
        setPaymentAmount('');
    };

    const cancelPayment = () => {
        setPaymentOpen(false);
        setPaymentFine(null);
        setPaymentAmount('');
    };

    const filteredFines = fines.filter(f =>
        f.student?.name.toLowerCase().includes(search.toLowerCase()) ||
        f.fine.fine_code.toLowerCase().includes(search.toLowerCase())
    );

    const totalFines = fines.reduce((acc, f) => acc + f.fine.total_fine, 0);
    const collected = fines.reduce((acc, f) => acc + (f.fine.paid_amount || 0), 0);
    const pending = totalFines - collected;
    const outstandingCases = fines.filter(f => !f.fine.is_paid).length;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/30 text-white">
                        <IndianRupee size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-500">Fines & Payments</h2>
                        <p className="text-sm text-slate-500 font-semibold ">Manage student fines, late fees, and collected payments.</p>
                    </div>
                </div>
                <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                    <Download size={18} />
                    Export Report
                </button>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full -z-10 transition-transform duration-500 group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                            <Receipt size={16} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Fines</p>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">₹{totalFines}</h3>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-50 rounded-full -z-10 transition-transform duration-500 group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                            <Wallet size={16} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Collected</p>
                    </div>
                    <h3 className="text-3xl font-black text-teal-600">₹{collected}</h3>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full -z-10 transition-transform duration-500 group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center">
                            <TrendingUp size={16} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending</p>
                    </div>
                    <h3 className="text-3xl font-black text-rose-500">₹{pending}</h3>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full -z-10 transition-transform duration-500 group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-500 flex items-center justify-center">
                            <AlertTriangle size={16} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Outstanding</p>
                    </div>
                    <h3 className="text-3xl font-black text-amber-500">{outstandingCases} <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cases</span></h3>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
                        {['All', 'Paid', 'Unpaid'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${filter === t 
                                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-all duration-300" size={18} />
                        <input
                            type="text"
                            placeholder="Search by student name or fine code..."
                            className="bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 w-full outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-sm font-medium text-slate-700 placeholder-slate-400 shadow-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Fine Details</th>
                                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Student Info</th>
                                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Type</th>
                                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Amount</th>
                                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Collected At</th>
                                <th className="p-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading fines...</td>
                                    </tr>
                                ))
                            ) : filteredFines.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Receipt size={28} className="text-slate-300" />
                                        </div>
                                        <p className="font-bold text-slate-600">No Fines Found</p>
                                        <p className="text-xs text-slate-400 mt-1">There are no fine records matching your current filter.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredFines.map(f => (
                                    <tr key={f.fine.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-sm">{f.fine.fine_code}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                    <Clock size={10} /> {new Date(f.fine.created_at * 1000).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-sm">{f.student?.name}</span>
                                                <span className="text-xs font-medium text-slate-500 mt-0.5">{f.student?.roll_number}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-[10px] font-bold text-slate-600 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg uppercase tracking-wider">
                                                {f.fine.fine_type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800 text-base">₹{f.fine.total_fine}</span>
                                                {f.fine.paid_amount > 0 && f.fine.paid_amount < f.fine.total_fine && (
                                                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">Partial: ₹{f.fine.paid_amount}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            {f.fine.is_paid === 1 || (f.fine.paid_amount && f.fine.paid_amount >= f.fine.total_fine) ? (
                                                <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg w-fit">
                                                    <CheckCircle size={14} /> Full Paid
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-rose-600 bg-rose-50 border border-rose-100 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg w-fit">
                                                    <AlertCircle size={14} /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-xs font-medium text-slate-500">
                                            {f.fine.paid_at ? new Date(f.fine.paid_at * 1000).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--'}
                                        </td>
                                        <td className="p-5 text-right">
                                            {!(f.fine.is_paid === 1 || (f.fine.paid_amount && f.fine.paid_amount >= f.fine.total_fine)) && (
                                                <button
                                                    onClick={() => handleCollect(f.fine.id, f.fine.total_fine - (f.fine.paid_amount || 0))}
                                                    className="px-4 py-2 bg-white border border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                                >
                                                    Collect Payment
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
                <PaymentModal
                  open={paymentOpen}
                  onClose={cancelPayment}
                  fine={paymentFine}
                  amount={paymentAmount}
                  onAmountChange={setPaymentAmount}
                  onSubmit={submitPayment}
                />
                </div>
    );
};

export default Fines;
