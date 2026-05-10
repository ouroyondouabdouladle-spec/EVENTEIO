export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12 relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
                {children}
            </div>
        </div>
    );
}
