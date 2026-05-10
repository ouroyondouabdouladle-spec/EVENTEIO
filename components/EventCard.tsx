import Link from 'next/link';
import type { Event } from '@/types/database';
import StatusBadge from './StatusBadge';

interface EventCardProps {
    event: Event;
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

const EVENT_TYPE_ICON: Record<string, string> = {
    mariage: '💍',
    soiree: '🎉',
    conference: '🎤',
    gala: '✨',
    anniversaire: '🎂',
};

function getEventIcon(type: string | null): string {
    if (!type) return '📅';
    const key = type.toLowerCase();
    return Object.entries(EVENT_TYPE_ICON).find(([k]) => key.includes(k))?.[1] ?? '📅';
}

export default function EventCard({ event }: EventCardProps) {
    const clientName = [
        event.client_monsieur_prenom,
        event.client_monsieur_nom,
        event.client_madame_prenom,
        event.client_madame_nom,
    ]
        .filter(Boolean)
        .slice(0, 2)
        .join(' ');

    return (
        <Link
            href={`/events/${event.id}`}
            id={`event-card-${event.id}`}
            className="group block w-full rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(127,119,221,0.4)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(127,119,221,0.15)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            }}
        >
            <div className="flex items-start gap-4">
                {/* Icône type événement */}
                <div
                    className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl text-xl"
                    style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
                >
                    {getEventIcon(event.type)}
                </div>

                {/* Contenu principal */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3
                                className="font-semibold truncate text-sm transition-colors duration-200 group-hover:text-purple-400"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {event.title}
                            </h3>
                            {clientName && (
                                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                                    {clientName}
                                </p>
                            )}
                        </div>
                        <StatusBadge status={event.status} size="sm" />
                    </div>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        {event.date_start && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <span>📅</span>
                                {formatDate(event.date_start)}
                            </span>
                        )}
                        {event.location && (
                            <span className="flex items-center gap-1 text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                <span>📍</span>
                                {event.location}
                            </span>
                        )}
                        {event.type && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <span>🏷</span>
                                {event.type}
                            </span>
                        )}
                    </div>
                </div>

                {/* Flèche */}
                <svg
                    className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </div>
        </Link>
    );
}
