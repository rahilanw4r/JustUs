
export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-8">
            <div className="max-w-2xl mx-auto space-y-12">
                <a href="/" className="inline-block text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                    ← Back to Home
                </a>

                <div className="space-y-6">
                    <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
                    <p className="text-zinc-500 text-lg leading-relaxed">
                        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
                        <ul className="text-zinc-400 list-disc pl-5 space-y-2">
                            <li><strong>IP Address:</strong> Used temporarily to determine your approximate country for matching. It is not stored permanently.</li>
                            <li><strong>Interests (Tags):</strong> Used to match you with others. Cleared after the session ends.</li>
                            <li><strong>Local Preferences:</strong> Stored on your device (e.g., dark mode settings).</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">2. Video & Audio Data</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            Video and audio streams are transmitted directly between peers (P2P). We do not record, store, or have access to your video calls. It's completely private between you and your match.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">3. Third-Party Services</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            We may use third-party services like Google Analytics or Cloudflare to improve performance and security.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">4. Your Control</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            You can clear your browsing data/cookies at any time to remove local preferences.
                        </p>
                    </section>
                </div>

                <div className="pt-12 border-t border-zinc-900 text-zinc-600 text-sm">
                    JustUs Privacy Team • {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}
