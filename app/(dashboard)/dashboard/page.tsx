'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, Flag, CheckSquare, Users, Phone, FileText, ChevronRight, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import TeamSetup from '@/components/layout/TeamSetup';
import type { Event } from '@/types/database';

export default function DashboardPage() {
    const { profile, loading: userLoading } = useUser();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.team_id) return;

        const fetchEvents = async () => {
            const supabase = createClient();
            const { data, error } = await (supabase as any)
                .from('events')
                .select('*')
                .eq('team_id', profile.team_id as string)
                .order('date_start', { ascending: false })
                .limit(5);

            if (!error && data) {
                setEvents(data as Event[]);
            }
            setLoading(false);
        };

        fetchEvents();
    }, [profile?.team_id]);

    if (userLoading) return null;

    if (profile && !profile.team_id) {
        return <TeamSetup />;
    }

    const latestEvent = events[0];

    const quickActions = [
        { icon: Calendar, label: 'Calendrier', color: 'bg-purple-500/10 text-purple-500', href: '/dashboard/calendar' },
        { icon: Flag, label: 'Événements', color: 'bg-blue-500/10 text-blue-500', href: '/dashboard/events' },
        { icon: CheckSquare, label: 'Tâches', color: 'bg-green-500/10 text-green-500', href: '/dashboard/tasks' },
        { icon: Users, label: 'Fournisseurs', color: 'bg-orange-500/10 text-orange-500', href: '/dashboard/suppliers' },
        { icon: Phone, label: 'Contacts', color: 'bg-cyan-500/10 text-cyan-500', href: '/dashboard/contacts' },
        { icon: FileText, label: 'Docs & fichiers', color: 'bg-pink-500/10 text-pink-500', href: '/dashboard/files' },
    ];

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-2xl pb-32">
            {/* Header */}
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        Bonjour {profile?.full_name?.split(' ')[0] || 'Cinar'} 👋
                    </h1>
                    <p className="text-muted text-sm font-semibold opacity-60">Voici ce qui se passe aujourd'hui.</p>
                </div>
                <button className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center text-muted hover:text-white transition-all active:scale-90">
                    <Search size={22} />
                </button>
            </header>

            {/* Featured Event Card (En ce moment) */}
            <section className="mb-12">
                <div className="flex items-center gap-2 mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                    Dernier projet
                </div>
                
                {latestEvent ? (
                    <Link href={`/dashboard/events/${latestEvent.id}`} className="block group">
                        <div className="card-premium relative overflow-hidden p-8 min-h-[220px] flex flex-col justify-between border-white/10 group-hover:border-purple-500/30 transition-all duration-500">
                            {/* Background dramatic gradient */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-600/30 to-blue-600/30 blur-[60px] -mr-32 -mt-32 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-600/10 blur-[40px] -ml-16 -mb-16" />
                            
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
                                        {latestEvent.status === 'valide' ? 'Validé' : 
                                         latestEvent.status === 'termine' ? 'Terminé' : 
                                         latestEvent.status === 'en_attente' ? 'En attente' : 'Brouillon'}
                                    </div>
                                </div>
                                
                                <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-300 transition-all">
                                    {latestEvent.title}
                                </h2>
                                
                                <div className="flex flex-col gap-2 mt-4">
                                    <p className="text-muted text-xs font-bold flex items-center gap-2 opacity-80">
                                        <MapPin size={14} className="text-purple-400" /> {latestEvent.location || 'Lieu non défini'}
                                    </p>
                                    {latestEvent.date_start && (
                                        <p className="text-muted text-xs font-bold flex items-center gap-2 opacity-80">
                                            <Calendar size={14} className="text-purple-400" /> 
                                            {new Date(latestEvent.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="relative z-10 mt-8 flex items-center gap-2 text-xs font-black text-white group-hover:gap-4 transition-all">
                                <span className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                                    Voir les détails
                                </span>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <Link href="/dashboard/events/new" className="block group">
                        <div className="card-premium p-10 text-center border-dashed border-white/10 hover:border-primary/50 transition-all">
                            <p className="text-muted font-bold mb-4 opacity-60">Aucun événement pour le moment.</p>
                            <span className="btn-premium py-2 px-6 inline-block text-xs">Créer mon premier événement</span>
                        </div>
                    </Link>
                )}
            </section>

            {/* Quick Actions Grid */}
            <section className="mb-12">
                <h3 className="text-sm font-black uppercase tracking-wider mb-6 opacity-40">Accès rapides</h3>
                <div className="grid grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                        <Link 
                            key={index} 
                            href={action.href}
                            className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-surface border border-white/5 hover:border-white/20 transition-all group active:scale-95"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner`}>
                                <action.icon size={28} />
                            </div>
                            <span className="text-[10px] font-black text-center leading-tight tracking-tight uppercase opacity-60 group-hover:opacity-100">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* My Events List */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-wider opacity-40">Mes événements</h3>
                    <Link href="/dashboard/events" className="text-purple-400 text-xs font-black hover:tracking-widest transition-all">
                        VOIR TOUT
                    </Link>
                </div>
                
                <div className="space-y-4">
                    {events.length === 0 ? (
                        <p className="text-center py-10 text-muted text-xs font-bold opacity-40">Liste vide.</p>
                    ) : (
                        events.map((event, index) => (
                            <Link key={index} href={`/dashboard/events/${event.id}`} className="block group">
                                <div className="card-premium p-5 flex items-center gap-5 group-hover:border-white/20 transition-all active:scale-[0.98]">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/5 overflow-hidden flex items-center justify-center shadow-inner group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-colors">
                                        <Calendar size={24} className="text-muted group-hover:text-purple-400 transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-black text-sm truncate group-hover:text-purple-400 transition-colors">{event.title}</h4>
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                event.status === 'valide' ? 'text-green-400 bg-green-500/20' : 
                                                event.status === 'termine' ? 'text-blue-400 bg-blue-500/20' : 
                                                'text-orange-400 bg-orange-500/20'
                                            }`}>
                                                {event.status === 'valide' ? 'Validé' : 
                                                 event.status === 'termine' ? 'Terminé' : 
                                                 event.status === 'en_attente' ? 'En attente' : 'Brouillon'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-bold text-muted truncate opacity-60 mb-2">{event.location || 'Lieu non défini'}</p>
                                        <p className="text-[10px] font-black text-muted/40 uppercase tracking-widest">
                                            {event.date_start ? new Date(event.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Date à définir'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}
