import React from 'react';
import BottomNav from '@/components/layout/BottomNav';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background pb-32">
            {children}
            <BottomNav />
        </div>
    );
}
