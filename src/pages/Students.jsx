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
    Users,
    Layers,
    UserCircle
} from 'lucide-react';
import useUiStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import Dropdown from '../components/ui/Dropdown';
import ConfirmModal from '../components/ui/ConfirmModal';
import StudentModal from '../components/ui/StudentModal';

const Students = () => {
    const { addToast } = useUiStore();
    const { user } = useAuthStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedClass, setSelectedClass] = useState('All Classes');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    const filteredData = useMemo(() => {
        if (selectedClass === 'All Classes') return data;
        return data.filter(s => s.class === selectedClass);
    }, [data, selectedClass]);

    // Fetch data
    const fetchStudents = async () => {
        setLoading(true);
        const result = await window.electron.ipc.invoke('students:getAll');
        if (result.success) {
            setData(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const columns = useMemo(() => [
       
        
        {
            accessorKey: 'name',
            header: 'Name',
            cell: info => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs">
                        {info.getValue().charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 leading-tight">{info.getValue()}</span>
                        <span className="text-[10px] text-slate-400 font-bold">Roll: {info.row.original.roll_number}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'class',
            header: 'Class',
            cell: info => `${info.getValue()} - ${info.row.original.year} Year`
        },
        {
            accessorKey: 'phone',
            header: 'Phone',
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: info => {
                const isActive = info.getValue() !== 0 && info.getValue() !== false ? 1 : 0;
                return (
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isActive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </span>
                );
            }
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: info => (
                <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={() => {
                            setEditingStudent(info.row.original);
                            setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors active:scale-95" 
                        title="Edit Student"
                    >
                        <Edit size={16} />
                    </button>
                    <button 
                        onClick={() => handleDeleteStudent(info.row.original)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors active:scale-95" 
                        title="Delete Student"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ], []);

    const table = useReactTable({
        data: filteredData,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: { pagination: { pageSize: 15 } }
    });

    const handleExportExcel = async () => {
        const result = await window.electron.ipc.invoke('reports:exportExcel', {
            data,
            columns: [
                { header: 'Student Code', key: 'student_code' },
                { header: 'Name', key: 'name' },
                { header: 'Roll Number', key: 'roll_number' },
                { header: 'Class', key: 'class' },
                { header: 'Year', key: 'year' },
                { header: 'Phone', key: 'phone' },
            ],
            fileName: 'Students_Report.xlsx',
            title: 'Current Students Registry'
        });
        if (result.success) addToast('Excel report exported successfully', 'success');
    };

    // Print the current page
    const handlePrint = () => {
        window.print();
    };

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);

    const handleDeleteStudent = (student) => {
        setStudentToDelete(student);
        setConfirmOpen(true);
    };



    const confirmDelete = async () => {
        if (!studentToDelete) return;
        try {
            const result = await window.electron.ipc.invoke('students:delete', { id: studentToDelete.id, adminId: user?._id });
            if (result.success) {
                addToast(`Student "${studentToDelete.name}" deleted successfully`, 'success');
                fetchStudents();
            } else {
                addToast(result.error || 'Failed to delete student', 'error');
            }
        } catch (error) {
            addToast('An unexpected error occurred', 'error');
        } finally {
            setConfirmOpen(false);
            setStudentToDelete(null);
        }
    };

    const cancelDelete = () => {
        setConfirmOpen(false);
        setStudentToDelete(null);
    };

    return (
        <>
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600  text-white rounded-3xl flex items-center justify-center shadow-sm">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-500">Student Directory</h2>
                        <p className="text-xs text-slate-500 font-semibold">{data.length} Total Students registered</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExportExcel} 
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <FileSpreadsheet size={18} />
                        Export
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <Printer size={18} />
                        Print
                    </button>
                    <button 
                        onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Add New Student
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
                            placeholder="Search by name, roll number, or code..."
                            className="bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 w-full outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-sm font-medium text-slate-700 placeholder-slate-400 shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-48">
                            <Dropdown
                                options={['All Classes', 'BCA', 'B.sc cs']}
                                value={selectedClass}
                                onChange={setSelectedClass}
                                icon={Layers}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                            <Filter size={18} />
                            Filters
                        </button>
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
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading database...</td>
                                    </tr>
                                ))
                            ) : table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-24 text-center">
                                        <div className="relative inline-block">
                                            <Layers className="mx-auto mb-6 text-slate-200" size={120} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Users size={40} className="text-teal-500/20 animate-bounce" />
                                            </div>
                                        </div>
                                        <p className="font-black text-2xl text-slate-800 tracking-tight">No Students Found</p>
                                        <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto font-medium">Try adding some students to your registry or clearing active filters.</p>
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
                        Showing <span className="text-slate-800">{table.getState().pagination.pageIndex * 15 + 1}</span> to <span className="text-slate-800">{Math.min((table.getState().pagination.pageIndex + 1) * 15, data.length)}</span> of <span className="text-teal-600">{data.length}</span> results
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

        <StudentModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingStudent(null); }}
            onSuccess={fetchStudents}
            student={editingStudent}
        />
        </>
    );
};

export default Students;
