'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import { eventSchema, type EventFormValues } from '@/lib/validations/eventSchema';
import FormSection from '@/components/form/FormSection';
import FormInput from '@/components/form/FormInput';
import FormTextarea from '@/components/form/FormTextarea';
import FormSelect from '@/components/form/FormSelect';
import { ChevronLeft, Save, Sparkles, Camera, AlertCircle, Loader2, Trash2 } from 'lucide-react';

const EVENT_TYPES = [
    { value: 'Mariage', label: '💍 Mariage' },
    { value: 'Anniversaire', label: '🎂 Anniversaire' },
    { value: 'Soirée entreprise', label: '🏢 Soirée entreprise' },
    { value: 'Conférence', label: '🎤 Conférence' },
    { value: 'Autre', label: '📅 Autre' },
];

const EVENT_STATUSES = [
    { value: 'non_valide', label: '⏳ Non validé' },
    { value: 'en_attente', label: '🕐 En attente' },
    { value: 'valide', label: '✅ Validé' },
    { value: 'termine', label: '🏁 Terminé' },
];

const PAYMENT_STATUSES = [
    { value: 'non_paye', label: '❌ Non payé' },
    { value: 'acompte_recu', label: '💰 Acompte reçu' },
    { value: 'paye', label: '✅ Payé' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            className="relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none"
            style={{
                background: value
                    ? 'linear-gradient(135deg, #7F77DD, #5B54C2)'
                    : 'var(--bg-overlay)',
                border: '1px solid var(--border)',
            }}
        >
            <span
                className="inline-block h-5 w-5 transform rounded-full shadow-md transition-all duration-300"
                style={{
                    background: '#fff',
                    transform: value ? 'translateX(22px)' : 'translateX(2px)',
                }}
            />
        </button>
    );
}

interface EventFormProps {
    eventId?: string;
}

export default function EventForm({ eventId }: EventFormProps) {
    const router = useRouter();
    const { profile, loading: userLoading } = useUser();
    const [loading, setLoading] = useState(false);
    const [fetchingEvent, setFetchingEvent] = useState(!!eventId);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            status: 'non_valide',
            statut_paiement: 'non_paye',
            droit_image: false,
        },
        mode: 'onChange'
    });

    const montantTotal = useWatch({ control, name: 'montant_total' });
    const acompte = useWatch({ control, name: 'acompte' });
    const droitImage = useWatch({ control, name: 'droit_image' });
    const resteAPayer = ((montantTotal ?? 0) - (acompte ?? 0)).toFixed(2);

    useEffect(() => {
        if (!eventId) return;

        const supabase = createClient();
        supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single()
            .then(({ data, error }) => {
                if (!error && data) {
                    reset({
                        title: data.title,
                        date_start: data.date_start ?? '',
                        date_end: data.date_end ?? '',
                        location: data.location ?? '',
                        type: (data.type as EventFormValues['type']) ?? undefined,
                        status: data.status,
                        client_monsieur_nom: data.client_monsieur_nom ?? '',
                        client_monsieur_prenom: data.client_monsieur_prenom ?? '',
                        client_monsieur_adresse: data.client_monsieur_adresse ?? '',
                        client_monsieur_tel: data.client_monsieur_tel ?? '',
                        client_monsieur_email: data.client_monsieur_email ?? '',
                        client_monsieur_instagram: data.client_monsieur_instagram ?? '',
                        client_madame_nom: data.client_madame_nom ?? '',
                        client_madame_prenom: data.client_madame_prenom ?? '',
                        client_madame_adresse: data.client_madame_adresse ?? '',
                        client_madame_tel: data.client_madame_tel ?? '',
                        client_madame_email: data.client_madame_email ?? '',
                        client_madame_instagram: data.client_madame_instagram ?? '',
                        montant_total: data.montant_total ?? undefined,
                        acompte: data.acompte ?? undefined,
                        statut_paiement: data.statut_paiement,
                        droit_image: data.droit_image,
                        conditions_annulation: data.conditions_annulation ?? '',
                        notes_internes: data.notes_internes ?? '',
                    });
                }
                setFetchingEvent(false);
            });
    }, [eventId, reset]);

    const onSubmit = async (values: EventFormValues) => {
        if (!profile?.id) {
            setSubmitError("Votre profil n'a pas pu être chargé. Veuillez rafraîchir la page ou vous reconnecter.");
            return;
        }

        if (!profile?.team_id) {
            setSubmitError("Vous n'êtes rattaché à aucune équipe. Veuillez contacter votre administrateur ou recréer un compte.");
            return;
        }
        setLoading(true);
        setSubmitError(null);

        const supabase = createClient();
        const payload = {
            title: values.title,
            date_start: values.date_start || null,
            date_end: values.date_end || null,
            location: values.location || null,
            type: values.type || null,
            status: values.status,
            client_monsieur_nom: values.client_monsieur_nom || null,
            client_monsieur_prenom: values.client_monsieur_prenom || null,
            client_monsieur_adresse: values.client_monsieur_adresse || null,
            client_monsieur_tel: values.client_monsieur_tel || null,
            client_monsieur_email: values.client_monsieur_email || null,
            client_monsieur_instagram: values.client_monsieur_instagram || null,
            client_madame_nom: values.client_madame_nom || null,
            client_madame_prenom: values.client_madame_prenom || null,
            client_madame_adresse: values.client_madame_adresse || null,
            client_madame_tel: values.client_madame_tel || null,
            client_madame_email: values.client_madame_email || null,
            client_madame_instagram: values.client_madame_instagram || null,
            montant_total: values.montant_total ?? null,
            acompte: values.acompte ?? null,
            statut_paiement: values.statut_paiement,
            droit_image: values.droit_image,
            conditions_annulation: values.conditions_annulation || null,
            notes_internes: values.notes_internes || null,
            team_id: profile.team_id,
            created_by: profile.id,
        };

        let savedId = eventId;

        try {
            if (eventId) {
                const { error } = await supabase
                    .from('events')
                    .update(payload)
                    .eq('id', eventId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('events')
                    .insert(payload)
                    .select('id')
                    .single();
                if (error || !data) throw error || new Error('Pas de données retournées');
                savedId = data.id;
            }

            await supabase.from('activity_logs').insert({
                event_id: savedId!,
                user_id: profile.id,
                action: eventId ? 'event_updated' : 'event_created',
                details: { title: values.title },
            });

            router.push(`/dashboard/events/${savedId}`);
        } catch (error: any) {
            console.error('Submit error:', error);
            setSubmitError(error.message || "Erreur lors de l'enregistrement");
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!eventId || !window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.")) return;
        
        setLoading(true);
        const supabase = createClient();
        
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);
                
            if (error) throw error;
            
            router.push('/dashboard/events');
        } catch (error: any) {
            console.error('Delete error:', error);
            setSubmitError(error.message || "Erreur lors de la suppression");
            setLoading(false);
        }
    };

    if (userLoading || fetchingEvent) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-muted opacity-60">Initialisation...</p>
            </div>
        );
    }

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <div className="min-h-screen pb-40 bg-background">
            <header className="sticky top-0 z-50 px-6 pt-8 pb-6 glass border-b border-white/5">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-surface border border-white/5 text-muted hover:text-white transition-all active:scale-90"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-white">
                                {eventId ? 'Modifier' : 'Nouveau projet'}
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted opacity-60">
                                {eventId ? 'Mise à jour des données' : 'Configuration initiale'}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <form 
                id="event-form"
                onSubmit={handleSubmit(onSubmit)} 
                className="px-6 py-8 max-w-2xl mx-auto space-y-4"
            >
                {!profile && !userLoading && (
                    <div className="rounded-2xl p-5 bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertCircle size={20} />
                            <p className="text-xs font-black uppercase tracking-widest">Alerte Profil</p>
                        </div>
                        <p className="text-[11px] font-bold opacity-90">
                            Impossible de charger votre profil. Veuillez vérifier votre connexion ou vous reconnecter.
                        </p>
                    </div>
                )}

                {/* SECTION 1 : Informations événement */}
                <FormSection title="Informations événement" icon="📋" defaultOpen>
                    <div className="sm:col-span-2">
                        <FormInput
                            label="Titre du projet"
                            registration={register('title')}
                            error={errors.title?.message}
                            placeholder="Ex : Mariage de Sophie & Marc"
                            required
                        />
                    </div>
                    <FormInput
                        label="Date de début"
                        registration={register('date_start')}
                        type="datetime-local"
                    />
                    <FormInput
                        label="Date de fin"
                        registration={register('date_end')}
                        type="datetime-local"
                    />
                    <div className="sm:col-span-2">
                        <FormInput
                            label="Lieu / Adresse"
                            registration={register('location')}
                            placeholder="Ex : Domaine de la Pinède, Marseille"
                        />
                    </div>
                    <FormSelect
                        label="Type de prestation"
                        registration={register('type')}
                        options={EVENT_TYPES}
                        placeholder="Sélectionner..."
                    />
                    <FormSelect
                        label="Statut du projet"
                        registration={register('status')}
                        options={EVENT_STATUSES}
                    />
                </FormSection>

                {/* SECTION 2 : Client Monsieur */}
                <FormSection title="Le Mari (Monsieur)" icon="👨">
                    <FormInput label="Nom" registration={register('client_monsieur_nom')} placeholder="Nom" />
                    <FormInput label="Prénom" registration={register('client_monsieur_prenom')} placeholder="Prénom" />
                    <div className="sm:col-span-2">
                        <FormInput label="Adresse" registration={register('client_monsieur_adresse')} placeholder="Adresse résidentielle" />
                    </div>
                    <FormInput label="Téléphone" registration={register('client_monsieur_tel')} type="tel" placeholder="+33 6 ..." />
                    <FormInput label="Email" registration={register('client_monsieur_email')} type="email" placeholder="Email"
                        error={errors.client_monsieur_email?.message} />
                    <FormInput label="Instagram" registration={register('client_monsieur_instagram')} placeholder="@username" />
                </FormSection>

                {/* SECTION 3 : La Mariée (Madame) */}
                <FormSection title="La Mariée (Madame)" icon="👩">
                    <FormInput label="Nom" registration={register('client_madame_nom')} placeholder="Nom" />
                    <FormInput label="Prénom" registration={register('client_madame_prenom')} placeholder="Prénom" />
                    <div className="sm:col-span-2">
                        <FormInput label="Adresse" registration={register('client_madame_adresse')} placeholder="Adresse résidentielle" />
                    </div>
                    <FormInput label="Téléphone" registration={register('client_madame_tel')} type="tel" placeholder="+33 6 ..." />
                    <FormInput label="Email" registration={register('client_madame_email')} type="email" placeholder="Email"
                        error={errors.client_madame_email?.message} />
                    <FormInput label="Instagram" registration={register('client_madame_instagram')} placeholder="@username" />
                </FormSection>

                {/* SECTION 4 : Budget & Paiement */}
                <FormSection title="Budget & Facturation" icon="💶">
                    <FormInput
                        label="Montant total (€)"
                        registration={register('montant_total')}
                        type="number"
                        placeholder="0.00"
                    />
                    <FormInput
                        label="Acompte versé (€)"
                        registration={register('acompte')}
                        type="number"
                        placeholder="0.00"
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted opacity-60 mb-1">
                            Reste à percevoir (€)
                        </label>
                        <div className="w-full rounded-2xl px-5 py-3.5 text-sm font-black bg-surface border border-white/5 text-primary">
                            {resteAPayer} €
                        </div>
                    </div>
                    <FormSelect
                        label="État du paiement"
                        registration={register('statut_paiement')}
                        options={PAYMENT_STATUSES}
                    />
                </FormSection>

                {/* SECTION 5 : Logistique & Notes */}
                <FormSection title="Logistique & Notes" icon="📸">
                    <div className="sm:col-span-2 flex items-center justify-between p-5 rounded-2xl bg-surface border border-white/5 mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${droitImage ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                <Camera size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black">Droit à l'image</p>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{droitImage ? 'Autorisé' : 'Non autorisé'}</p>
                            </div>
                        </div>
                        <Toggle
                            value={droitImage ?? false}
                            onChange={(v) => setValue('droit_image', v)}
                        />
                    </div>
                    <div className="sm:col-span-2 space-y-4">
                        <FormTextarea
                            label="Conditions d'annulation"
                            registration={register('conditions_annulation')}
                            placeholder="Détails contractuels..."
                            rows={3}
                        />
                        <FormTextarea
                            label="Notes internes (Équipe uniquement)"
                            registration={register('notes_internes')}
                            placeholder="Informations sensibles ou rappels..."
                            rows={3}
                        />
                    </div>
                </FormSection>

                {/* Alertes d'erreurs */}
                {(submitError || hasErrors) && (
                    <div className="rounded-2xl p-5 bg-red-500/10 border border-red-500/20 text-red-400 animate-shake">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertCircle size={20} />
                            <p className="text-xs font-black uppercase tracking-widest">Attention</p>
                        </div>
                        <ul className="list-disc list-inside text-[11px] font-bold space-y-1 ml-1 opacity-90">
                            {submitError && <li>{submitError}</li>}
                            {errors.title && <li>Le titre est obligatoire</li>}
                            {errors.client_monsieur_email && <li>Email Monsieur invalide</li>}
                            {errors.client_madame_email && <li>Email Madame invalide</li>}
                        </ul>
                    </div>
                )}

                {/* Barre d'action fixe */}
                <div className="fixed bottom-0 left-0 right-0 px-6 py-6 z-[60] glass border-t border-white/5">
                    <div className="max-w-2xl mx-auto flex gap-3">
                        {eventId && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading || userLoading}
                                className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 active:scale-95"
                                title="Supprimer l'événement"
                            >
                                <Trash2 size={24} />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading || isSubmitting || userLoading}
                            className="btn-premium flex-1 flex items-center justify-center gap-3 h-16 shadow-2xl shadow-primary/40 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="uppercase tracking-[0.2em] font-black text-xs">Enregistrement...</span>
                                </>
                            ) : (
                                <>
                                    {eventId ? <Save size={20} /> : <Sparkles size={20} />}
                                    <span className="uppercase tracking-[0.2em] font-black text-xs">
                                        {eventId ? 'Enregistrer' : 'Finaliser la création'}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
