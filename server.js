const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const crypto = require('crypto');
const path = require('path');

app.use(express.static('public'));
app.use(express.json());

// Store active rooms and their users
const rooms = new Map();

// Generate a random room ID
function generateRoomId() {
    return crypto.randomBytes(4).toString('hex');
}

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('createRoom', (username) => {
        const roomId = generateRoomId();
        rooms.set(roomId, {
            users: [{ id: socket.id, username: username }],
            createdBy: username
        });
        socket.join(roomId);
        socket.emit('roomCreated', { roomId, username });
    });

    socket.on('joinRoom', ({ roomId, username }) => {
        const room = rooms.get(roomId);
        if (room) {
            room.users.push({ id: socket.id, username: username });
            socket.join(roomId);
            socket.emit('roomJoined', { roomId, username });
            io.to(roomId).emit('userJoined', { username, users: room.users });
        } else {
            socket.emit('error', 'Room not found');
        }
    });

    socket.on('sendMessage', ({ roomId, message, username }) => {
        io.to(roomId).emit('message', { username, message, time: new Date().toLocaleTimeString() });
    });

    socket.on('disconnect', () => {
        rooms.forEach((room, roomId) => {
            const userIndex = room.users.findIndex(user => user.id === socket.id);
            if (userIndex !== -1) {
                const username = room.users[userIndex].username;
                room.users.splice(userIndex, 1);
                if (room.users.length === 0) {
                    rooms.delete(roomId);
                } else {
                    io.to(roomId).emit('userLeft', { username, users: room.users });
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 