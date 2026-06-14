import { z } from 'zod';

// ================================================================
// EVENTIO — Schéma Zod pour le formulaire d'événement
// ================================================================

export const eventSchema = z.object({
    // ---- Section 1 : Informations événement ----
    title: z.string().min(1, 'Le titre est obligatoire'),
    event_date: z.string().nullable().optional(),
    event_time: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    status: z.enum(['non_valide', 'en_attente', 'valide', 'termine']).default('non_valide'),

    // ---- Section 2 : Client Monsieur ----
    client_monsieur_nom: z.string().nullable().optional(),
    client_monsieur_prenom: z.string().nullable().optional(),
    client_monsieur_adresse: z.string().nullable().optional(),
    client_monsieur_tel: z.string().nullable().optional(),
    client_monsieur_email: z.string().email('Email invalide').nullable().optional().or(z.literal('')),
    client_monsieur_instagram: z.string().nullable().optional(),

    // ---- Section 3 : Client Madame ----
    client_madame_nom: z.string().nullable().optional(),
    client_madame_prenom: z.string().nullable().optional(),
    client_madame_adresse: z.string().nullable().optional(),
    client_madame_tel: z.string().nullable().optional(),
    client_madame_email: z.string().email('Email invalide').nullable().optional().or(z.literal('')),
    client_madame_instagram: z.string().nullable().optional(),

    // ---- Section 4 : Tarifs ----
    montant_total: z.coerce.number().min(0).nullable().optional(),
    acompte: z.coerce.number().min(0).nullable().optional(),
    statut_paiement: z.enum(['non_paye', 'acompte_recu', 'paye']).default('non_paye'),
    moyen_paiement_acompte: z.string().nullable().optional(),

    // ---- Section 5 : Droit à l'image ----
    droit_image: z.boolean().default(false),

    // ---- Section 6 : Conditions d'annulation ----
    conditions_annulation: z.string().nullable().optional(),

    // ---- Section 7 : Notes internes ----
    notes_internes: z.string().nullable().optional(),
});

export type EventFormValues = z.infer<typeof eventSchema>;
