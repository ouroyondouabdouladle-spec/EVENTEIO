'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Shield, Loader2, Sparkles, Users, Key } from 'lucide-react';

export default function TeamSetup() {
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [teamName, setTeamName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Non authentifié");

            const { data: team, error: teamError } = await (supabase as any)
                .from('teams')
                .insert({ name: teamName.trim() })
                .select()
                .single();

            if (teamError) throw teamError;

            const { error: profileError } = await (supabase as any)
                .from('profiles')
                .update({ team_id: team.id, role: 'admin' })
                .eq('id', user.id);

            if (profileError) throw profileError;

            window.location.reload();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Une erreur est survenue");
            setLoading(false);
        }
    };

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Non authentifié");

            // Rechercher l'équipe par invite_code
            const { data: team, error: teamError } = await (supabase as any)
                .from('teams')
                .select('id, name')
                .eq('invite_code', inviteCode.trim())
                .maybeSingle();

            if (teamError) throw teamError;
            
            if (!team) {
                throw new Error("Équipe introuvable. Avez-vous bien copié le 'Code d'invitation' exact (format: xxxx-xxxx-xxxx) et non le nom de l'équipe ?");
            }

            // Rejoindre l'équipe
            const { error: profileError } = await (supabase as any)
                .from('profiles')
                .update({ team_id: team.id, role: 'membre' })
                .eq('id', user.id);

            if (profileError) throw profileError;

            window.location.reload();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Une erreur est survenue");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/20 mx-auto mb-6">
                        <Shield size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Bienvenue !</h1>
                    <p className="text-muted text-sm font-medium">Créez ou rejoignez une équipe pour commencer.</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl mb-8">
                    <button
                        onClick={() => { setMode('create'); setError(null); }}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                            mode === 'create' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-muted hover:text-white'
                        }`}
                    >
                        <Sparkles size={16} /> Créer une équipe
                    </button>
                    <button
                        onClick={() => { setMode('join'); setError(null); }}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                            mode === 'join' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-muted hover:text-white'
                        }`}
                    >
                        <Users size={16} /> Rejoindre
                    </button>
                </div>

                {mode === 'create' ? (
                    <form onSubmit={handleCreateTeam} className="space-y-6 animate-fade-in">
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-muted ml-1">Nom de votre agence / équipe</label>
                            <input
                                type="text"
                                className="input-premium"
                                placeholder="Ex: Agence Lumière"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-red-500 font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !teamName.trim()}
                            className="btn-premium w-full flex items-center justify-center gap-3 h-14"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <span>Créer mon équipe</span>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleJoinTeam} className="space-y-6 animate-fade-in">
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-muted ml-1">Code d'invitation secret</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                                <input
                                    type="text"
                                    className="input-premium pl-12 font-mono uppercase"
                                    placeholder="XXXX-XXXX-XXXX"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-red-500 font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !inviteCode.trim()}
                            className="btn-premium w-full flex items-center justify-center gap-3 h-14"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <span>Rejoindre l'équipe</span>}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
