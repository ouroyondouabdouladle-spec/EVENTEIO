'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function Topbar() {
    const { profile, unreadCount } = useUser();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const firstName = profile?.full_name?.split(' ')[0] || 'Utilisateur';
    const role = profile?.role === 'admin' ? 'Organisateur'
        : profile?.role === 'membre' ? 'Membre'
        : 'Spectateur';

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <header className="topbar-desktop">
            {/* Search Bar */}
            <div className="topbar-search">
                <Search size={16} className="topbar-search-icon" />
                <input
                    type="text"
                    placeholder="Rechercher partout..."
                    className="topbar-search-input"
                    readOnly
                />
                <kbd className="topbar-search-kbd">⌘ K</kbd>
            </div>

            {/* Right Actions */}
            <div className="topbar-actions">
                {/* Notifications */}
                <Link href="/dashboard/notifications" className="topbar-icon-btn">
                    <Bell size={20} />
                    {unreadCount > 0 && <span className="topbar-notif-badge">{unreadCount}</span>}
                </Link>

                {/* Profile Dropdown */}
                <div className="topbar-profile" ref={dropdownRef}>
                    <button
                        className="topbar-profile-btn"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <div className="topbar-avatar">
                            {initials}
                        </div>
                        <div className="topbar-user-info">
                            <span className="topbar-user-name">{firstName}</span>
                            <span className="topbar-user-role">{role}</span>
                        </div>
                        <ChevronDown size={14} className={`topbar-chevron ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="topbar-dropdown">
                            <Link href="/dashboard/profile" className="topbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <User size={15} />
                                <span>Mon profil</span>
                            </Link>
                            <Link href="/dashboard/settings" className="topbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <Settings size={15} />
                                <span>Paramètres</span>
                            </Link>
                            <div className="topbar-dropdown-divider" />
                            <button className="topbar-dropdown-item danger" onClick={handleSignOut}>
                                <LogOut size={15} />
                                <span>Se déconnecter</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
