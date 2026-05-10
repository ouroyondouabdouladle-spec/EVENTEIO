'use client';

import React, { useState } from 'react';
import { 
    BookOpen, 
    ChevronDown, 
    Users, 
    Shield, 
    FileText, 
    Calendar, 
    CreditCard,
    Search
} from 'lucide-react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface GuideItem {
    id: string;
    question: string;
    answer: React.ReactNode;
    icon: any;
}

const GUIDE_DATA: GuideItem[] = [
    {
        id: 'team',
        icon: Users,
        question: "Comment inviter mes collaborateurs dans l'équipe ?",
        answer: (
            <div className="space-y-2">
                <p>Eventio fonctionne avec un système de <strong>Code d'invitation secret</strong> hautement sécurisé.</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
                    <li>Allez dans les <strong>Paramètres</strong> (depuis votre Profil).</li>
                    <li>Copiez le "Code d'invitation" généré pour votre agence.</li>
                    <li>Envoyez ce code à votre collaborateur.</li>
                    <li>Lorsqu'il créera son compte (ou se connectera), il devra cliquer sur <strong>Rejoindre une équipe</strong> et y coller ce code.</li>
                </ol>
            </div>
        )
    },
    {
        id: 'admin',
        icon: Shield,
        question: "Quelle est la différence entre un Admin et un Membre ?",
        answer: (
            <p>
                Le statut <strong>Administrateur</strong> est attribué au créateur de l'équipe. <br/><br/>
                L'Admin a le droit exclusif de modifier le nom de l'agence, d'accéder au code d'invitation, et de retirer des membres de l'équipe. Un <strong>Membre</strong> a accès à tous les événements et fichiers, mais ne peut pas gérer les paramètres de l'agence.
            </p>
        )
    },
    {
        id: 'events',
        icon: Calendar,
        question: "Comment bien configurer un nouvel événement ?",
        answer: (
            <div className="space-y-2">
                <p>Pour un suivi optimal, remplissez un maximum d'informations dès la création :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Indiquez les contacts des clients (Monsieur / Madame) pour un accès rapide depuis l'événement.</li>
                    <li>Remplissez la partie financière (Budget, Acompte) pour suivre l'état de facturation.</li>
                    <li>Une fois l'événement créé, utilisez les onglets pour ajouter des Tâches, Fournisseurs et Documents.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'docs',
        icon: FileText,
        question: "Comment stocker et partager des documents ?",
        answer: (
            <p>
                Dans la page de n'importe quel événement, allez dans l'onglet <strong>Documents</strong>. Cliquez sur "Ajouter un fichier" pour uploader un PDF, une image ou tout autre document de travail.<br/><br/>
                Tous ces fichiers sont sauvegardés de manière sécurisée et centralisée. Vous pouvez retrouver la totalité de vos fichiers dans le menu principal <strong>Docs & fichiers</strong>.
            </p>
        )
    },
    {
        id: 'finance',
        icon: CreditCard,
        question: "Comment suivre les paiements ?",
        answer: (
            <p>
                Le suivi des paiements se fait au niveau de chaque événement. Vous pouvez définir le <strong>Budget total</strong> et l'<strong>Acompte reçu</strong>. Modifiez le statut (Non payé, Acompte reçu, Payé) pour avoir un coup d'œil rapide sur la santé financière de vos projets depuis la liste des événements.
            </p>
        )
    }
];

export default function GuidePage() {
    const [openId, setOpenId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleItem = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    const filteredGuide = GUIDE_DATA.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (typeof item.answer === 'string' && item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <main className="p-6 animate-fade-in max-w-md mx-auto md:max-w-2xl pb-32">
            {/* Header */}
            <header className="mb-8">
                <Link href="/dashboard/profile" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all mb-6">
                    <ChevronLeft size={20} />
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                        <BookOpen size={24} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Guide & Aide</h1>
                </div>
                <p className="text-muted text-sm font-semibold opacity-80">Tout ce que vous devez savoir pour maîtriser Eventio.</p>
            </header>

            {/* Search */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher une réponse..." 
                    className="input-premium pl-12 h-14"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-4">
                {filteredGuide.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-muted font-bold opacity-60">Aucune réponse trouvée pour cette recherche.</p>
                    </div>
                ) : (
                    filteredGuide.map((item) => {
                        const isOpen = openId === item.id;
                        return (
                            <div 
                                key={item.id} 
                                className={`card-premium overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary/40 shadow-lg shadow-primary/10' : 'hover:border-white/20'}`}
                            >
                                <button 
                                    onClick={() => toggleItem(item.id)}
                                    className="w-full p-5 flex items-center justify-between text-left gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isOpen ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted'}`}>
                                            <item.icon size={20} />
                                        </div>
                                        <h3 className={`font-black text-sm transition-colors ${isOpen ? 'text-white' : 'text-white/80'}`}>
                                            {item.question}
                                        </h3>
                                    </div>
                                    <ChevronDown 
                                        size={20} 
                                        className={`text-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
                                    />
                                </button>
                                
                                <div 
                                    className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="px-5 pb-5 pt-0 text-sm text-muted leading-relaxed font-medium ml-14">
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="mt-12 p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center">
                <h4 className="font-black text-white mb-2">Toujours bloqué ?</h4>
                <p className="text-sm text-muted mb-4 font-medium">Contactez l'assistance technique pour une aide personnalisée.</p>
                <a href="mailto:support@eventio.app" className="btn-premium inline-flex py-3 px-6 text-xs">
                    Contacter le support
                </a>
            </div>
        </main>
    );
}
