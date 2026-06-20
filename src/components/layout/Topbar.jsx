import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronRight, LogOut, Settings, IndianRupee, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
const pageMeta = {
    '/': { title: 'Dashboard', subtitle: 'Overview & Analytics' },
    '/books': { title: 'Books Management', subtitle: 'Browse & manage inventory' },
    '/students': { title: 'Students Directory', subtitle: 'Enrolled members' },
    '/issue': { title: 'Issue Book', subtitle: 'Lend a book to a student' },
    '/returns': { title: 'Return Books', subtitle: 'Process book returns' },
    '/fines': { title: 'Fines & Payments', subtitle: 'Manage overdue charges' },
    '/settings': { title: 'System Settings', subtitle: 'Configuration & preferences' },
};

const Topbar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [showNotif, setShowNotif] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    const meta = pageMeta[location.pathname] || { title: 'LibraryPro', subtitle: '' };

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        if (!showNotif) return;
        const close = () => setShowNotif(false);
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, [showNotif]);

    // Close user menu when clicking outside
    useEffect(() => {
        if (!showUserMenu) return;
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showUserMenu]);

    const { notifications, fetchAll, markRead, deleteNotification } = useNotificationStore();
    const initials = user?.name ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'A';

    // Fetch notifications on mount or when user changes
    useEffect(() => {
        if (user?.id) {
            fetchAll(user.id);
        }
    }, [user?.id]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <header className="h-16 border-r border-t border-slate-100  px-6 flex items-center justify-between sticky top-0 bg-white  z-40 ">

            {/* Left — Breadcrumb + page title */}
            <div className="flex flex-col justify-center animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-0.5">
                    <span>Library Portal</span>
                    <ChevronRight size={12} />
                    <span className="text-teal-500 font-semibold">{meta.title}</span>
                </div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight tracking-tight">{meta.title}</h1>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">

                {/* Search bar */}
                <div className={`relative flex items-center transition-all duration-300 ease-in-out ${searchFocused ? 'w-72' : 'w-52'}`}>
                    <Search
                        size={16}
                        className={`absolute left-3 z-10 pointer-events-none transition-colors duration-300 ${searchFocused ? 'text-teal-500' : 'text-slate-400'}`}
                    />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Search..."
                        className={`w-full pl-9 pr-4 h-9 rounded-xl text-sm font-medium outline-none transition-all duration-300
                            border bg-slate-50 text-slate-700 placeholder-slate-400
                            ${searchFocused
                                ? 'border-teal-400 ring-4 ring-teal-50 bg-white shadow-sm'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                    />
                </div>

                {/* Divider */}
                <div className="h-7 w-px bg-slate-200 mx-1" />

                {/* Online indicator */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-500
                    ${isOnline ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {isOnline ? 'Online' : 'Offline'}
                </div>

                {/* Notifications */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setShowNotif(v => !v)}
                        className="w-9 h-9 border border-slate-200 flex items-center justify-center rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all duration-300 active:scale-90 focus:outline-none"
                    >
                         <Bell size={18} />
                         {unreadCount > 0 && (
                             <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                                 {unreadCount}
                             </span>
                         )}
                    </button>

                    {/* Dropdown */}
                    {showNotif && (
                        <div className="absolute right-0 top-12 w-72 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/60 py-3 z-50 animate-slide-in">
                            <div className="px-4 pb-2 border-b border-slate-100 mb-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notifications</p>
                            </div>
                            <div className="px-3 space-y-1">
                                {notifications.map((n, i) => (
                                    <div key={i} className="flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors duration-200 group">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-slate-300' : n.type === 'info' ? 'bg-teal-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{n.title}</p>
                                            <p className="text-xs text-slate-400">{n.message}</p>
                                            <p className="text-xs text-slate-300 mt-0.5">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {!n.isRead && (
                                                <button onClick={() => markRead(n._id)} className="text-xs text-teal-600 hover:underline">Mark as read</button>
                                            )}
                                            <button onClick={() => deleteNotification(n._id)} className="text-xs text-rose-600 hover:underline">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-7 w-px bg-slate-200 mx-1" />

                {/* User menu dropdown */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all duration-300 group"
                    >
                        <div className="w-9 h-9 rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-teal-500/30 group-hover:shadow-teal-500/50 transition-shadow duration-300 flex-shrink-0 select-none">
                            {initials}
                        </div>
                        <div className="flex flex-col leading-tight text-left">
                            <span className="text-sm font-semibold text-slate-800 group-hover:text-teal-600 transition-colors duration-300 whitespace-nowrap">
                                {user?.name || 'Admin'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                                {user?.role || 'Administrator'}
                            </span>
                        </div>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* User dropdown menu */}
                    {showUserMenu && (
                        <div className="absolute right-0 top-12 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60  z-50 animate-slide-in">
                            {/* User info header */}
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-sm font-bold text-slate-800">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-slate-500 mt-1">{user?.email || 'admin@library.com'}</p>
                                <div className="inline-block mt-2 px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg">
                                    {user?.role || 'Administrator'}
                                </div>
                            </div>

                            {/* Menu items */}
                            <div className="">
                                <button
                                    onClick={() => {
                                        navigate('/fines');
                                        setShowUserMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:text-teal-600 hover:bg-teal-50 transition-colors duration-200 group"
                                >
                                    <IndianRupee size={18} className="group-hover:scale-110 transition-transform duration-200" />
                                    <span className="text-sm font-medium">Fines</span>
                                </button>
                                <button
                                    onClick={() => {
                                        navigate('/settings');
                                        setShowUserMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:text-teal-600 hover:bg-teal-50 transition-colors duration-200 group"
                                >
                                    <Settings size={18} className="group-hover:scale-110 transition-transform duration-200" />
                                    <span className="text-sm font-medium">Settings</span>
                                </button>
                            </div>

                            {/* Logout button */}
                            <div className="border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        logout();
                                        setShowUserMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-200 group"
                                >
                                    <LogOut size={18} className="group-hover:rotate-12 transition-transform duration-200" />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
