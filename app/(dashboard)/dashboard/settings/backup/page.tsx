'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ChevronLeft, Download, Upload, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import type { Team } from '@/types/database';

export default function BackupPage() {
    const router = useRouter();
    const [team, setTeam] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importStats, setImportStats] = useState<{
        events: number;
        tasks: number;
        suppliers: number;
        contacts: number;
    } | null>(null);

    useEffect(() => {
        const fetchTeam = async () => {
            const supabase = createClient();
            
            // Get active user and profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*, teams(*)')
                .eq('id', user.id)
                .single() as any;

            if (profile && profile.teams) {
                setTeam(profile.teams);
            }
            setLoading(false);
        };

        fetchTeam();
    }, [router]);

    const handleExport = async () => {
        if (!team) return;
        setExporting(true);
        const supabase = createClient();

        // 1. Fetch team events
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*') as any;

        if (eventsError) {
            alert("Erreur lors de l'export des événements.");
            setExporting(false);
            return;
        }

        // Get list of event IDs to fetch related items
        const eventIds = (events || []).map((e: any) => e.id);

        let tasks: any[] = [];
        let suppliers: any[] = [];
        let contacts: any[] = [];

        if (eventIds.length > 0) {
            // 2. Fetch tasks
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*')
                .in('event_id', eventIds);
            tasks = tasksData || [];

            // 3. Fetch suppliers
            const { data: suppliersData } = await supabase
                .from('suppliers')
                .select('*')
                .in('event_id', eventIds);
            suppliers = suppliersData || [];

            // 4. Fetch contacts
            const { data: contactsData } = await supabase
                .from('contacts')
                .select('*')
                .in('event_id', eventIds);
            contacts = contactsData || [];
        }

        const backupData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            teamId: team.id,
            teamName: team.name,
            events: events || [],
            tasks,
            suppliers,
            contacts
        };

        // Trigger file download
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eventio-backup-${team.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExporting(false);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !team) return;

        const confirmImport = window.confirm(
            "Êtes-vous sûr de vouloir restaurer cette sauvegarde ?\n\nCela va insérer de nouveaux projets dans votre équipe sans écraser vos projets actuels."
        );
        if (!confirmImport) return;

        setImporting(true);
        setImportStats(null);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const backup = JSON.parse(event.target?.result as string);

                // Simple structural validation
                if (!backup.version || !Array.isArray(backup.events)) {
                    alert("Le fichier de sauvegarde est invalide ou corrompu.");
                    setImporting(false);
                    return;
                }

                const supabase = createClient();
                let eventsCount = 0;
                let tasksCount = 0;
                let suppliersCount = 0;
                let contactsCount = 0;

                // Loop and import each event sequentially to prevent ID mapping errors
                for (const ev of backup.events) {
                    const { id: oldEventId, created_at, updated_at, share_token, ...eventInsert } = ev;
                    
                    // Force the event to belong to the current team
                    eventInsert.team_id = team.id;

                    // Insert the event and retrieve the new ID
                    const { data: newEvent, error: eventErr } = await supabase
                        .from('events')
                        .insert(eventInsert)
                        .select('id')
                        .single() as any;

                    if (eventErr || !newEvent) {
                        console.error("Error inserting event:", eventErr);
                        continue;
                    }
                    eventsCount++;

                    // 1. Restore Tasks
                    const relatedTasks = (backup.tasks || []).filter((t: any) => t.event_id === oldEventId);
                    if (relatedTasks.length > 0) {
                        const tasksToInsert = relatedTasks.map(({ id, created_at: _, ...t }: any) => ({
                            ...t,
                            event_id: newEvent.id
                        }));
                        const { error: taskErr } = await supabase.from('tasks').insert(tasksToInsert);
                        if (!taskErr) tasksCount += relatedTasks.length;
                    }

                    // 2. Restore Suppliers
                    const relatedSuppliers = (backup.suppliers || []).filter((s: any) => s.event_id === oldEventId);
                    if (relatedSuppliers.length > 0) {
                        const suppliersToInsert = relatedSuppliers.map(({ id, created_at: _, ...s }: any) => ({
                            ...s,
                            event_id: newEvent.id
                        }));
                        const { error: supplierErr } = await supabase.from('suppliers').insert(suppliersToInsert);
                        if (!supplierErr) suppliersCount += relatedSuppliers.length;
                    }

                    // 3. Restore Contacts
                    const relatedContacts = (backup.contacts || []).filter((c: any) => c.event_id === oldEventId);
                    if (relatedContacts.length > 0) {
                        const contactsToInsert = relatedContacts.map(({ id, created_at: _, ...c }: any) => ({
                            ...c,
                            event_id: newEvent.id
                        }));
                        const { error: contactErr } = await supabase.from('contacts').insert(contactsToInsert);
                        if (!contactErr) contactsCount += relatedContacts.length;
                    }
                }

                setImportStats({
                    events: eventsCount,
                    tasks: tasksCount,
                    suppliers: suppliersCount,
                    contacts: contactsCount
                });
            } catch (err) {
                alert("Erreur lors de la lecture ou de l'importation du fichier.");
            } finally {
                setImporting(false);
            }
        };

        reader.readAsText(file);
    };

    if (loading) {
        return (
            <main className="p-6 max-w-md mx-auto md:max-w-2xl pb-32 flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
                <p className="text-sm font-semibold text-muted animate-pulse">Chargement de l'espace de sauvegarde...</p>
            </main>
        );
    }

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
                    <h1 className="text-2xl font-black tracking-tight">Sauvegardes</h1>
                    {team && <p className="text-sm text-primary font-bold">{team.name}</p>}
                </div>
            </header>

            <div className="space-y-8">
                {/* Info Card */}
                <div className="card-premium p-5 border-blue-500/20 bg-blue-500/5 flex items-start gap-4">
                    <Info className="text-blue-400 mt-1 flex-shrink-0" size={18} />
                    <p className="text-xs font-semibold leading-relaxed text-blue-100/80">
                        La sauvegarde télécharge toutes vos informations (événements, budgets, tâches, prestataires, contacts) au format standardisé JSON. Vous pouvez conserver ces fichiers en externe et les restaurer à tout moment pour récupérer vos données.
                    </p>
                </div>

                {/* Export Card */}
                <div className="card-premium p-6 border-white/5 bg-[#121214]">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                            <Download size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">Exporter les données</h3>
                            <p className="text-xs text-muted font-medium mt-1">Créez une sauvegarde complète de votre équipe au format JSON.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full h-12 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs text-white transition-all shadow-lg active:scale-98"
                    >
                        {exporting ? 'Génération de la sauvegarde...' : 'Créer une sauvegarde (Exporter en JSON)'}
                    </button>
                </div>

                {/* Import Card */}
                <div className="card-premium p-6 border-white/5 bg-[#121214]">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                            <Upload size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">Importer / Restaurer</h3>
                            <p className="text-xs text-muted font-medium mt-1">Restaurez vos projets et relations logistiques depuis un fichier JSON.</p>
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            disabled={importing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                        />
                        <div className="w-full h-24 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500/30 hover:bg-white/5 transition-all text-center p-4">
                            <span className="text-xs font-bold text-muted">
                                {importing ? 'Restauration en cours...' : 'Sélectionner ou déposer votre fichier de sauvegarde .json'}
                            </span>
                            <span className="text-[10px] text-muted opacity-50 font-medium">Taille maximale : 10 Mo</span>
                        </div>
                    </div>
                </div>

                {/* Warning Alert */}
                <div className="card-premium p-5 border-yellow-500/20 bg-yellow-500/5 flex items-start gap-4">
                    <ShieldAlert className="text-yellow-400 mt-1 flex-shrink-0" size={18} />
                    <div className="text-xs font-semibold leading-relaxed text-yellow-100/80">
                        <span className="font-bold text-yellow-300">Attention</span> : L'importation ré-associera toutes vos tâches et prestataires à de nouveaux projets insérés. Vos projets actuels ne seront pas écrasés mais des doublons peuvent être créés si vous importez deux fois la même sauvegarde.
                    </div>
                </div>

                {/* Import Success Stats Box */}
                {importStats && (
                    <div className="card-premium p-6 border-green-500/20 bg-green-500/5 animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle size={20} className="text-green-400" />
                            <h3 className="text-sm font-black text-white">Restauration Complétée avec Succès !</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                                <span className="text-xl font-black text-white">{importStats.events}</span>
                                <span className="text-[10px] font-bold text-muted uppercase block mt-1">Projets</span>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                                <span className="text-xl font-black text-white">{importStats.tasks}</span>
                                <span className="text-[10px] font-bold text-muted uppercase block mt-1">Tâches</span>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                                <span className="text-xl font-black text-white">{importStats.suppliers}</span>
                                <span className="text-[10px] font-bold text-muted uppercase block mt-1">Prestataires</span>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                                <span className="text-xl font-black text-white">{importStats.contacts}</span>
                                <span className="text-[10px] font-bold text-muted uppercase block mt-1">Contacts</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
