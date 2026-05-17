'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Calendar, FileText, CheckCircle, PlusCircle, Users, Trash } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    time: string;
    isRead: boolean;
    type: 'event' | 'task' | 'supplier' | 'document' | 'general';
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*, events(title), profiles(full_name)')
            .order('created_at', { ascending: false })
            .limit(40);

        if (error) {
            setLoading(false);
            return;
        }

        // Get read/deleted from localStorage safely
        let readIds: string[] = [];
        let deletedIds: string[] = [];
        if (typeof window !== 'undefined') {
            try {
                readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                deletedIds = JSON.parse(localStorage.getItem('deleted_notifications') || '[]');
            } catch (e) {
                console.error("Local storage error:", e);
            }
        }

        const formatted = (data || [])
            .filter((log: any) => !deletedIds.includes(log.id))
            .map((log: any) => {
                const eventTitle = log.events?.title || 'Projet';
                const userName = log.profiles?.full_name || 'Un membre de l\'équipe';
                let title = 'Activité';
                let message = `${userName} a effectué une action.`;
                let type: 'event' | 'task' | 'supplier' | 'document' | 'general' = 'general';

                switch (log.action) {
                    case 'event_created':
                        title = 'Nouveau Projet Créé';
                        message = `${userName} a créé le projet "${eventTitle}".`;
                        type = 'event';
                        break;
                    case 'event_updated':
                        title = 'Projet Mis à Jour';
                        message = `${userName} a modifié les détails du projet "${eventTitle}".`;
                        type = 'event';
                        break;
                    case 'task_created':
                        title = 'Nouvelle Tâche';
                        message = `${userName} a ajouté une tâche au projet "${eventTitle}".`;
                        type = 'task';
                        break;
                    case 'task_updated':
                        title = 'Tâche Mise à Jour';
                        message = `${userName} a mis à jour une tâche du projet "${eventTitle}".`;
                        type = 'task';
                        break;
                    case 'supplier_added':
                        title = 'Nouveau Prestataire';
                        message = `${userName} a ajouté un prestataire au projet "${eventTitle}".`;
                        type = 'supplier';
                        break;
                    case 'document_uploaded':
                        title = 'Nouveau Document';
                        message = `${userName} a ajouté un document au projet "${eventTitle}".`;
                        type = 'document';
                        break;
                }

                // Format time ago or local time
                const date = new Date(log.created_at);
                const timeStr = date.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                return {
                    id: log.id,
                    title,
                    message,
                    time: timeStr,
                    isRead: readIds.includes(log.id),
                    type
                };
            });

        setNotifications(formatted);
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = (id: string) => {
        if (typeof window !== 'undefined') {
            try {
                const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                if (!readIds.includes(id)) {
                    readIds.push(id);
                    localStorage.setItem('read_notifications', JSON.stringify(readIds));
                }
            } catch (e) {
                console.error("Local storage error:", e);
            }
        }

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof window !== 'undefined') {
            try {
                const deletedIds = JSON.parse(localStorage.getItem('deleted_notifications') || '[]');
                if (!deletedIds.includes(id)) {
                    deletedIds.push(id);
                    localStorage.setItem('deleted_notifications', JSON.stringify(deletedIds));
                }
            } catch (e) {
                console.error("Local storage error:", e);
            }
        }

        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleClearAll = () => {
        const allIds = notifications.map(n => n.id);
        if (typeof window !== 'undefined') {
            try {
                const deletedIds = JSON.parse(localStorage.getItem('deleted_notifications') || '[]');
                const updatedDeleted = Array.from(new Set([...deletedIds, ...allIds]));
                localStorage.setItem('deleted_notifications', JSON.stringify(updatedDeleted));
            } catch (e) {
                console.error("Local storage error:", e);
            }
        }
        setNotifications([]);
    };

    const handleMarkAllRead = () => {
        const allIds = notifications.map(n => n.id);
        if (typeof window !== 'undefined') {
            try {
                const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                const updatedRead = Array.from(new Set([...readIds, ...allIds]));
                localStorage.setItem('read_notifications', JSON.stringify(updatedRead));
            } catch (e) {
                console.error("Local storage error:", e);
            }
        }
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) {
        return (
            <main className="p-6 max-w-md mx-auto md:max-w-2xl pb-32 flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
                <p className="text-sm font-semibold text-muted animate-pulse">Chargement de l'activité de l'équipe...</p>
            </main>
        );
    }

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-2xl pb-32">
            <header className="mb-10 flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full animate-pulse shadow-lg shadow-primary/30">
                                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <p className="text-muted text-sm font-semibold opacity-60 mt-2">Restez informé de l'activité en temps réel de votre équipe.</p>
                </div>
                
                {notifications.length > 0 && (
                    <div className="flex items-center gap-3 no-print">
                        <button 
                            onClick={handleMarkAllRead}
                            className="text-xs font-bold text-muted hover:text-white transition-colors"
                        >
                            Tout lire
                        </button>
                        <span className="text-white/10 text-xs">|</span>
                        <button 
                            onClick={handleClearAll}
                            className="text-muted hover:text-red-400 transition-colors flex items-center gap-1.5"
                            title="Tout effacer"
                        >
                            <Trash2 size={16} />
                            <span className="text-xs font-bold">Tout effacer</span>
                        </button>
                    </div>
                )}
            </header>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 animate-fade-in">
                        <span className="text-4xl">🔔</span>
                        <div>
                            <p className="text-sm text-white font-bold">Aucune notification pour le moment</p>
                            <p className="text-xs text-muted font-semibold mt-1">Les actions de votre équipe apparaîtront ici.</p>
                        </div>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div 
                            key={n.id} 
                            onClick={() => handleMarkAsRead(n.id)}
                            className={`card-premium relative overflow-hidden flex gap-5 p-5 cursor-pointer transition-all hover:bg-white/5 ${!n.isRead ? 'border-primary/20 bg-primary/5 hover:border-primary/30' : 'border-white/5'}`}
                        >
                            {!n.isRead && (
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                            )}
                            
                            {/* Dynamic Icon Box */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0 ${
                                n.type === 'document' ? 'bg-blue-500/10 text-blue-400' :
                                n.type === 'task' ? 'bg-orange-500/10 text-orange-400' :
                                n.type === 'supplier' ? 'bg-emerald-500/10 text-emerald-400' :
                                'bg-purple-500/10 text-purple-400'
                            }`}>
                                {n.type === 'document' ? <FileText size={20} /> : 
                                 n.type === 'task' ? <CheckCircle size={20} /> : 
                                 n.type === 'supplier' ? <Users size={20} /> : 
                                 <PlusCircle size={20} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-black text-sm text-white">{n.title}</h4>
                                    <span className="text-[10px] font-bold text-muted opacity-40">{n.time}</span>
                                </div>
                                <p className="text-xs text-muted font-medium leading-relaxed opacity-80">
                                    {n.message}
                                </p>
                            </div>

                            {/* Delete Action */}
                            <button
                                onClick={(e) => handleDelete(n.id, e)}
                                className="text-muted hover:text-red-400 p-2 rounded-xl hover:bg-white/5 transition-colors self-center flex-shrink-0"
                                title="Effacer cette notification"
                            >
                                <Trash size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
