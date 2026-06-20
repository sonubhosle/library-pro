import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useUiStore from '../../store/uiStore';

const Layout = () => {
    const { isSidebarOpen } = useUiStore();

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
                <Topbar />
                <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
