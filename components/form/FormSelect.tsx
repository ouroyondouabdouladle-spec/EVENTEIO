'use client';

import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface SelectOption {
    value: string;
    label: string;
}

interface FormSelectProps {
    label: string;
    registration: UseFormRegisterReturn;
    options: SelectOption[];
    error?: string;
    placeholder?: string;
    className?: string;
}

export default function FormSelect({
    label,
    registration,
    options,
    error,
    placeholder,
    className = '',
}: FormSelectProps) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <label
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
            >
                {label}
            </label>
            <select
                {...registration}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 cursor-pointer appearance-none"
                style={{
                    background: 'var(--bg-overlay)',
                    border: `1px solid ${error ? 'rgba(248,113,113,0.6)' : 'var(--border)'}`,
                    color: 'var(--text-primary)',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                    paddingRight: '36px',
                }}
                onFocus={(e) => {
                    if (!error) e.currentTarget.style.borderColor = 'rgba(127,119,221,0.6)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(127,119,221,0.1)';
                }}
                onBlur={(e) => {
                    if (!error) e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                {placeholder && (
                    <option value="" style={{ background: 'var(--bg-surface)' }}>
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-surface)' }}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-xs" style={{ color: 'rgba(248,113,113,0.9)' }}>
                    {error}
                </p>
            )}
        </div>
    );
}
