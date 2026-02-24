import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-bg font-sans text-textMain flex overflow-x-hidden">
            {/* Desktop Sidebar */}
            <Sidebar />

            <div className="flex-grow flex flex-col min-w-0 md:pl-64 w-full">
                {/* Mobile Top Navbar */}
                <Navbar />

                {/* Page Content */}
                <main className="flex-grow p-4 md:p-10 pt-20 md:pt-10 pb-28 md:pb-10">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation */}
                <BottomNav />
            </div>
        </div>
    );
};

export default MainLayout;
