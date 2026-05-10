'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { ActivityLog } from '@/types/database';

interface ActivityHistoryProps {
    eventId: string;
}

export default function ActivityHistory({ eventId }: ActivityHistoryProps) {
    const [logs, setLogs] = useState<(ActivityLog & { user?: { full_name: string } })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [eventId]);

    const fetchLogs = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*, profiles(full_name)')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setLogs(data.map((item: any) => ({
                ...item,
                user: item.profiles
            })));
        }
        setLoading(false);
    };

    const formatAction = (action: string) => {
        const actions: Record<string, string> = {
            'event_created': 'a créé l\'événement',
            'event_updated': 'a modifié l\'événement',
            'task_created': 'a ajouté une tâche',
            'task_updated': 'a mis à jour une tâche',
            'supplier_added': 'a ajouté un prestataire',
            'document_uploaded': 'a ajouté un document',
        };
        return actions[action] || action;
    };

    if (loading) return null;
    if (logs.length === 0) return null;

    return (
        <section className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span>🕒</span> Historique récent
            </h3>
            <div className="space-y-6">
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                            <div className="flex-1 w-px bg-gray-800 my-1" />
                        </div>
                        <div className="pb-2">
                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                <span className="font-bold">{log.user?.full_name || 'Utilisateur'}</span>{' '}
                                <span style={{ color: 'var(--text-secondary)' }}>{formatAction(log.action)}</span>
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                {new Date(log.created_at).toLocaleString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
