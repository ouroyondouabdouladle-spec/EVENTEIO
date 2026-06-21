'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Flag,
    CheckSquare,
    Users,
    Phone,
    FolderOpen,
    Bell,
    User,
    LogOut,
    Zap,
    ChevronRight,
    TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import { canViewEvents, canViewCalendar, canViewTasks, canViewSuppliers, canViewContacts, canViewFiles, canViewStats } from '@/lib/permissions';
export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, unreadCount } = useUser();
    const [signingOut, setSigningOut] = useState(false);

    const mainNav = [
        { icon: LayoutDashboard, label: 'Tableau de bord', href: '/dashboard', perm: () => true },
        { icon: Calendar, label: 'Calendrier', href: '/dashboard/calendar', perm: canViewCalendar },
        { icon: Flag, label: 'Événements', href: '/dashboard/events', perm: canViewEvents },
        { icon: CheckSquare, label: 'Tâches', href: '/dashboard/tasks', perm: canViewTasks },
        { icon: Users, label: 'Fournisseurs', href: '/dashboard/suppliers', perm: canViewSuppliers },
        { icon: Phone, label: 'Contacts', href: '/dashboard/contacts', perm: canViewContacts },
        { icon: FolderOpen, label: 'Documents & fichiers', href: '/dashboard/files', perm: canViewFiles },
        { icon: TrendingUp, label: 'Statistiques', href: '/dashboard/statistics', perm: canViewStats },
    ].filter(item => item.perm(profile));

    const handleSignOut = async () => {
        setSigningOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    return (
        <aside className="sidebar-desktop">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <Zap size={18} className="text-white" />
                </div>
                <span className="sidebar-logo-text">Eventio</span>
            </div>

            {/* Main Navigation */}
            <nav className="sidebar-nav">
                {mainNav.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Others */}
            <div className="sidebar-section-label">AUTRES</div>
            <nav className="sidebar-nav">
                <Link
                    href="/dashboard/notifications"
                    className={`sidebar-nav-item ${isActive('/dashboard/notifications') ? 'active' : ''}`}
                >
                    <Bell size={18} />
                    <span>Notifications</span>
                    {unreadCount > 0 && <span className="sidebar-badge">{unreadCount}</span>}
                </Link>
                <Link
                    href="/dashboard/profile"
                    className={`sidebar-nav-item ${isActive('/dashboard/profile') ? 'active' : ''}`}
                >
                    <User size={18} />
                    <span>Profil</span>
                </Link>
            </nav>

            {/* Sign Out */}
            <div className="sidebar-footer">
                <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="sidebar-signout"
                >
                    <LogOut size={16} />
                    <span>{signingOut ? 'Déconnexion...' : 'Se déconnecter'}</span>
                </button>
            </div>
        </aside>
    );
}
