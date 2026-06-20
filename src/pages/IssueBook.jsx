import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Users,
    Book as BookIcon,
    Calendar,
    Search,
    Info,
    CheckCircle2,
    BookOpen,
    Clock,
    CreditCard
} from 'lucide-react';
import useUiStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

const issueSchema = z.object({
    student_id: z.string({ required_error: 'Please select a student' }).min(1, 'Please select a student'),
    book_id: z.string({ required_error: 'Please select a book' }).min(1, 'Please select a book'),
    notes: z.string().optional(),
});

const IssueBook = () => {
    const { addToast } = useUiStore();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [bookSearch, setBookSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [matchingStudents, setMatchingStudents] = useState([]);
    const [matchingBooks, setMatchingBooks] = useState([]);

    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 6); // Default 6 days
        return d.toISOString().split('T')[0];
    });

    const { handleSubmit, setValue, reset, formState: { errors } } = useForm({
        resolver: zodResolver(issueSchema)
    });

    const handleSearchStudent = async () => {
        if (!studentSearch) return;
        setMatchingStudents([]);
        const result = await window.electron.ipc.invoke('students:getAll', { search: studentSearch });
        if (result.success && result.data.length > 0) {
            if (result.data.length === 1) {
                const student = result.data[0];
                setSelectedStudent(student);
                setValue('student_id', student._id || student.id);
                setStudentSearch('');
                addToast(`Student found: ${student.name}`, 'success');
            } else {
                setMatchingStudents(result.data);
                addToast(`${result.data.length} matching students found`, 'info');
            }
        } else {
            addToast('Student not found', 'error');
        }
    };

    const handleSearchBook = async () => {
        if (!bookSearch) return;
        setMatchingBooks([]);
        const result = await window.electron.ipc.invoke('books:getAll', { search: bookSearch });
        if (result.success && result.data.length > 0) {
            if (result.data.length === 1) {
                const book = result.data[0];
                if (book.available_copies <= 0) {
                    addToast('Book out of stock', 'warning');
                    return;
                }
                setSelectedBook(book);
                setValue('book_id', book._id || book.id);
                setBookSearch('');
                addToast(`Book found: ${book.title}`, 'success');
            } else {
                setMatchingBooks(result.data);
                addToast(`${result.data.length} matching books found`, 'info');
            }
        } else {
            addToast('Book not found', 'error');
        }
    };

    const onSubmit = async (data) => {
        if (!window.electron) {
            addToast('Running in browser mode. Issue logic bypassed.', 'success');
            return;
        }
        setLoading(true);
        const payload = {
            ...data,
            issue_date: Math.floor(Date.now() / 1000),
            due_date: Math.floor(new Date(dueDate).getTime() / 1000),
        };
        const result = await window.electron.ipc.invoke('issues:create', {
            data: payload,
            adminId: user?.id || user?._id
        });
        setLoading(false);

        if (result.success) {
            addToast('Book issued successfully', 'success');
            reset();
            setSelectedStudent(null);
            setSelectedBook(null);
            setMatchingStudents([]);
            setMatchingBooks([]);
            setStudentSearch('');
            setBookSearch('');
        } else {
            addToast(result.error || 'Failed to issue book', 'error');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/30 text-white">
                    <BookOpen size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-500">Issue Book</h2>
                    <p className="text-sm text-slate-500 font-semibold">Lend books to students securely and track their returns.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Selection Card */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">1. Student Details</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-24 py-3.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-700 font-medium placeholder:text-slate-400"
                                placeholder="Enter Student Code, Roll No or Name..."
                                value={studentSearch}
                                onChange={e => {
                                    setStudentSearch(e.target.value);
                                    if (matchingStudents.length > 0) setMatchingStudents([]);
                                }}
                                onKeyDown={e => e.key === 'Enter' && handleSearchStudent()}
                            />
                            <button 
                                onClick={handleSearchStudent}
                                className="absolute right-2 top-2 bottom-2 px-4 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-bold text-slate-700 hover:text-teal-600 hover:border-teal-200 transition-colors active:scale-95"
                            >
                                Find
                            </button>

                            {matchingStudents.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-50">
                                    <div className="p-2 bg-slate-50 flex justify-between items-center sticky top-0 border-b border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Multiple Matches Found</span>
                                        <button 
                                            type="button"
                                            onClick={() => setMatchingStudents([])} 
                                            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 rounded hover:bg-slate-200"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    {matchingStudents.map(student => (
                                        <div
                                            key={student._id || student.id}
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setValue('student_id', student._id || student.id);
                                                setMatchingStudents([]);
                                                setStudentSearch('');
                                                addToast(`Student selected: ${student.name}`, 'success');
                                            }}
                                            className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                                    {student.student_code} • Roll {student.roll_number} • {student.class}
                                                </p>
                                            </div>
                                            <span className="text-[10px] bg-teal-50 text-teal-600 font-bold px-2 py-1 rounded">Select</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedStudent ? (
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50 rounded-2xl p-5 flex items-center gap-4 animate-scale-in shadow-inner">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 font-black text-xl border border-emerald-100">
                                    {selectedStudent.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-base font-bold text-slate-800">{selectedStudent.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{selectedStudent.student_code}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Roll {selectedStudent.roll_number}</span>
                                    </div>
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                        {selectedStudent.class} • {selectedStudent.year} Year
                                    </div>
                                </div>
                                <CheckCircle2 className="text-emerald-500" size={28} />
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-slate-50/50">
                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-slate-300">
                                    <Users size={32} />
                                </div>
                                <p className="text-slate-500 font-medium">Search to select a student</p>
                                <p className="text-xs text-slate-400 mt-1">Required to issue a book</p>
                            </div>
                        )}
                        {errors.student_id && <p className="text-xs text-rose-500 font-bold px-1 animate-fade-in">{errors.student_id.message}</p>}
                    </div>
                </div>

                {/* Book Selection Card */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                            <BookIcon size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">2. Book Details</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-24 py-3.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-700 font-medium placeholder:text-slate-400"
                                placeholder="Enter Book Code, Title or ISBN..."
                                value={bookSearch}
                                onChange={e => {
                                    setBookSearch(e.target.value);
                                    if (matchingBooks.length > 0) setMatchingBooks([]);
                                }}
                                onKeyDown={e => e.key === 'Enter' && handleSearchBook()}
                            />
                            <button 
                                onClick={handleSearchBook}
                                className="absolute right-2 top-2 bottom-2 px-4 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-bold text-slate-700 hover:text-teal-600 hover:border-teal-200 transition-colors active:scale-95"
                            >
                                Find
                            </button>

                            {matchingBooks.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-50">
                                    <div className="p-2 bg-slate-50 flex justify-between items-center sticky top-0 border-b border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Multiple Matches Found</span>
                                        <button 
                                            type="button"
                                            onClick={() => setMatchingBooks([])} 
                                            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 rounded hover:bg-slate-200"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    {matchingBooks.map(book => (
                                        <div
                                            key={book._id || book.id}
                                            onClick={() => {
                                                if (book.available_copies <= 0) {
                                                    addToast('Book out of stock', 'warning');
                                                    return;
                                                }
                                                setSelectedBook(book);
                                                setValue('book_id', book._id || book.id);
                                                setMatchingBooks([]);
                                                setBookSearch('');
                                                addToast(`Book selected: ${book.title}`, 'success');
                                            }}
                                            className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                                        >
                                            <div className="min-w-0 flex-1 pr-4">
                                                <p className="text-sm font-bold text-slate-800 truncate" title={book.title}>{book.title}</p>
                                                <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                                                    {book.book_code} • {book.author} • Category: {book.category}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${book.available_copies > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    Qty: {book.available_copies}
                                                </span>
                                                {book.available_copies > 0 && (
                                                    <span className="text-[10px] bg-teal-50 text-teal-600 font-bold px-2 py-1 rounded">Select</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedBook ? (
                            <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100/50 rounded-2xl p-5 flex items-center gap-4 animate-scale-in shadow-inner">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-teal-600 border border-teal-100">
                                    <BookIcon size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-bold text-slate-800 truncate" title={selectedBook.title}>{selectedBook.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{selectedBook.book_code}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{selectedBook.author}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-100/50 text-teal-700 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                            {selectedBook.category}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${selectedBook.available_copies > 2 ? 'bg-emerald-100/50 text-emerald-700' : 'bg-orange-100/50 text-orange-700'}`}>
                                            Available: {selectedBook.available_copies}
                                        </span>
                                    </div>
                                </div>
                                <CheckCircle2 className="text-teal-500 flex-shrink-0" size={28} />
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-slate-50/50">
                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-slate-300">
                                    <BookIcon size={32} />
                                </div>
                                <p className="text-slate-500 font-medium">Search to select a book</p>
                                <p className="text-xs text-slate-400 mt-1">Verify availability before issuing</p>
                            </div>
                        )}
                        {errors.book_id && <p className="text-xs text-rose-500 font-bold px-1 animate-fade-in">{errors.book_id.message}</p>}
                    </div>
                </div>
            </div>

            {/* Confirmation Section */}
            <div className="bg-slate-800 rounded-3xl p-1 overflow-hidden shadow-2xl shadow-slate-900/20 relative">
                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"></div>
                
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-[22px] p-8 md:p-10 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 pb-8 border-b border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-teal-400 shadow-inner">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Issue Summary</h3>
                                <p className="text-slate-400 text-sm font-medium mt-1">Review dates and finalize</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 md:gap-12 bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 w-full md:w-auto">
                            <div>
                                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                    <Clock size={14} />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Issue Date</span>
                                </div>
                                <p className="text-white font-bold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="w-px h-10 bg-slate-700"></div>
                            <div>
                                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                    <Clock size={14} />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Due Date</span>
                                </div>
                                <input 
                                    type="date"
                                    className="bg-transparent text-teal-400 font-bold outline-none cursor-pointer hover:text-teal-300 focus:text-teal-300 transition-colors"
                                    style={{ colorScheme: 'dark' }}
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="w-px h-10 bg-slate-700 hidden sm:block"></div>
                            <div className="hidden sm:block">
                                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                    <CreditCard size={14} />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Late Fine</span>
                                </div>
                                <p className="text-rose-400 font-bold">₹10 / day</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 flex items-start gap-4 p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl">
                            <Info className="text-teal-500 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                By issuing this book, <span className="text-white font-bold">{selectedStudent?.name || 'the student'}</span> takes full responsibility. Ensure the book condition is verified before final handover.
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={() => { setSelectedStudent(null); setSelectedBook(null); setMatchingStudents([]); setMatchingBooks([]); reset(); setStudentSearch(''); setBookSearch(''); }}
                                className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors border border-slate-700 w-full md:w-auto active:scale-95"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleSubmit(onSubmit)}
                                disabled={!selectedStudent || !selectedBook || loading}
                                className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl font-black shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 w-full md:w-auto active:scale-95"
                            >
                                {loading ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        Confirm Issue
                                        <CheckCircle2 size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueBook;
