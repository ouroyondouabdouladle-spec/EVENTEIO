'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Plus, Bell, User, TrendingUp } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { canViewStats } from '@/lib/permissions';

export default function BottomNav() {
    const pathname = usePathname();
    const { profile, unreadCount } = useUser();

    const navItems = [
        { icon: Home, label: 'Accueil', href: '/dashboard' },
        { icon: Calendar, label: 'Calendrier', href: '/dashboard/calendar' },
        ...(canViewStats(profile) ? [{ icon: TrendingUp, label: 'Statistiques', href: '/dashboard/statistics' }] : []),
        { icon: Plus, label: 'Add', href: '/dashboard/events/new', isCenter: true },
        { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
        { icon: User, label: 'Profil', href: '/dashboard/profile' },
    ];

    if (pathname === '/dashboard/events/new' || pathname?.includes('/edit')) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-background/80 backdrop-blur-xl border-t border-white/5">
            <div className="max-w-md mx-auto flex items-center justify-between">
                {navItems.map((item, index) => {
                    if (item.isCenter) {
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className="w-14 h-14 -mt-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/40 transform active:scale-90 transition-all"
                            >
                                <item.icon size={28} className="text-white" />
                            </Link>
                        );
                    }

                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={index}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-all relative ${
                                isActive ? 'text-primary' : 'text-muted hover:text-white'
                            }`}
                        >
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            {item.icon === Bell && unreadCount > 0 && (
                                <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
