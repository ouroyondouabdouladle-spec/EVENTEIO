'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, User, Mail, Lock, Shield, Users, AlertCircle, CheckCircle2, Key } from 'lucide-react';
import { createClient } from '@/lib/supabase';

type Mode = 'create' | 'join';

export default function RegisterPage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>('create');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [teamName, setTeamName] = useState('');
    const [teamCode, setTeamCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const typedSupabase = supabase as any;

        // 1. Création du compte Auth
        const { data: authData, error: authError } = await typedSupabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });

        if (authError || !authData.user) {
            setError(authError?.message ?? 'Erreur lors de la création du compte.');
            setLoading(false);
            return;
        }

        const userId = authData.user.id;

        if (mode === 'create') {
            // 2a. Créer une nouvelle team
            const { data: team, error: teamError } = await typedSupabase
                .from('teams')
                .insert({ name: teamName.trim() })
                .select()
                .single();

            if (teamError || !team) {
                setError("Erreur lors de la création de l'équipe.");
                setLoading(false);
                return;
            }

            // 3a. Lier l'utilisateur à la team avec le rôle admin
            const { error: profileError } = await typedSupabase
                .from('profiles')
                .upsert({ 
                    id: userId, 
                    team_id: team.id, 
                    role: 'admin',
                    full_name: fullName 
                });

            if (profileError) {
                console.error("Erreur profile link:", profileError);
                setError("Erreur lors de la configuration de votre profil.");
                setLoading(false);
                return;
            }

        } else {
            // 2b. Rechercher la team par son code d'invitation
            const { data: team, error: teamError } = await typedSupabase
                .from('teams')
                .select('id')
                .eq('invite_code', teamCode.trim())
                .maybeSingle();

            if (teamError) {
                setError("Erreur lors de la vérification du code.");
                setLoading(false);
                return;
            }

            if (!team) {
                setError("Code d'invitation invalide ou introuvable.");
                setLoading(false);
                return;
            }

            // 3b. Lier l'utilisateur comme membre
            const { error: profileError } = await typedSupabase
                .from('profiles')
                .upsert({ 
                    id: userId, 
                    team_id: team.id, 
                    role: 'membre',
                    full_name: fullName 
                });

            if (profileError) {
                console.error("Erreur profile link:", profileError);
                setError("Erreur lors de la liaison à l'équipe.");
                setLoading(false);
                return;
            }
        }

        setSuccess(true);
        setLoading(false);
    }

    if (success) {
        return (
            <div className="flex flex-col items-center text-center animate-scale-in">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-bold mb-4">Compte créé !</h2>
                <p className="text-muted font-medium mb-10 max-w-[280px]">
                    Vérifiez votre boîte mail pour confirmer votre adresse email avant de vous connecter.
                </p>
                <Link href="/login" className="btn-premium w-full">
                    Se connecter
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full animate-fade-in">
            {/* Header / Back Button */}
            <header className="mb-10 absolute top-[-80px] left-0">
                <Link href="/" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-border text-white hover:bg-surface-hover transition-all">
                    <ChevronLeft size={24} />
                </Link>
            </header>

            {/* Titles */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Créer un compte</h1>
                <p className="text-muted font-medium">Rejoignez l'expérience Eventio</p>
            </div>

            {/* Toggle Mode Selection */}
            <div className="flex p-1.5 bg-surface border border-border rounded-2xl mb-8">
                {(['create', 'join'] as Mode[]).map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all ${
                            mode === m 
                                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                                : 'text-muted hover:text-white'
                        }`}
                    >
                        {m === 'create' ? 'Créer une équipe' : 'Rejoindre'}
                    </button>
                ))}
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
                {/* Nom complet */}
                <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-muted ml-1">Nom complet</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            className="input-premium pl-12"
                            placeholder="Jean Dupont"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-muted ml-1">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="email"
                            className="input-premium pl-12"
                            placeholder="vous@exemple.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-muted ml-1">Mot de passe</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="password"
                            className="input-premium pl-12"
                            placeholder="Min. 8 caractères"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>
                </div>

                {/* Team Info */}
                <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-muted ml-1">
                        {mode === 'create' ? 'Nom de votre agence' : "Code d'invitation secret"}
                    </label>
                    <div className="relative group">
                        {mode === 'create' ? (
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                        ) : (
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                        )}
                        <input
                            type="text"
                            className={`input-premium pl-12 ${mode === 'join' ? 'font-mono uppercase' : ''}`}
                            placeholder={mode === 'create' ? 'Ex: Agence Lumière' : 'XXXX-XXXX-XXXX'}
                            value={mode === 'create' ? teamName : teamCode}
                            onChange={(e) => mode === 'create' ? setTeamName(e.target.value) : setTeamCode(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-shake">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-premium w-full flex items-center justify-center gap-2 mt-4"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Création...
                        </>
                    ) : (mode === 'create' ? 'Créer mon compte' : 'Rejoindre l\'équipe')}
                </button>
            </form>

            <p className="text-center text-sm text-muted mt-8">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-primary font-bold hover:underline">
                    Se connecter
                </Link>
            </p>
        </div>
    );
}
