require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const routes = require('./routes');
const { emitLog } = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);
app.set('io', io);

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
