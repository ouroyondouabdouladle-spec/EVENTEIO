'use client';

import React from 'react';
import { Bell, Check, Trash2, Calendar } from 'lucide-react';

export default function NotificationsPage() {
    // Mock notifications for now
    const notifications = [
        {
            id: '1',
            title: 'Nouveau document',
            message: 'Un nouveau contrat a été ajouté au projet "Mariage Sarah & Marc".',
            time: 'Il y a 10 min',
            isRead: false,
            type: 'document'
        },
        {
            id: '2',
            title: 'Tâche assignée',
            message: 'Vous avez été assigné à la tâche "Réserver le traiteur".',
            time: 'Il y a 2 heures',
            isRead: true,
            type: 'task'
        },
        {
            id: '3',
            title: 'Événement proche',
            message: 'Le "Festival d\'été" commence dans 3 jours.',
            time: 'Hier',
            isRead: true,
            type: 'event'
        }
    ];

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-2xl pb-32">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Notifications</h1>
                    <p className="text-muted text-sm font-semibold opacity-60">Restez informé de l'activité de vos projets.</p>
                </div>
                <button className="text-muted hover:text-white transition-colors">
                    <Trash2 size={20} />
                </button>
            </header>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <p className="text-sm text-muted font-bold opacity-60">Aucune notification.</p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div 
                            key={n.id} 
                            className={`card-premium relative overflow-hidden flex gap-5 p-6 ${!n.isRead ? 'border-primary/30 bg-primary/5' : ''}`}
                        >
                            {!n.isRead && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            )}
                            
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                                n.type === 'document' ? 'bg-blue-500/10 text-blue-500' :
                                n.type === 'task' ? 'bg-orange-500/10 text-orange-500' :
                                'bg-purple-500/10 text-purple-500'
                            }`}>
                                {n.type === 'document' ? <Check size={24} /> : 
                                 n.type === 'task' ? <Check size={24} /> : 
                                 <Calendar size={24} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-black text-sm">{n.title}</h4>
                                    <span className="text-[10px] font-bold text-muted opacity-40">{n.time}</span>
                                </div>
                                <p className="text-xs text-muted font-medium leading-relaxed opacity-80">
                                    {n.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
