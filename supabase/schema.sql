-- ================================================================
-- EVENTIO : SCHÉMA SQL COMPLET POUR SUPABASE
-- ================================================================

-- 1. CRÉATION DES TYPES (ENUMS)
-- ----------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'membre');
CREATE TYPE event_status AS ENUM ('non_valide', 'en_attente', 'valide', 'termine');
CREATE TYPE payment_status AS ENUM ('non_paye', 'acompte_recu', 'paye');
CREATE TYPE task_status AS ENUM ('a_faire', 'en_cours', 'termine');

-- 2. CRÉATION DES TABLES
-- ----------------------------------------------------------------

-- Table: teams
CREATE TABLE public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code UUID DEFAULT gen_random_uuid() UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table: profiles (étend auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'membre'::user_role NOT NULL,
    team_id UUID REFERENCES public.teams ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table: events
CREATE TABLE public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    date_start TIMESTAMPTZ,
    date_end TIMESTAMPTZ,
    location TEXT,
    type TEXT,
    status event_status DEFAULT 'non_valide'::event_status,
    
    -- Client Monsieur
    client_monsieur_nom TEXT,
    client_monsieur_prenom TEXT,
    client_monsieur_tel TEXT,
    client_monsieur_email TEXT,
    client_monsieur_adresse TEXT,
    client_monsieur_instagram TEXT,
    
    -- Client Madame
    client_madame_nom TEXT,
    client_madame_prenom TEXT,
    client_madame_tel TEXT,
    client_madame_email TEXT,
    client_madame_adresse TEXT,
    client_madame_instagram TEXT,
    
    -- Finance et Légal
    montant_total NUMERIC,
    acompte NUMERIC,
    statut_paiement payment_status DEFAULT 'non_paye'::payment_status,
    droit_image BOOLEAN DEFAULT false,
    conditions_annulation TEXT,
    notes_internes TEXT,
    
    -- Signatures
    signature_monsieur TEXT,
    signature_madame TEXT,
    signature_date DATE,
    share_token UUID DEFAULT gen_random_uuid() UNIQUE,
    
    -- Relations
    team_id UUID REFERENCES public.teams ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles ON DELETE SET NULL,
    
    -- Horodatages
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table: tasks
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    status task_status DEFAULT 'a_faire'::task_status,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table: suppliers
CREATE TABLE public.suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table: contacts
CREATE TABLE public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table: documents
CREATE TABLE public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table: activity_logs
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. GESTION AUTOMATIQUE DE PROFIL SUR INSCRIPTION (TRIGGER)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'membre');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------

-- Activer le RLS sur toutes les tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Fonction utilitaire : Récupérer la team de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_team()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT team_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Politiques: Teams
CREATE POLICY "Users can view their team" 
    ON public.teams FOR SELECT USING (id = get_user_team());
CREATE POLICY "Anyone can view a team to join it" 
    ON public.teams FOR SELECT USING (true);
CREATE POLICY "Anyone can create a team" 
    ON public.teams FOR INSERT WITH CHECK (true);

-- Politiques: Profiles
CREATE POLICY "Users can view profiles in their team" 
    ON public.profiles FOR SELECT USING (team_id = get_user_team() OR id = auth.uid());
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can update profiles in their team" 
    ON public.profiles FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin' AND p.team_id = public.profiles.team_id
        )
    );

-- Politiques: Events
CREATE POLICY "Team members can perform all actions on their events" 
    ON public.events FOR ALL USING (team_id = get_user_team());

CREATE POLICY "Anyone can view events with a valid share_token"
    ON public.events FOR SELECT USING (share_token IS NOT NULL);

CREATE POLICY "Anyone can update signatures of events with a valid share_token"
    ON public.events FOR UPDATE USING (share_token IS NOT NULL) WITH CHECK (share_token IS NOT NULL);

-- Politiques: Tasks
CREATE POLICY "Team members can perform all actions on their tasks" 
    ON public.tasks FOR ALL USING (event_id IN (SELECT id FROM public.events WHERE team_id = get_user_team()));

-- Politiques: Suppliers
CREATE POLICY "Team members can perform all actions on their suppliers" 
    ON public.suppliers FOR ALL USING (event_id IN (SELECT id FROM public.events WHERE team_id = get_user_team()));

-- Politiques: Contacts
CREATE POLICY "Team members can perform all actions on their contacts" 
    ON public.contacts FOR ALL USING (event_id IN (SELECT id FROM public.events WHERE team_id = get_user_team()));

-- Politiques: Documents
CREATE POLICY "Team members can perform all actions on their documents" 
    ON public.documents FOR ALL USING (event_id IN (SELECT id FROM public.events WHERE team_id = get_user_team()));

-- Politiques: Activity Logs
CREATE POLICY "Team members can view logs of their events" 
    ON public.activity_logs FOR SELECT USING (event_id IN (SELECT id FROM public.events WHERE team_id = get_user_team()));
CREATE POLICY "Users can insert activity logs for their events" 
    ON public.activity_logs FOR INSERT WITH CHECK (event_id IN (SELECT id FROM public.events WHERE team_id = get_user_team()));

-- 5. STOCKAGE (STORAGE)
-- ----------------------------------------------------------------
-- Note: Requires Supabase Storage to be enabled

-- Bucket: avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible." 
    ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar." 
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar." 
    ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar." 
    ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Bucket: documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for documents bucket
CREATE POLICY "Document files are publicly accessible." 
    ON storage.objects FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents." 
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents." 
    ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
