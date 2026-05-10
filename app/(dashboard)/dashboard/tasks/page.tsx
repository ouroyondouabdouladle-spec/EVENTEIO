'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import type { Task, Event, TaskPriority } from '@/types/database';
import { Check, Calendar, ChevronRight, AlertCircle, Search, Flag, Clock } from 'lucide-react';
import Link from 'next/link';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
    basse: { label: 'Basse', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    moyenne: { label: 'Moyenne', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    haute: { label: 'Haute', color: 'text-red-400', bg: 'bg-red-500/10' }
};

export default function GlobalTasksPage() {
    const { profile } = useUser();
    const [tasks, setTasks] = useState<(Task & { events: Event })[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!profile?.team_id) return;

        const fetchAllTasks = async () => {
            const supabase = createClient();
            
            // Get all events for the team
            const { data: events } = await (supabase as any)
                .from('events')
                .select('id')
                .eq('team_id', profile.team_id as string);

            if (!events || events.length === 0) {
                setLoading(false);
                return;
            }

            const eventIds = events.map((e: any) => e.id);

            // Get all tasks for these events
            const { data, error } = await supabase
                .from('tasks')
                .select('*, events(*)')
                .in('event_id', eventIds)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setTasks(data as any);
            }
            setLoading(false);
        };

        fetchAllTasks();
    }, [profile?.team_id]);

    const filteredTasks = tasks.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.events.title.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (iso: string | null) => {
        if (!iso) return null;
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'short'
        }).format(new Date(iso));
    };

    if (loading) return <div className="py-20 text-center animate-pulse text-muted">Chargement de toutes vos tâches...</div>;

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-2xl pb-32">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight mb-2">Toutes les tâches</h1>
                <p className="text-muted text-sm font-semibold opacity-60">Suivez l'avancement de tous vos projets.</p>
            </header>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher une tâche ou un événement..." 
                    className="input-premium pl-12"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-surface border border-white/5 flex items-center justify-center text-muted mb-4">
                            <AlertCircle size={24} />
                        </div>
                        <p className="text-sm text-muted font-bold">Aucune tâche trouvée.</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <Link key={task.id} href={`/dashboard/events/${task.event_id}`} className="block group">
                            <div className={`card-premium p-5 flex items-start gap-5 group-hover:border-white/20 transition-all ${
                                task.status === 'termine' ? 'opacity-50' : ''
                            }`}>
                                <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                    task.status === 'termine' ? 'bg-primary border-primary' : 'border-white/20'
                                }`}>
                                    {task.status === 'termine' && <Check size={14} className="text-white" strokeWidth={4} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-black mb-1 truncate ${task.status === 'termine' ? 'line-through' : ''}`}>
                                        {task.title}
                                    </p>
                                    
                                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">
                                        {task.events.title}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].color} border border-white/5`}>
                                            <Flag size={10} strokeWidth={3} />
                                            {PRIORITY_CONFIG[task.priority].label}
                                        </div>

                                        {task.due_date && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-white/5 text-muted border border-white/5">
                                                <Calendar size={10} />
                                                {formatDate(task.due_date)}
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-white/5 text-muted opacity-40">
                                            <Clock size={10} />
                                            {formatDate(task.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="mt-1 text-muted group-hover:text-white transition-all" size={18} />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </main>
    );
}
