'use client';

import { useRouter } from 'next/navigation';
import type { Event } from '@/types/database';
import { 
    Phone, Mail, MapPin, Camera, ChevronRight, 
    Info, CreditCard, FileText, Wallet 
} from 'lucide-react';

interface TabDetailsProps {
    event: Event;
}

export default function TabDetails({ event }: TabDetailsProps) {
    const router = useRouter();

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '—';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const ClientCard = ({ title, nom, prenom, tel, email, address, instagram }: { 
        title: string, nom: string | null, prenom: string | null, tel: string | null, email: string | null, address: string | null, instagram: string | null 
    }) => (
        <div className="card-premium mb-6 group transition-all hover:border-white/20">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <span className="font-black text-xs">{title.charAt(0)}</span>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-white transition-colors">
                    {title}
                </h4>
            </div>
            
            <div className="space-y-4">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Nom complet</span>
                    <span className="text-sm font-black text-white">{prenom || '—'} {nom || ''}</span>
                </div>
                
                {tel && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted">
                            <Phone size={14} />
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted block">Téléphone</span>
                            <a href={`tel:${tel}`} className="text-xs font-bold text-primary hover:text-white transition-colors">{tel}</a>
                        </div>
                    </div>
                )}
                
                {email && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted">
                            <Mail size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted block">Email</span>
                            <a href={`mailto:${email}`} className="text-xs font-bold text-primary hover:text-white transition-colors truncate block">{email}</a>
                        </div>
                    </div>
                )}
                
                {instagram && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                            <Camera size={14} />
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted block">Instagram</span>
                            <span className="text-xs font-bold text-white">@{instagram.replace('@', '')}</span>
                        </div>
                    </div>
                )}
                
                {address && (
                    <div className="pt-4 mt-2 border-t border-white/5">
                        <div className="flex items-start gap-3">
                            <MapPin size={14} className="text-muted mt-1" />
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted block mb-1">Adresse</span>
                                <p className="text-xs font-medium text-white/80 leading-relaxed">{address}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const logistics = [
        { icon: Info, label: 'Type d\'événement', value: event.type || 'Non spécifié', color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { icon: MapPin, label: 'Lieu', value: event.location || 'Non spécifié', color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { icon: Wallet, label: 'Budget', value: formatCurrency(event.montant_total), color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { icon: CreditCard, label: 'Statut Paiement', value: event.statut_paiement?.replace('_', ' ') || '—', color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { icon: Camera, label: 'Droit à l\'image', value: event.droit_image ? 'Autorisé' : 'Refusé', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    ];

    return (
        <div className="pb-32 animate-fade-in">
            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {(event.client_monsieur_nom || event.client_monsieur_prenom) && (
                    <ClientCard 
                        title="Monsieur"
                        nom={event.client_monsieur_nom}
                        prenom={event.client_monsieur_prenom}
                        tel={event.client_monsieur_tel}
                        email={event.client_monsieur_email}
                        address={event.client_monsieur_adresse}
                        instagram={event.client_monsieur_instagram}
                    />
                )}
                {(event.client_madame_nom || event.client_madame_prenom) && (
                    <ClientCard 
                        title="Madame"
                        nom={event.client_madame_nom}
                        prenom={event.client_madame_prenom}
                        tel={event.client_madame_tel}
                        email={event.client_madame_email}
                        address={event.client_madame_adresse}
                        instagram={event.client_madame_instagram}
                    />
                )}
            </div>

            {/* Logistics */}
            <div className="mb-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-2 opacity-40">Informations Logistiques</h3>
                <div className="card-premium p-2">
                    {logistics.map((item, idx) => (
                        <div 
                            key={idx} 
                            className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-default"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.bg} ${item.color}`}>
                                    <item.icon size={18} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider text-muted group-hover:text-white transition-colors">
                                    {item.label}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-white uppercase tracking-wider">
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Internal Notes */}
            {event.notes_internes && (
                <div className="mb-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-2 opacity-40">Notes Internes</h3>
                    <div className="card-premium p-6 border-dashed border-white/10 bg-white/5">
                        <div className="flex items-start gap-4">
                            <FileText size={20} className="text-primary mt-1 opacity-60" />
                            <p className="text-sm font-medium leading-relaxed text-white/80 whitespace-pre-wrap">
                                {event.notes_internes}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Edit Button */}
            <div className="fixed bottom-24 left-0 right-0 px-6 z-40 pointer-events-none">
                <div className="max-w-md mx-auto md:max-w-2xl pointer-events-auto bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl">
                    <button
                        onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
                        className="btn-premium w-full flex items-center justify-center gap-3 h-14 group shadow-xl shadow-primary/20"
                    >
                        <span className="text-xs uppercase tracking-[0.2em] font-black">Modifier l'événement</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
