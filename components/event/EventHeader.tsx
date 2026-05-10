'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Copy, Trash2, MoreHorizontal, Check, Edit3 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { Event } from '@/types/database';
import StatusBadge from '@/components/StatusBadge';

interface EventHeaderProps {
    event: Event;
    isAdmin: boolean;
}

export default function EventHeader({ event }: EventHeaderProps) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    const formatDate = (iso: string | null) => {
        if (!iso) return '';
        return new Intl.DateTimeFormat('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(iso));
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/share/${event.share_token}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setShowMenu(false);
    };

    const handleDuplicate = async () => {
        if (!window.confirm("Voulez-vous dupliquer cet événement ?")) return;
        
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, created_at, share_token, ...rest } = event;
        
        const { data, error } = await (supabase as any)
            .from('events')
            .insert({
                ...rest,
                title: `${rest.title} (Copie)`,
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            alert("Erreur lors de la duplication");
            return;
        }

        router.push(`/dashboard/events/${data.id}`);
        setShowMenu(false);
    };

    const handleDelete = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;
        
        const supabase = createClient();
        const { error } = await (supabase as any)
            .from('events')
            .delete()
            .eq('id', event.id);

        if (error) {
            alert("Erreur lors de la suppression");
            return;
        }

        router.push('/dashboard/events');
    };

    const clientNames = [
        event.client_monsieur_prenom,
        event.client_madame_prenom
    ].filter(Boolean).join(' & ');

    return (
        <header className="relative w-full mb-8">
            {/* Cover Image Area */}
            <div className="w-full h-56 md:h-72 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#4C1D95] relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
                
                <div className="absolute inset-0 bg-black/30" /> {/* Subtle overlay */}
                
                {/* Navigation Controls */}
                <div className="absolute top-6 left-0 right-0 px-4 flex justify-between items-center z-20">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/dashboard/events')}
                            className="w-10 h-10 flex items-center justify-center rounded-xl glass hover:bg-white/10 transition-all text-white active:scale-90"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        
                        <button
                            onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
                            className="px-4 h-10 flex items-center gap-2 rounded-xl glass hover:bg-white/10 transition-all text-white active:scale-90 text-[10px] font-black uppercase tracking-widest"
                        >
                            <Edit3 size={14} strokeWidth={3} />
                            Modifier
                        </button>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all text-white active:scale-90 ${showMenu ? 'bg-white text-black shadow-xl' : 'glass hover:bg-white/10'}`}
                        >
                            <MoreHorizontal size={20} strokeWidth={2.5} />
                        </button>

                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                <div className="absolute top-12 right-0 w-56 glass-dark border border-white/10 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                                    <button 
                                        onClick={handleShare}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-white text-xs font-bold transition-colors"
                                    >
                                        {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}
                                        {copied ? 'Copié !' : 'Partager le projet'}
                                    </button>
                                    <button 
                                        onClick={handleDuplicate}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-white text-xs font-bold transition-colors"
                                    >
                                        <Copy size={16} />
                                        Dupliquer l'événement
                                    </button>
                                    <div className="h-px bg-white/5 my-2 mx-2" />
                                    <button 
                                        onClick={handleDelete}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Supprimer
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Event Summary Overlay (Bottom Left) */}
                <div className="absolute bottom-12 left-4 md:left-8 right-4 z-10 flex flex-col gap-1">
                    <StatusBadge status={event.status} size="sm" />
                </div>
            </div>

            {/* Event Info Card */}
            <div className="max-w-md mx-auto px-4 md:max-w-2xl -mt-10 relative z-20">
                <div className="bg-[#121212]/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {event.title}
                        </h1>
                        {clientNames && (
                            <p className="text-lg font-bold text-purple-400">
                                {clientNames}
                            </p>
                        )}
                        
                        <div className="mt-4 grid grid-cols-1 gap-2">
                            {event.location && (
                                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center text-[10px]">📍</span>
                                    <span>{event.location}</span>
                                </div>
                            )}
                            {event.date_start && (
                                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center text-[10px]">📅</span>
                                    <span className="capitalize">{formatDate(event.date_start)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
