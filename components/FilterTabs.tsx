'use client';

import type { EventStatus } from '@/types/database';

export type FilterValue = 'all' | EventStatus;

const TABS: { value: FilterValue; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'non_valide', label: 'Non validé' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'valide', label: 'Validé' },
    { value: 'termine', label: 'Terminé' },
];

interface FilterTabsProps {
    active: FilterValue;
    onChange: (v: FilterValue) => void;
}

export default function FilterTabs({ active, onChange }: FilterTabsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((tab) => {
                const isActive = active === tab.value;
                return (
                    <button
                        key={tab.value}
                        id={`filter-${tab.value}`}
                        type="button"
                        onClick={() => onChange(tab.value)}
                        className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                        style={{
                            background: isActive
                                ? 'var(--primary)'
                                : 'var(--bg-overlay)',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                            boxShadow: isActive ? '0 2px 12px rgba(127,119,221,0.35)' : 'none',
                        }}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
