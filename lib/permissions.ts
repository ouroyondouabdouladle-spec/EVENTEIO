import type { Profile, UserRole } from '@/types/database';

// ================================================================
// EVENTIO - Système de permissions basé sur les rôles et modules
// ================================================================

/**
 * Vérifie si un utilisateur a le rôle admin.
 */
export function isAdmin(profile: Profile | null): boolean {
    return profile?.role === 'admin';
}

/**
 * Peut modifier les événements (admins uniquement par défaut, ou selon besoins futurs).
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

// --- PERMISSIONS DES MODULES ---

function checkModuleAccess(profile: Profile | null, moduleName: string): boolean {
    if (isAdmin(profile)) return true; // Admin voit tout
    if (!profile) return false;
    // Si la colonne JSONB n'est pas encore définie, on donne l'accès par défaut (true)
    if (!profile.module_permissions) return true;
    // Vérifie si la permission est explicitement à false
    return profile.module_permissions[moduleName] !== false;
}

export function canViewEvents(profile: Profile | null): boolean { return checkModuleAccess(profile, 'events'); }
export function canViewCalendar(profile: Profile | null): boolean { return checkModuleAccess(profile, 'calendar'); }
export function canViewTasks(profile: Profile | null): boolean { return checkModuleAccess(profile, 'tasks'); }
export function canViewSuppliers(profile: Profile | null): boolean { return checkModuleAccess(profile, 'suppliers'); }
export function canViewContacts(profile: Profile | null): boolean { return checkModuleAccess(profile, 'contacts'); }
export function canViewFiles(profile: Profile | null): boolean { return checkModuleAccess(profile, 'files'); }

// ================================================================
// Carte des permissions (pour PermissionGate et useUser)
// ================================================================
export type Permission =
    | 'edit'
    | 'view_stats'
    | 'view_notes'
    | 'access_settings'
    | 'view_events'
    | 'view_calendar'
    | 'view_tasks'
    | 'view_suppliers'
    | 'view_contacts'
    | 'view_files';

const PERMISSION_MAP: Record<Permission, (profile: Profile | null) => boolean> = {
    edit: canEdit,
    view_stats: canViewStats,
    view_notes: canViewNotes,
    access_settings: canAccessSettings,
    view_events: canViewEvents,
    view_calendar: canViewCalendar,
    view_tasks: canViewTasks,
    view_suppliers: canViewSuppliers,
    view_contacts: canViewContacts,
    view_files: canViewFiles,
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
        return [
            'edit', 'view_stats', 'view_notes', 'access_settings',
            'view_events', 'view_calendar', 'view_tasks', 'view_suppliers', 'view_contacts', 'view_files'
        ];
    }
    // Pour un membre, ça dépend des permissions JSON, donc on ne peut pas les lister statiquement ici.
    return [];
}
