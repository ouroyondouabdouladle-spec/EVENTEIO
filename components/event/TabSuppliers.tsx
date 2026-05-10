'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import type { Supplier, SupplierStatus } from '@/types/database';
import {
    Search, Phone, Mail, ChevronRight, Plus, Music, Utensils, 
    Camera, Sparkles, Shield, Flower2, Wine, Heart, 
    DollarSign, X, Trash2, ExternalLink, Instagram, Briefcase,
    MoreHorizontal
} from 'lucide-react';

interface TabSuppliersProps {
    eventId: string;
}

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

export default function TabSuppliers({ eventId }: TabSuppliersProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // New Supplier Form State
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('autre');
    const [newBudget, setNewBudget] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newStatus, setNewStatus] = useState<SupplierStatus>('a_contacter');

    useEffect(() => {
        fetchSuppliers();
    }, [eventId]);

    const fetchSuppliers = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('event_id', eventId)
            .order('name', { ascending: true });

        if (!error && data) setSuppliers(data);
        setLoading(false);
    };

    const addSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const supabase = createClient();
        const { data, error } = await supabase
            .from('suppliers')
            .insert({
                event_id: eventId,
                name: newName.trim(),
                category: newCategory,
                budget: parseFloat(newBudget) || 0,
                phone: newPhone.trim(),
                status: newStatus
            })
            .select()
            .single();

        if (!error && data) {
            setSuppliers([...suppliers, data]);
            resetForm();
        }
    };

    const deleteSupplier = async (id: string) => {
        if (!window.confirm("Supprimer ce prestataire ?")) return;
        const supabase = createClient();
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (!error) {
            setSuppliers(suppliers.filter(s => s.id !== id));
        }
    };

    const resetForm = () => {
        setNewName('');
        setNewCategory('autre');
        setNewBudget('');
        setNewPhone('');
        setNewStatus('a_contacter');
        setIsAdding(false);
    };

    const getCategoryIcon = (category: string | null) => {
        const cat = CATEGORIES.find(c => c.value === category?.toLowerCase()) || CATEGORIES[CATEGORIES.length - 1];
        return <cat.icon size={22} className="text-black" />;
    };

    const totalBudget = useMemo(() => {
        return suppliers.reduce((sum, s) => sum + (Number(s.budget) || 0), 0);
    }, [suppliers]);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [suppliers, searchQuery]);

    if (loading) return <div className="py-20 text-center animate-pulse text-muted">Chargement des prestataires...</div>;

    return (
        <div className="pb-40 animate-fade-in">
            {/* Budget Summary Card */}
            <div className="card-premium mb-8 p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Budget Prestataires</p>
                        <h3 className="text-2xl font-black text-white">{totalBudget.toLocaleString('fr-FR')} €</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            {/* Search Area */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher un prestataire..." 
                    className="input-premium pl-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Suppliers List */}
            <div className="space-y-4">
                {filteredSuppliers.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <p className="text-sm text-muted font-bold opacity-60">Aucun prestataire trouvé.</p>
                    </div>
                ) : (
                    filteredSuppliers.map((s) => (
                        <div
                            key={s.id}
                            className="card-premium flex items-start gap-5 group transition-all"
                        >
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                                {getCategoryIcon(s.category)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-black text-white truncate">{s.name}</h4>
                                    <span className="text-[11px] font-black text-primary">{s.budget > 0 ? `${s.budget.toLocaleString()}€` : ''}</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border border-white/5 ${STATUS_CONFIG[s.status]?.bg} ${STATUS_CONFIG[s.status]?.color}`}>
                                        {STATUS_CONFIG[s.status]?.label}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white/5 text-muted border border-white/5">
                                        {s.category}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    {s.phone && (
                                        <a href={`tel:${s.phone}`} className="text-[10px] font-bold text-muted hover:text-primary transition-colors flex items-center gap-1.5">
                                            <Phone size={10} /> {s.phone}
                                        </a>
                                    )}
                                    {s.email && (
                                        <a href={`mailto:${s.email}`} className="text-[10px] font-bold text-muted hover:text-primary transition-colors flex items-center gap-1.5">
                                            <Mail size={10} /> Email
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button onClick={() => deleteSupplier(s.id)} className="p-2 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </button>
                                <button className="p-2 text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-24 left-0 right-0 px-6 z-40 pointer-events-none">
                <div className="max-w-md mx-auto md:max-w-2xl pointer-events-auto bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl">
                    {isAdding ? (
                        <form onSubmit={addSupplier} className="space-y-4 animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Nouveau Prestataire</h4>
                                <button type="button" onClick={resetForm} className="text-muted hover:text-white"><X size={18}/></button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Nom..."
                                    className="input-premium h-12 col-span-2"
                                />
                                <select 
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white h-12"
                                >
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-surface">{c.label}</option>)}
                                </select>
                                <input 
                                    type="number"
                                    value={newBudget}
                                    onChange={(e) => setNewBudget(e.target.value)}
                                    placeholder="Budget €"
                                    className="input-premium h-12"
                                />
                            </div>

                            <div className="flex gap-3">
                                <input 
                                    type="text"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder="Téléphone..."
                                    className="input-premium h-12 flex-1"
                                />
                                <select 
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as SupplierStatus)}
                                    className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white h-12 flex-1"
                                >
                                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                                        <option key={val} value={val} className="bg-surface">{cfg.label}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={!newName.trim()}
                                className="btn-premium w-full h-14 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
                            >
                                <Plus size={20} />
                                <span>Ajouter le prestataire</span>
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="btn-premium w-full flex items-center justify-center gap-3 h-14 group shadow-xl shadow-primary/20"
                        >
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            </div>
                            <span className="text-xs uppercase tracking-[0.2em] font-black">Ajouter un prestataire</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
