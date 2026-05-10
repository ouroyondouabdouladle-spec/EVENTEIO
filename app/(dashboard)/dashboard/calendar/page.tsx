'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import type { Event } from '@/types/database';

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

            if (!error && data) {
                setEvents(data as Event[]);
            }
            setLoading(false);
        };

        fetchEvents();
    }, [profile?.team_id]);

    const getEventsForDay = (day: number, month: number, year: number) => {
        return events.filter(event => {
            if (!event.date_start) return false;
            const eventDate = new Date(event.date_start);
            return eventDate.getDate() === day && 
                   eventDate.getMonth() === month && 
                   eventDate.getFullYear() === year;
        });
    };

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = (firstDayOfMonth(year, month) + 6) % 7; // Adjust for Monday start

        const days = [];

        // Previous month filler
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-14" />);
        }

        // Current month days
        for (let d = 1; d <= totalDays; d++) {
            const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isSelected = d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
            const dayEvents = getEventsForDay(d, month, year);
            const hasEvent = dayEvents.length > 0;

            days.push(
                <div 
                    key={d} 
                    onClick={() => setSelectedDate(new Date(year, month, d))}
                    className="h-14 flex flex-col items-center justify-center relative cursor-pointer group"
                >
                    <div className={`
                        w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all
                        ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'text-white hover:bg-surface-light'}
                        ${isToday && !isSelected ? 'border border-primary/50 text-primary' : ''}
                    `}>
                        {d}
                    </div>
                    {hasEvent && !isSelected && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                </div>
            );
        }

        return days;
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Calendrier</h1>
                <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-white transition-colors">
                        <Search size={20} />
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                        <Plus size={20} />
                    </button>
                </div>
            </header>

            {/* Month Selector */}
            <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-lg font-bold">
                    {monthNames[currentDate.getMonth()]} <span className="text-muted font-medium">{currentDate.getFullYear()}</span>
                </h2>
                <div className="flex gap-4">
                    <button onClick={prevMonth} className="text-muted hover:text-white transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextMonth} className="text-muted hover:text-white transition-colors">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="mb-10">
                <div className="grid grid-cols-7 mb-4">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-muted/40">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-2">
                    {renderCalendar()}
                </div>
            </div>

            {/* Selected Day Events */}
            <section className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        Programme <span className="text-muted font-medium">• {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}</span>
                    </h3>
                </div>

                <div className="space-y-4">
                    {getEventsForDay(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()).map((event) => (
                        <div 
                            key={event.id} 
                            onClick={() => router.push(`/dashboard/events/${event.id}`)}
                            className="card-premium p-4 flex items-center gap-4 group cursor-pointer hover:translate-x-1"
                        >
                            <div className={`w-2 h-10 rounded-full ${
                                event.status === 'valide' ? 'bg-green-500' : 
                                event.status === 'en_attente' ? 'bg-orange-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                                <h4 className="font-bold text-sm mb-1">{event.title}</h4>
                                <p className="text-xs text-muted font-medium">
                                    {event.date_start ? new Date(event.date_start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'} • {event.type || 'Événement'}
                                </p>
                            </div>
                            <button className="text-muted hover:text-white transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    ))}

                    {getEventsForDay(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()).length === 0 && (
                        <div className="text-center py-10">
                            <CalendarIcon size={40} className="mx-auto text-muted/20 mb-4" />
                            <p className="text-muted text-sm">Aucun événement prévu ce jour.</p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
