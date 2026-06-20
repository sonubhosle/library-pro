import React, { useState, useEffect } from 'react';
import { Search, ReceiptText, Trash2, Printer, Download, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import useUiStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import InvoiceModal from '../components/ui/InvoiceModal';

const Invoices = () => {
    const { addToast } = useUiStore();
    const { user } = useAuthStore();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const result = await window.electron.ipc.invoke('invoices:getAll');
            if (result.success) {
                setInvoices(result.data);
            } else {
                addToast(result.error || 'Failed to fetch invoices', 'error');
            }
        } catch (error) {
            addToast('An error occurred while fetching invoices', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;

        setDeletingId(id);
        try {
            const result = await window.electron.ipc.invoke('invoices:delete', { 
                id, 
                adminId: user.id || user._id 
            });
            if (result.success) {
                addToast('Invoice deleted successfully', 'success');
                fetchInvoices();
            } else {
                addToast(result.error || 'Failed to delete invoice', 'error');
            }
        } catch (error) {
            addToast('An error occurred while deleting invoice', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleViewInvoice = (invoice) => {
        setSelectedInvoiceData({
            invoice,
            student: invoice.student_id,
            issue: invoice.issue_id,
            book: invoice.issue_id?.book_id,
            fine: invoice.fine_id
        });
        setIsModalOpen(true);
    };

    const filteredInvoices = invoices.filter(inv => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            inv.invoice_number?.toLowerCase().includes(q) ||
            inv.student_id?.name?.toLowerCase().includes(q) ||
            inv.student_id?.roll_number?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/30 text-white flex-shrink-0">
                        <ReceiptText size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-500">Invoices</h2>
                        <p className="text-sm text-slate-500 font-semibold">Manage, print, and delete generated invoices.</p>
                    </div>
                </div>
                <button onClick={fetchInvoices} className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Search */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden flex items-center gap-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-0 pointer-events-none" />
                    <div className="relative flex-1 z-10">
                        <Search className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                        <input
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-700 font-medium placeholder:text-slate-400"
                            placeholder="Search by invoice number, student name, roll no..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    {loading && invoices.length === 0 ? (
                        <div className="text-center py-20">
                            <RefreshCw className="mx-auto h-8 w-8 text-teal-400 animate-spin mb-4" />
                            <p className="text-slate-500 font-semibold">Loading invoices...</p>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-20">
                            <ReceiptText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <p className="text-slate-500 font-semibold text-lg">No invoices found</p>
                            <p className="text-slate-400 text-sm mt-1">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Invoice Details</th>
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredInvoices.map((inv) => (
                                        <tr key={inv.id || inv._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                                        <ReceiptText size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">{inv.invoice_number}</span>
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                                                                inv.invoice_type === 'lost_book' 
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                                    : 'bg-teal-50 text-teal-700 border-teal-200'
                                                            }`}>
                                                                {inv.invoice_type === 'lost_book' ? 'Lost' : 'Return'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium capitalize mt-0.5">{inv.invoice_type?.replace('_', ' ')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-slate-800">{inv.student_id?.name || 'Unknown'}</div>
                                                <div className="text-xs text-slate-500 font-medium">Roll: {inv.student_id?.roll_number || 'N/A'}</div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                                                {new Date(inv.generated_at * 1000).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 font-black text-teal-600">
                                                ₹{inv.total}
                                            </td>
                                            <td className="py-4 px-6">
                                                {inv.is_paid ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        <CheckCircle2 size={12} /> Paid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                                                        <AlertCircle size={12} /> Unpaid
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleViewInvoice(inv)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="View / Print"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(inv.id || inv._id)}
                                                        disabled={deletingId === (inv.id || inv._id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        {deletingId === (inv.id || inv._id) ? (
                                                            <RefreshCw size={18} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <InvoiceModal 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedInvoiceData(null); }}
                invoiceData={selectedInvoiceData}
            />
        </div>
    );
};

export default Invoices;
