import type { EventStatus, PaymentStatus } from '@/types/database';

type AnyStatus = EventStatus | PaymentStatus;

// ================================================================
// Couleurs et libellés par statut
// ================================================================
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    // Événements
    non_valide: {
        label: 'Non validé',
        bg: 'rgba(239,68,68,0.12)',
        text: '#f87171',
        dot: '#ef4444',
    },
    en_attente: {
        label: 'En attente',
        bg: 'rgba(251,146,60,0.12)',
        text: '#fb923c',
        dot: '#f97316',
    },
    valide: {
        label: 'Validé',
        bg: 'rgba(34,197,94,0.12)',
        text: '#4ade80',
        dot: '#22c55e',
    },
    termine: {
        label: 'Terminé',
        bg: 'rgba(96,165,250,0.12)',
        text: '#60a5fa',
        dot: '#3b82f6',
    },
    // Paiements
    non_paye: {
        label: 'Non payé',
        bg: 'rgba(239,68,68,0.12)',
        text: '#f87171',
        dot: '#ef4444',
    },
    acompte_recu: {
        label: 'Acompte reçu',
        bg: 'rgba(251,146,60,0.12)',
        text: '#fb923c',
        dot: '#f97316',
    },
    paye: {
        label: 'Payé',
        bg: 'rgba(34,197,94,0.12)',
        text: '#4ade80',
        dot: '#22c55e',
    },
};

interface StatusBadgeProps {
    status: AnyStatus;
    size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? {
        label: status,
        bg: 'rgba(148,163,184,0.12)',
        text: '#94a3b8',
        dot: '#94a3b8',
    };
    const padding = size === 'sm' ? '2px 8px' : '4px 12px';
    const fontSize = size === 'sm' ? '11px' : '12px';

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap"
            style={{
                background: config.bg,
                color: config.text,
                padding,
                fontSize,
                border: `1px solid ${config.dot}30`,
            }}
        >
            <span
                className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: config.dot }}
            />
            {config.label}
        </span>
    );
}
