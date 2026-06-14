'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Event } from '@/types/database';

const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STATUS_COLOR: Record<string, string> = {
    valide: 'bg-green-500',
    en_attente: 'bg-orange-500',
    termine: 'bg-blue-500',
    non_valide: 'bg-gray-500',
};

function getEventBg(status: string) {
    const map: Record<string, string> = {
        valide: 'bg-green-500/15 text-green-300 border-green-500/20',
        en_attente: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
        termine: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
        non_valide: 'bg-white/5 text-muted border-white/10',
    };
    return map[status] || 'bg-white/5 text-muted border-white/10';
}

export default function CalendarPage() {
    const { profile } = useUser();
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.team_id) return;
        const fetchEvents = async () => {
            const supabase = createClient();
            const { data, error } = await (supabase as any)
                .from('events')
                .select('*')
                .eq('team_id', profile.team_id as string);
            if (!error && data) setEvents(data as Event[]);
            setLoading(false);
        };
        fetchEvents();
    }, [profile?.team_id]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = (new Date(year, month, 1).getDay() + 6) % 7; // Mon-start

    const getEventsForDay = (d: number, m: number, y: number) =>
        events.filter(ev => {
            if (!ev.date_start) return false;
            const dt = new Date(ev.date_start);
            return dt.getDate() === d && dt.getMonth() === m && dt.getFullYear() === y;
        });

    const nextMonth = () => setCurrentDate(new Date(year, month + 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const selectedEvents = getEventsForDay(
        selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()
    );

    // Build upcoming events (next 30 days from today, sorted)
    const today = new Date();
    const in30 = new Date(); in30.setDate(today.getDate() + 30);
    const upcoming = events
        .filter(ev => ev.date_start && new Date(ev.date_start) >= today && new Date(ev.date_start) <= in30)
        .sort((a, b) => new Date(a.date_start!).getTime() - new Date(b.date_start!).getTime())
        .slice(0, 6);

    // Build calendar cells
    const cells: (number | null)[] = [
        ...Array(startDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <main className="p-6 animate-fade-in pb-32">
            {/* ── Desktop Layout ─────────────────────────────────── */}
            <div className="hidden md:flex gap-8 items-start">

                {/* Left: Full Calendar */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-black tracking-tight">Calendrier</h1>
                        <div className="flex items-center gap-3">
                            <button onClick={goToToday} className="px-4 py-2 text-xs font-bold rounded-xl bg-surface border border-white/10 text-muted hover:text-white transition-colors">
                                Aujourd'hui
                            </button>
                            <Link href="/dashboard/events/new" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/30 hover:bg-primary/80 transition-all">
                                <Plus size={14} /> Nouvel événement
                            </Link>
                        </div>
                    </div>

                    {/* Month Navigation */}
                    <div className="card-premium p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black">
                                {MONTH_NAMES[month]} <span className="text-muted font-medium">{year}</span>
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-muted hover:text-white transition-all">
                                    <ChevronLeft size={18} />
                                </button>
                                <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-muted hover:text-white transition-all">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Week-day headers */}
                        <div className="grid grid-cols-7 mb-4">
                            {WEEK_DAYS.map(d => (
                                <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-muted/40 py-2">{d}</div>
                            ))}
                        </div>

                        {/* Calendar cells */}
                        <div className="grid grid-cols-7 gap-1">
                            {cells.map((day, idx) => {
                                if (!day) return <div key={`e-${idx}`} className="h-16" />;
                                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                                const isSelected = day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
                                const dayEvts = getEventsForDay(day, month, year);
                                return (
                                    <div
                                        key={day}
                                        onClick={() => setSelectedDate(new Date(year, month, day))}
                                        className={`h-16 rounded-xl flex flex-col items-center pt-2 gap-1 cursor-pointer transition-all group ${isSelected ? 'bg-primary/20 border border-primary/40' : 'hover:bg-white/5'}`}
                                    >
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                                            isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                                            isToday ? 'border border-primary text-primary' : 'text-white group-hover:bg-white/10'
                                        }`}>
                                            {day}
                                        </span>
                                        <div className="flex gap-0.5">
                                            {dayEvts.slice(0, 3).map(ev => (
                                                <div key={ev.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_COLOR[ev.status] || 'bg-muted'}`} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar detail */}
                <div className="w-80 flex-shrink-0 space-y-6">
                    {/* Selected day */}
                    <div className="card-premium p-5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-4">
                            {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                        </h3>
                        {selectedEvents.length === 0 ? (
                            <div className="text-center py-8 flex flex-col items-center gap-3">
                                <CalendarIcon size={32} className="text-muted/20" />
                                <p className="text-xs text-muted font-medium">Aucun événement ce jour</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedEvents.map(ev => (
                                    <div
                                        key={ev.id}
                                        onClick={() => router.push(`/dashboard/events/${ev.id}`)}
                                        className={`p-3 rounded-xl border cursor-pointer hover:brightness-125 transition-all ${getEventBg(ev.status)}`}
                                    >
                                        <p className="text-sm font-bold truncate">{ev.title}</p>
                                        <p className="text-[10px] font-medium mt-1 opacity-70">
                                            {ev.date_start && new Date(ev.date_start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            {ev.type ? ` · ${ev.type}` : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upcoming */}
                    <div className="card-premium p-5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-4">Prochains événements</h3>
                        {upcoming.length === 0 ? (
                            <p className="text-xs text-muted opacity-60 text-center py-4">Aucun événement dans les 30 prochains jours</p>
                        ) : (
                            <div className="space-y-2">
                                {upcoming.map(ev => {
                                    const dt = new Date(ev.date_start!);
                                    return (
                                        <div
                                            key={ev.id}
                                            onClick={() => router.push(`/dashboard/events/${ev.id}`)}
                                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-surface border border-white/10 flex flex-col items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-black text-primary leading-none">{dt.getDate()}</span>
                                                <span className="text-[8px] font-bold text-muted uppercase">{MONTH_NAMES[dt.getMonth()].slice(0, 3)}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{ev.title}</p>
                                                <p className="text-[10px] text-muted font-medium">{ev.type || 'Événement'}</p>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[ev.status] || 'bg-muted'}`} />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Mobile Layout ──────────────────────────────────── */}
            <div className="md:hidden">
                <header className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold">Calendrier</h1>
                    <Link href="/dashboard/events/new" className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Plus size={20} />
                    </Link>
                </header>

                <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-lg font-bold">
                        {MONTH_NAMES[month]} <span className="text-muted font-medium">{year}</span>
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={prevMonth} className="text-muted hover:text-white transition-colors"><ChevronLeft size={24} /></button>
                        <button onClick={nextMonth} className="text-muted hover:text-white transition-colors"><ChevronRight size={24} /></button>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="grid grid-cols-7 mb-3">
                        {WEEK_DAYS.map(d => <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-muted/40">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-y-2">
                        {cells.map((day, idx) => {
                            if (!day) return <div key={`e-${idx}`} className="h-12" />;
                            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                            const isSelected = day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
                            const hasEvent = getEventsForDay(day, month, year).length > 0;
                            return (
                                <div key={day} onClick={() => setSelectedDate(new Date(year, month, day))} className="h-12 flex flex-col items-center justify-center relative cursor-pointer">
                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : isToday ? 'border border-primary/50 text-primary' : 'text-white hover:bg-surface-light'}`}>
                                        {day}
                                    </div>
                                    {hasEvent && !isSelected && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <section className="animate-fade-in-up">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-5">
                        Programme <span className="text-muted font-medium">• {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]}</span>
                    </h3>
                    <div className="space-y-4">
                        {selectedEvents.map(event => (
                            <div key={event.id} onClick={() => router.push(`/dashboard/events/${event.id}`)} className="card-premium p-4 flex items-center gap-4 cursor-pointer hover:translate-x-1 transition-transform">
                                <div className={`w-2 h-10 rounded-full ${STATUS_COLOR[event.status] || 'bg-muted'}`} />
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm mb-1">{event.title}</h4>
                                    <p className="text-xs text-muted font-medium">{event.type || 'Événement'}</p>
                                </div>
                                <ChevronRight size={20} className="text-muted" />
                            </div>
                        ))}
                        {selectedEvents.length === 0 && (
                            <div className="text-center py-10">
                                <CalendarIcon size={40} className="mx-auto text-muted/20 mb-4" />
                                <p className="text-muted text-sm">Aucun événement prévu ce jour.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
