'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import type { Document } from '@/types/database';
import { 
    ChevronRight, Folder, FileText, ChevronLeft, Plus, 
    Search, X, Trash2, ExternalLink, Link as LinkIcon, 
    FileCode, Image as ImageIcon, FileCheck, Loader2, Upload
} from 'lucide-react';

interface TabDocumentsProps {
    eventId: string;
}

type FolderType = 'contrats' | 'devis' | 'plans' | 'photos' | 'autres';

const FOLDER_CONFIG: Record<FolderType, { label: string; color: string; bg: string; icon: any }> = {
    contrats: { label: 'Contrats', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: FileCheck },
    devis: { label: 'Devis', color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: FileText },
    plans: { label: 'Plans & Logistique', color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: FileCode },
    photos: { label: 'Photos & Inspi', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: ImageIcon },
    autres: { label: 'Autres fichiers', color: 'text-muted', bg: 'bg-white/5', icon: Folder }
};

export default function TabDocuments({ eventId }: TabDocumentsProps) {
    const [docs, setDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // New Doc Form State
    const [newName, setNewName] = useState('');
    const [newFile, setNewFile] = useState<File | null>(null);
    const [newType, setNewType] = useState<FolderType>('autres');
    const [isUploading, setIsUploading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchDocs();
    }, [eventId]);

    const fetchDocs = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (!error && data) setDocs(data);
        setLoading(false);
    };

    const addDoc = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newFile) return;

        setIsUploading(true);
        const supabase = createClient();

        try {
            // 1. Générer un nom unique pour le fichier
            const fileExt = newFile.name.split('.').pop();
            const fileName = `${eventId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            // 2. Uploader le fichier dans le bucket "documents"
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, newFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 3. Récupérer l'URL publique
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            // 4. Sauvegarder dans la base de données
            const { data, error: dbError } = await supabase
                .from('documents')
                .insert({
                    event_id: eventId,
                    name: newName.trim(),
                    url: publicUrl,
                    type: newType
                })
                .select()
                .single();

            if (dbError) throw dbError;

            if (data) {
                setDocs([data, ...docs]);
                resetForm();
            }
        } catch (error: any) {
            console.error("Erreur lors de l'upload:", error.message);
            alert("Erreur lors de l'upload du fichier.");
        } finally {
            setIsUploading(false);
        }
    };

    const deleteDoc = async (doc: Document) => {
        if (!window.confirm("Supprimer définitivement ce fichier ?")) return;
        
        const supabase = createClient();
        
        // 1. Tenter de supprimer le fichier du bucket si c'est un fichier hébergé sur notre Supabase
        if (doc.url.includes('/storage/v1/object/public/documents/')) {
            const filePath = doc.url.split('/storage/v1/object/public/documents/')[1];
            if (filePath) {
                // On ne bloque pas si l'effacement du storage échoue (ex: déjà effacé)
                await supabase.storage.from('documents').remove([filePath]);
            }
        }

        // 2. Supprimer la ligne en base de données
        const { error } = await supabase.from('documents').delete().eq('id', doc.id);
        if (!error) {
            setDocs(docs.filter(d => d.id !== doc.id));
        }
    };

    const resetForm = () => {
        setNewName('');
        setNewFile(null);
        setNewType('autres');
        setIsAdding(false);
    };

    const folders = useMemo(() => {
        const categories: Record<FolderType, Document[]> = {
            contrats: [], devis: [], plans: [], photos: [], autres: []
        };
        docs.forEach(doc => {
            const type = doc.type?.toLowerCase() as FolderType;
            if (categories[type]) categories[type].push(doc);
            else categories.autres.push(doc);
        });
        return categories;
    }, [docs]);

    const filteredDocs = useMemo(() => {
        if (!selectedFolder) return [];
        return folders[selectedFolder].filter(d => 
            d.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [folders, selectedFolder, searchQuery]);

    if (loading) return <div className="py-20 text-center animate-pulse text-muted">Chargement des documents...</div>;

    if (selectedFolder) {
        return (
            <div className="animate-fade-in pb-40">
                <button 
                    onClick={() => setSelectedFolder(null)}
                    className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-widest text-muted hover:text-white transition-colors"
                >
                    <ChevronLeft size={14} />
                    Retour aux dossiers
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${FOLDER_CONFIG[selectedFolder].bg} ${FOLDER_CONFIG[selectedFolder].color}`}>
                        <Folder size={28} fill="currentColor" className="opacity-40" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black">{FOLDER_CONFIG[selectedFolder].label}</h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                            {folders[selectedFolder].length} fichier{folders[selectedFolder].length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input 
                        type="text" 
                        placeholder="Rechercher dans ce dossier..." 
                        className="input-premium pl-12 h-12 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    {filteredDocs.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                            <p className="text-xs text-muted font-bold opacity-60">Dossier vide.</p>
                        </div>
                    ) : (
                        filteredDocs.map(doc => (
                            <div key={doc.id} className="card-premium flex items-center gap-4 group transition-all hover:translate-x-1">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted group-hover:text-primary transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black truncate">{doc.name}</p>
                                    <p className="text-[9px] font-bold text-muted mt-0.5 opacity-60">
                                        Ajouté le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => deleteDoc(doc)} className="p-2 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                    <a 
                                        href={doc.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 text-muted hover:text-white"
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Floating Add Button for Folder View */}
                <div className="fixed bottom-24 left-0 right-0 px-6 z-40 pointer-events-none">
                    <div className="max-w-md mx-auto md:max-w-2xl pointer-events-auto">
                        {!isAdding && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="btn-premium w-full flex items-center justify-center gap-3 h-14 group shadow-xl shadow-primary/20"
                            >
                                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                                <span className="text-xs uppercase tracking-[0.2em] font-black">Ajouter un fichier</span>
                            </button>
                        )}
                    </div>
                </div>

                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-6 bg-background/60 backdrop-blur-sm">
                        <div className="w-full max-w-md bg-[#1A1A1A] border border-white/10 p-6 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300">
                             <div className="flex items-center justify-between mb-6">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Nouveau Document</h4>
                                <button onClick={resetForm} className="text-muted hover:text-white"><X size={20}/></button>
                            </div>
                            <form onSubmit={addDoc} className="space-y-4">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Nom descriptif..."
                                    className="input-premium h-14"
                                />
                                
                                <div 
                                    className="relative flex items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer overflow-hidden"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input 
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setNewFile(e.target.files[0]);
                                                // Pré-remplir le nom si vide
                                                if (!newName) {
                                                    setNewName(e.target.files[0].name.split('.')[0]);
                                                }
                                            }
                                        }}
                                    />
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted">
                                        <Upload size={24} className={newFile ? 'text-primary' : ''} />
                                        <p className="text-xs font-bold px-4 text-center truncate w-full">
                                            {newFile ? newFile.name : "Cliquez pour uploader un fichier"}
                                        </p>
                                    </div>
                                </div>

                                <select 
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as FolderType)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 h-14 text-sm font-bold text-white outline-none focus:border-primary transition-all appearance-none"
                                >
                                    {Object.entries(FOLDER_CONFIG).map(([val, cfg]) => (
                                        <option key={val} value={val} className="bg-[#1A1A1A] text-white">{cfg.label}</option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    disabled={!newName.trim() || !newFile || isUploading}
                                    className="btn-premium w-full h-14 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Upload en cours...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={20} />
                                            <span>Uploader le fichier</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-40">
            <div className="grid grid-cols-1 gap-4">
                {(Object.keys(FOLDER_CONFIG) as FolderType[]).map(type => {
                    const cfg = FOLDER_CONFIG[type];
                    const Icon = cfg.icon;
                    return (
                        <button
                            key={type}
                            onClick={() => setSelectedFolder(type)}
                            className="card-premium group flex items-center gap-5 p-5 hover:translate-x-1 transition-all"
                        >
                            <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-all group-hover:scale-110 ${cfg.bg} ${cfg.color}`}>
                                <Icon size={28} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 text-left">
                                <h4 className="text-sm font-black text-white group-hover:text-primary transition-colors">{cfg.label}</h4>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5 opacity-60">
                                    {folders[type].length} fichier{folders[type].length > 1 ? 's' : ''}
                                </p>
                            </div>
                            <ChevronRight className="text-muted group-hover:text-white transition-all opacity-40 group-hover:opacity-100" size={20} />
                        </button>
                    );
                })}
            </div>

            {/* Floating Add Button for Main View */}
            <div className="fixed bottom-24 left-0 right-0 px-6 z-40 pointer-events-none">
                <div className="max-w-md mx-auto md:max-w-2xl pointer-events-auto">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn-premium w-full flex items-center justify-center gap-3 h-14 group shadow-xl shadow-primary/20"
                    >
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        </div>
                        <span className="text-xs uppercase tracking-[0.2em] font-black">Ajouter un fichier</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-6 bg-background/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-[#1A1A1A] border border-white/10 p-6 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300">
                         <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary">Nouveau Document</h4>
                            <button onClick={resetForm} className="text-muted hover:text-white"><X size={20}/></button>
                        </div>
                        <form onSubmit={addDoc} className="space-y-4">
                            <input
                                autoFocus
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Nom descriptif..."
                                className="input-premium h-14"
                            />
                            
                            <div 
                                className="relative flex items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer overflow-hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setNewFile(e.target.files[0]);
                                            // Pré-remplir le nom si vide
                                            if (!newName) {
                                                setNewName(e.target.files[0].name.split('.')[0]);
                                            }
                                        }
                                    }}
                                />
                                <div className="flex flex-col items-center justify-center gap-2 text-muted">
                                    <Upload size={24} className={newFile ? 'text-primary' : ''} />
                                    <p className="text-xs font-bold px-4 text-center truncate w-full">
                                        {newFile ? newFile.name : "Cliquez pour uploader un fichier"}
                                    </p>
                                </div>
                            </div>

                            <select 
                                value={newType}
                                onChange={(e) => setNewType(e.target.value as FolderType)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 h-14 text-sm font-bold text-white outline-none focus:border-primary transition-all appearance-none"
                            >
                                {Object.entries(FOLDER_CONFIG).map(([val, cfg]) => (
                                    <option key={val} value={val} className="bg-[#1A1A1A] text-white">{cfg.label}</option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                disabled={!newName.trim() || !newFile || isUploading}
                                className="btn-premium w-full h-14 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Upload en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        <span>Uploader le fichier</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
