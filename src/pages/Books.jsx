import React, { useState, useEffect, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender
} from '@tanstack/react-table';
import {
    Plus,
    Search,
    Filter,
    Download,
    Printer,
    FileSpreadsheet,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Book as BookIcon,
    Layers,
    Tag
} from 'lucide-react';
import BookModal from '../components/ui/BookModal';
import Dropdown from '../components/ui/Dropdown';
import useUiStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

const Books = () => {
    const { addToast } = useUiStore();
    const { user } = useAuthStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null);

    const fetchBooks = async () => {
        setLoading(true);
        const result = await window.electron.ipc.invoke('books:getAll');
        if (result.success) {
            setData(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const categories = useMemo(() => {
        const cats = new Set(data.map(b => b.category));
        return ['All Categories', ...Array.from(cats)];
    }, [data]);

    const handleEdit = (book) => {
        setEditingBook(book);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            const result = await window.electron.ipc.invoke('books:delete', { id, adminId: user?._id });
            if (result.success) {
                addToast('Book deleted successfully', 'success');
                fetchBooks();
            } else {
                addToast(result.error || 'Failed to delete book', 'error');
            }
        }
    };

    const filteredData = useMemo(() => {
        if (selectedCategory === 'All Categories') return data;
        return data.filter(b => b.category === selectedCategory);
    }, [data, selectedCategory]);

    const columns = useMemo(() => [
        {
            accessorKey: 'book_code',
            header: 'Code',
            cell: info => <span className="font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider border border-teal-100">{info.getValue()}</span>
        },
        {
            accessorKey: 'title',
            header: 'Title',
            cell: info => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 line-clamp-1">{info.getValue()}</span>
                    <span className="text-[10px] text-slate-400 font-bold tracking-tight">ISBN: {info.row.original.isbn || 'N/A'}</span>
                </div>
            )
        },
        {
            accessorKey: 'author',
            header: 'Author',
            cell: info => <span className="font-medium text-slate-600">{info.getValue()}</span>
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: info => (
                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {info.getValue()}
                </span>
            )
        },
        {
            accessorKey: 'total_copies',
            header: 'Total',
            cell: info => <span className="font-medium text-slate-600">{info.getValue()}</span>
        },
        {
            accessorKey: 'available_copies',
            header: 'Available',
            cell: info => {
                const val = info.getValue();
                return (
                    <span className={`font-black px-2 py-1 rounded-lg text-xs ${val === 0 ? 'text-rose-600 bg-rose-50' : val <= 2 ? 'text-orange-600 bg-orange-50' : 'text-emerald-600 bg-emerald-50'}`}>
                        {val}
                    </span>
                );
            }
        },
        {
            accessorKey: 'price',
            header: 'Price',
            cell: info => <span className="font-bold text-slate-700">₹{info.getValue()}</span>
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: info => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors active:scale-95"
                        onClick={() => handleEdit(info.row.original)}
                        title="Edit Book"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors active:scale-95"
                        onClick={() => handleDelete(info.row.original.id)}
                        title="Delete Book"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ], [data]);

    const table = useReactTable({
        data: filteredData,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: { pagination: { pageSize: 12 } }
    });

    const handleExportExcel = async () => {
        const result = await window.electron.ipc.invoke('reports:exportExcel', {
            data: filteredData,
            columns: [
                { header: 'ISBN Code', key: 'book_code' },
                { header: 'Title', key: 'title' },
                { header: 'Author', key: 'author' },
                { header: 'Category', key: 'category' },
                { header: 'Price', key: 'price' },
                { header: 'Total Copies', key: 'total_copies' },
            ],
            fileName: 'Library_Books_Export.xlsx',
            title: 'Library Management System - Book Inventory'
        });
        if (result.success) addToast('Inventory exported to Excel', 'success');
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600  text-white rounded-3xl flex items-center justify-center shadow-sm">
                            <BookIcon size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-500">Book Inventory</h2>
                            <p className="text-xs text-slate-500  font-semibold ">{data.length} Total Books registered</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExportExcel} 
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <Download size={18} />
                            Export
                        </button>
                        <button 
                            onClick={() => { setEditingBook(null); setIsModalOpen(true); }} 
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            Add New Book
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Table Filters */}
                    <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
                        <div className="relative w-full lg:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-all duration-300" size={20} />
                            <input
                                type="text"
                                value={globalFilter}
                                onChange={e => setGlobalFilter(e.target.value)}
                                placeholder="Search books smoothly..."
                                className="bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 w-full outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-sm font-medium text-slate-700 placeholder-slate-400 shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-56">
                                <Dropdown
                                    options={categories}
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                    icon={Tag}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id} className="bg-slate-50 border-b border-slate-100">
                                        {headerGroup.headers.map(header => (
                                            <th key={header.id} className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center gap-2 group' : ''}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {header.column.getCanSort() && <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    Array(6).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={8} className="p-10 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Syncing Book Records...</td>
                                        </tr>
                                    ))
                                ) : table.getRowModel().rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-24 text-center">
                                            <div className="relative inline-block">
                                                <Layers className="mx-auto mb-6 text-slate-200" size={120} />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <BookIcon size={40} className="text-teal-500/20 animate-bounce" />
                                                </div>
                                            </div>
                                            <p className="font-black text-2xl text-slate-800 tracking-tight">Inventory Empty</p>
                                            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto font-medium">No books match your current search or category filters. Try clearing them.</p>
                                            <button className="mt-8 mx-auto flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95" onClick={() => { setGlobalFilter(''); setSelectedCategory('All Categories'); }}>Clear All Filters</button>
                                        </td>
                                    </tr>
                                ) : (
                                    table.getRowModel().rows.map(row => (
                                        <tr key={row.id} className="group hover:bg-teal-50/40 transition-colors duration-200 border-b border-slate-50 last:border-0">
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id} className="p-5 text-sm text-slate-700">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            Showing <span className="text-slate-800">{table.getState().pagination.pageIndex * 12 + 1}</span> to <span className="text-slate-800">{Math.min((table.getState().pagination.pageIndex + 1) * 12, filteredData.length)}</span> of <span className="text-teal-600">{filteredData.length}</span> entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1.5 mx-2">
                                {Array.from({ length: table.getPageCount() }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => table.setPageIndex(i)}
                                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all duration-300 ${table.getState().pagination.pageIndex === i
                                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20 scale-110'
                                            : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                )).slice(0, 5)}
                            </div>
                            <button
                                className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <BookModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingBook(null); }}
                onSuccess={fetchBooks}
                book={editingBook}
            />
        </>
    );
};

export default Books;
