const socketIO = require('socket.io');
const debug = require('debug')('app:logger');
let io;

const initLogger = (server) => {
    io = socketIO(server, {
        cors: {
            origin: process.env.NODE_ENV === "production" ? process.env.CLIENT_ORIGIN : "http://localhost:4200", // フロントエンドのURL
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected');
        emitLog(io, 'info', 'Client connected');

        socket.on('disconnect', () => {
            console.log('Client disconnected');
            emitLog(io, 'info', 'Client disconnected');
        });
    });

    return io;
};

const emitLog = (io, level, message) => {
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    io.emit('log', { level, message, timestamp });
    debug('%s: %s', level, message);
    console.log(`[${level.toUpperCase()}] ${timestamp}: ${message}`);
};

module.exports = {
    initLogger,
    emitLog
};