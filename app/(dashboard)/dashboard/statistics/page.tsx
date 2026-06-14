'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ChevronLeft, TrendingUp, Wallet, CheckSquare, Users, Landmark, Calendar, Filter } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────
interface EventRaw {
    id: string;
    status: string;
    montant_total: number | null;
    acompte: number | null;
    date_start: string | null;
    created_at: string;
}

type QuickFilter = 'all' | 'year' | 'month' | 'custom';

interface DateRange {
    start: string;
    end: string;
}

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

const EMPTY_STATS: StatsData = {
    revenue: 0, paid: 0, remaining: 0, cashRatio: 0,
    tasksTotal: 0, tasksCompleted: 0, tasksRatio: 0,
    eventsTotal: 0, eventsDraft: 0, eventsPending: 0, eventsValidated: 0, eventsCompleted: 0,
    suppliersCount: 0, contactsCount: 0,
};

// ─── Helper: get today's date as YYYY-MM-DD ────────────────────────
function todayStr() {
    return new Date().toISOString().split('T')[0];
}
function firstDayOfYear() {
    return `${new Date().getFullYear()}-01-01`;
}
function lastDayOfYear() {
    return `${new Date().getFullYear()}-12-31`;
}
function firstDayOfMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function lastDayOfMonth() {
    const d = new Date();
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
}

// ─── Format period label ───────────────────────────────────────────
function formatPeriodLabel(filter: QuickFilter, range: DateRange, selectedYear: number): string {
    if (filter === 'all') return 'Toute la période';
    if (filter === 'year') return `Année ${selectedYear}`;
    if (filter === 'month') {
        return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    if (range.start && range.end) {
        const s = new Date(range.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        const e = new Date(range.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${s} → ${e}`;
    }
    return 'Plage personnalisée';
}

// ─── Main Component ────────────────────────────────────────────────
export default function StatisticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [allEvents, setAllEvents] = useState<EventRaw[]>([]);
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
    const [allContacts, setAllContacts] = useState<any[]>([]);
    const [stats, setStats] = useState<StatsData>(EMPTY_STATS);

    // Filter state
    const [activeFilter, setActiveFilter] = useState<QuickFilter>('year');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [customRange, setCustomRange] = useState<DateRange>({ start: '', end: '' });
    const [showCustom, setShowCustom] = useState(false);

    // Get unique years from events dynamically
    const years = React.useMemo(() => {
        const list = allEvents.map(e => {
            const dateStr = e.date_start || e.created_at;
            return dateStr ? new Date(dateStr).getFullYear() : null;
        }).filter(Boolean) as number[];
        
        const currentYear = new Date().getFullYear();
        if (!list.includes(currentYear)) {
            list.push(currentYear);
        }
        return Array.from(new Set(list)).sort((a, b) => b - a);
    }, [allEvents]);

    // ── Load all data once ──────────────────────────────────────────
    useEffect(() => {
        const fetchAll = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data: profile } = await supabase
                .from('profiles').select('team_id').eq('id', user.id).single() as any;

            if (!profile?.team_id) { setLoading(false); return; }

            const teamId = profile.team_id;

            const { data: events } = await supabase
                .from('events')
                .select('id, status, montant_total, acompte, date_start, created_at')
                .eq('team_id', teamId) as any;

            const eventsList: EventRaw[] = events || [];
            setAllEvents(eventsList);

            const eventIds = eventsList.map(e => e.id);

            if (eventIds.length > 0) {
                const { data: tasks } = await supabase
                    .from('tasks').select('status, event_id').in('event_id', eventIds) as any;
                setAllTasks(tasks || []);

                const { data: suppliers } = await supabase
                    .from('suppliers').select('event_id').in('event_id', eventIds) as any;
                setAllSuppliers(suppliers || []);

                const { data: contacts } = await supabase
                    .from('contacts').select('event_id').in('event_id', eventIds) as any;
                setAllContacts(contacts || []);
            }

            setLoading(false);
        };
        fetchAll();
    }, [router]);

    // ── Recompute stats when filter or data changes ─────────────────
    const computeStats = useCallback(() => {
        let filteredEvents = [...allEvents];

        // Determine effective date range limits
        let startLimit: Date | null = null;
        let endLimit: Date | null = null;

        if (activeFilter === 'year') {
            startLimit = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
            endLimit = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
        } else if (activeFilter === 'month') {
            const d = new Date();
            startLimit = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
            endLimit = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (activeFilter === 'custom') {
            if (customRange.start) {
                startLimit = new Date(customRange.start);
                startLimit.setHours(0, 0, 0, 0);
            }
            if (customRange.end) {
                endLimit = new Date(customRange.end);
                endLimit.setHours(23, 59, 59, 999);
            }
        }

        // Filter events using the timezone-safe limits
        if (startLimit || endLimit) {
            filteredEvents = filteredEvents.filter(e => {
                const dateStr = e.date_start || e.created_at;
                if (!dateStr) return false;
                const date = new Date(dateStr);
                const isAfterStart = startLimit ? date >= startLimit : true;
                const isBeforeEnd = endLimit ? date <= endLimit : true;
                return isAfterStart && isBeforeEnd;
            });
        }

        const eventsTotal = filteredEvents.length;
        const eventsDraft = filteredEvents.filter(e => e.status === 'non_valide').length;
        const eventsPending = filteredEvents.filter(e => e.status === 'en_attente').length;
        const eventsValidated = filteredEvents.filter(e => e.status === 'valide').length;
        const eventsCompleted = filteredEvents.filter(e => e.status === 'termine').length;

        const billable = filteredEvents.filter(e => e.status !== 'non_valide');
        const revenue = billable.reduce((s, e) => s + Number(e.montant_total || 0), 0);
        const paid = billable.reduce((s, e) => s + Number(e.acompte || 0), 0);
        const remaining = revenue - paid;
        const cashRatio = revenue > 0 ? Math.round((paid / revenue) * 100) : 0;

        const filteredIds = new Set(filteredEvents.map(e => e.id));
        const filteredTasks = allTasks.filter(t => filteredIds.has(t.event_id));
        const tasksTotal = filteredTasks.length;
        const tasksCompleted = filteredTasks.filter(t => t.status === 'termine').length;
        const tasksRatio = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

        const suppliersCount = allSuppliers.filter(s => filteredIds.has(s.event_id)).length;
        const contactsCount = allContacts.filter(c => filteredIds.has(c.event_id)).length;

        setStats({
            revenue, paid, remaining, cashRatio,
            tasksTotal, tasksCompleted, tasksRatio,
            eventsTotal, eventsDraft, eventsPending, eventsValidated, eventsCompleted,
            suppliersCount, contactsCount,
        });
    }, [allEvents, allTasks, allSuppliers, allContacts, activeFilter, customRange, selectedYear]);

    useEffect(() => {
        computeStats();
    }, [computeStats]);

    const handleQuickFilter = (f: QuickFilter) => {
        setActiveFilter(f);
        setShowCustom(f === 'custom');
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

    // ── Loading State ──────────────────────────────────────────────
    if (loading) {
        return (
            <main className="p-6 max-w-md mx-auto md:max-w-4xl pb-32 flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
                <p className="text-sm font-semibold text-muted animate-pulse">Calcul de vos statistiques d'équipe...</p>
            </main>
        );
    }

    const periodLabel = formatPeriodLabel(activeFilter, customRange, selectedYear);

    const quickFilters: { key: QuickFilter; label: string }[] = [
        { key: 'all', label: 'Tout' },
        { key: 'year', label: 'Par année' },
        { key: 'month', label: 'Ce mois' },
        { key: 'custom', label: 'Personnalisé' },
    ];

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-4xl pb-32">
            {/* Header */}
            <header className="mb-8 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-surface border border-white/5 flex items-center justify-center text-muted hover:text-white transition-all flex-shrink-0"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        Statistiques d'Activité 📊
                    </h1>
                    <p className="text-xs text-muted font-semibold mt-1">
                        Performances filtrées par période · <span className="text-primary">{periodLabel}</span>
                    </p>
                </div>
            </header>

            {/* ── Filter Bar ── */}
            <section className="mb-8 card-premium p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={14} className="text-muted" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Filtrer par période</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {quickFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleQuickFilter(f.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeFilter === f.key
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'bg-white/5 text-muted hover:text-white hover:bg-white/10 border border-white/5'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}

                    {activeFilter === 'year' && (
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50 cursor-pointer"
                        >
                            {years.map(y => (
                                <option key={y} value={y} className="bg-[#121214] text-white">
                                    {y}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Custom date range inputs */}
                {showCustom && (
                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Date de début</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                <input
                                    type="date"
                                    value={customRange.start}
                                    onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full bg-background border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <span className="text-muted font-bold text-sm mt-4 sm:mt-0 hidden sm:block">→</span>
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Date de fin</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                <input
                                    type="date"
                                    value={customRange.end}
                                    onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                    min={customRange.start}
                                    className="w-full bg-background border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* ── No results ── */}
            {stats.eventsTotal === 0 && (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl mb-8 flex flex-col items-center gap-3">
                    <span className="text-4xl">📭</span>
                    <p className="text-sm font-bold text-white">Aucun événement pour cette période</p>
                    <p className="text-xs text-muted">Essayez d'élargir la plage de dates.</p>
                </div>
            )}

            {stats.eventsTotal > 0 && (
            <div className="space-y-8">
                {/* ── Financial KPIs ── */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card-premium p-6 relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-transparent">
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shadow-inner">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Chiffre d'Affaires</span>
                        <h2 className="text-2xl font-black text-white">{formatCurrency(stats.revenue)}</h2>
                        <p className="text-[10px] text-purple-400 font-bold mt-2">Sur projets validés & terminés</p>
                    </div>

                    <div className="card-premium p-6 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-transparent">
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
                            <Wallet size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Acomptes Encaissés</span>
                        <h2 className="text-2xl font-black text-white">{formatCurrency(stats.paid)}</h2>
                        <p className="text-[10px] text-emerald-400 font-bold mt-2">{stats.cashRatio}% du CA total perçu</p>
                    </div>

                    <div className="card-premium p-6 relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-transparent">
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shadow-inner">
                            <Landmark size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Reste à Recevoir</span>
                        <h2 className="text-2xl font-black text-white">{formatCurrency(stats.remaining)}</h2>
                        <p className="text-[10px] text-orange-400 font-bold mt-2">Solde en attente de facturation</p>
                    </div>
                </section>

                {/* ── Progress Gauges ── */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* ── Events Breakdown + Network ── */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card-premium p-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-4">Répartition des Événements <span className="text-primary">({stats.eventsTotal})</span></h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Non validés', count: stats.eventsDraft, color: 'bg-gray-500' },
                                { label: 'En attente', count: stats.eventsPending, color: 'bg-orange-400' },
                                { label: 'Validés', count: stats.eventsValidated, color: 'bg-green-400' },
                                { label: 'Terminés', count: stats.eventsCompleted, color: 'bg-blue-400' },
                            ].map(row => (
                                <div key={row.label} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-xs font-bold text-white flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                                        {row.label}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${row.color} rounded-full`}
                                                style={{ width: stats.eventsTotal > 0 ? `${Math.round((row.count / stats.eventsTotal) * 100)}%` : '0%' }}
                                            />
                                        </div>
                                        <span className="text-xs font-black text-white w-4 text-right">{row.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

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
                            Réseau total de prestataires et contacts enregistrés sur cette période.
                        </p>
                    </div>
                </section>
            </div>
            )}
        </main>
    );
}
