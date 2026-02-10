"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Video, Zap, Hash, Globe, HelpCircle, X, Shield, Sparkles } from 'lucide-react';

export default function Home() {
    const router = useRouter();
    const [interest, setInterest] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [showInterests, setShowInterests] = useState(false);
    const [country, setCountry] = useState('Global');
    const [showAbout, setShowAbout] = useState(false);

    useEffect(() => {
        // Auto-detect country via IP
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
                if (data.country_code) {
                    setCountry(data.country_code);
                }
            })
            .catch(err => console.error("IP Fetch failed:", err));
    }, []);

    const addTag = () => {
        if (interest && !tags.includes(interest)) {
            setTags([...tags, interest]);
            setInterest('');
        }
    };

    const startChat = () => {
        const params = new URLSearchParams();
        if (tags.length > 0) params.append('tags', tags.join(','));
        if (country !== 'Global') params.append('country', country);
        router.push(`/chat?${params.toString()}`);
    };

    const startTextChat = () => {
        const params = new URLSearchParams();
        params.append('mode', 'text');
        if (tags.length > 0) params.append('tags', tags.join(','));
        if (country !== 'Global') params.append('country', country);
        router.push(`/chat?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 md:p-6 font-sans relative overflow-x-hidden">

            {/* Subtle Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            {/* Info Button - Fixed Top Right */}
            <button
                onClick={() => setShowAbout(true)}
                className="absolute top-6 right-6 md:top-10 md:right-10 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all z-40 group"
            >
                <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
            </button>

            {/* About Modal Overlay */}
            {showAbout && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowAbout(false)} />
                    <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative z-[101] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <button onClick={() => setShowAbout(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>

                        <div className="space-y-6">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-black">
                                <Sparkles size={24} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-2xl font-semibold tracking-tight">What is JustUs?</h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    JustUs is a minimal, luxury space for connecting with real people instantly. No profiles, no scrolling, and no noise.
                                </p>
                                <p className="text-zinc-400 leading-relaxed">
                                    We use global signals to match you with someone who shares your vibe. Whether it's a deep conversation or a quick laugh, it's curated for quality.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                                    <Shield size={16} className="text-emerald-500" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Privacy First</p>
                                    <p className="text-[11px] text-zinc-400 leading-snug">Encrypted p2p streams. No data storage.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                                    <Globe size={16} className="text-blue-500" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Global Reach</p>
                                    <p className="text-[11px] text-zinc-400 leading-snug">Connect with 150+ countries instantly.</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAbout(false)}
                                className="w-full h-12 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 active:scale-[0.98]"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="z-10 w-full max-w-xl space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">

                {/* Header */}
                <div className="space-y-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-medium tracking-widest uppercase text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live Beta
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight text-white mb-2">
                        JustUs.
                    </h1>
                    <p className="text-zinc-500 text-lg font-normal leading-relaxed max-w-sm mx-auto">
                        A minimal space for <br /> real human connection.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1 shadow-2xl shadow-black/50">
                    <div className="bg-zinc-950 rounded-xl border border-zinc-800/50 p-6 space-y-6">

                        {/* Inputs */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Region</label>
                                    <select
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-4 py-3 text-sm focus:border-zinc-600 focus:bg-zinc-800 outline-none transition-all appearance-none"
                                    >
                                        <option value="Global">Global</option>
                                        <option value="US">United States</option>
                                        <option value="IN">India</option>
                                        <option value="GB">United Kingdom</option>
                                        <option value="CA">Canada</option>
                                        <option value="AU">Australia</option>
                                        <option value="DE">Germany</option>
                                        <option value="JP">Japan</option>
                                        <option value="BR">Brazil</option>
                                        <option value="KR">South Korea</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Select Vibe (Max 3)</label>

                                    {tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pb-2">
                                            {tags.map(tag => (
                                                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-bold shadow-sm animate-in fade-in zoom-in duration-200">
                                                    {tag}
                                                    <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-500 transition-colors">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {showInterests ? (
                                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {[
                                                    '🎵 Music', '🎮 Gaming', '💬 Chill', '❤️ Dating',
                                                    '🎬 Movies', '💻 Tech', '🎨 Art', '⚽ Sports',
                                                    '✈️ Travel', '📚 Books', '😂 Memes', '🍲 Food',
                                                    '👗 Fashion', '💃 Dance', '🐕 Pets', '🧘 Yoga'
                                                ].map((tag) => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => {
                                                            const cleanTag = tag.split(' ')[1];
                                                            if (!tags.includes(cleanTag) && tags.length < 3) {
                                                                setTags([...tags, cleanTag]);
                                                            }
                                                        }}
                                                        disabled={tags.includes(tag.split(' ')[1])}
                                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-left flex items-center gap-2
                                                            ${tags.includes(tag.split(' ')[1])
                                                                ? 'bg-zinc-800 text-zinc-500 cursor-default opacity-50'
                                                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-800'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setShowInterests(false)}
                                                className="w-full py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 font-medium hover:text-white hover:bg-zinc-800 transition-all"
                                            >
                                                Done / Close
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowInterests(true)}
                                            className="w-full py-3 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-lg text-sm text-zinc-500 font-medium hover:text-white hover:border-zinc-600 hover:bg-zinc-900 transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white transition-colors">+</div>
                                            Select Vibe
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-900 w-full" />

                        <div className="flex gap-3">
                            <button
                                onClick={startChat}
                                className="flex-1 bg-white text-black hover:bg-zinc-200 h-12 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5 active:scale-[0.98]"
                            >
                                Start Video
                            </button>
                            <button
                                onClick={startTextChat}
                                className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 h-12 rounded-lg font-medium text-sm transition-all active:scale-[0.98]"
                            >
                                Text Only
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-6 text-zinc-600 text-xs font-medium tracking-wide">
                    <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
                    <span>•</span>
                    <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
                    <span>•</span>
                    <button onClick={() => setShowAbout(true)} className="hover:text-zinc-400 transition-colors underline underline-offset-4 decoration-zinc-800">Learn More</button>
                </div>
            </div>
        </div>
    );
}
