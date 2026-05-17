'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ChevronLeft, BarChart3, TrendingUp, Wallet, ArrowUpRight, CheckSquare, Award, Users, Flag, Landmark } from 'lucide-react';

interface StatsData {
    revenue: number;
    paid: number;
    remaining: number;
    cashRatio: number;
    tasksTotal: number;
    tasksCompleted: number;
    tasksRatio: number;
    eventsTotal: number;
    eventsDraft: number;
    eventsPending: number;
    eventsValidated: number;
    eventsCompleted: number;
    suppliersCount: number;
    contactsCount: number;
}

export default function StatisticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StatsData>({
        revenue: 0,
        paid: 0,
        remaining: 0,
        cashRatio: 0,
        tasksTotal: 0,
        tasksCompleted: 0,
        tasksRatio: 0,
        eventsTotal: 0,
        eventsDraft: 0,
        eventsPending: 0,
        eventsValidated: 0,
        eventsCompleted: 0,
        suppliersCount: 0,
        contactsCount: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createClient();

            // 1. Get active team ID from profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('team_id')
                .eq('id', user.id)
                .single() as any;

            if (!profile?.team_id) {
                setLoading(false);
                return;
            }

            const teamId = profile.team_id;

            // 2. Fetch Events
            const { data: events } = await supabase
                .from('events')
                .select('*')
                .eq('team_id', teamId) as any;

            const eventsList = events || [];
            const eventsTotal = eventsList.length;
            const eventsDraft = eventsList.filter((e: any) => e.status === 'brouillon').length;
            const eventsPending = eventsList.filter((e: any) => e.status === 'en_attente').length;
            const eventsValidated = eventsList.filter((e: any) => e.status === 'valide').length;
            const eventsCompleted = eventsList.filter((e: any) => e.status === 'termine').length;

            // Finance calculations on non-draft events
            const billableEvents = eventsList.filter((e: any) => e.status !== 'brouillon');
            const revenue = billableEvents.reduce((sum: number, e: any) => sum + Number(e.montant_total || 0), 0);
            const paid = billableEvents.reduce((sum: number, e: any) => sum + Number(e.acompte || 0), 0);
            const remaining = revenue - paid;
            const cashRatio = revenue > 0 ? Math.round((paid / revenue) * 100) : 0;

            // 3. Fetch Tasks
            const eventIds = eventsList.map((e: any) => e.id);
            let tasksTotal = 0;
            let tasksCompleted = 0;

            if (eventIds.length > 0) {
                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('status')
                    .in('event_id', eventIds) as any;
                
                const tasksList = tasks || [];
                tasksTotal = tasksList.length;
                tasksCompleted = tasksList.filter((t: any) => t.status === 'termine').length;
            }
            const tasksRatio = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

            // 4. Fetch Suppliers
            let suppliersCount = 0;
            if (eventIds.length > 0) {
                const { count } = await supabase
                    .from('suppliers')
                    .select('*', { count: 'exact', head: true })
                    .in('event_id', eventIds) as any;
                suppliersCount = count || 0;
            }

            // 5. Fetch Contacts
            let contactsCount = 0;
            if (eventIds.length > 0) {
                const { count } = await supabase
                    .from('contacts')
                    .select('*', { count: 'exact', head: true })
                    .in('event_id', eventIds) as any;
                contactsCount = count || 0;
            }

            setStats({
                revenue,
                paid,
                remaining,
                cashRatio,
                tasksTotal,
                tasksCompleted,
                tasksRatio,
                eventsTotal,
                eventsDraft,
                eventsPending,
                eventsValidated,
                eventsCompleted,
                suppliersCount,
                contactsCount
            });
            setLoading(false);
        };

        fetchStats();
    }, [router]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) {
        return (
            <main className="p-6 max-w-md mx-auto md:max-w-2xl pb-32 flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
                <p className="text-sm font-semibold text-muted animate-pulse">Calcul de vos statistiques d'équipe...</p>
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
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        Statistiques d'Activité 📊
                    </h1>
                    <p className="text-xs text-muted font-semibold mt-1">Vue d'ensemble et performances financières en temps réel.</p>
                </div>
            </header>

            <div className="space-y-8">
                {/* Financial KPI Summary */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CA Total */}
                    <div className="card-premium p-6 relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-transparent">
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shadow-inner">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Chiffre d'Affaires</span>
                        <h2 className="text-2xl font-black text-white">{formatCurrency(stats.revenue)}</h2>
                        <p className="text-[10px] text-muted font-medium mt-2 flex items-center gap-1">
                            <span className="text-purple-400 font-bold">Sur projets validés & terminés</span>
                        </p>
                    </div>

                    {/* Paid */}
                    <div className="card-premium p-6 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-transparent">
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
                            <Wallet size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Acomptes Encaissés</span>
                        <h2 className="text-2xl font-black text-white">{formatCurrency(stats.paid)}</h2>
                        <p className="text-[10px] text-muted font-medium mt-2 flex items-center gap-1">
                            <span className="text-emerald-400 font-bold">{stats.cashRatio}% du CA total perçu</span>
                        </p>
                    </div>

                    {/* Remaining */}
                    <div className="card-premium p-6 relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-transparent">
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shadow-inner">
                            <Landmark size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Reste à Recevoir</span>
                        <h2 className="text-2xl font-black text-white">{formatCurrency(stats.remaining)}</h2>
                        <p className="text-[10px] text-muted font-medium mt-2 flex items-center gap-1">
                            <span className="text-orange-400 font-bold">Solde en attente de facturation</span>
                        </p>
                    </div>
                </section>

                {/* Progress Gauges Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cash ratio progress card */}
                    <div className="card-premium p-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-4">Ratio d'Encaissement (Trésorerie)</h3>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-xs font-bold text-white">Sécurisé via acompte</span>
                            <span className="text-sm font-black text-emerald-400">{stats.cashRatio}%</span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000"
                                style={{ width: `${stats.cashRatio}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted font-medium mt-3">Idéalement, maintenez un ratio supérieur à 30% d'acomptes garantis avant événement.</p>
                    </div>

                    {/* Task progress card */}
                    <div className="card-premium p-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-4">Avancement des Tâches Logistiques</h3>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-xs font-bold text-white">{stats.tasksCompleted} complétées sur {stats.tasksTotal}</span>
                            <span className="text-sm font-black text-purple-400">{stats.tasksRatio}%</span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-1000"
                                style={{ width: `${stats.tasksRatio}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted font-medium mt-3">Représente la charge de travail globale finalisée à l'échelle de l'équipe.</p>
                    </div>
                </section>

                {/* Projets & Relations Count */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Events breakdown */}
                    <div className="card-premium p-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-4">Répartition des Événements</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> Brouillons
                                </span>
                                <span className="text-xs font-black text-white">{stats.eventsDraft}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> En attente
                                </span>
                                <span className="text-xs font-black text-white">{stats.eventsPending}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" /> Validés
                                </span>
                                <span className="text-xs font-black text-white">{stats.eventsValidated}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Terminés
                                </span>
                                <span className="text-xs font-black text-white">{stats.eventsCompleted}</span>
                            </div>
                        </div>
                    </div>

                    {/* Network & Relations breakdown */}
                    <div className="card-premium p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-6">Réseau & Collaborations</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                                        <Users size={20} />
                                    </div>
                                    <span className="text-2xl font-black text-white block">{stats.suppliersCount}</span>
                                    <span className="text-[10px] font-bold text-muted uppercase block mt-1">Fournisseurs</span>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3">
                                        <CheckSquare size={20} />
                                    </div>
                                    <span className="text-2xl font-black text-white block">{stats.contactsCount}</span>
                                    <span className="text-[10px] font-bold text-muted uppercase block mt-1">Contacts</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted font-medium mt-6 leading-relaxed opacity-60">
                            Représente l'ensemble des relations uniques de prestataires et d'invités/prestataires enregistrées au travers des différents événements.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
