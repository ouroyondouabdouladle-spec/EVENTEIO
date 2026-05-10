import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// ================================================================
// Variables d'environnement
// ================================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing in environment variables!');
}

// ================================================================
// Client Navigateur (Browser Client)
// À utiliser dans les Composants Client ('use client')
// ================================================================
export function createClient() {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
