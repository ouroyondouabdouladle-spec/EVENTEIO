import React from 'react';
import BottomNav from '@/components/layout/BottomNav';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* ── Desktop Layout (≥ 1024px) ── */}
            <div className="dashboard-desktop-shell">
                <Sidebar />
                <div className="dashboard-main-area">
                    <Topbar />
                    <div className="dashboard-content-area">
                        {children}
                    </div>
                </div>
            </div>

            {/* ── Mobile Layout (< 1024px) ── */}
            <div className="dashboard-mobile-shell">
                <div className="min-h-screen bg-background pb-32">
                    {children}
                    <BottomNav />
                </div>
            </div>
        </>
    );
}
