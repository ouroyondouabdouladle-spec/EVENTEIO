'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import type { Profile, Team } from '@/types/database';
import { ChevronLeft, Users, Key, Copy, Check, Trash2, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const { profile } = useUser();
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const supabase = createClient();
    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        async function fetchTeamData() {
            if (!profile?.team_id) {
                setLoading(false);
                return;
            }

            try {
                // Fetch Team (needs to select invite_code)
                const { data: teamData } = await (supabase as any)
                    .from('teams')
                    .select('*')
                    .eq('id', profile.team_id)
                    .single();
                
                if (teamData) setTeam(teamData as Team);

                // Fetch Members
                const { data: membersData } = await (supabase as any)
                    .from('profiles')
                    .select('*')
                    .eq('team_id', profile.team_id as string)
                    .order('role', { ascending: true }); // admin first
                
                if (membersData) setMembers(membersData as Profile[]);
            } catch (error) {
                console.error("Erreur de chargement de l'équipe", error);
            } finally {
                setLoading(false);
            }
        }

        fetchTeamData();
    }, [profile, supabase]);

    const copyInviteCode = () => {
        if (team?.invite_code) {
            navigator.clipboard.writeText(team.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleKickMember = async (memberId: string) => {
        if (!confirm("Voulez-vous vraiment retirer ce membre de l'équipe ?")) return;

        try {
            const { error } = await (supabase as any)
                .from('profiles')
                .update({ team_id: null, role: 'membre' })
                .eq('id', memberId);

            if (error) throw error;
            
            // Retirer de la liste locale
            setMembers(prev => prev.filter(m => m.id !== memberId));
        } catch (error) {
            console.error("Erreur lors de la suppression du membre", error);
            alert("Erreur lors de la suppression.");
        }
    };

    if (loading) return null;

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-2xl pb-32">
            <header className="mb-10 flex items-center gap-4">
                <button 
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-surface border border-white/5 flex items-center justify-center text-muted hover:text-white transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Paramètres</h1>
                    {team && <p className="text-sm text-primary font-bold">{team.name}</p>}
                </div>
            </header>

            <div className="space-y-10">
                {/* Code d'invitation (Admins Only) */}
                {isAdmin && team && (
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-4 opacity-40">
                            Invitation
                        </h3>
                        <div className="card-premium p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Key size={22} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold">Code d'invitation</p>
                                    <p className="text-[11px] text-muted font-medium">Partagez ce code pour inviter des membres</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-background border border-white/10 rounded-xl p-4 font-mono text-center tracking-wider text-sm">
                                    {team.invite_code}
                                </div>
                                <button 
                                    onClick={copyInviteCode}
                                    className="w-14 h-14 rounded-xl bg-primary hover:bg-primary/80 transition-colors flex items-center justify-center text-white"
                                >
                                    {copied ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Liste des membres */}
                <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-4 opacity-40 flex items-center justify-between">
                        <span>Équipe ({members.length})</span>
                    </h3>
                    <div className="space-y-3">
                        {members.map(member => (
                            <div key={member.id} className="card-premium p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface border border-white/10 flex-shrink-0">
                                    {member.avatar_url ? (
                                        <img src={member.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted font-bold text-lg">
                                            {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold flex items-center gap-2">
                                        {member.full_name || 'Utilisateur'}
                                        {member.role === 'admin' && (
                                            <span className="text-[9px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black">
                                                Admin
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-[11px] text-muted font-medium truncate">
                                        Membre depuis le {new Date(member.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                
                                {/* Bouton Kick (Admin Seulement) */}
                                {isAdmin && member.id !== profile?.id && (
                                    <button 
                                        onClick={() => handleKickMember(member.id)}
                                        className="w-10 h-10 rounded-xl hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors flex items-center justify-center"
                                        title="Retirer de l'équipe"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
