import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/hooks/useUser";

export const metadata: Metadata = {
    title: "Eventio — Gérez. Planifiez. Réussissez.",
    description: "Application de gestion d'événements premium pour les professionnels.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
            <body className="antialiased">
                <UserProvider>{children}</UserProvider>
            </body>
        </html>
    );
}
