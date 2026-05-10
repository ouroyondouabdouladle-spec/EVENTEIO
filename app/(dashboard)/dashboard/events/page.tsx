'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, MapPin, Calendar, Users, ChevronRight, Filter, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import type { Event } from '@/types/database';

type FilterValue = 'all' | 'valide' | 'en_attente' | 'termine' | 'non_valide';
const FILTER_LABELS: Record<FilterValue, string> = {
    all: 'Tous',
    valide: 'Validés',
    en_attente: 'En attente',
    termine: 'Terminés',
    non_valide: 'Brouillons'
};

export default function EventsPage() {
    const { profile } = useUser();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterValue>('all');

    // Chargement des événements depuis Supabase
    useEffect(() => {
        if (!profile?.team_id) {
            setLoading(false);
            return;
        }

        const supabase = createClient();

        (supabase as any)
            .from('events')
            .select('*')
            .eq('team_id', profile.team_id as string)
            .order('date_start', { ascending: true })
            .then(({ data, error }: { data: any, error: any }) => {
                if (!error && data) setEvents(data as Event[]);
                setLoading(false);
            });
    }, [profile?.team_id]);

    // Filtrage côté client
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return events.filter((ev) => {
            const matchSearch =
                !q ||
                ev.title.toLowerCase().includes(q) ||
                (ev.location ?? '').toLowerCase().includes(q) ||
                (ev.type ?? '').toLowerCase().includes(q);

            const matchFilter = filter === 'all' || ev.status === filter;

            return matchSearch && matchFilter;
        });
    }, [events, search, filter]);



    return (
        <main className="p-6 animate-fade-in pb-32">
            {/* Header */}
            <header className="flex flex-col gap-6 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Événements</h1>
                        <p className="text-muted text-sm font-medium">
                            {loading ? 'Chargement...' : `${events.length} projet${events.length > 1 ? 's' : ''} au total`}
                        </p>
                    </div>
                    <button className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-muted hover:text-white transition-all shadow-sm">
                        <Search size={22} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text"
                        placeholder="Rechercher un événement..."
                        className="input-premium pl-12 py-3.5"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-none">
                {(Object.keys(FILTER_LABELS) as FilterValue[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all capitalize ${
                            filter === tab
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-surface border border-border text-muted hover:text-white'
                        }`}
                    >
                        {FILTER_LABELS[tab]}
                    </button>
                ))}
            </div>

            {/* Events Grid */}
            <div className="space-y-6">
                {loading ? (
                    // Loading Skeletons
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-64 rounded-3xl bg-surface/50 animate-pulse border border-border" />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center text-muted mb-6">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Aucun événement</h3>
                        <p className="text-muted text-sm max-w-xs mx-auto">
                            {search || filter !== 'all' 
                                ? "Aucun résultat ne correspond à vos critères." 
                                : "Commencez par créer votre premier événement mémorable."}
                        </p>
                    </div>
                ) : (
                    filtered.map((event) => (
                        <Link 
                            key={event.id} 
                            href={`/dashboard/events/${event.id}`}
                            className="block group"
                        >
                            <div className="card-premium p-0 overflow-hidden group-hover:border-primary/40 transition-all">
                                {/* Visual Header */}
                                <div className="relative h-48 w-full">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                                    {/* Replace with real images if available in schema */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                        <Calendar size={64} className="text-white" />
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                        event.status === 'valide' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                        event.status === 'termine' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        event.status === 'en_attente' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                        'bg-white/10 text-muted border border-white/10'
                                    }`}>
                                        {FILTER_LABELS[event.status as FilterValue] || event.status}
                                    </div>

                                    {/* Date Overlay */}
                                    <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white min-w-[60px] text-center">
                                        <div className="text-lg font-black leading-none">
                                            {event.date_start ? new Date(event.date_start).getDate() : '--'}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase opacity-60">
                                            {event.date_start ? new Date(event.date_start).toLocaleString('fr-FR', { month: 'short' }) : '---'}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors truncate">
                                        {event.title}
                                    </h3>
                                    
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-muted text-xs">
                                            <MapPin size={14} className="text-primary/60" />
                                            <span className="truncate">{event.location || 'Lieu non défini'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted text-xs">
                                            <Users size={14} className="text-primary/60" />
                                            <span>{event.type || 'Type non défini'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-surface bg-surface-light overflow-hidden">
                                                    <img src={`https://i.pravatar.cc/100?img=${event.id.length % 70 + i}`} alt="avatar" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-primary group-hover:gap-2 transition-all">
                                            Gérer <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Floating Action Button */}
            <Link 
                href="/dashboard/events/new"
                className="fixed bottom-32 right-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all z-40"
            >
                <Plus size={32} />
            </Link>
        </main>
    );
}
