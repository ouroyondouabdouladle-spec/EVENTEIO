'use client';

import React, { useState } from 'react';

interface FormSectionProps {
    title: string;
    icon: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string | number;
}

export default function FormSection({
    title,
    icon,
    children,
    defaultOpen = false,
    badge,
}: FormSectionProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{
                border: `1px solid ${open ? 'rgba(127,119,221,0.35)' : 'var(--border)'}`,
                background: 'var(--bg-surface)',
            }}
        >
            {/* En-tête cliquable */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 transition-colors duration-150"
                style={{ background: open ? 'rgba(127,119,221,0.06)' : 'transparent' }}
            >
                <div className="flex items-center gap-3">
                    <span
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-base flex-shrink-0"
                        style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
                    >
                        {icon}
                    </span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {title}
                    </span>
                    {badge !== undefined && (
                        <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(127,119,221,0.15)', color: 'var(--primary)' }}
                        >
                            {badge}
                        </span>
                    )}
                </div>

                {/* Chevron animé */}
                <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"
                    className="transition-transform duration-300"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {/* Corps avec animation */}
            <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: open ? '1200px' : '0px', opacity: open ? 1 : 0 }}
            >
                <div className="px-5 pb-5 pt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {children}
                </div>
            </div>
        </div>
    );
}
