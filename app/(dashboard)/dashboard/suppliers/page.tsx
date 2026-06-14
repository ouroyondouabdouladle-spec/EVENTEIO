'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import type { Supplier, Event, SupplierStatus } from '@/types/database';
import { 
    Search, ChevronRight, Phone, Plus, Music, Utensils, 
    Camera, Sparkles, Shield, Flower2, Wine, Heart, 
    Briefcase, DollarSign 
} from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
    { value: 'traiteur', label: 'Traiteur', icon: Utensils },
    { value: 'photo', label: 'Photo & Vidéo', icon: Camera },
    { value: 'musique', label: 'Musique / DJ', icon: Music },
    { value: 'déco', label: 'Décoration', icon: Sparkles },
    { value: 'fleur', label: 'Fleurs', icon: Flower2 },
    { value: 'boisson', label: 'Boissons / Bar', icon: Wine },
    { value: 'sécurité', label: 'Sécurité', icon: Shield },
    { value: 'lieu', label: 'Lieu / Domaine', icon: Heart },
    { value: 'autre', label: 'Autre', icon: Briefcase },
];

const STATUS_CONFIG: Record<SupplierStatus, { label: string; color: string; bg: string }> = {
    a_contacter: { label: 'À contacter', color: 'text-muted', bg: 'bg-white/5' },
    devis_recu: { label: 'Devis reçu', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    contrat_signe: { label: 'Contrat signé', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    paye: { label: 'Payé', color: 'text-green-400', bg: 'bg-green-500/10' }
};

export default function GlobalSuppliersPage() {
    const { profile } = useUser();
    const [suppliers, setSuppliers] = useState<(Supplier & { events: Event })[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!profile?.team_id) return;

        const fetchAllSuppliers = async () => {
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
                .from('suppliers')
                .select('*, events(*)')
                .in('event_id', eventIds)
                .order('name', { ascending: true });

            if (!error && data) {
                setSuppliers(data as any);
            }
            setLoading(false);
        };

        fetchAllSuppliers();
    }, [profile?.team_id]);

    const getCategoryIcon = (category: string | null) => {
        const cat = CATEGORIES.find(c => c.value === category?.toLowerCase()) || CATEGORIES[CATEGORIES.length - 1];
        return <cat.icon size={22} className="text-black" />;
    };

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => 
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.category?.toLowerCase().includes(search.toLowerCase()) ||
            s.events.title.toLowerCase().includes(search.toLowerCase())
        );
    }, [suppliers, search]);

    if (loading) return <div className="py-20 text-center animate-pulse text-muted">Chargement des prestataires...</div>;

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-none pb-32">
            <header className="mb-8">
                <h1 className="text-3xl font-black tracking-tight mb-1">Prestataires</h1>
                <p className="text-muted text-sm font-semibold opacity-60">Tous vos partenaires événementiels.</p>
            </header>

            <div className="relative mb-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher un prestataire, une catégorie..." 
                    className="input-premium pl-12 py-4"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSuppliers.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <p className="text-sm text-muted font-bold opacity-60">Aucun prestataire trouvé.</p>
                    </div>
                ) : (
                    filteredSuppliers.map((s) => (
                        <Link key={s.id} href={`/dashboard/events/${s.event_id}`} className="block group">
                            <div className="card-premium flex items-start gap-5 group-hover:border-white/20 transition-all">
                                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                                    {getCategoryIcon(s.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <div>
                                            <h4 className="font-black text-sm truncate group-hover:text-purple-400 transition-colors">{s.name}</h4>
                                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-0.5">
                                                {s.events.title}
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-black text-primary">
                                            {s.budget > 0 ? `${s.budget.toLocaleString()}€` : ''}
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mt-3 mb-3">
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border border-white/5 ${STATUS_CONFIG[s.status]?.bg} ${STATUS_CONFIG[s.status]?.color}`}>
                                            {STATUS_CONFIG[s.status]?.label}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white/5 text-muted border border-white/5">
                                            {s.category}
                                        </span>
                                    </div>

                                    {s.phone && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted opacity-60">
                                            <Phone size={10} /> {s.phone}
                                        </div>
                                    )}
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
