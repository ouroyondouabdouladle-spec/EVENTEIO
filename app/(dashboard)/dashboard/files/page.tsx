'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import type { EventDocument, Event } from '@/types/database';
import { 
    Search, ChevronRight, FileText, Folder, Calendar, 
    ExternalLink, FileCheck, FileCode, Image as ImageIcon 
} from 'lucide-react';
import Link from 'next/link';

type FolderType = 'contrats' | 'devis' | 'plans' | 'photos' | 'autres';

const FOLDER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    contrats: { label: 'Contrats', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: FileCheck },
    devis: { label: 'Devis', color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: FileText },
    plans: { label: 'Plans & Logistique', color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: FileCode },
    photos: { label: 'Photos & Inspi', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: ImageIcon },
    autres: { label: 'Autres fichiers', color: 'text-muted', bg: 'bg-white/5', icon: Folder }
};

export default function GlobalFilesPage() {
    const { profile } = useUser();
    const [docs, setDocs] = useState<(EventDocument & { events: Event })[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!profile?.team_id) return;

        const fetchAllDocs = async () => {
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

            const { data, error } = await (supabase as any)
                .from('documents')
                .select('*, events(*)')
                .in('event_id', eventIds)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setDocs(data as any);
            }
            setLoading(false);
        };

        fetchAllDocs();
    }, [profile?.team_id]);

    const filteredDocs = useMemo(() => {
        return docs.filter(d => 
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.events.title.toLowerCase().includes(search.toLowerCase()) ||
            d.type?.toLowerCase().includes(search.toLowerCase())
        );
    }, [docs, search]);

    const getDocIcon = (type: string | null) => {
        const cfg = FOLDER_CONFIG[type?.toLowerCase() || 'autres'] || FOLDER_CONFIG.autres;
        const Icon = cfg.icon;
        return <Icon size={24} className={cfg.color} />;
    };

    if (loading) return <div className="py-20 text-center animate-pulse text-muted">Chargement de vos documents...</div>;

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-none pb-32">
            <header className="mb-8">
                <h1 className="text-3xl font-black tracking-tight mb-1">Documents</h1>
                <p className="text-muted text-sm font-semibold opacity-60">Bibliothèque centrale de vos fichiers.</p>
            </header>

            <div className="relative mb-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher un fichier, un événement..." 
                    className="input-premium pl-12 py-4"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDocs.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <p className="text-sm text-muted font-bold opacity-60">Aucun document trouvé.</p>
                    </div>
                ) : (
                    filteredDocs.map((d) => (
                        <div key={d.id} className="card-premium flex items-start gap-5 group transition-all">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/5 group-hover:border-white/20 shadow-inner transition-all`}>
                                {getDocIcon(d.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-black text-sm truncate group-hover:text-primary transition-colors">{d.name}</h4>
                                    <span className="text-[9px] font-black uppercase tracking-wider opacity-60 bg-white/5 px-2 py-0.5 rounded-md">
                                        {FOLDER_CONFIG[d.type?.toLowerCase() || '']?.label || 'Fichier'}
                                    </span>
                                </div>
                                <Link href={`/dashboard/events/${d.event_id}`} className="text-[10px] font-bold text-purple-400 uppercase tracking-widest truncate mt-0.5 block hover:underline">
                                    {d.events.title}
                                </Link>
                                <div className="flex items-center gap-3 mt-4">
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted font-bold opacity-60">
                                        <Calendar size={10} />
                                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                            </div>
                            <a 
                                href={d.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-1 p-2 text-muted hover:text-white transition-all transform group-hover:translate-x-1"
                            >
                                <ExternalLink size={20} />
                            </a>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
