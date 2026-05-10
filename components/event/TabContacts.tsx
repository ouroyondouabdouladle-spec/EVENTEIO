'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import type { Contact } from '@/types/database';
import { Search, Phone, Mail, ChevronRight, Plus, X, Trash2, User, MoreHorizontal } from 'lucide-react';

interface TabContactsProps {
    eventId: string;
}

export default function TabContacts({ eventId }: TabContactsProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // New Contact Form State
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');

    useEffect(() => {
        fetchContacts();
    }, [eventId]);

    const fetchContacts = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('event_id', eventId)
            .order('name', { ascending: true });

        if (!error && data) setContacts(data);
        setLoading(false);
    };

    const addContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const supabase = createClient();
        const { data, error } = await supabase
            .from('contacts')
            .insert({
                event_id: eventId,
                name: newName.trim(),
                role: newRole.trim() || 'Contact',
                phone: newPhone.trim(),
                email: newEmail.trim()
            })
            .select()
            .single();

        if (!error && data) {
            setContacts([...contacts, data].sort((a, b) => a.name.localeCompare(b.name)));
            resetForm();
        }
    };

    const deleteContact = async (id: string) => {
        if (!window.confirm("Supprimer ce contact ?")) return;
        const supabase = createClient();
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (!error) {
            setContacts(contacts.filter(c => c.id !== id));
        }
    };

    const resetForm = () => {
        setNewName('');
        setNewRole('');
        setNewPhone('');
        setNewEmail('');
        setIsAdding(false);
    };

    const getAvatarColor = (name: string) => {
        const colors = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const filteredContacts = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return contacts.filter(c => 
            c.name.toLowerCase().includes(q) || 
            (c.role && c.role.toLowerCase().includes(q))
        );
    }, [contacts, searchQuery]);

    if (loading) return <div className="py-20 text-center animate-pulse text-muted">Chargement des contacts...</div>;

    return (
        <div className="pb-40 animate-fade-in">
            {/* Search Bar */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                    type="text"
                    placeholder="Rechercher un contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-premium pl-12"
                />
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredContacts.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <p className="text-sm text-muted font-bold opacity-60">Aucun contact trouvé.</p>
                    </div>
                ) : (
                    filteredContacts.map((c) => (
                        <div
                            key={c.id}
                            className="card-premium flex items-center gap-5 group transition-all"
                        >
                            {/* Avatar */}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-xl shadow-lg transition-transform group-hover:scale-110 ${getAvatarColor(c.name)}`}>
                                {c.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-white truncate">{c.name}</h4>
                                <p className="text-[10px] font-bold text-muted mt-0.5 uppercase tracking-wider opacity-60">
                                    {c.role || 'Contact'}
                                </p>
                                
                                <div className="flex items-center gap-4 mt-3">
                                    {c.phone && (
                                        <a href={`tel:${c.phone}`} className="text-[10px] font-bold text-muted hover:text-primary transition-colors flex items-center gap-1.5">
                                            <Phone size={10} /> Appeler
                                        </a>
                                    )}
                                    {c.email && (
                                        <a href={`mailto:${c.email}`} className="text-[10px] font-bold text-muted hover:text-primary transition-colors flex items-center gap-1.5">
                                            <Mail size={10} /> Email
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button onClick={() => deleteContact(c.id)} className="p-2 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </button>
                                <ChevronRight className="text-muted group-hover:text-white transition-all opacity-40 group-hover:opacity-100" size={18} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-24 left-0 right-0 px-6 z-40 pointer-events-none">
                <div className="max-w-md mx-auto md:max-w-2xl pointer-events-auto bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl">
                    {isAdding ? (
                        <form onSubmit={addContact} className="space-y-4 animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Nouveau Contact</h4>
                                <button type="button" onClick={resetForm} className="text-muted hover:text-white"><X size={18}/></button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Nom complet..."
                                    className="input-premium h-12 col-span-2"
                                />
                                <input
                                    type="text"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    placeholder="Rôle (ex: Mariée, Père...)"
                                    className="input-premium h-12 col-span-2"
                                />
                                <input 
                                    type="text"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder="Téléphone..."
                                    className="input-premium h-12"
                                />
                                <input 
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="Email..."
                                    className="input-premium h-12"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!newName.trim()}
                                className="btn-premium w-full h-14 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
                            >
                                <Plus size={20} />
                                <span>Ajouter le contact</span>
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
                            <span className="text-xs uppercase tracking-[0.2em] font-black">Ajouter un contact</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
