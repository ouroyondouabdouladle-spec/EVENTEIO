'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';
import { createClient } from '@/lib/supabase';
import {
  hasPermission,
  canEdit,
  canViewStats,
  canViewNotes,
  canAccessSettings,
  type Permission,
} from '@/lib/permissions';

// ================================================================
// Types du contexte
// ================================================================
interface UserContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  // Helpers de permissions
  can: (permission: Permission) => boolean;
  canEdit: () => boolean;
  canViewStats: () => boolean;
  canViewNotes: () => boolean;
  canAccessSettings: () => boolean;
}

// ================================================================
// Création du contexte
// ================================================================
const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  loading: true,
  can: () => false,
  canEdit: () => false,
  canViewStats: () => false,
  canViewNotes: () => false,
  canAccessSettings: () => false,
});

// ================================================================
// Provider à placer dans app/layout.tsx
// ================================================================
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string, retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Si le profil n'existe pas encore (cas fréquent juste après l'inscription)
        // on réessaie une fois après 2 secondes.
        if (error.code === 'PGRST116' && retryCount < 1) {
          setTimeout(() => fetchProfile(userId, retryCount + 1), 2000);
          return;
        }
        console.error('Error fetching profile:', error);
      }
      setProfile(data ?? null);
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      if (retryCount >= 0) {
        setLoading(false);
      }
    }
  }, [supabase]);

  useEffect(() => {
    // Charger la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setLoading(false);
      }
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, supabase.auth]);

  const value: UserContextValue = {
    user,
    profile,
    loading,
    can: (permission: Permission) => hasPermission(profile, permission),
    canEdit: () => canEdit(profile),
    canViewStats: () => canViewStats(profile),
    canViewNotes: () => canViewNotes(profile),
    canAccessSettings: () => canAccessSettings(profile),
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ================================================================
// Hook principal
// ================================================================
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser doit être utilisé à l\'intérieur de <UserProvider>');
  }
  return context;
}
