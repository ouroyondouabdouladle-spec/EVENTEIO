'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Calendar, Flag, CheckSquare, Users, Phone, FileText,
    MapPin, ChevronRight, Plus, MoreHorizontal, Search,
    ChevronLeft, Folder, Clock, ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import TeamSetup from '@/components/layout/TeamSetup';
import { canViewCalendar, canViewEvents, canViewTasks, canViewSuppliers, canViewContacts, canViewFiles } from '@/lib/permissions';
import type { Event } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────
type Task = { id: string; title: string; due_date: string | null; status: string; event_id: string };
type Supplier = { id: string; name: string; category: string | null; phone: string | null; email: string | null; event_id: string };
type Contact = { id: string; name: string; role: string | null; phone: string | null; email: string | null; event_id: string };

const DAYS_FR = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function getStatusLabel(status: string) {
    if (status === 'valide') return 'Confirmé';
    if (status === 'termine') return 'Terminé';
    if (status === 'en_attente') return 'En préparation';
    return 'Brouillon';
}
function getStatusClass(status: string) {
    if (status === 'valide') return 'badge-confirmed';
    if (status === 'termine') return 'badge-done';
    if (status === 'en_attente') return 'badge-pending';
    return 'badge-draft';
}

// ─── Mini Calendar ────────────────────────────────────────────────
function MiniCalendar({ events }: { events: Event[] }) {
    const today = new Date();
    const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

    const firstDay = new Date(current.year, current.month, 1);
    const lastDay = new Date(current.year, current.month + 1, 0);
    // Adjust: Monday=0 ... Sunday=6
    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalCells = startOffset + lastDay.getDate();
    const cells = Array.from({ length: Math.ceil(totalCells / 7) * 7 }, (_, i) => {
        const dayNum = i - startOffset + 1;
        return dayNum >= 1 && dayNum <= lastDay.getDate() ? dayNum : null;
    });

    const eventDays = new Set(
        events.map(e => {
            if (!e.date_start) return null;
            const d = new Date(e.date_start);
            if (d.getMonth() === current.month && d.getFullYear() === current.year) return d.getDate();
            return null;
        }).filter(Boolean)
    );

    const todayEvents = events.filter(e => {
        if (!e.date_start) return false;
        const d = new Date(e.date_start);
        return d.toDateString() === today.toDateString();
    });

    return (
        <div className="mini-calendar">
            <div className="mini-cal-header">
                <button className="mini-cal-nav" onClick={() => setCurrent(c => {
                    const m = c.month === 0 ? 11 : c.month - 1;
                    const y = c.month === 0 ? c.year - 1 : c.year;
                    return { year: y, month: m };
                })}>
                    <ChevronLeft size={14} />
                </button>
                <span className="mini-cal-title">{MONTHS_FR[current.month]} {current.year}</span>
                <button className="mini-cal-nav" onClick={() => setCurrent(c => {
                    const m = c.month === 11 ? 0 : c.month + 1;
                    const y = c.month === 11 ? c.year + 1 : c.year;
                    return { year: y, month: m };
                })}>
                    <ChevronRight size={14} />
                </button>
                <button className="mini-cal-today-btn">Aujourd'hui</button>
            </div>
            <div className="mini-cal-grid">
                {DAYS_FR.map(d => <div key={d} className="mini-cal-day-label">{d}</div>)}
                {cells.map((day, i) => {
                    const isToday = day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();
                    const hasEvent = day && eventDays.has(day);
                    return (
                        <div key={i} className={`mini-cal-cell ${!day ? 'empty' : ''} ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}>
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Today's agenda */}
            {todayEvents.length > 0 && (
                <div className="mini-cal-agenda">
                    <p className="mini-cal-agenda-title">
                        {today.getDate()} {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][today.getDay()]}
                    </p>
                    {todayEvents.map(e => (
                        <Link key={e.id} href={`/dashboard/events/${e.id}`} className="mini-cal-event-item">
                            <div className="mini-cal-event-dot" />
                            <div>
                                <p className="mini-cal-event-name">{e.title}</p>
                                <p className="mini-cal-event-loc">{e.location || 'En ligne'}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            {todayEvents.length === 0 && (
                <div className="mini-cal-agenda">
                    <p className="mini-cal-agenda-empty">Aucun événement aujourd'hui</p>
                    <Link href="/dashboard/calendar" className="mini-cal-see-all">Voir tout le calendrier →</Link>
                </div>
            )}
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function DashboardPage() {
    const { profile, loading: userLoading } = useUser();
    const [events, setEvents] = useState<Event[]>([]);
    const [nextEvent, setNextEvent] = useState<Event | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventFilter, setEventFilter] = useState<'all' | 'valide' | 'en_attente' | 'termine'>('all');
    const [taskTab, setTaskTab] = useState<'todo' | 'inprogress' | 'done'>('todo');

    useEffect(() => {
        if (!profile?.team_id) return;

        const fetchAll = async () => {
            const supabase = createClient();

            // 1. Next Event (upcoming or today)
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const { data: nextEventData } = await (supabase as any)
                .from('events')
                .select('*')
                .eq('team_id', profile.team_id as string)
                .neq('status', 'non_valide')
                .neq('status', 'termine')
                .gte('date_start', todayStart.toISOString())
                .order('date_start', { ascending: true })
                .limit(1)
                .maybeSingle();

            setNextEvent(nextEventData as Event || null);

            // 2. Events List (up to 50 for robust client filtering)
            const { data: eventsData } = await (supabase as any)
                .from('events')
                .select('*')
                .eq('team_id', profile.team_id as string)
                .neq('status', 'non_valide')
                .order('date_start', { ascending: true })
                .limit(50);

            const evList = (eventsData as Event[]) || [];
            setEvents(evList);

            if (evList.length > 0) {
                const eventIds = evList.map((e: Event) => e.id);

                // Tasks
                const { data: tasksData } = await (supabase as any)
                    .from('tasks')
                    .select('id, title, due_date, status, event_id')
                    .in('event_id', eventIds)
                    .order('due_date', { ascending: true })
                    .limit(8);

                // Suppliers
                const { data: suppliersData } = await (supabase as any)
                    .from('suppliers')
                    .select('id, name, category, phone, email, event_id')
                    .in('event_id', eventIds)
                    .limit(6);

                // Contacts
                const { data: contactsData } = await (supabase as any)
                    .from('contacts')
                    .select('id, name, role, phone, email, event_id')
                    .in('event_id', eventIds)
                    .order('name', { ascending: true })
                    .limit(6);

                setTasks((tasksData as Task[]) || []);
                setSuppliers((suppliersData as Supplier[]) || []);
                setContacts((contactsData as Contact[]) || []);
            }

            setLoading(false);
        };

        fetchAll();
    }, [profile?.team_id]);

    if (userLoading) return null;
    if (profile && !profile.team_id) return <TeamSetup />;

    const latestEvent = nextEvent;

    const filteredEvents = eventFilter === 'all'
        ? events
        : events.filter(e => e.status === eventFilter);

    const filteredTasks = tasks.filter(t => {
        if (taskTab === 'todo') return t.status === 'a_faire' || t.status === 'todo';
        if (taskTab === 'inprogress') return t.status === 'en_cours' || t.status === 'inprogress';
        return t.status === 'termine' || t.status === 'done';
    });

    const getAvatarColor = (name: string) => {
        const colors = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const quickActions = [
        { icon: Calendar, label: 'Calendrier', color: 'qa-purple', href: '/dashboard/calendar', perm: canViewCalendar },
        { icon: Flag, label: 'Événements', color: 'qa-blue', href: '/dashboard/events', perm: canViewEvents },
        { icon: CheckSquare, label: 'Tâches', color: 'qa-green', href: '/dashboard/tasks', perm: canViewTasks },
        { icon: Users, label: 'Fournisseurs', color: 'qa-orange', href: '/dashboard/suppliers', perm: canViewSuppliers },
        { icon: Phone, label: 'Contacts', color: 'qa-cyan', href: '/dashboard/contacts', perm: canViewContacts },
        { icon: FileText, label: 'Docs & fichiers', color: 'qa-pink', href: '/dashboard/files', perm: canViewFiles },
    ].filter(a => a.perm(profile));

    // ── Mobile Layout (returned as-is, wrapped by mobile shell in layout) ──
    // ── Desktop layout follows ──
    return (
        <>
            {/* ══════════ MOBILE VIEW ══════════ */}
            <main className="block lg:hidden p-6 animate-fade-in max-w-md mx-auto md:max-w-2xl pb-32">
                {/* Header */}
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">
                            Bonjour {profile?.full_name?.split(' ')[0] || 'Cinar'} 👋
                        </h1>
                        <p className="text-muted text-sm opacity-60">Voici ce qui se passe aujourd'hui.</p>
                    </div>
                </header>

                {latestEvent ? (
                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            Prochain événement
                        </div>
                        <Link href={`/dashboard/events/${latestEvent.id}`} className="block group">
                            <div className="card-premium relative overflow-hidden p-8 min-h-[200px] flex flex-col justify-between">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-600/30 to-blue-600/30 blur-[50px] -mr-24 -mt-24" />
                                <div className="relative z-10">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg ${getStatusClass(latestEvent.status || '')}`}>
                                        {getStatusLabel(latestEvent.status || '')}
                                    </span>
                                    <h2 className="text-2xl font-black mt-3 mb-2">{latestEvent.title}</h2>
                                    <p className="text-muted text-xs flex items-center gap-2"><MapPin size={12} className="text-purple-400" />{latestEvent.location || 'Lieu non défini'}</p>
                                </div>
                                <div className="relative z-10 mt-6">
                                    <span className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-xs font-black">Voir les détails</span>
                                </div>
                            </div>
                        </Link>
                    </section>
                ) : (
                    <Link href="/dashboard/events/new" className="block mb-10">
                        <div className="card-premium p-10 text-center border-dashed">
                            <p className="text-muted font-bold mb-4 opacity-60">Aucun événement.</p>
                            <span className="btn-premium py-2 px-6 inline-block text-xs">Créer mon premier événement</span>
                        </div>
                    </Link>
                )}

                <section className="mb-10">
                    <h3 className="text-sm font-black uppercase tracking-wider mb-5 opacity-40">Accès rapides</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {quickActions.map((a, i) => (
                            <Link key={i} href={a.href} className="flex flex-col items-center gap-2 p-4 rounded-[2rem] bg-surface border border-white/5 hover:border-white/20 transition-all group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.color} group-hover:scale-110 transition-transform`}>
                                    <a.icon size={22} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tight opacity-60 group-hover:opacity-100 text-center">{a.label}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black uppercase tracking-wider opacity-40">Prochains événements</h3>
                        <Link href="/dashboard/events" className="text-purple-400 text-xs font-black">VOIR TOUT</Link>
                    </div>
                    <div className="space-y-3">
                        {events.map(ev => (
                            <Link key={ev.id} href={`/dashboard/events/${ev.id}`} className="block group">
                                <div className="card-premium p-4 flex items-center gap-4 group-hover:border-white/20 transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Calendar size={20} className="text-muted" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-sm truncate">{ev.title}</h4>
                                        <p className="text-[10px] text-muted opacity-60">{ev.location}</p>
                                    </div>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${getStatusClass(ev.status || '')}`}>
                                        {getStatusLabel(ev.status || '')}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>

            {/* ══════════ DESKTOP VIEW ══════════ */}
            <main className="hidden lg:block db-page animate-fade-in">
                {/* Greeting */}
                <div className="db-greeting">
                    <h1 className="db-greeting-title">
                        Bonjour {profile?.full_name?.split(' ')[0] || 'Cinar'} 👋
                    </h1>
                    <p className="db-greeting-sub">Voici ce qui se passe aujourd'hui.</p>
                </div>

                {/* ── Row 1: 3 columns ── */}
                <div className="db-row1">

                    {/* Col A: Featured Event + My Events */}
                    <div className="db-col-a">
                        {/* Featured Event */}
                        <div className="db-widget">
                            <div className="db-widget-header">
                                <div className="db-widget-dot" />
                                <span className="db-widget-label">Événement à venir</span>
                            </div>
                            {latestEvent ? (
                                <Link href={`/dashboard/events/${latestEvent.id}`} className="block group">
                                    <div className="db-featured-event">
                                        <div className="db-featured-glow" />
                                        <div className="db-featured-body">
                                            <div className="db-featured-image">
                                                <Calendar size={32} className="text-purple-300/60" />
                                            </div>
                                            <div className="db-featured-info">
                                                <h2 className="db-featured-title">{latestEvent.title}</h2>
                                                <p className="db-featured-loc"><MapPin size={13} />{latestEvent.location || 'Lieu non défini'}</p>
                                                {latestEvent.date_start && (
                                                    <p className="db-featured-date">
                                                        <Calendar size={13} />
                                                        {new Date(latestEvent.date_start).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                                                        {latestEvent.date_end && ' · ' + new Date(latestEvent.date_end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}
                                                <span className="db-featured-btn">Voir les détails</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <Link href="/dashboard/events/new" className="db-empty-featured">
                                    <Plus size={24} className="text-purple-400" />
                                    <p>Créer un événement</p>
                                </Link>
                            )}
                        </div>

                        {/* My Events */}
                        {canViewEvents(profile) && (
                        <div className="db-widget db-widget-scroll">
                            <div className="db-widget-header-row">
                                <span className="db-section-title">Mes événements</span>
                                <Link href="/dashboard/events" className="db-see-all">Voir tout</Link>
                            </div>
                            {events.slice(0, 3).map(ev => (
                                <Link key={ev.id} href={`/dashboard/events/${ev.id}`} className="db-event-row group">
                                    <div className="db-event-thumb">
                                        <Calendar size={18} className="text-purple-400" />
                                    </div>
                                    <div className="db-event-info">
                                        <p className="db-event-name">{ev.title}</p>
                                        <p className="db-event-sub"><MapPin size={11} />{ev.location || 'Lieu non défini'}</p>
                                        {ev.date_start && (
                                            <p className="db-event-date">
                                                <Calendar size={11} />
                                                {new Date(ev.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`db-badge ${getStatusClass(ev.status || '')}`}>
                                        {getStatusLabel(ev.status || '')}
                                    </span>
                                </Link>
                            ))}
                            {events.length === 0 && (
                                <p className="db-empty-text">Aucun événement.</p>
                            )}
                        </div>
                        )}
                    </div>

                    {/* Col B: Quick Actions + Calendar */}
                    <div className="db-col-b">
                        {/* Quick Actions */}
                        <div className="db-widget">
                            <div className="db-widget-header-row">
                                <span className="db-section-title">Accès rapides</span>
                                <MoreHorizontal size={16} className="text-muted opacity-40" />
                            </div>
                            <div className="db-qa-grid">
                                {quickActions.map((a, i) => (
                                    <Link key={i} href={a.href} className="db-qa-item group">
                                        <div className={`db-qa-icon ${a.color}`}>
                                            <a.icon size={22} />
                                        </div>
                                        <span className="db-qa-label">{a.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Mini Calendar */}
                        {canViewCalendar(profile) && (
                        <div className="db-widget">
                            <MiniCalendar events={events} />
                        </div>
                        )}
                    </div>

                    {/* Col C: Events List */}
                    <div className="db-col-c">
                        {canViewEvents(profile) && (
                        <div className="db-widget db-widget-full">
                            <div className="db-widget-header-row">
                                <span className="db-section-title">Liste des événements</span>
                                <Link href="/dashboard/events" className="db-see-all-plus">
                                    Voir tout <Plus size={14} />
                                </Link>
                            </div>

                            {/* Search */}
                            <div className="db-events-search">
                                <Search size={14} className="db-search-icon" />
                                <input placeholder="Rechercher un événement..." className="db-search-input" readOnly />
                            </div>

                            {/* Filter Tabs */}
                            <div className="db-filter-tabs">
                                {[['all', 'Tous'], ['valide', 'Confirmés'], ['en_attente', 'En préparation'], ['termine', 'Terminés']] .map(([val, label]) => (
                                    <button
                                        key={val}
                                        className={`db-filter-tab ${eventFilter === val ? 'active' : ''}`}
                                        onClick={() => setEventFilter(val as any)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Events */}
                            <div className="db-events-list">
                                {filteredEvents.map(ev => (
                                    <Link key={ev.id} href={`/dashboard/events/${ev.id}`} className="db-event-list-item group">
                                        <div className="db-el-thumb">
                                            <Calendar size={16} className="text-purple-400" />
                                        </div>
                                        <div className="db-el-info">
                                            <p className="db-el-name">{ev.title}</p>
                                            <p className="db-el-sub">{ev.location || 'Lieu non défini'}</p>
                                            {ev.date_start && (
                                                <p className="db-el-date">
                                                    {new Date(ev.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`db-badge ${getStatusClass(ev.status || '')}`}>
                                                {getStatusLabel(ev.status || '')}
                                            </span>
                                            <MoreHorizontal size={14} className="text-muted opacity-0 group-hover:opacity-60 transition-all" />
                                        </div>
                                    </Link>
                                ))}
                                {filteredEvents.length === 0 && (
                                    <p className="db-empty-text">Aucun événement dans cette catégorie.</p>
                                )}
                            </div>
                        </div>
                        )}
                    </div>
                </div>

                {/* ── Row 2: 4 columns ── */}
                <div className="db-row2">

                    {/* Tasks */}
                    {canViewTasks(profile) && (
                    <div className="db-widget db-widget-sm">
                        <div className="db-widget-header-row">
                            <span className="db-section-title">Tâches</span>
                            <Link href="/dashboard/tasks" className="db-see-all">Voir tout</Link>
                        </div>
                        <div className="db-tabs">
                            {[['todo', 'À faire'], ['inprogress', 'En cours'], ['done', 'Terminées']].map(([val, label]) => (
                                <button key={val} className={`db-tab ${taskTab === val ? 'active' : ''}`} onClick={() => setTaskTab(val as any)}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="db-tasks-list">
                            {filteredTasks.slice(0, 5).map(t => (
                                <div key={t.id} className="db-task-item">
                                    <div className={`db-task-check ${taskTab === 'done' ? 'done' : ''}`} />
                                    <div className="db-task-body">
                                        <p className="db-task-title">{t.title}</p>
                                        {t.due_date && (
                                            <p className="db-task-date">
                                                <Clock size={10} />
                                                {new Date(t.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredTasks.length === 0 && <p className="db-empty-text">Aucune tâche.</p>}
                        </div>
                        <Link href="/dashboard/tasks" className="db-add-btn">
                            <Plus size={16} /> Ajouter une tâche
                        </Link>
                    </div>
                    )}

                    {/* Suppliers */}
                    {canViewSuppliers(profile) && (
                    <div className="db-widget db-widget-sm">
                        <div className="db-widget-header-row">
                            <span className="db-section-title">Fournisseurs</span>
                            <div className="flex items-center gap-2">
                                <Link href="/dashboard/suppliers" className="db-see-all">Voir tout</Link>
                                <MoreHorizontal size={14} className="text-muted opacity-40" />
                            </div>
                        </div>
                        <div className="db-list">
                            {suppliers.slice(0, 5).map(s => (
                                <div key={s.id} className="db-list-item">
                                    <div className="db-list-avatar">
                                        {s.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="db-list-info">
                                        <p className="db-list-name">{s.name}</p>
                                        <p className="db-list-sub">{s.category || 'Prestataire'}</p>
                                    </div>
                                    <div className="db-list-contact">
                                        {s.email && <p className="db-list-email">{s.email}</p>}
                                        {s.phone && <p className="db-list-phone">{s.phone}</p>}
                                    </div>
                                </div>
                            ))}
                            {suppliers.length === 0 && <p className="db-empty-text">Aucun prestataire.</p>}
                        </div>
                        <Link href="/dashboard/suppliers" className="db-add-btn">
                            <Plus size={16} /> Ajouter un fournisseur
                        </Link>
                    </div>
                    )}

                    {/* Contacts */}
                    {canViewContacts(profile) && (
                    <div className="db-widget db-widget-sm">
                        <div className="db-widget-header-row">
                            <span className="db-section-title">Contacts</span>
                            <Link href="/dashboard/contacts" className="db-see-all">Voir tout</Link>
                        </div>
                        <div className="db-contacts-search">
                            <Search size={13} className="db-search-icon" />
                            <input placeholder="Rechercher un contact..." className="db-search-input" readOnly />
                        </div>
                        <div className="db-list">
                            {contacts.slice(0, 5).map(c => (
                                <div key={c.id} className="db-list-item">
                                    <div className={`db-list-avatar ${getAvatarColor(c.name)}`}>
                                        {c.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="db-list-info">
                                        <p className="db-list-name">{c.name}</p>
                                        <p className="db-list-sub">{c.role || 'Contact'}</p>
                                    </div>
                                    <div className="db-list-contact">
                                        {c.email && <p className="db-list-email">{c.email}</p>}
                                        {c.phone && <p className="db-list-phone">{c.phone}</p>}
                                    </div>
                                    <ChevronRight size={14} className="text-muted opacity-30" />
                                </div>
                            ))}
                            {contacts.length === 0 && <p className="db-empty-text">Aucun contact.</p>}
                        </div>
                        <Link href="/dashboard/contacts" className="db-add-btn">
                            <Plus size={16} /> Ajouter un contact
                        </Link>
                    </div>
                    )}

                    {/* Files */}
                    {canViewFiles(profile) && (
                    <div className="db-widget db-widget-sm">
                        <div className="db-widget-header-row">
                            <span className="db-section-title">Documents & fichiers</span>
                            <Link href="/dashboard/files" className="db-see-all">Voir tout</Link>
                        </div>
                        <div className="db-files-search">
                            <Search size={13} className="db-search-icon" />
                            <input placeholder="Rechercher un fichier..." className="db-search-input" readOnly />
                        </div>
                        <div className="db-folders">
                            {[
                                { name: 'Contrats', count: 4, color: 'folder-blue' },
                                { name: 'Devis', count: 8, color: 'folder-purple' },
                                { name: 'Plans', count: 5, color: 'folder-green' },
                                { name: 'Photos', count: 23, color: 'folder-orange' },
                                { name: 'Autres', count: 7, color: 'folder-pink' },
                            ].map(f => (
                                <Link key={f.name} href="/dashboard/files" className="db-folder-item group">
                                    <div className={`db-folder-icon ${f.color}`}>
                                        <Folder size={22} />
                                    </div>
                                    <div className="db-folder-info">
                                        <p className="db-folder-name">{f.name}</p>
                                        <p className="db-folder-count">{f.count} fichiers</p>
                                    </div>
                                    <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-60 transition-all" />
                                </Link>
                            ))}
                        </div>
                        <Link href="/dashboard/files" className="db-add-btn">
                            <Plus size={16} /> Ajouter un fichier
                        </Link>
                    </div>
                    )}

                </div>
            </main>
        </>
    );
}
