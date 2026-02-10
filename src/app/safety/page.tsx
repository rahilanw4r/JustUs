
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
                        JustUs is designed for real human connection. To keep this space safe and welcoming, please follow these guidelines.
                    </p>
                </div>

                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">1. Respect Boundaries</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            Treat everyone with respect. Harassment, hate speech, bullying, or any form of abuse is strictly prohibited and will result in an immediate ban.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">2. No Nudity or Explicit Content</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            We have a zero-tolerance policy for nudity, sexual content, or suggestive behavior. Our AI moderation systems and community reports help enforce this.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">3. Report Bad Behavior</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            If you encounter someone violating these rules, use the "Report" button immediately. This helps us remove bad actors from the platform.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">4. Protect Your Privacy</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            Do not share personal information like your address, phone number, or financial details with strangers. Stay safe.
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
