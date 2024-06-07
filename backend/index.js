require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const routes = require('./routes');
const { emitLog } = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: process.env.CLIENT_ORIGIN || "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);
app.set('io', io);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist/browser')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/browser', 'index.html'));
    });
}

io.on('connection', (socket) => {
    console.log('Client connected');
    emitLog(io, 'info', 'Client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        emitLog(io, 'info', 'Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
