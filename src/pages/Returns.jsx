import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    RotateCcw,
    Book as BookIcon,
    AlertCircle,
    CheckCircle2,
    Receipt,
    Clock,
    CalendarDays,
    IndianRupee,
    StickyNote,
    ArrowLeftRight,
    User,
} from 'lucide-react';
import useUiStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import InvoiceModal from '../components/ui/InvoiceModal';

const Returns = () => {
    const { addToast } = useUiStore();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [allIssues, setAllIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [notes, setNotes] = useState('');
    const [generatedInvoice, setGeneratedInvoice] = useState(null);
    const [lastProcessedReturn, setLastProcessedReturn] = useState(null);
    const [isLostMode, setIsLostMode] = useState(false);
    const [collectPayment, setCollectPayment] = useState(true);

    const fetchIssues = async () => {
        setLoading(true);
        const result = await window.electron.ipc.invoke('issues:getAll', { status: 'issued' });
        if (result.success) {
            setAllIssues(result.data || []);
        } else {
            addToast('Failed to load active issues', 'error');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const filteredIssues = useMemo(() => {
        if (!searchQuery.trim()) return allIssues;
        const q = searchQuery.toLowerCase();
        return allIssues.filter(issue =>
            issue.student?.name?.toLowerCase().includes(q) ||
            issue.student?.student_code?.toLowerCase().includes(q) ||
            issue.student?.roll_number?.toLowerCase().includes(q) ||
            issue.book?.title?.toLowerCase().includes(q) ||
            issue.book?.book_code?.toLowerCase().includes(q) ||
            issue.issue_code?.toLowerCase().includes(q)
        );
    }, [allIssues, searchQuery]);

    const calculateCurrentFine = (issue) => {
        const due = issue.due_date * 1000;
        const now = Date.now();
        if (now <= due) return 0;
        const daysLate = Math.ceil((now - due) / 86400000);
        return daysLate * 10;
    };

    const isOverdue = (issue) => Date.now() > issue.due_date * 1000;

    const lateFine = selectedIssue ? calculateCurrentFine(selectedIssue) : 0;
    const bookPrice = selectedIssue?.book?.price || 0;
    const totalPenalty = isLostMode ? (lateFine + bookPrice) : lateFine;

    const handleReturn = async () => {
        if (!selectedIssue) return;
        setLoading(true);
        const channel = isLostMode ? 'issues:markLost' : 'issues:return';
        const result = await window.electron.ipc.invoke(channel, {
            issueId: selectedIssue.id || selectedIssue._id,
            adminId: user?.id || user?._id,
            data: {
                admin_id: user?.id || user?._id,
                notes,
                is_paid: collectPayment ? 1 : 0,
                paid_amount: collectPayment ? (totalPenalty > 0 ? totalPenalty : 0) : 0
            }
        });
        setLoading(false);

        if (result.success) {
            setLastProcessedReturn({
                issue: selectedIssue,
                result: result,
                isLostMode,
                collectPayment,
                totalPenalty,
                bookPrice,
                lateFine
            });

            addToast(isLostMode ? 'Book marked as lost' : 'Book returned successfully', 'success');
            if (totalPenalty > 0) {
                if (collectPayment) {
                    addToast(`Payment of ₹${totalPenalty} collected successfully`, 'success');
                } else {
                    addToast(`Fine generated: ₹${totalPenalty}`, 'warning');
                }
            }

            setSelectedIssue(null);
            setNotes('');
            setIsLostMode(false);
            setCollectPayment(true);
            fetchIssues();
        } else {
            addToast(result.error || 'Failed to process return', 'error');
        }
    };

    const handleGenerateInvoice = async () => {
        if (!lastProcessedReturn) return;
        setLoading(true);
        const { issue, result, isLostMode, collectPayment, totalPenalty, bookPrice, lateFine } = lastProcessedReturn;
        const subtotal = totalPenalty;

        const invoicePayload = {
            issue_id: issue.id || issue._id,
            fine_id: result.fine?.fine_id || null,
            student_id: issue.student?.id || issue.student?._id,
            type: isLostMode ? 'lost_book' : 'return_receipt',
            items: [
                { description: `Book Return: ${issue.book?.title}`, amount: 0 },
                ...(isLostMode ? [{ description: `Lost Book Penalty (Book Price)`, amount: bookPrice }] : []),
                ...(lateFine > 0 ? [{ description: `Late Return Fine (${result.fine?.daysLate || Math.ceil((Date.now() - issue.due_date * 1000) / 86400000)} Days Late)`, amount: lateFine }] : [])
            ],
            subtotal: subtotal,
            total: subtotal,
            is_paid: collectPayment ? 1 : 0,
            admin_id: user?.id || user?._id
        };

        const invResult = await window.electron.ipc.invoke('invoices:generate', {
            data: invoicePayload,
            adminId: user?.id || user?._id
        });
        setLoading(false);

        if (invResult.success) {
            setGeneratedInvoice({
                invoice: invResult.data,
                student: issue.student,
                issue: result.issue || issue,
                book: result.book || issue.book,
                fine: result.fine || { totalFine: totalPenalty, type: isLostMode ? 'lost_book' : 'late_return', daysLate: result.fine?.daysLate || 0 }
            });
            setLastProcessedReturn(null);
        } else {
            addToast(invResult.error || 'Failed to generate invoice', 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/30 text-white flex-shrink-0">
                        <RotateCcw size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-500">Book Returns & Lost</h2>
                        <p className="text-sm text-slate-500 font-semibold">Process returns, mark lost books, and collect fines automatically.</p>
                    </div>
                </div>
                <button onClick={fetchIssues} className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95">
                    <RotateCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left Side: Filter and Issues List */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Search / Filter */}
                    <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-0 pointer-events-none" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-700 font-medium placeholder:text-slate-400"
                                    placeholder="Search by student name, roll no, book title, code..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="px-4 py-3 bg-teal-100 text-teal-700 rounded-2xl text-sm font-bold flex-shrink-0 text-center">
                                {filteredIssues.length} Active {filteredIssues.length === 1 ? 'Issue' : 'Issues'}
                            </div>
                        </div>
                    </div>

                    {/* Issues List */}
                    <div className="space-y-4">
                        {loading && allIssues.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Loading active issues...</div>
                        ) : filteredIssues.length > 0 ? (
                            filteredIssues.map(issue => {
                                const fine = calculateCurrentFine(issue);
                                const overdue = isOverdue(issue);
                                const selected = selectedIssue?.id === issue.id;
                                return (
                                    <div
                                        key={issue.id}
                                        onClick={() => {
                                            setSelectedIssue(issue);
                                            setLastProcessedReturn(null);
                                        }}
                                        className={`bg-white rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all duration-200 hover:shadow-md group flex flex-col sm:flex-row gap-4 sm:items-center justify-between
                                            ${selected
                                                ? 'border-teal-400 shadow-lg shadow-teal-500/10 ring-2 ring-teal-400/20'
                                                : 'border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-teal-200'
                                            }`}
                                    >
                                        <div className="flex gap-4 items-start sm:items-center min-w-0 flex-1 flex-col sm:flex-row">
                                            <div className="flex items-center gap-4 min-w-0 flex-1 w-full">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500'}`}>
                                                    <BookIcon size={22} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-800 truncate" title={issue.book?.title}>{issue.book?.title || 'Unknown Book'}</h4>
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{issue.book?.book_code} • {issue.issue_code}</p>
                                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            <CalendarDays size={10} />
                                                            {new Date(issue.issue_date * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${overdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                                            <Clock size={10} />
                                                            Due: {new Date(issue.due_date * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="min-w-0 flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4 w-full sm:w-auto">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase">
                                                    {issue.student?.name?.charAt(0) || <User size={14} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-700 truncate">{issue.student?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{issue.student?.student_code} • Roll {issue.student?.roll_number}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 w-full sm:w-auto">
                                            {fine > 0 ? (
                                                <div className="text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                                                    <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Late Fine</p>
                                                    <p className="text-lg font-black text-rose-500">₹{fine}</p>
                                                </div>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest">On Time</span>
                                            )}
                                            {selected && <CheckCircle2 size={20} className="text-teal-500 animate-scale-in hidden sm:block" />}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 sm:p-20 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <Receipt size={36} className="text-slate-300" />
                                </div>
                                <p className="font-bold text-slate-700">{searchQuery ? 'No matching issues found' : 'No Active Issues'}</p>
                                <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                                    {searchQuery ? 'Try adjusting your search query.' : 'There are currently no books issued to any student.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Action Panel */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Return Options</h3>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] sticky top-24 overflow-hidden">
                        {selectedIssue ? (
                            <div className="animate-scale-in">
                                {/* Penalty Banner */}
                                <div className={`px-5 py-4 border-b ${totalPenalty > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${totalPenalty > 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                                                {isLostMode ? 'Lost Book Penalty' : totalPenalty > 0 ? 'Late Fine Due' : 'No Fine'}
                                            </p>
                                            <p className={`text-3xl font-black mt-0.5 ${totalPenalty > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{totalPenalty}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${totalPenalty > 0 ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
                                            <IndianRupee size={22} />
                                        </div>
                                    </div>
                                    {/* Penalty breakdown */}
                                    {isLostMode && (
                                        <div className="mt-3 space-y-1">
                                            {bookPrice > 0 && (
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-rose-500 font-semibold">Book Price</span>
                                                    <span className="font-bold text-rose-600">₹{bookPrice}</span>
                                                </div>
                                            )}
                                            {lateFine > 0 && (
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-rose-500 font-semibold">Late Fine</span>
                                                    <span className="font-bold text-rose-600">₹{lateFine}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Issue Details */}
                                <div className="px-5 py-4 space-y-3 border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</span>
                                        <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]" title={selectedIssue.student?.name}>{selectedIssue.student?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Book</span>
                                        <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]" title={selectedIssue.book?.title}>{selectedIssue.book?.title}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Book Price</span>
                                        <span className="text-xs font-bold text-slate-700">₹{bookPrice}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</span>
                                        <span className={`text-xs font-bold ${isOverdue(selectedIssue) ? 'text-rose-500' : 'text-slate-700'}`}>
                                            {new Date(selectedIssue.due_date * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Mode Toggle */}
                                <div className="px-5 pt-4 border-b border-slate-100 pb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Return Action</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsLostMode(false)}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${!isLostMode ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            ✓ Normal Return
                                        </button>
                                        <button
                                            onClick={() => setIsLostMode(true)}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${isLostMode ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            ✗ Mark as Lost
                                        </button>
                                    </div>
                                    {isLostMode && (
                                        <p className="text-[10px] text-rose-500 font-semibold mt-2 text-center animate-fade-in">
                                            Marks book as lost and charges book price + late fine.
                                        </p>
                                    )}
                                </div>

                                {/* Payment Toggle */}
                                {(totalPenalty > 0 || isLostMode) && (
                                    <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collect Payment Now</p>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">₹{totalPenalty} total due</p>
                                            </div>
                                            <button
                                                onClick={() => setCollectPayment(v => !v)}
                                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${collectPayment ? 'bg-teal-500' : 'bg-slate-200'}`}
                                            >
                                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${collectPayment ? 'left-6' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                        {collectPayment && (
                                            <div className="mt-2 px-3 py-2 bg-teal-50 border border-teal-100 rounded-xl">
                                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Payment will be marked as PAID</p>
                                            </div>
                                        )}
                                        {!collectPayment && (
                                            <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Fine will be added to Fines & Payments</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Notes */}
                                <div className="px-5 pt-4 pb-3">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        <StickyNote size={10} />
                                        Notes / Remarks
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all min-h-[70px] resize-none placeholder:text-slate-400 font-medium"
                                        placeholder="Describe book condition..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>

                                {/* Confirm Button */}
                                <div className="px-5 pb-5">
                                    <button
                                        onClick={handleReturn}
                                        disabled={loading}
                                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
                                            ${isLostMode
                                                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-rose-500/20'
                                                : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-teal-500/20'
                                            }`}
                                    >
                                        {isLostMode ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                                        {loading ? 'Processing...' : isLostMode
                                            ? (collectPayment ? `Mark Lost & Collect ₹${totalPenalty > 0 ? totalPenalty : 0}` : 'Mark as Lost')
                                            : (collectPayment ? `Return & Collect ₹${totalPenalty > 0 ? totalPenalty : 0}` : 'Confirm Return')
                                        }
                                    </button>
                                </div>
                            </div>
                        ) : lastProcessedReturn ? (
                            <div className="p-6 text-center animate-scale-in">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h4 className="text-lg font-black text-slate-800">Return Processed!</h4>
                                <p className="text-sm text-slate-500 font-semibold mt-1">
                                    {lastProcessedReturn.isLostMode ? 'Book marked as lost.' : 'Book returned successfully.'}
                                </p>

                                <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-400 uppercase">Student</span>
                                        <span className="font-bold text-slate-700 truncate max-w-[150px]" title={lastProcessedReturn.issue.student?.name}>
                                            {lastProcessedReturn.issue.student?.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-400 uppercase">Book</span>
                                        <span className="font-bold text-slate-700 truncate max-w-[150px]" title={lastProcessedReturn.issue.book?.title}>
                                            {lastProcessedReturn.issue.book?.title}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
                                        <span className="font-bold text-slate-400 uppercase">Fine Due</span>
                                        <span className="font-extrabold text-slate-800">₹{lastProcessedReturn.totalPenalty}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-400 uppercase">Status</span>
                                        <span className={`font-black ${lastProcessedReturn.collectPayment ? 'text-emerald-600' : 'text-amber-500'}`}>
                                            {lastProcessedReturn.collectPayment ? 'PAID' : 'UNPAID'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={handleGenerateInvoice}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-500/20 hover:shadow-teal-500/35 transition-all active:scale-95 disabled:opacity-60"
                                    >
                                        <Receipt size={18} />
                                        {loading ? 'Generating...' : 'Generate Invoice'}
                                    </button>
                                    <button
                                        onClick={() => setLastProcessedReturn(null)}
                                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all active:scale-95"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ArrowLeftRight size={28} className="text-slate-300" />
                                </div>
                                <p className="font-bold text-slate-600">No Issue Selected</p>
                                <p className="text-xs text-slate-400 mt-1">Select an active issue from the list to process it.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <InvoiceModal
                isOpen={!!generatedInvoice}
                onClose={() => setGeneratedInvoice(null)}
                invoiceData={generatedInvoice}
            />
        </div>
    );
};

export default Returns;
