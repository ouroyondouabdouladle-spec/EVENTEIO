'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import type { Event } from '@/types/database';

// Components
import EventHeader from '@/components/event/EventHeader';
import ActivityHistory from '@/components/event/ActivityHistory';
import TabDetails from '@/components/event/TabDetails';
import TabTasks from '@/components/event/TabTasks';
import TabSuppliers from '@/components/event/TabSuppliers';
import TabContacts from '@/components/event/TabContacts';
import TabDocuments from '@/components/event/TabDocuments';

interface EventPageProps {
    params: { id: string };
}

type TabId = 'details' | 'tasks' | 'suppliers' | 'contacts' | 'documents';

export default function EventPage({ params }: EventPageProps) {
    const { profile } = useUser();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('details');

    useEffect(() => {
        const fetchEvent = async () => {
            const supabase = createClient();
            const { data, error } = await (supabase as any)
                .from('events')
                .select('*')
                .eq('id', params.id)
                .single();

            if (!error && data) {
                setEvent(data as Event);
            }
            setLoading(false);
        };

        fetchEvent();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-base)' }}>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Événement introuvable</p>
                <button onClick={() => window.history.back()} className="text-purple-400 font-medium">Retourner à la liste</button>
            </div>
        );
    }

    const TABS = [
        { id: 'details', label: 'Détails' },
        { id: 'tasks', label: 'Tâches' },
        { id: 'suppliers', label: 'Fournisseurs' },
        { id: 'contacts', label: 'Contacts' },
        { id: 'documents', label: 'Docs & fichiers' },
    ] as const;

    return (
        <div className="min-h-screen pb-20" style={{ background: 'var(--bg-base)' }}>
            <EventHeader event={event} isAdmin={profile?.role === 'admin'} />

            <div className="max-w-md mx-auto px-4 md:max-w-2xl">
                {/* Navigation Tabs */}
                <nav className="flex items-center gap-6 mb-6 overflow-x-auto no-scrollbar border-b" style={{ borderColor: 'var(--border)' }}>
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabId)}
                            className={`pb-3 text-sm font-semibold transition-all duration-200 whitespace-nowrap relative ${
                                activeTab === tab.id 
                                ? 'text-purple-400' 
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Content */}
                <main className="fade-in">
                    {activeTab === 'details' && <TabDetails event={event} />}
                    {activeTab === 'tasks' && <TabTasks eventId={event.id} />}
                    {activeTab === 'suppliers' && <TabSuppliers eventId={event.id} />}
                    {activeTab === 'contacts' && <TabContacts eventId={event.id} />}
                    {activeTab === 'documents' && <TabDocuments eventId={event.id} />}
                </main>

                {/* Footer History */}
                <ActivityHistory eventId={event.id} />
            </div>
        </div>
    );
}
