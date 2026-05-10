'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import type { Contact, Event } from '@/types/database';
import { Search, ChevronRight, Phone, Mail, User, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function GlobalContactsPage() {
    const { profile } = useUser();
    const [contacts, setContacts] = useState<(Contact & { events: Event })[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!profile?.team_id) return;

        const fetchAllContacts = async () => {
            const supabase = createClient();
            
            const { data: events } = await (supabase as any)
                .from('events')
                .select('id')
                .eq('team_id', profile.team_id as string);

            if (!events || events.length === 0) {
                setLoading(false);
                return;
            }

            const eventIds = events.map((e: any) => e.id);

            const { data, error } = await supabase
                .from('contacts')
                .select('*, events(*)')
                .in('event_id', eventIds)
                .order('name', { ascending: true });

            if (!error && data) {
                setContacts(data as any);
            }
            setLoading(false);
        };

        fetchAllContacts();
    }, [profile?.team_id]);

    const getAvatarColor = (name: string) => {
        const colors = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const filteredContacts = contacts.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role?.toLowerCase().includes(search.toLowerCase()) ||
        c.events.title.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="py-20 text-center animate-pulse text-muted">Chargement de vos contacts...</div>;

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-2xl pb-32">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight mb-2">Contacts</h1>
                <p className="text-muted text-sm font-semibold opacity-60">Répertoire global de vos projets.</p>
            </header>

            <div className="relative mb-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher un nom, un rôle..." 
                    className="input-premium pl-12 py-4"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {filteredContacts.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <p className="text-sm text-muted font-bold opacity-60">Aucun contact trouvé.</p>
                    </div>
                ) : (
                    filteredContacts.map((c) => (
                        <Link key={c.id} href={`/dashboard/events/${c.event_id}`} className="block group">
                            <div className="card-premium flex items-start gap-5 group-hover:border-white/20 transition-all">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform ${getAvatarColor(c.name)}`}>
                                    {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <div>
                                            <h4 className="font-black text-sm truncate group-hover:text-purple-400 transition-colors">{c.name}</h4>
                                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-0.5">
                                                {c.events.title}
                                            </p>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider opacity-60 bg-white/5 px-2 py-0.5 rounded-md">
                                            {c.role || 'Contact'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mt-4">
                                        {c.phone && <span className="text-[10px] font-bold text-muted flex items-center gap-1.5"><Phone size={10} /> Appeler</span>}
                                        {c.email && <span className="text-[10px] font-bold text-muted flex items-center gap-1.5 truncate"><Mail size={10} /> Email</span>}
                                    </div>
                                </div>
                                <ChevronRight className="mt-1 text-muted group-hover:text-white transition-all opacity-0 group-hover:opacity-100" size={18} />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </main>
    );
}
