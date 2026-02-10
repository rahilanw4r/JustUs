
export default function TermsPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-8">
            <div className="max-w-2xl mx-auto space-y-12">
                <a href="/" className="inline-block text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                    ← Back to Home
                </a>

                <div className="space-y-6">
                    <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
                    <p className="text-zinc-500 text-lg leading-relaxed">
                        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            By accessing or using the JustUs platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">2. User Conduct</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            You are solely responsible for your conduct and any content you submit. You agree not to harass, bully, or engage in any unlawful activity.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">3. Disclaimers</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            JUSTUS IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. WE ARE NOT LIABLE FOR THE ACTIONS OF OTHER USERS. USE AT YOUR OWN RISK.
                        </p>
                    </section>
                </div>

                <div className="pt-12 border-t border-zinc-900 text-zinc-600 text-sm">
                    JustUs Legal • {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}
