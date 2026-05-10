'use client';

import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface FormTextareaProps {
    label: string;
    registration: UseFormRegisterReturn;
    error?: string;
    placeholder?: string;
    rows?: number;
    className?: string;
}

export default function FormTextarea({
    label,
    registration,
    error,
    placeholder,
    rows = 4,
    className = '',
}: FormTextareaProps) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="text-[13px] font-semibold text-muted ml-1">
                {label}
            </label>
            <textarea
                {...registration}
                rows={rows}
                placeholder={placeholder}
                className={`input-premium resize-none min-h-[120px] ${error ? 'border-red-500/50 focus:border-red-500' : ''}`}
            />
            {error && (
                <p className="text-xs text-red-500/90 ml-1 mt-1">
                    {error}
                </p>
            )}
        </div>
    );
}
