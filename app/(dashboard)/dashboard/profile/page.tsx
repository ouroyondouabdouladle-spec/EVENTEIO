'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import ProfileField from '@/components/profile/ProfileField';
import { 
    User, 
    Mail, 
    Shield, 
    Users, 
    Settings, 
    Bell, 
    Globe, 
    LogOut, 
    ChevronRight,
    Camera,
    X,
    Loader2,
    BookOpen
} from 'lucide-react';

export default function ProfilePage() {
    const { profile, user, loading } = useUser();
    const router = useRouter();
    const supabase = createClient();

    const [teamName, setTeamName] = useState<string>('Chargement...');
    const [isUploading, setIsUploading] = useState(false);
    
    // Modal Edit Profile State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (profile?.team_id) {
            const fetchTeamName = async () => {
                const { data } = await (supabase as any)
                    .from('teams')
                    .select('name')
                    .eq('id', profile.team_id)
                    .single();
                if (data) setTeamName(data.name);
                else setTeamName('Équipe inconnue');
            };
            fetchTeamName();
        } else if (!loading) {
            setTeamName('Aucune équipe');
        }
    }, [profile?.team_id, loading, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0 || !user) return;
            setIsUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update Profile
            const { error: updateError } = await (supabase as any)
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;
            
            // Reload page or force refresh to show new avatar
            window.location.reload();
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert("Erreur lors du téléchargement de l'avatar.");
        } finally {
            setIsUploading(false);
        }
    };

    const openEditModal = () => {
        setEditName(profile?.full_name || '');
        setIsEditModalOpen(true);
    };

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !editName.trim()) return;
        setIsSaving(true);
        try {
            const { error } = await (supabase as any)
                .from('profiles')
                .update({ full_name: editName.trim() })
                .eq('id', user.id);
                
            if (error) throw error;
            window.location.reload();
        } catch (error) {
            console.error('Error saving profile:', error);
            alert("Erreur lors de la sauvegarde du profil.");
        } finally {
            setIsSaving(false);
            setIsEditModalOpen(false);
        }
    };

    if (loading) return <div className="py-20 text-center animate-pulse text-muted">Chargement du profil...</div>;

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-2xl pb-32">
            {/* Header / Avatar */}
            <header className="flex flex-col items-center mb-10 pt-4">
                <div className="relative group mb-6">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-accent p-1 shadow-2xl shadow-primary/20">
                        <div className="w-full h-full rounded-[2.3rem] bg-surface flex items-center justify-center overflow-hidden relative">
                            {isUploading ? (
                                <Loader2 className="animate-spin text-primary" size={32} />
                            ) : profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : profile?.full_name ? (
                                <span className="text-4xl font-black text-white">{profile.full_name.charAt(0).toUpperCase()}</span>
                            ) : (
                                <User size={48} className="text-muted" />
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute bottom-0 right-0 w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg transform translate-x-2 translate-y-2 hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Camera size={20} />
                    </button>
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleAvatarUpload} 
                        className="hidden" 
                    />
                </div>
                
                <h1 className="text-2xl font-black tracking-tight mb-1">{profile?.full_name || 'Utilisateur'}</h1>
                <p className="text-muted text-sm font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} className="text-primary" />
                    {profile?.role === 'admin' ? 'Administrateur' : 'Membre équipe'}
                </p>
            </header>

            {/* Sections */}
            <div className="space-y-8">
                {/* Account Settings */}
                <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-4 opacity-40">Compte</h3>
                    <div className="space-y-3">
                        <ProfileField 
                            icon={User} 
                            label="Nom Complet" 
                            value={profile?.full_name || 'Non renseigné'} 
                            onClick={openEditModal} 
                        />
                        <ProfileField 
                            icon={Mail} 
                            label="Email" 
                            value={user?.email || 'Non renseigné'} 
                            onClick={() => alert("Le changement d'email nécessite une confirmation de sécurité. Fonctionnalité bientôt disponible.")} 
                        />
                    </div>
                </section>

                {/* Team Section */}
                <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-4 opacity-40">Organisation</h3>
                    <div className="space-y-3">
                        <ProfileField 
                            icon={Users} 
                            label="Équipe / Agence" 
                            value={teamName} 
                            onClick={() => {}} 
                        />
                        {profile?.role === 'admin' && (
                            <ProfileField 
                                icon={Settings} 
                                label="Gérer l'équipe" 
                                onClick={() => router.push('/dashboard/settings')} 
                            />
                        )}
                    </div>
                </section>

                {/* App Settings */}
                <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-4 opacity-40">Préférences</h3>
                    <div className="space-y-3">
                        <ProfileField 
                            icon={Bell} 
                            label="Notifications" 
                            value="Activées"
                            onClick={() => {}} 
                        />
                        <ProfileField 
                            icon={Globe} 
                            label="Langue" 
                            value="Français (FR)"
                            onClick={() => {}} 
                        />
                    </div>
                </section>

                {/* Support & Aide */}
                <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4 px-4 opacity-40">Support</h3>
                    <div className="space-y-3">
                        <ProfileField 
                            icon={BookOpen} 
                            label="Guide d'utilisation" 
                            onClick={() => router.push('/dashboard/guide')} 
                        />
                    </div>
                </section>

                {/* Logout Button */}
                <section className="pt-4">
                    <ProfileField 
                        icon={LogOut} 
                        label="Session" 
                        value="Se déconnecter"
                        variant="danger"
                        onClick={handleLogout} 
                    />
                </section>
            </div>

            {/* Footer Version */}
            <footer className="mt-12 text-center">
                <p className="text-[10px] font-bold text-muted/30 uppercase tracking-[0.3em]">Eventio v1.4.2</p>
            </footer>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-6 bg-background/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-[#1A1A1A] border border-white/10 p-6 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary">Modifier le Profil</h4>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-muted hover:text-white transition-colors">
                                <X size={20}/>
                            </button>
                        </div>
                        <form onSubmit={saveProfile} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">Nom Complet</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Votre nom..."
                                    className="input-premium h-14"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving || !editName.trim()}
                                className="btn-premium w-full h-14 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <span className="font-black uppercase tracking-widest text-xs">Sauvegarder le profil</span>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
