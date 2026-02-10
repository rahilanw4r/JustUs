const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let waitingUsers = []; // Array of { id, socket, interests }
let activePairs = {}; // Map socketId -> partnerId

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_queue', ({ interests = [], country = 'Global', mode = 'video' }) => {
        // 1. Prevent Duplicates & Cleanup
        if (waitingUsers.find(u => u.id === socket.id)) return;

        // Remove existing pairs if reconnecting
        const oldPartner = activePairs[socket.id];
        if (oldPartner) {
            io.to(oldPartner).emit('partner_left');
            delete activePairs[oldPartner];
            delete activePairs[socket.id];
        }

        console.log(`User ${socket.id} joining. Mode: ${mode}, Country: ${country}, Interests: [${interests.join(', ')}]`);

        // 2. FIND MATCH (Cascading Priority)
        // Filter by Mode first (must match video/text)
        let candidates = waitingUsers.filter(u => u.id !== socket.id && u.mode === mode);
        let partner = null;

        if (candidates.length > 0) {

            // A. If USER has interests, try to find a match for them
            if (interests.length > 0) {
                // Priority 1: Same Interest + Same Country
                partner = candidates.find(u =>
                    u.country === country &&
                    u.interests.some(i => interests.includes(i))
                );

                // Priority 2: Same Interest (Any Country)
                if (!partner) {
                    partner = candidates.find(u =>
                        u.interests.some(i => interests.includes(i))
                    );
                }
            }

            // B. If no interest match (or user has no interests), try Country Match
            if (!partner) {
                // Priority 3: Same Country (Any Interest)
                partner = candidates.find(u => u.country === country);
            }

            // C. Fallback: Any available user
            if (!partner) {
                // Priority 4: Global Random
                partner = candidates[0];
            }
        }

        if (partner) {
            // Remove partner from waiting list
            waitingUsers = waitingUsers.filter(u => u.id !== partner.id);

            activePairs[socket.id] = partner.id;
            activePairs[partner.id] = socket.id;

            // Notify both
            const sharedInterests = interests.filter(i => partner.interests.includes(i));
            const commonTags = sharedInterests.length > 0 ? sharedInterests.join(', ') : 'Random';

            io.to(partner.id).emit('match_found', {
                partnerId: socket.id,
                initiator: true,
                country: country,
                commonTags
            });
            io.to(socket.id).emit('match_found', {
                partnerId: partner.id,
                initiator: false,
                country: partner.country,
                commonTags
            });

            console.log(`Matched ${socket.id} (${country}) & ${partner.id} (${partner.country}) on [${commonTags}]`);
        } else {
            // No match found, add to waiting pool
            waitingUsers.push({ id: socket.id, socket, interests, country, mode });
            console.log(`User ${socket.id} queued. Waiting: ${waitingUsers.length}`);
        }
    });

    socket.on('signal', (data) => {
        io.to(data.target).emit('signal', { signal: data.signal, sender: socket.id });
    });

    socket.on('send_message', (data) => {
        const partnerId = activePairs[socket.id];
        if (partnerId) {
            io.to(partnerId).emit('receive_message', { content: data.content, sender: socket.id });
        }
    });

    socket.on('report_user', () => {
        // Placeholder for Safety System
        const partnerId = activePairs[socket.id];
        if (partnerId) {
            console.log(`REPORT: User ${socket.id} reported ${partnerId}`);
            // TODO: Log to DB, check reputation, shadowban logic
            io.to(socket.id).emit('system_message', { content: "User reported. Finding new match..." });
            // Disconnect immediately
            io.to(partnerId).emit('partner_left'); // Maybe shadowban silent disconnect?
            delete activePairs[partnerId];
            delete activePairs[socket.id];
        }
    });

    socket.on('leave_chat', () => {
        const partnerId = activePairs[socket.id];
        if (partnerId) {
            io.to(partnerId).emit('partner_left');
            delete activePairs[partnerId];
        }
        delete activePairs[socket.id];
        // Also ensure removed from waiting list
        waitingUsers = waitingUsers.filter(u => u.id !== socket.id);
    });

    socket.on('disconnect', () => {
        const partnerId = activePairs[socket.id];
        if (partnerId) {
            io.to(partnerId).emit('partner_left');
            delete activePairs[partnerId];
        }
        delete activePairs[socket.id];
        waitingUsers = waitingUsers.filter(u => u.id !== socket.id);
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Signaling server running on port ${PORT}`);
});
