'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(
                error.message === 'Invalid login credentials'
                    ? 'Email ou mot de passe incorrect.'
                    : error.message
            );
            setLoading(false);
            return;
        }

        router.push('/dashboard');
        router.refresh();
    }

    return (
        <div className="flex flex-col w-full animate-fade-in px-2">
            {/* Back Button */}
            <header className="mb-12 absolute top-[-60px] left-2">
                <Link href="/" className="group flex items-center gap-2 text-muted hover:text-white transition-colors">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border group-hover:bg-surface-hover transition-all">
                        <ChevronLeft size={20} />
                    </div>
                </Link>
            </header>

            {/* Titles */}
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight mb-3">Bienvenue !</h1>
                <p className="text-muted text-sm font-medium">Connectez-vous à votre compte</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6 mb-10">
                <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-muted/60 ml-1">Email</label>
                    <input
                        type="email"
                        className="input-premium"
                        placeholder="cinar@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-muted/60">Mot de passe</label>
                    </div>
                    <input
                        type="password"
                        className="input-premium"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div className="flex justify-end pr-1">
                        <Link href="/forgot-password" className="text-xs font-bold text-primary/80 hover:text-primary transition-colors">
                            Mot de passe oublié ?
                        </Link>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-shake">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-premium w-full flex items-center justify-center gap-2 py-4 shadow-xl shadow-primary/20"
                    disabled={loading}>
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Connexion...
                        </>
                    ) : 'Se connecter'}
                </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-10">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                </div>
                <span className="relative px-4 bg-background text-[10px] uppercase tracking-[0.2em] text-muted/40 font-black">
                    ou continuer avec
                </span>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-3 gap-4 mb-12">
                <button type="button" className="h-16 flex items-center justify-center rounded-2xl bg-surface border border-border hover:bg-surface-hover transition-all group shadow-sm active:scale-95">
                    {/* Apple Logo SVG */}
                    <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05 1.78-3.41 1.78-1.31 0-1.74-.83-3.26-.83-1.54 0-2.03.81-3.26.81-1.32 0-2.34-.78-3.41-1.78-2.18-2.13-3.33-6.04-3.33-8.82 0-4.39 2.65-6.7 5.17-6.7 1.31 0 2.37.82 3.23.82.83 0 1.95-.82 3.32-.82 1.05 0 3.84.41 5.37 2.65-3.31 1.94-2.77 5.92-.07 7.02-1.07 2.63-2.31 4.96-3.37 5.87zm-4.38-16.71c0-1.63 1.33-2.96 2.96-2.96.14 0 .28.01.42.03-.13 1.73-1.46 3.06-3.09 3.06-.14 0-.28-.01-.42-.03.04-.04.09-.07.13-.1z"/>
                    </svg>
                </button>
                <button type="button" className="h-16 flex items-center justify-center rounded-2xl bg-surface border border-border hover:bg-surface-hover transition-all group shadow-sm active:scale-95">
                    {/* Google Logo SVG */}
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                </button>
                <button type="button" className="h-16 flex items-center justify-center rounded-2xl bg-surface border border-border hover:bg-surface-hover transition-all group shadow-sm active:scale-95">
                    {/* Microsoft Logo SVG */}
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path d="M1 1h10v10H1V1z" fill="#F25022"/>
                        <path d="M13 1h10v10H13V1z" fill="#7FBA00"/>
                        <path d="M1 13h10v10H1V13z" fill="#00A4EF"/>
                        <path d="M13 13h10v10H13V13z" fill="#FFB900"/>
                    </svg>
                </button>
            </div>

            {/* Bottom Link */}
            <p className="text-center text-sm text-muted font-medium">
                Pas encore de compte ?{' '}
                <Link href="/register" className="text-primary font-bold hover:underline underline-offset-4 transition-all">
                    S'inscrire
                </Link>
            </p>
        </div>
    );
}
