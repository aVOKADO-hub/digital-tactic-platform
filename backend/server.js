import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import connectDB from './config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Імпортуємо наші маршрути
import userRoutes from './routes/userRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import scenarioRoutes from './routes/scenarioRoutes.js';

// --- Початкове налаштування ---
dotenv.config();
connectDB();
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5001;

// --- Створюємо HTTP сервер та прив'язуємо Socket.io ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

// --- Маршрути API ---
app.get('/api', (req, res) => {
    res.send('API працює...');
});
app.use('/api/users', userRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/scenarios', scenarioRoutes);

// --- Налаштування для роздачі завантажених файлів ---
const __dirname = path.resolve();
app.use('/backend/uploads', express.static(path.join(__dirname, '/backend/uploads')));

// --- ЛОГІКА SOCKET.IO ---
io.on('connection', (socket) => {
    // ... (всі старі слухачі: joinSession, cursorMove, addNewObject, objectMove, etc.) ...

    socket.on('joinSession', (sessionId) => {
        socket.join(sessionId);
        socket.sessionId = sessionId;
        console.log(
            colors.yellow(
                `[Socket.io] Клієнт ${socket.id} приєднався до кімнати: ${sessionId}`
            )
        );
    });

    socket.on('cursorMove', (coords) => {
        if (socket.sessionId) {
            socket.to(socket.sessionId).emit('updateCursor', { id: socket.id, ...coords });
        }
    });

    socket.on('addNewObject', (data) => {
        if (socket.sessionId) {
            const newObject = { ...data, id: uuidv4() };
            io.to(socket.sessionId).emit('objectAdded', newObject);
            console.log(colors.magenta(`[Socket.io] Об'єкт ${newObject.name} додано`));
        }
    });

    socket.on('objectMove', (data) => {
        if (socket.sessionId) {
            io.to(socket.sessionId).emit('objectMoved', data);
            console.log(colors.blue(`[Socket.io] Об'єкт ${data.id} переміщено`));
        }
    });

    socket.on('addNewDrawing', (data) => {
        if (socket.sessionId) {
            const newDrawing = { ...data, id: uuidv4() };
            io.to(socket.sessionId).emit('drawingAdded', newDrawing);
            console.log(colors.cyan(`[Socket.io] Малюнок ${newDrawing.type} додано`));
        }
    });

    socket.on('deleteObject', (id) => {
        if (socket.sessionId) {
            io.to(socket.sessionId).emit('objectDeleted', id);
            console.log(colors.red.bold(`[Socket.io] Об'єкт ${id} видалено`));
        }
    });

    socket.on('deleteDrawing', (id) => {
        if (socket.sessionId) {
            io.to(socket.sessionId).emit('drawingDeleted', id);
            console.log(colors.red.bold(`[Socket.io] Малюнок ${id} видалено`));
        }
    });

    // --- НАШЕ ОНОВЛЕННЯ: СЛУХАЄМО ЗАВАНТАЖЕННЯ СЦЕНАРІЮ ---
    socket.on('loadScenario', (data) => {
        // 'data' = { objects: [...], drawings: [...] }
        if (socket.sessionId) {
            // Розсилаємо всім, КРІМ відправника (бо в нього вже все завантажено)
            socket.to(socket.sessionId).emit('scenarioLoaded', data);
            console.log(
                colors.green.bold(`[Socket.io] Сценарій завантажено в кімнаті ${socket.sessionId}`)
            );
        }
    });
    // ---------------------------------------------------

    socket.on('disconnect', () => {
        console.log(
            colors.red.bold(`[Socket.io] Клієнт відключено: ${socket.id}`)
        );
        if (socket.sessionId) {
            socket.to(socket.sessionId).emit('userDisconnect', socket.id);
        }
    });
});

// --- Запускаємо наш HTTP сервер ---
server.listen(PORT, () =>
    console.log(
        colors.green.bold(
            `[Server] Сервер успішно запущено на порту ${PORT}`
        )
    )
);
console.log(colors.blue('[Server] Очікування підключення до бази даних...'));