import EventForm from '@/components/EventForm';

export const metadata = {
    title: 'Modifier l\'événement — Eventio',
    description: 'Modifier les informations d\'un événement',
};

interface EditEventPageProps {
    params: { id: string };
}

export default function EditEventPage({ params }: EditEventPageProps) {
    return <EventForm eventId={params.id} />;
}
