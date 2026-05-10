'use client';

import type { ReactNode } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import type { Permission } from '@/lib/permissions';

// ================================================================
// Props du composant
// ================================================================
interface PermissionGateProps {
    /** La permission requise pour afficher le contenu */
    permission: Permission;
    /** Contenu à afficher si l'utilisateur a la permission */
    children: ReactNode;
    /** Contenu de remplacement si la permission est refusée (optionnel) */
    fallback?: ReactNode;
}

// ================================================================
// PermissionGate — Affiche ou masque selon les droits de l'utilisateur
// ================================================================
/**
 * Wrapper conditionnel basé sur les permissions.
 *
 * Usage :
 * ```tsx
 * <PermissionGate permission="edit" fallback={<p>Accès refusé</p>}>
 *   <EditButton />
 * </PermissionGate>
 * ```
 */
export default function PermissionGate({
    permission,
    children,
    fallback = null,
}: PermissionGateProps) {
    const { can, loading } = useUser();

    // En attente de chargement : ne pas afficher le contenu ni le fallback
    if (loading) return null;

    return can(permission) ? <>{children}</> : <>{fallback}</>;
}
