'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import type { Profile, Team, UserRole } from '@/types/database';
import { ChevronLeft, Users, Key, Copy, Check, Trash2, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const { profile } = useUser();
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [expandedMember, setExpandedMember] = useState<string | null>(null);

    const modules = [
        { id: 'events', label: 'Événements', icon: '🗓️' },
        { id: 'calendar', label: 'Calendrier', icon: '📅' },
        { id: 'tasks', label: 'Tâches', icon: '✅' },
        { id: 'suppliers', label: 'Fournisseurs', icon: '🤝' },
        { id: 'contacts', label: 'Contacts', icon: '👥' },
        { id: 'files', label: 'Fichiers', icon: '📁' },
    ];

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

    const handleChangeRole = async (memberId: string, newRole: UserRole) => {
        try {
            const { error } = await (supabase as any)
                .from('profiles')
                .update({ role: newRole })
                .eq('id', memberId);

            if (error) throw error;
            
            // Mettre à jour la liste locale
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        } catch (error) {
            console.error("Erreur lors de la modification du rôle", error);
            alert("Erreur lors de la modification de l'autorisation.");
        }
    };

    const handleToggleModule = async (memberId: string, moduleId: string, currentVal: boolean) => {
        try {
            const member = members.find(m => m.id === memberId);
            if (!member) return;

            const newPermissions = {
                ...(member.module_permissions || {}),
                [moduleId]: !currentVal
            };

            const { error } = await (supabase as any)
                .from('profiles')
                .update({ module_permissions: newPermissions })
                .eq('id', memberId);

            if (error) throw error;

            // Mettre à jour la liste locale
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, module_permissions: newPermissions } : m));
        } catch (error) {
            console.error("Erreur lors de la modification des permissions de module", error);
            alert("Erreur lors de la modification de l'accès au module.");
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
                            <React.Fragment key={member.id}>
                                <div className="card-premium p-4 flex items-center gap-4">
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
                                    </p>
                                    <p className="text-[11px] text-muted font-medium truncate">
                                        Membre depuis le {new Date(member.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                
                                {/* Sélecteur de rôle et bouton Kick (Admin Seulement) */}
                                {isAdmin && member.id !== profile?.id ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                                            className="text-[10px] uppercase font-bold text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            {expandedMember === member.id ? 'Fermer' : 'Gérer les accès'}
                                        </button>
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleChangeRole(member.id, e.target.value as UserRole)}
                                            className="text-xs bg-surface border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary/50 cursor-pointer font-bold"
                                        >
                                            <option value="membre">Membre</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <button 
                                            onClick={() => handleKickMember(member.id)}
                                            className="w-10 h-10 rounded-xl hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors flex items-center justify-center flex-shrink-0"
                                            title="Retirer de l'équipe"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    member.role === 'admin' && (
                                        <span className="text-[9px] uppercase tracking-wider bg-primary/20 text-primary px-3 py-1 rounded-full font-black">
                                            Admin
                                        </span>
                                    )
                                )}
                            </div>
                            
                            {/* Panneau de permissions (étendu) */}
                            {isAdmin && member.id !== profile?.id && expandedMember === member.id && (
                                <div className="mt-2 ml-16 mr-4 mb-4 p-4 rounded-xl bg-background border border-white/5 space-y-3">
                                    <h4 className="text-xs font-bold text-muted mb-2">Accès aux modules</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {modules.map(mod => {
                                            const hasAccess = member.module_permissions ? member.module_permissions[mod.id] !== false : true;
                                            return (
                                                <label key={mod.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-surface transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={hasAccess}
                                                        onChange={() => handleToggleModule(member.id, mod.id, hasAccess)}
                                                        className="w-4 h-4 rounded text-primary bg-surface border-white/20 focus:ring-primary focus:ring-offset-background"
                                                    />
                                                    <span className="text-xs font-medium text-white">{mod.icon} {mod.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                        ))}
                    </div>
                </section>

                {/* Sauvegarde & Sécurité */}
                <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-4 opacity-40">
                        Sauvegarde & Données
                    </h3>
                    <div className="card-premium p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                <span>📦 Sauvegarde & Export de Données</span>
                            </h4>
                            <p className="text-xs text-muted font-medium">Exportez toutes les données de votre équipe (projets, tâches, prestataires) ou restaurez une sauvegarde précédente.</p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/settings/backup')}
                            className="h-11 px-5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-bold text-white flex-shrink-0"
                        >
                            Gérer les sauvegardes
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
