'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Copy, Trash2, MoreHorizontal, Check, Edit3, FileText } from 'lucide-react';
import { generateEventPDF } from '@/lib/pdf';
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
    const [showShareModal, setShowShareModal] = useState(false);

    const formatDate = (iso: string | null) => {
        if (!iso) return '';
        const d = new Date(iso);
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        };
        
        if (d.getHours() !== 0 || d.getMinutes() !== 0) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return new Intl.DateTimeFormat('fr-FR', options).format(d);
    };

    const handleShare = () => {
        setShowShareModal(true);
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
                                        onClick={() => {
                                            generateEventPDF(event);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-white text-xs font-bold transition-colors"
                                    >
                                        <FileText size={16} />
                                        Générer la Fiche PDF
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

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in no-print">
                    <div className="w-full max-w-md bg-[#121214] border border-white/10 rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <span>🔗 Partager avec le client</span>
                                </h3>
                                <p className="text-xs text-muted font-medium mt-1">Transmettez ce lien sécurisé pour la consultation et la signature.</p>
                            </div>
                            <button 
                                onClick={() => setShowShareModal(false)}
                                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-muted hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Link Container */}
                        <div className="mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted block mb-2 px-1">Lien de signature unique</span>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={typeof window !== 'undefined' ? `${window.location.origin}/share/${event.share_token}` : ''}
                                    className="input-premium py-3 text-xs font-semibold flex-1 min-w-0 bg-[#161618] border-white/5"
                                />
                                <button
                                    onClick={async () => {
                                        if (typeof window === 'undefined') return;
                                        const shareUrl = `${window.location.origin}/share/${event.share_token}`;
                                        await navigator.clipboard.writeText(shareUrl);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className={`h-11 px-4 rounded-xl flex items-center justify-center font-bold text-xs transition-all active:scale-95 border ${
                                        copied 
                                            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                                            : 'bg-primary border-primary text-white hover:bg-primary/80'
                                    }`}
                                >
                                    {copied ? <Check size={16} /> : 'Copier'}
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="space-y-3 mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted block px-1">Partager directement</span>
                            
                            {/* Email Option */}
                            <a
                                href={typeof window !== 'undefined' ? `mailto:${[event.client_monsieur_email, event.client_madame_email].filter(Boolean).join(',') || ''}?subject=${encodeURIComponent(`Votre contrat d'événement : ${event.title}`)}&body=${encodeURIComponent(
                                    `Bonjour,\n\nVoici le lien sécurisé pour consulter et signer en ligne votre contrat de prestation pour l'événement "${event.title}" :\n\n${window.location.origin}/share/${event.share_token}\n\nÀ très bientôt,\nL'équipe EVENTIO`
                                )}` : '#'}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-left"
                            >
                                <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 text-lg">
                                    📬
                                </span>
                                <div>
                                    <h4 className="text-xs font-black text-white">Envoyer par E-mail</h4>
                                    <p className="text-[10px] text-muted font-medium mt-0.5">Pré-remplit un e-mail destiné à vos clients.</p>
                                </div>
                            </a>

                            {/* WhatsApp Option */}
                            <a
                                href={typeof window !== 'undefined' ? `https://api.whatsapp.com/send?text=${encodeURIComponent(
                                    `Bonjour, Voici le lien pour consulter et signer en ligne votre contrat de prestation pour l'événement "${event.title}" : ${window.location.origin}/share/${event.share_token}`
                                )}` : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-left"
                            >
                                <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 text-lg">
                                    💬
                                </span>
                                <div>
                                    <h4 className="text-xs font-black text-white">Partager sur WhatsApp</h4>
                                    <p className="text-[10px] text-muted font-medium mt-0.5">Envoie une invitation rapide via WhatsApp.</p>
                                </div>
                            </a>
                        </div>

                        {/* Preview Button */}
                        <a
                            href={`/share/${event.share_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-12 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all"
                        >
                            👁️ Prévisualiser la page de signature
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
}
