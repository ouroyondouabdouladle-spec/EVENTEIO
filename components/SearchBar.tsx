'use client';

interface SearchBarProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}

export default function SearchBar({
    value,
    onChange,
    placeholder = 'Rechercher un événement…',
}: SearchBarProps) {
    return (
        <div className="relative flex-1">
            {/* Icône loupe */}
            <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>

            <input
                id="events-search"
                type="text"
                className="input-field pl-10 pr-4"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
