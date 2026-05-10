'use client';

import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface ProfileFieldProps {
    icon: LucideIcon;
    label: string;
    value?: string;
    onClick?: () => void;
    variant?: 'default' | 'danger';
}

export default function ProfileField({ icon: Icon, label, value, onClick, variant = 'default' }: ProfileFieldProps) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-5 rounded-3xl bg-surface border border-white/5 hover:border-white/10 active:scale-[0.98] transition-all group"
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${
                variant === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-muted group-hover:text-primary'
            }`}>
                <Icon size={22} />
            </div>
            
            <div className="flex-1 text-left">
                <p className={`text-xs font-black uppercase tracking-wider mb-1 ${
                    variant === 'danger' ? 'text-red-400/60' : 'text-muted opacity-60'
                }`}>
                    {label}
                </p>
                {value && (
                    <p className="text-sm font-bold text-white truncate">
                        {value}
                    </p>
                )}
            </div>

            {onClick && variant !== 'danger' && (
                <ChevronRight className="text-muted group-hover:text-white transition-colors" size={20} />
            )}
        </button>
    );
}
