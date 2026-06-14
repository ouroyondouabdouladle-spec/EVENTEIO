'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { Event } from '@/types/database';
import SignaturePad from '@/components/SignaturePad';
import { Calendar, MapPin, CreditCard, FileText, Check, AlertCircle, Award } from 'lucide-react';
import { generateEventPDF } from '@/lib/pdf';

interface SharePageProps {
    params: { token: string };
}

export default function ShareContractPage({ params }: SharePageProps) {
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [signingRole, setSigningRole] = useState<'monsieur' | 'madame' | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const fetchEvent = async () => {
        const supabase = createClient();
        const { data, error } = await (supabase as any)
            .from('events')
            .select('*')
            .eq('share_token', params.token)
            .single();

        if (!error && data) {
            setEvent(data as Event);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEvent();
    }, [params.token]);

    const handleSaveSignature = async (base64Image: string) => {
        if (!event || !signingRole) return;

        const supabase = createClient();
        const updateData: any = {};
        const signDate = new Date().toISOString();

        if (signingRole === 'monsieur') {
            updateData.signature_monsieur = base64Image;
        } else {
            updateData.signature_madame = base64Image;
        }
        updateData.signature_date = signDate;

        // Si l'autre signature est déjà présente, on valide automatiquement le contrat !
        const isMonsieurSignedNow = signingRole === 'monsieur' || !!event.signature_monsieur;
        const isMadameSignedNow = signingRole === 'madame' || !!event.signature_madame;

        if (isMonsieurSignedNow && isMadameSignedNow) {
            updateData.status = 'valide';
        }

        const { error } = await (supabase as any)
            .from('events')
            .update(updateData)
            .eq('id', event.id);

        if (error) {
            alert("Erreur lors de l'enregistrement de la signature. Veuillez réessayer.");
            return;
        }

        // Mettre à jour l'état local et afficher le succès
        setSigningRole(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        await fetchEvent();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#080808] text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
                <p className="text-sm font-semibold text-muted animate-pulse">Chargement de votre contrat en cours...</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#080808] text-white px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-2">
                    <AlertCircle size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black mb-2">Contrat introuvable</h1>
                    <p className="text-sm text-muted max-w-sm">Le lien de partage ou le jeton de sécurité est invalide ou expiré.</p>
                </div>
            </div>
        );
    }

    const clientNames = [
        event.client_monsieur_prenom ? `${event.client_monsieur_prenom} ${event.client_monsieur_nom}` : '',
        event.client_madame_prenom ? `${event.client_madame_prenom} ${event.client_madame_nom}` : ''
    ].filter(Boolean).join(' & ');

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '0,00 €';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const dateFormatted = event.date_start ? new Date(event.date_start).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }) : 'Non définie';

    const montantRestant = (event.montant_total ?? 0) - (event.acompte ?? 0);
    const bothSigned = !!event.signature_monsieur && !!event.signature_madame;

    return (
        <div className="min-h-screen bg-[#09090A] text-white pb-32">
            {/* Success Overlay Toast */}
            {showSuccess && (
                <div className="fixed top-6 left-6 right-6 z-50 p-4 rounded-2xl glass-dark border border-green-500/30 bg-green-500/10 flex items-center gap-4 animate-in fade-in slide-in-from-top duration-300">
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white">
                        <Check size={20} strokeWidth={3} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white">Signature enregistrée !</h4>
                        <p className="text-[11px] text-muted font-medium">Votre signature a été synchronisée en temps réel.</p>
                    </div>
                </div>
            )}

            {/* Header Banner */}
            <div className="w-full h-48 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#4C1D95] relative overflow-hidden flex items-end p-6">
                <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-black/40" />
                
                <div className="relative z-10 max-w-xl mx-auto w-full flex justify-between items-end">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                            Espace Client
                        </span>
                        <h1 className="text-2xl font-black mt-3 leading-tight">{event.title}</h1>
                    </div>
                    {bothSigned && (
                        <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg">
                            <Check size={12} strokeWidth={3} />
                            Signé
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6 -mt-6 relative z-20">
                {/* Intro Card */}
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 shadow-2xl mb-8">
                    <p className="text-sm text-muted leading-relaxed">
                        Bonjour {clientNames || 'Cher Client'} 👋, merci de prendre connaissance du contrat de prestation ci-dessous. Vous pouvez signer électroniquement ce contrat directement depuis cette page.
                    </p>
                </div>

                {/* Recap Sections */}
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-2 opacity-50">Résumé du Projet</h3>
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-4 mb-8 space-y-2">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                <Calendar size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider text-muted">Date</span>
                        </div>
                        <span className="text-sm font-bold text-white capitalize">{dateFormatted}</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                <MapPin size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider text-muted">Lieu</span>
                        </div>
                        <span className="text-sm font-bold text-white">{event.location ?? 'Non défini'}</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                <Award size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider text-muted">Prestation</span>
                        </div>
                        <span className="text-sm font-bold text-white">{event.type ?? 'Non définie'}</span>
                    </div>
                </div>

                {/* Financial Summary */}
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-2 opacity-50">Synthèse Financière</h3>
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-4 mb-8 space-y-2">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl">
                        <span className="text-xs font-black uppercase tracking-wider text-muted">Montant Total</span>
                        <span className="text-sm font-bold text-white">{formatCurrency(event.montant_total)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-2xl">
                        <span className="text-xs font-black uppercase tracking-wider text-muted">Acompte Versé</span>
                        <span className="text-sm font-bold text-white text-green-400">
                            {formatCurrency(event.acompte)}
                            {event.moyen_paiement_acompte && (
                                <span className="text-xs text-muted ml-2 font-normal">
                                    ({event.moyen_paiement_acompte === 'especes' ? 'Espèces' : event.moyen_paiement_acompte === 'virement' ? 'Virement' : 'PayPal'})
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-2xl border-t border-white/5 pt-5 mt-2">
                        <span className="text-xs font-black uppercase tracking-wider text-white">Solde Restant</span>
                        <span className="text-base font-black text-purple-400">{formatCurrency(montantRestant)}</span>
                    </div>
                </div>

                {/* Clauses & conditions */}
                {event.conditions_annulation && (
                    <div className="mb-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-2 opacity-50">Clauses & Conditions</h3>
                        <div className="bg-[#121214] border border-white/5 rounded-3xl p-6">
                            <p className="text-xs font-medium leading-relaxed text-white/70 whitespace-pre-wrap">
                                {event.conditions_annulation}
                            </p>
                        </div>
                    </div>
                )}

                {/* Signatures Blocks */}
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-2 opacity-50">Signatures du Contrat</h3>
                <div className="grid grid-cols-1 gap-6 mb-12">
                    {/* Monsieur */}
                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-4">
                            Signataire Monsieur {event.client_monsieur_nom ? `(${event.client_monsieur_prenom} ${event.client_monsieur_nom})` : ''}
                        </h4>
                        
                        {event.signature_monsieur ? (
                            <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-[#151515] min-h-[120px]">
                                <img src={event.signature_monsieur} alt="Signature Monsieur" className="max-h-24 object-contain invert" />
                                {event.signature_date && (
                                    <span className="text-[9px] font-bold text-muted uppercase mt-4">
                                        Signé le {new Date(event.signature_date).toLocaleDateString('fr-FR')}
                                    </span>
                                )}
                            </div>
                        ) : signingRole === 'monsieur' ? (
                            <SignaturePad 
                                placeholder="Dessinez votre signature ici..."
                                onSave={handleSaveSignature}
                            />
                        ) : (
                            <button
                                onClick={() => setSigningRole('monsieur')}
                                className="w-full h-14 rounded-2xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                ✍️ Signer en tant que Monsieur
                            </button>
                        )}
                    </div>

                    {/* Madame */}
                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-4">
                            Signataire Madame {event.client_madame_nom ? `(${event.client_madame_prenom} ${event.client_madame_nom})` : ''}
                        </h4>
                        
                        {event.signature_madame ? (
                            <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-[#151515] min-h-[120px]">
                                <img src={event.signature_madame} alt="Signature Madame" className="max-h-24 object-contain invert" />
                                {event.signature_date && (
                                    <span className="text-[9px] font-bold text-muted uppercase mt-4">
                                        Signé le {new Date(event.signature_date).toLocaleDateString('fr-FR')}
                                    </span>
                                )}
                            </div>
                        ) : signingRole === 'madame' ? (
                            <SignaturePad 
                                placeholder="Dessinez votre signature ici..."
                                onSave={handleSaveSignature}
                            />
                        ) : (
                            <button
                                onClick={() => setSigningRole('madame')}
                                className="w-full h-14 rounded-2xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                ✍️ Signer en tant que Madame
                            </button>
                        )}
                    </div>
                </div>

                {/* PDF Print/Download Actions */}
                <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                            <FileText size={16} className="text-purple-400" />
                            <span>Contrat PDF officiel</span>
                        </h4>
                        <p className="text-[11px] text-muted font-semibold">Téléchargez ou imprimez une copie officielle de votre contrat signé.</p>
                    </div>
                    <button
                        onClick={() => generateEventPDF(event)}
                        className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 text-xs font-bold text-white flex-shrink-0"
                    >
                        Télécharger le contrat
                    </button>
                </div>
            </div>
        </div>
    );
}
