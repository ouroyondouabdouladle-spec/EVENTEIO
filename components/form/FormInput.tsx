'use client';

import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface FormInputProps {
    label: string;
    registration: UseFormRegisterReturn;
    error?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export default function FormInput({
    label,
    registration,
    error,
    type = 'text',
    placeholder,
    required = false,
    className = '',
}: FormInputProps) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="text-[13px] font-semibold text-muted ml-1">
                {label}
                {required && <span className="text-primary ml-1">*</span>}
            </label>
            <input
                {...registration}
                type={type}
                placeholder={placeholder}
                className={`input-premium ${error ? 'border-red-500/50 focus:border-red-500' : ''}`}
            />
            {error && (
                <p className="text-xs text-red-500/90 ml-1 mt-1">
                    {error}
                </p>
            )}
        </div>
    );
}
