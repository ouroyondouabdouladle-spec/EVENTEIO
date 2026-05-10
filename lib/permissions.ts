import type { Profile, UserRole } from '@/types/database';

// ================================================================
// EVENTIO - Système de permissions basé sur les rôles
// ================================================================

/**
 * Vérifie si un utilisateur a le rôle admin.
 */
export function isAdmin(profile: Profile | null): boolean {
    return profile?.role === 'admin';
}

/**
 * Peut modifier les événements (admins uniquement).
 */
export function canEdit(profile: Profile | null): boolean {
    return isAdmin(profile);
}

/**
 * Peut consulter les statistiques (admins uniquement).
 */
export function canViewStats(profile: Profile | null): boolean {
    return isAdmin(profile);
}

/**
 * Peut voir les notes internes d'un événement (admins uniquement).
 */
export function canViewNotes(profile: Profile | null): boolean {
    return isAdmin(profile);
}

/**
 * Peut accéder aux paramètres de l'équipe (admins uniquement).
 */
export function canAccessSettings(profile: Profile | null): boolean {
    return isAdmin(profile);
}

// ================================================================
// Carte des permissions (pour PermissionGate et useUser)
// ================================================================
export type Permission =
    | 'edit'
    | 'view_stats'
    | 'view_notes'
    | 'access_settings';

const PERMISSION_MAP: Record<Permission, (profile: Profile | null) => boolean> = {
    edit: canEdit,
    view_stats: canViewStats,
    view_notes: canViewNotes,
    access_settings: canAccessSettings,
};

/**
 * Vérifie une permission nommée pour un profil donné.
 */
export function hasPermission(
    profile: Profile | null,
    permission: Permission
): boolean {
    const checker = PERMISSION_MAP[permission];
    return checker ? checker(profile) : false;
}

/**
 * Retourne les permissions d'un rôle donné à titre indicatif.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
    if (role === 'admin') {
        return ['edit', 'view_stats', 'view_notes', 'access_settings'];
    }
    // Les membres n'ont pas de permissions spéciales par défaut
    return [];
}
