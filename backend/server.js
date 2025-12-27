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
import aiEngine from './services/aiEngine.js'; // AI Engine Import
import Session from './models/sessionModel.js'; // Import Session Model

import cors from 'cors';

// ============= HP CALCULATION FOR NEW UNITS =============
const UNIT_STATS = {
    infantry: { hp: 100 },
    tank: { hp: 200 },
    apc: { hp: 150 },
    artillery: { hp: 80 },
    medical: { hp: 50 },
    supply: { hp: 60 },
    uav: { hp: 30 },
    hq: { hp: 100 },
};

const ECHELON_MULTIPLIERS = {
    team: 0.5, squad: 0.7, section: 0.8, platoon: 1.0,
    company: 2.5, battalion: 5.0, regiment: 8.0, brigade: 12.0,
};

function calculateInitialHp(entity, echelon) {
    const base = UNIT_STATS[entity]?.hp || 100;
    const mult = ECHELON_MULTIPLIERS[echelon] || 1.0;
    return Math.round(base * mult);
}

// --- Початкове налаштування ---
dotenv.config();
connectDB();
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5001;

app.use(cors({
    origin: 'http://localhost:5173', // Дозволяємо запити з нашого фронтенду
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Дозволені методи
    credentials: true
}));

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
// --- Налаштування для роздачі завантажених файлів ---
const __dirname = path.resolve();
// If running from 'backend' folder, __dirname is .../backend
// We store files in .../backend/uploads
// We want to serve them at /uploads url
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- SERVER STATE ---
// Зберігаємо користувачів по кімнатах: { sessionId: [ { id, name, role, color }, ... ] }
const roomUsers = {};

// --- ЛОГІКА SOCKET.IO ---
io.on('connection', (socket) => {
    // ... (всі старі слухачі: joinSession, cursorMove, addNewObject, objectMove, etc.) ...

    socket.on('joinSession', async ({ sessionId, user }) => {
        socket.join(sessionId);
        socket.sessionId = sessionId;

        // 1. Load Session Data for AI
        try {
            const session = await Session.findById(sessionId).populate('map');
            if (session) {
                aiEngine.registerSession(sessionId);

                let bounds = { bounds: [[50.40, 30.40], [50.50, 30.60]] }; // Default Kyiv
                if (session.map && session.map.calibrationData) {
                    bounds = session.map.calibrationData;
                } else {
                    console.log(colors.yellow(`[Join] No calibration. Using default.`));
                }
                aiEngine.updateSessionMap(sessionId, bounds, session.drawings);

                // Populate AI World State
                if (session.objects && session.objects.length > 0) {
                    session.objects.forEach(obj => {
                        aiEngine.updateWorldState(sessionId, obj);
                    });
                    console.log(colors.cyan(`[Join] AI loaded ${session.objects.length} units.`));
                }
            }
        } catch (err) {
            console.error(colors.red(`[Join] Error loading session: ${err.message}`));
        }

        // 2. Add user to room list
        if (!roomUsers[sessionId]) {
            roomUsers[sessionId] = [];
        }

        const newUser = {
            id: socket.id,
            userId: user?._id || 'anon',
            name: user?.name || `Guest ${socket.id.substr(0, 4)}`,
            role: user?.role || 'student',
            color: user?.color || '#' + Math.floor(Math.random() * 16777215).toString(16)
        };

        roomUsers[sessionId].push(newUser);

        console.log(
            colors.yellow(
                `[Socket.io] Клієнт ${newUser.name} (${socket.id}) приєднався до кімнати: ${sessionId}`
            )
        );

        io.to(sessionId).emit('roomUsersUpdate', roomUsers[sessionId]);
    });

    socket.on('cursorMove', (coords) => {
        if (socket.sessionId) {
            // Include socket.id so we can look up name on client
            socket.to(socket.sessionId).emit('updateCursor', { id: socket.id, ...coords });
        }
    });

    socket.on('addNewObject', async (data) => {
        if (socket.sessionId) {
            try {
                const session = await Session.findById(socket.sessionId);
                if (session) {
                    // Calculate initial HP based on entity and echelon
                    const hp = calculateInitialHp(data.entity, data.echelon);

                    const newObject = {
                        ...data,
                        id: uuidv4(),
                        hp: hp,
                        maxHp: hp
                    };
                    session.objects.push(newObject);
                    await session.save();

                    io.to(socket.sessionId).emit('objectAdded', newObject);
                    aiEngine.updateWorldState(socket.sessionId, newObject);
                    console.log(colors.magenta(`[Socket.io] Об'єкт ${newObject.name} (HP: ${hp}) зберігся в БД`));
                }
            } catch (err) {
                console.error(`[Error] addNewObject: ${err.message}`);
            }
        }
    });

    socket.on('objectMove', async (data) => {
        if (socket.sessionId) {
            try {
                const session = await Session.findById(socket.sessionId);
                if (session) {
                    const obj = session.objects.find(o => o.id === data.id);
                    if (obj) {
                        obj.latLng = data.latLng;
                        session.markModified('objects');
                        await session.save();
                    }
                }
                io.to(socket.sessionId).emit('objectMoved', data);
                aiEngine.updateWorldState(socket.sessionId, { id: data.id, latLng: data.latLng });
            } catch (err) {
                console.error(`[Error] objectMove: ${err.message}`);
            }
        }
    });

    // --- НОВА ПОДІЯ: Оновлення властивостей об'єкта ---
    socket.on('updateObject', async (updatedData) => {
        if (socket.sessionId) {
            try {
                const session = await Session.findById(socket.sessionId);
                if (session) {
                    const objIndex = session.objects.findIndex(o => o.id === updatedData.id);
                    if (objIndex !== -1) {
                        session.objects[objIndex] = { ...session.objects[objIndex], ...updatedData };
                        session.markModified('objects');
                        await session.save();

                        socket.to(socket.sessionId).emit('objectUpdated', updatedData);
                        aiEngine.updateWorldState(socket.sessionId, updatedData);
                        console.log(colors.cyan(`[Socket.io] Об'єкт ${updatedData.id} оновлено в БД`));
                    }
                }
            } catch (err) {
                console.error(`[Error] updateObject: ${err.message}`);
            }
        }
    });
    socket.on('addNewDrawing', (data) => {
        if (socket.sessionId) {
            const newDrawing = { ...data, id: uuidv4() };
            io.to(socket.sessionId).emit('drawingAdded', newDrawing);
            console.log(colors.cyan(`[Socket.io] Малюнок ${newDrawing.type} додано`));
        }
    });

    socket.on('deleteObject', async (id) => {
        if (socket.sessionId) {
            try {
                const session = await Session.findById(socket.sessionId);
                if (session) {
                    session.objects = session.objects.filter(o => o.id !== id);
                    await session.save();
                    console.log(colors.red.bold(`[Socket.io] Об'єкт ${id} видалено з БД`));
                }

                io.to(socket.sessionId).emit('objectDeleted', id);
                aiEngine.removeObject(socket.sessionId, id);
            } catch (err) {
                console.error(`[Error] deleteObject: ${err.message}`);
            }
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

    // --- AI CONTROL ---
    socket.on('toggleAi', (isActive) => {
        if (!socket.sessionId) return;

        if (isActive) {
            aiEngine.addSession(socket.sessionId);
            io.to(socket.sessionId).emit('aiStatusChanged', true);
            console.log(colors.magenta(`[Socket.io] AI enabled for session ${socket.sessionId}`));
        } else {
            aiEngine.removeSession(socket.sessionId);
            io.to(socket.sessionId).emit('aiStatusChanged', false);
            console.log(colors.magenta(`[Socket.io] AI disabled for session ${socket.sessionId}`));
        }
    });

    socket.on('getHistory', (callback) => {
        if (socket.sessionId) {
            const history = aiEngine.getHistory(socket.sessionId);
            if (callback) callback(history);
        }
    });

    socket.on('disconnect', () => {
        console.log(
            colors.red.bold(`[Socket.io] Клієнт відключено: ${socket.id}`)
        );
        if (socket.sessionId) {
            const sessionId = socket.sessionId;

            // Remove user from list
            if (roomUsers[sessionId]) {
                roomUsers[sessionId] = roomUsers[sessionId].filter(u => u.id !== socket.id);
                // Broadcast update
                io.to(sessionId).emit('roomUsersUpdate', roomUsers[sessionId]);
            }

            socket.to(sessionId).emit('userDisconnect', socket.id);
        }
    });

    // --- AI ORDERS ---
    socket.on('issueOrder', (data) => {
        // data: { sessionId, order: { type, unitIds, target, currentUnitPositions } }
        // Pass control to AI Engine
        if (data.sessionId && data.order) {
            aiEngine.issueOrder(data.sessionId, data.order);
        }
    });

    socket.on('updateAIConfig', ({ sessionId, config }) => {
        aiEngine.setConfig(sessionId, config);
    });
});

// --- Запускаємо наш HTTP сервер ---
server.listen(PORT, () => {
    console.log(colors.green.bold(`[Server] Сервер успішно запущено на порту ${PORT}`));

    // START AI ENGINE
    aiEngine.init(io);
    aiEngine.start();
});
console.log(colors.blue('[Server] Очікування підключення до бази даних...'));