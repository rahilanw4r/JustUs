"use client";
import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import SimplePeer, { Instance as PeerInstance } from 'simple-peer';
import { Mic, MicOff, Video, VideoOff, Send, SkipForward, AlertTriangle, Globe, Zap } from 'lucide-react';

if (typeof window !== 'undefined') {
    (window as any).global = window;
    (window as any).process = { env: { DEBUG: undefined }, version: '' };
    (window as any).Buffer = require('buffer').Buffer;
}

let socket: Socket;

function ChatRoomContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [faceLight, setFaceLight] = useState(false);
    const tagsParam = searchParams.get('tags');
    const userInterests = tagsParam ? tagsParam.split(',') : [];
    const isTextMode = searchParams.get('mode') === 'text';
    const userCountry = searchParams.get('country') || 'Global';

    // State
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [messages, setMessages] = useState<{ sender: 'me' | 'them', content: string }[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const [status, setStatus] = useState(isTextMode ? 'Connecting Text Mode...' : 'Initializing Media...');
    const [micOn, setMicOn] = useState(true);

    // Refs
    const myVideo = useRef<HTMLVideoElement>(null);
    const peerVideo = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<PeerInstance | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Main Init Effect
    useEffect(() => {
        let localStream: MediaStream | null = null;

        const startChat = async () => {
            try {
                // 1. Get Media (VIDEO MODE ONLY)
                if (!isTextMode) {
                    setStatus('Requesting Camera...');
                    try {
                        // Request high quality video with a robust fallback
                        localStream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                width: { min: 640, ideal: 1280 },
                                height: { min: 480, ideal: 720 },
                                frameRate: { ideal: 30 }
                            },
                            audio: true
                        });
                        setStream(localStream);
                        if (myVideo.current) {
                            myVideo.current.srcObject = localStream;
                            myVideo.current.muted = true;
                        }
                    } catch (e: any) {
                        console.error("Camera denied:", e);
                        setStatus('Camera Denied. Switch to Text Mode?');
                        return;
                    }
                } else {
                    setStatus('Text Mode: Connecting...');
                }

                // 2. Connect Socket
                const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
                console.log('Connecting to Signaling Server:', socketUrl);

                socket = io(socketUrl, {
                    transports: ['websocket'],
                    reconnection: true
                });
                socketRef.current = socket;

                // 3. Socket Events
                socket.on('connect', () => {
                    setStatus(`Searching in ${userCountry}...`);
                    socket.emit('join_queue', { interests: userInterests, country: userCountry, mode: isTextMode ? 'text' : 'video' });
                });

                socket.on('match_found', (data: { partnerId: string, initiator: boolean, matchType?: string }) => {
                    setStatus(data.matchType ? `Matched: ${data.matchType}` : 'Match Found!');
                    setPartnerId(data.partnerId);

                    // 4. Init Peer Connection (VIDEO MODE ONLY)
                    if (!isTextMode) {
                        const peer = new SimplePeer({
                            initiator: data.initiator,
                            trickle: true,
                            stream: localStream || undefined,
                            config: {
                                iceServers: [
                                    { urls: 'stun:stun.l.google.com:19302' },
                                    { urls: 'stun:stun1.l.google.com:19302' },
                                    { urls: 'stun:stun2.l.google.com:19302' },
                                    { urls: 'stun:stun3.l.google.com:19302' },
                                    { urls: 'stun:stun4.l.google.com:19302' },
                                    { urls: 'stun:global.stun.twilio.com:3478' },
                                ]
                            }
                        });

                        peer.on('signal', (signal) => {
                            if (socket.connected) {
                                socket.emit('signal', { target: data.partnerId, signal });
                            }
                        });

                        peer.on('stream', (rStream) => {
                            console.log('Remote stream received');
                            setRemoteStream(rStream);
                            if (peerVideo.current) {
                                peerVideo.current.srcObject = rStream;
                            }
                            setStatus('Connected');
                        });

                        peer.on('connect', () => {
                            console.log('Peer-to-peer connection established');
                            setStatus('Connected');
                        });

                        peer.on('error', err => {
                            console.error('Peer connection error:', err);
                            // Only skip if we were actually trying to connect
                            if (status !== 'Connected') {
                                setStatus('Connection Failed. Retrying...');
                                setTimeout(nextPartner, 2000);
                            }
                        });
                        peerRef.current = peer;
                    } else {
                        setStatus('Connected (Text Only)');
                    }
                });

                socket.on('signal', (data) => {
                    // Critical: Ensure the peer exists and is the correct one
                    try {
                        if (peerRef.current && !peerRef.current.destroyed) {
                            peerRef.current.signal(data.signal);
                        }
                    } catch (e) {
                        console.warn("Signal error (likely normal during skip):", e);
                    }
                });

                socket.on('receive_message', (data) => {
                    setMessages(prev => [...prev, { sender: 'them', content: data.content }]);
                });

                socket.on('partner_left', () => {
                    handlePartnerDisconnect();
                });

            } catch (err: any) {
                console.error("Setup Error:", err);
                setStatus(`Error: ${err.message}`);
            }
        };

        startChat();

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (socketRef.current) socketRef.current.disconnect();
            if (peerRef.current) peerRef.current.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTextMode]);

    const handlePartnerDisconnect = () => {
        setStatus('Partner Left. Searching...');
        setRemoteStream(null);
        setPartnerId(null);
        setMessages([]);
        if (peerRef.current) peerRef.current.destroy();
        peerRef.current = null;

        setTimeout(() => {
            socketRef.current?.emit('join_queue', { interests: userInterests, country: userCountry, mode: isTextMode ? 'text' : 'video' });
        }, 1500);
    };

    const nextPartner = () => {
        if (peerRef.current) peerRef.current.destroy();
        setRemoteStream(null);
        setPartnerId(null);
        setMessages([]);
        setStatus('Skipping...');

        socketRef.current?.emit('leave_chat');
        setTimeout(() => {
            socketRef.current?.emit('join_queue', { interests: userInterests, country: userCountry, mode: isTextMode ? 'text' : 'video' });
        }, 500);
    };

    const sendMessage = () => {
        if (!msgInput.trim()) return;
        socketRef.current?.emit('send_message', { content: msgInput });
        setMessages(prev => [...prev, { sender: 'me', content: msgInput }]);
        setMsgInput('');
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicOn(audioTrack.enabled);
            }
        }
    };

    // Skip on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                nextPartner();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextPartner]);

    return (
        <div className="h-screen h-[100dvh] bg-zinc-950 text-zinc-200 flex flex-col font-sans selection:bg-white selection:text-black relative overflow-hidden">

            {/* Face Light Overlay - Acts as a soft light source */}
            {faceLight && (
                <div className="absolute inset-0 pointer-events-none z-40 bg-white/10 mix-blend-overlay border-[50px] border-white/90 shadow-[inset_0_0_100px_rgba(255,255,255,0.5)] animate-in fade-in duration-700" />
            )}

            {/* Minimal Header */}
            <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-sm z-50">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg tracking-tight text-white">JustUs.</span>
                    <div className="h-4 w-px bg-zinc-800" />
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'Connected' ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                        {status}
                    </span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setFaceLight(!faceLight)}
                        className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${faceLight ? 'text-yellow-200 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                        {faceLight ? <Zap size={14} fill="currentColor" /> : <Zap size={14} />} {faceLight ? 'Light On' : 'Light Off'}
                    </button>
                    <button onClick={() => window.location.href = '/'} className="text-xs font-medium text-zinc-500 hover:text-white transition-colors">
                        Exit
                    </button>
                </div>
            </div>

            {/* Split View - Cinematic Cards */}
            <div className={`flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-10 min-h-0 bg-zinc-950 ${isTextMode ? 'hidden' : ''}`}>

                {/* Local - Preview */}
                <div className="relative rounded-[2rem] md:rounded-[3.5rem] overflow-hidden bg-zinc-900 shadow-2xl border border-white/5 ring-1 ring-white/10 group">
                    <video ref={myVideo} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] opacity-60 group-hover:opacity-100 transition-opacity duration-1000" />

                    {/* Glass HUD Label */}
                    <div className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-500" />
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-none mt-0.5">Preview</span>
                    </div>

                    {/* Vignette Overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
                </div>

                {/* Remote - Partner */}
                <div className="relative rounded-[2rem] md:rounded-[3.5rem] overflow-hidden bg-zinc-900 flex items-center justify-center shadow-2xl border border-white/5 ring-1 ring-white/10">
                    {remoteStream ? (
                        <>
                            <video ref={peerVideo} autoPlay playsInline className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000" />

                            {/* Partner HUD */}
                            <div className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none mt-0.5">Live Connection</span>
                            </div>

                            {/* Vignette Overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
                        </>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 border border-zinc-800 rounded-full flex items-center justify-center mx-auto">
                                <div className="w-1 h-1 bg-zinc-500 rounded-full animate-ping" />
                            </div>
                            <p className="text-zinc-600 text-xs font-medium tracking-wide uppercase">Searching Signal...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Mode Active State */}
            {isTextMode && (
                <div className="h-16 border-b border-zinc-900 flex items-center justify-center gap-3 bg-zinc-900/10">
                    <AlertTriangle size={14} className="text-zinc-500" />
                    <span className="text-sm text-zinc-500 font-medium">Text Mode Active</span>
                </div>
            )}

            {/* Chat Area - Fixed Height */}
            <div className={`${isTextMode ? 'flex-1' : 'h-[35vh] md:h-[400px]'} border-t border-zinc-900 flex flex-col md:flex-row bg-zinc-950`}>

                {/* Sidebar */}
                <div className="hidden md:flex flex-col w-64 border-r border-zinc-900 p-4 gap-2 bg-zinc-950">
                    {!isTextMode && (
                        <button onClick={toggleMic} className={`w-full h-10 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${micOn ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-900' : 'border-red-900/30 text-red-700 bg-red-950/10'}`}>
                            {micOn ? 'Microphone On' : 'Microphone Off'}
                        </button>
                    )}
                    <div className="flex-1" />
                    <button onClick={nextPartner} className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-semibold tracking-wide transition-all shadow-lg shadow-white/5 active:scale-[0.98]">
                        Next Person
                    </button>
                    <p className="text-center text-[10px] text-zinc-600 pt-2">ESC to Skip</p>
                </div>

                {/* Messages */}
                <div className="flex-1 flex flex-col relative bg-zinc-950">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] text-[14px] leading-relaxed ${msg.sender === 'me'
                                    ? 'text-zinc-300 text-right'
                                    : 'text-zinc-500 text-left'
                                    }`}>
                                    <span className={`block px-4 py-2 rounded-lg ${msg.sender === 'me' ? 'bg-zinc-900 border border-zinc-800 text-zinc-200' : 'bg-zinc-950 border border-zinc-900 text-zinc-400'}`}>
                                        {msg.content}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                        {messages.length === 0 && (
                            <div className="h-full flex items-center justify-center opacity-20">
                                <span className="text-4xl">Start</span>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex gap-4">
                        <button onClick={nextPartner} className="md:hidden p-3 bg-white text-black rounded-lg shadow-lg">
                            <SkipForward size={18} />
                        </button>
                        <input
                            value={msgInput}
                            onChange={(e) => setMsgInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={!partnerId}
                            placeholder={partnerId ? "Type here..." : "Waiting..."}
                            className="flex-1 bg-zinc-900/50 border border-zinc-800 text-zinc-200 px-4 py-3 rounded-lg outline-none focus:border-zinc-700 transition-all text-sm placeholder:text-zinc-700 font-normal"
                        />
                        <button onClick={sendMessage} disabled={!partnerId || !msgInput.trim()} className="p-3 text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ChatRoom() {
    return (
        <Suspense fallback={<div className="text-white text-center mt-20">Loading NeoChat...</div>}>
            <ChatRoomContent />
        </Suspense>
    );
}
