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

    socket.on('join_queue', ({ interests = [] }) => {
        // 1. Prevent Duplicates
        if (waitingUsers.find(u => u.id === socket.id)) return;

        // 2. Safety Cleanup (if reconnecting)
        const oldPartner = activePairs[socket.id];
        if (oldPartner) {
            io.to(oldPartner).emit('partner_left');
            delete activePairs[oldPartner];
            delete activePairs[socket.id];
        }

        console.log(`User ${socket.id} joining with interests: [${interests.join(', ')}]`);

        // 3. SMART MATCHING ENGINE
        let partnerIndex = -1;

        if (interests.length > 0) {
            // Priority: Find someone with overlapping interest
            partnerIndex = waitingUsers.findIndex(u =>
                u.id !== socket.id &&
                u.interests.some(i => interests.includes(i))
            );
        }

        // Fallback: If no interest match, find ANY random user (lazy random)
        // TODO: In production, add a flag "strict_match_only" if user refuses random.
        if (partnerIndex === -1) {
            // Avoid matching with self
            partnerIndex = waitingUsers.findIndex(u => u.id !== socket.id);
        }

        if (partnerIndex !== -1) {
            const partner = waitingUsers.splice(partnerIndex, 1)[0];

            activePairs[socket.id] = partner.id;
            activePairs[partner.id] = socket.id;

            // Notify both with metadata
            const sharedInterests = interests.filter(i => partner.interests.includes(i));
            const matchType = sharedInterests.length > 0 ? `Shared: ${sharedInterests.join(', ')}` : 'Random';

            io.to(partner.id).emit('match_found', { partnerId: socket.id, initiator: true, matchType });
            io.to(socket.id).emit('match_found', { partnerId: partner.id, initiator: false, matchType });

            console.log(`Matched ${socket.id} & ${partner.id} (${matchType})`);
        } else {
            // No match found, add to waiting pool
            waitingUsers.push({ id: socket.id, socket, interests });
            console.log(`User ${socket.id} queued. Total Waiting: ${waitingUsers.length}`);
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

server.listen(3001, () => {
    console.log('Signaling server running on port 3001');
});
