'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
    useEffect(() => {
        console.log('--- Diagnostic Supabase ---');
        console.log('URL présente :', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Clé présente :', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        console.log('---------------------------');
    }, []);

    return (
        <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">

            {/* Background Atmosphere */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                {/* Logo Section */}
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/20 mb-8 animate-scale-in">
                    <span className="text-white text-5xl font-black italic tracking-tighter select-none">E</span>
                </div>

                {/* Brand Identity */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <h1 className="text-5xl font-bold tracking-tight mb-3">
                        Event<span className="text-primary">io</span>
                    </h1>
                    <p className="text-muted text-lg font-medium">
                        Gérez. Planifiez. Réussissez.
                    </p>
                </div>

                {/* Primary Actions */}
                <div className="w-full flex flex-col gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <Link 
                        href="/register" 
                        className="btn-premium text-center text-base py-4 hover:scale-[1.02]"
                    >
                        Commencer
                    </Link>
                    <Link 
                        href="/login" 
                        className="text-sm font-medium text-muted hover:text-white transition-all text-center py-2"
                    >
                        Se connecter
                    </Link>
                </div>
            </div>

            {/* Footer Tagline (Optional but fits the vibe) */}
            <div className="absolute bottom-10 text-[10px] uppercase tracking-[0.2em] text-muted/30 font-medium">
                eventio.app
            </div>
        </main>
    );
}
