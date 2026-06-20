import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Book,
    Users,
    PlusCircle,
    RotateCcw,
    IndianRupee,
    Settings,
    Library,
    ChevronLeft,
    ChevronRight,
    ReceiptText
} from 'lucide-react';
import useUiStore from '../../store/uiStore';

const Sidebar = () => {
    const { isSidebarOpen, toggleSidebar } = useUiStore();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Books', path: '/books', icon: Book },
        { name: 'Students', path: '/students', icon: Users },
        { name: 'Issue Book', path: '/issue', icon: PlusCircle },
        { name: 'Returns', path: '/returns', icon: RotateCcw },
        { name: 'Fines', path: '/fines', icon: IndianRupee },
        { name: 'Invoices', path: '/invoices', icon: ReceiptText },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <aside
            className={`fixed top-0 left-0 h-full bg-white border-r border-t border-slate-100 transition-all duration-300 ease-in-out z-50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${isSidebarOpen ? 'w-64' : 'w-20'
                }`}
        >
            {/* Logo */}
            <div className="h-20 flex items-center px-6 gap-8 overflow-hidden border-b border-slate-100">
                <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/30">
                    <Library className="text-white w-6 h-6" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-700 whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'}">
                        MIT COLLEGE
                    </span>
                    <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-slate-500 to-slate-700 whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'}">
                        LMS System
                    </span>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3.5 top-24 bg-white border border-slate-200 w-7 h-7 rounded-full flex items-center justify-center text-slate-500 shadow-sm hover:text-teal-600 hover:border-teal-300 hover:shadow-md transition-all duration-300 z-10 focus:outline-none"
            >
                {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Nav Items */}
            <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            relative flex items-center px-4 py-3 rounded-xl transition-colors duration-300 group font-medium overflow-hidden
                            ${isActive
                                ? 'text-teal-600'
                                : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <div className="relative z-10 flex items-center w-full">
                                <div className="w-6 flex justify-center flex-shrink-0">
                                    <item.icon size={22} className="transition-transform group-hover:scale-110 duration-300" />
                                </div>
                                <span className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'opacity-100 ml-4 translate-x-0' : 'opacity-0 w-0 ml-0 -translate-x-4'}`}>
                                    {item.name}
                                </span>
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
