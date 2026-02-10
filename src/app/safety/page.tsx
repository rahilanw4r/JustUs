
export default function SafetyPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-8">
            <div className="max-w-2xl mx-auto space-y-12">
                <a href="/" className="inline-block text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                    ← Back to Home
                </a>

                <div className="space-y-6">
                    <h1 className="text-4xl font-bold tracking-tight">Community Safety</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        To keep this space safe, please follow these guidelines.
                    </p>
                </div>

                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">1. Respect</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            Treat everyone with respect. Harassment results in an immediate ban.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">2. Content</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            No nudity or sexual content.
                        </p>
                    </section>
                </div>

                <div className="pt-12 border-t border-zinc-900 text-zinc-600 text-sm">
                    JustUs Safety Team • {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}
