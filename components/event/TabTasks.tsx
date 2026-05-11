'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import type { Task, TaskStatus, TaskPriority } from '@/types/database';
import { MoreHorizontal, Plus, Check, Calendar, Flag, Clock, X } from 'lucide-react';

interface TabTasksProps {
    eventId: string;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
    basse: { label: 'Basse', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    moyenne: { label: 'Moyenne', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    haute: { label: 'Haute', color: 'text-red-400', bg: 'bg-red-500/10' }
};

export default function TabTasks({ eventId }: TabTasksProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<TaskStatus | 'tous'>('tous');
    const [isAdding, setIsAdding] = useState(false);
    
    // New Task State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newPriority, setNewPriority] = useState<TaskPriority>('moyenne');
    const [newDueDate, setNewDueDate] = useState('');

    useEffect(() => {
        fetchTasks();
    }, [eventId]);

    const fetchTasks = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (!error && data) setTasks(data);
        setLoading(false);
    };

    const toggleStatus = async (task: Task) => {
        const nextStatus = task.status === 'termine' ? 'a_faire' : 'termine';
        const supabase = createClient();
        const { error } = await (supabase as any)
            .from('tasks')
            .update({ status: nextStatus })
            .eq('id', task.id);

        if (!error) {
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
        }
    };

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const supabase = createClient();
        const { data, error } = await (supabase as any)
            .from('tasks')
            .insert({
                event_id: eventId,
                title: newTaskTitle.trim(),
                status: 'a_faire',
                priority: newPriority,
                due_date: newDueDate || null
            })
            .select()
            .single();

        if (!error && data) {
            setTasks([data, ...tasks]);
            resetForm();
        }
    };

    const resetForm = () => {
        setNewTaskTitle('');
        setNewPriority('moyenne');
        setNewDueDate('');
        setIsAdding(false);
    };

    const filteredTasks = useMemo(() => {
        if (activeFilter === 'tous') return tasks;
        return tasks.filter(t => t.status === activeFilter);
    }, [tasks, activeFilter]);

    const formatDate = (iso: string | null) => {
        if (!iso) return null;
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'short'
        }).format(new Date(iso));
    };

    const isOverdue = (date: string | null) => {
        if (!date) return false;
        return new Date(date) < new Date() && activeFilter !== 'termine';
    };

    if (loading) return <div className="py-20 text-center animate-pulse text-muted">Chargement des tâches...</div>;

    return (
        <div className="pb-28 animate-fade-in">
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
                {(['tous', 'a_faire', 'en_cours', 'termine'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setActiveFilter(status)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap border ${
                            activeFilter === status 
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                            : 'bg-white/5 text-muted hover:text-white border-white/5'
                        }`}
                    >
                        {status === 'tous' ? 'Toutes' : status === 'a_faire' ? 'À faire' : status === 'en_cours' ? 'En cours' : 'Terminées'}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <p className="text-sm text-muted font-bold opacity-60">Aucune tâche trouvée.</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`card-premium p-5 flex items-start gap-5 group transition-all cursor-pointer ${
                                task.status === 'termine' ? 'opacity-50' : 'hover:scale-[1.01]'
                            }`}
                            onClick={() => toggleStatus(task)}
                        >
                            {/* Checkbox */}
                            <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                task.status === 'termine' ? 'bg-primary border-primary' : 'border-white/20'
                            }`}>
                                {task.status === 'termine' && <Check size={14} className="text-white" strokeWidth={4} />}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-black mb-2 ${task.status === 'termine' ? 'line-through' : ''}`}>
                                    {task.title}
                                </p>
                                
                                <div className="flex flex-wrap gap-3">
                                    {/* Priority Badge */}
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].color} border border-white/5`}>
                                        <Flag size={10} strokeWidth={3} />
                                        {PRIORITY_CONFIG[task.priority].label}
                                    </div>

                                    {/* Due Date */}
                                    {task.due_date && (
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${isOverdue(task.due_date) ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-muted'} border border-white/5`}>
                                            <Calendar size={10} />
                                            {formatDate(task.due_date)}
                                        </div>
                                    )}

                                    {/* Created At */}
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-white/5 text-muted opacity-40">
                                        <Clock size={10} />
                                        {formatDate(task.created_at)}
                                    </div>
                                </div>
                            </div>

                            <button className="p-1 text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Enhanced Floating Footer Form */}
            <div className="fixed bottom-24 left-0 right-0 px-6 z-40 pointer-events-none">
                <div className="max-w-md mx-auto md:max-w-2xl pointer-events-auto bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl">
                    {isAdding ? (
                        <form onSubmit={addTask} className="space-y-4 animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Nouvelle Tâche</h4>
                                <button type="button" onClick={resetForm} className="text-muted hover:text-white"><X size={18}/></button>
                            </div>
                            
                            <input
                                autoFocus
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Que faut-il faire ?"
                                className="input-premium h-14"
                            />

                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">Priorité</label>
                                    <div className="flex gap-2">
                                        {(['basse', 'moyenne', 'haute'] as TaskPriority[]).map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setNewPriority(p)}
                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                                                    newPriority === p 
                                                    ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border-current` 
                                                    : 'bg-white/5 text-muted border-white/5'
                                                }`}
                                            >
                                                {PRIORITY_CONFIG[p].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-1/3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">Échéance</label>
                                    <input 
                                        type="date" 
                                        value={newDueDate}
                                        onChange={(e) => setNewDueDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary transition-all h-[34px]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!newTaskTitle.trim()}
                                className="btn-premium w-full h-14 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
                            >
                                <Plus size={20} />
                                <span>Créer la tâche</span>
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="btn-premium w-full flex items-center justify-center gap-3 h-14 group shadow-xl shadow-primary/20"
                        >
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            </div>
                            <span className="text-xs uppercase tracking-[0.2em] font-black">Ajouter une tâche</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
