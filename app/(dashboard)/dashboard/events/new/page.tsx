'use client';

import EventForm from '@/components/EventForm';
import { useUser } from '@/lib/hooks/useUser';
import TeamSetup from '@/components/layout/TeamSetup';

export default function NewEventPage() {
    const { profile, loading } = useUser();

    if (loading) return null;
    if (profile && !profile.team_id) return <TeamSetup />;

    return <EventForm />;
}
