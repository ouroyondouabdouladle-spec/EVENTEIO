'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Plus, Bell, User } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: 'Accueil', href: '/dashboard' },
        { icon: Calendar, label: 'Calendrier', href: '/dashboard/calendar' },
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
                            className={`flex flex-col items-center gap-1 transition-all ${
                                isActive ? 'text-primary' : 'text-muted hover:text-white'
                            }`}
                        >
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
