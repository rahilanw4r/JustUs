"use client";
import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import SimplePeer, { Instance as PeerInstance } from 'simple-peer';
import { Mic, MicOff, Video, VideoOff, Send, SkipForward, AlertTriangle, Globe } from 'lucide-react';

if (typeof window !== 'undefined') {
    (window as any).global = window;
    (window as any).process = { env: { DEBUG: undefined }, version: '' };
    (window as any).Buffer = require('buffer').Buffer;
}

let socket: Socket;

function ChatRoomContent() {
    const searchParams = useSearchParams();
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
                        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
                            trickle: false,
                            stream: localStream || undefined
                        });

                        peer.on('signal', (signal) => {
                            socket.emit('signal', { target: data.partnerId, signal });
                        });

                        peer.on('stream', (rStream) => {
                            setRemoteStream(rStream);
                            if (peerVideo.current) peerVideo.current.srcObject = rStream;
                            setStatus('Connected');
                        });

                        peer.on('error', err => console.error('Peer Error', err));
                        peerRef.current = peer;
                    } else {
                        setStatus('Connected (Text Only)');
                    }
                });

                socket.on('signal', (data) => {
                    peerRef.current?.signal(data.signal);
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
                audioTrack.enabled = !micOn;
                setMicOn(!micOn);
            }
        }
    };

    return (
        <div className="h-screen bg-[#111] text-white flex flex-col font-sans overflow-hidden">
            {/* Top Bar */}
            <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
                <span className="font-bold text-cyan-400 flex items-center gap-2">
                    NeoChat <span className="text-zinc-600 text-xs px-2 py-1 bg-zinc-800 rounded">{isTextMode ? 'TEXT MODE' : 'VIDEO MODE'}</span>
                </span>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Globe size={12} /> {userCountry} | {status}
                </span>
            </div>

            {/* Split Screen Area (Hidden in Text Mode to focus on chat) */}
            <div className={`flex-1 flex flex-col md:flex-row min-h-0 bg-black ${isTextMode ? 'hidden' : ''}`}>
                {/* Local User */}
                <div className="relative flex-1 bg-zinc-900 overflow-hidden border-r border-zinc-800">
                    <video ref={myVideo} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-xs backdrop-blur-md">You</div>
                </div>

                {/* Remote User */}
                <div className="relative flex-1 bg-zinc-900 overflow-hidden flex items-center justify-center">
                    {remoteStream ? (
                        <video ref={peerVideo} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto" />
                            <p className="text-zinc-500 text-sm animate-pulse uppercase tracking-widest">{status}</p>
                        </div>
                    )}
                    {partnerId && <div className="absolute top-4 right-4 bg-green-600 px-3 py-1 rounded text-xs font-bold animate-pulse shadow-lg">CONNECTED</div>}
                </div>
            </div>

            {/* Text Mode Placeholder (Visible ONLY in Text Mode) */}
            {isTextMode && (
                <div className="h-24 bg-zinc-900 border-b border-zinc-800 flex items-center justify-center text-zinc-500 gap-2">
                    <AlertTriangle size={20} />
                    <span>Camera Disabled. Text Only Mode Active.</span>
                </div>
            )}

            {/* Controls & Chat Container */}
            <div className={`${isTextMode ? 'flex-1' : 'h-[40vh] md:h-80'} bg-zinc-900 border-t border-zinc-700 flex flex-col md:flex-row transition-all duration-300`}>

                {/* Desktop Sidebar Controls */}
                <div className="hidden md:flex flex-col w-64 border-r border-zinc-700 bg-zinc-900 p-6 gap-3">
                    {!isTextMode && (
                        <button onClick={toggleMic} className={`py-4 rounded-lg font-bold border transition-all ${micOn ? 'border-zinc-600 text-zinc-300 hover:bg-zinc-800' : 'border-red-500 text-red-500 bg-red-500/10'}`}>
                            {micOn ? 'Mute Mic' : 'Unmute Mic'}
                        </button>
                    )}
                    <button onClick={nextPartner} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xl font-black rounded-lg shadow-lg shadow-cyan-500/20 transform active:scale-95 transition-all flex items-center justify-center gap-2">
                        NEXT <SkipForward size={24} />
                    </button>
                    <div className="text-center text-xs text-zinc-600">Press ESC to skip</div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col relative bg-zinc-900">
                    {/* Message List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm break-words ${msg.sender === 'me'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-zinc-700 text-zinc-200 rounded-bl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                        {messages.length === 0 && (
                            <div className="h-full flex items-center justify-center text-zinc-700 text-sm">
                                {partnerId ? "Say hello!" : `Waiting for match in ${userCountry}...`}
                            </div>
                        )}
                    </div>

                    {/* Input Bar */}
                    <div className="p-3 bg-zinc-800 flex gap-2 items-center">
                        <button onClick={nextPartner} className="md:hidden p-3 bg-cyan-600 rounded-full text-white shadow-lg">
                            <SkipForward size={20} />
                        </button>
                        <input
                            value={msgInput}
                            onChange={(e) => setMsgInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={!partnerId}
                            placeholder={partnerId ? "Type a message..." : "Waiting..."}
                            className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-full outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!partnerId || !msgInput.trim()}
                            className="p-3 bg-blue-600 rounded-full hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
                        >
                            <Send size={20} fill="currentColor" />
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
