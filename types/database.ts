// ================================================================
// EVENTIO - Types TypeScript générés depuis le schéma Supabase
// ================================================================

// --- ENUMS ---
export type UserRole = 'admin' | 'membre';
export type EventStatus = 'non_valide' | 'en_attente' | 'valide' | 'termine';
export type PaymentStatus = 'non_paye' | 'acompte_recu' | 'paye';
export type TaskStatus = 'a_faire' | 'en_cours' | 'termine';
export type TaskPriority = 'basse' | 'moyenne' | 'haute';
export type SupplierStatus = 'a_contacter' | 'devis_recu' | 'contrat_signe' | 'paye';

// --- TABLE INTERFACES ---

export interface Team {
    id: string;
    name: string;
    invite_code: string;
    created_at: string;
}

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    team_id: string | null;
    created_at: string;
}

export interface Event {
    id: string;
    title: string;
    date_start: string | null;
    date_end: string | null;
    location: string | null;
    type: string | null;
    status: EventStatus;

    // Client Monsieur
    client_monsieur_nom: string | null;
    client_monsieur_prenom: string | null;
    client_monsieur_tel: string | null;
    client_monsieur_email: string | null;
    client_monsieur_adresse: string | null;
    client_monsieur_instagram: string | null;

    // Client Madame
    client_madame_nom: string | null;
    client_madame_prenom: string | null;
    client_madame_tel: string | null;
    client_madame_email: string | null;
    client_madame_adresse: string | null;
    client_madame_instagram: string | null;

    // Finance & Légal
    montant_total: number | null;
    acompte: number | null;
    statut_paiement: PaymentStatus;
    droit_image: boolean;
    conditions_annulation: string | null;
    notes_internes: string | null;

    // Signatures
    signature_monsieur: string | null;
    signature_madame: string | null;
    signature_date: string | null;
    share_token: string | null;

    // Relations
    team_id: string | null;
    created_by: string | null;

    // Horodatages
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    event_id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    assigned_to: string | null;
    created_at: string;
}

export interface Supplier {
    id: string;
    event_id: string;
    name: string;
    category: string | null;
    phone: string | null;
    email: string | null;
    status: SupplierStatus;
    budget: number;
    notes: string | null;
    website: string | null;
    instagram: string | null;
    created_at: string;
}

export interface Contact {
    id: string;
    event_id: string;
    name: string;
    role: string | null;
    phone: string | null;
    email: string | null;
    created_at: string;
}

export interface EventDocument {
    id: string;
    event_id: string;
    name: string;
    url: string;
    type: string | null;
    created_at: string;
}

export interface ActivityLog {
    id: string;
    event_id: string;
    user_id: string;
    action: string;
    details: Record<string, unknown>;
    created_at: string;
}

// --- TYPE SUPABASE DATABASE (structure pour les clients typés) ---
export interface Database {
    public: {
        Tables: {
            teams: {
                Row: Team;
                Insert: {
                    name: string;
                    id?: string;
                    created_at?: string;
                    invite_code?: string;
                };
                Update: Partial<Team>;
            };
            profiles: {
                Row: Profile;
                Insert: {
                    id: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    role?: UserRole;
                    team_id?: string | null;
                    created_at?: string;
                };
                Update: Partial<Profile>;
            };
            events: {
                Row: Event;
                Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'share_token'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    share_token?: string;
                };
                Update: Partial<Omit<Event, 'id'>>;
            };
            tasks: {
                Row: Task;
                Insert: Omit<Task, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<Omit<Task, 'id'>>;
            };
            suppliers: {
                Row: Supplier;
                Insert: Omit<Supplier, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<Omit<Supplier, 'id'>>;
            };
            contacts: {
                Row: Contact;
                Insert: Omit<Contact, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<Omit<Contact, 'id'>>;
            };
            documents: {
                Row: EventDocument;
                Insert: Omit<EventDocument, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<Omit<EventDocument, 'id'>>;
            };
            activity_logs: {
                Row: ActivityLog;
                Insert: Omit<ActivityLog, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: never;
            };
        };
        Views: {
            [_ in never]: never
        };
        Functions: {
            get_user_team: {
                Args: Record<PropertyKey, never>;
                Returns: string;
            };
        };
        Enums: {
            user_role: UserRole;
            event_status: EventStatus;
            payment_status: PaymentStatus;
            task_status: TaskStatus;
            task_priority: TaskPriority;
            supplier_status: SupplierStatus;
        };
        CompositeTypes: {
            [_ in never]: never
        };
    };
};
