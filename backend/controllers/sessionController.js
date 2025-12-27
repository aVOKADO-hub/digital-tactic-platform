import asyncHandler from 'express-async-handler';
import Session from '../models/sessionModel.js';
import User from '../models/userModel.js'; // Потрібен для перевірки
import Map from '../models/mapModel.js'; // Потрібен для перевірки

// @desc    Створити нову сесію
// @route   POST /api/sessions
// @access  Public (пізніше змінимо на Private)
const createSession = asyncHandler(async (req, res) => {
    // 1. Отримуємо дані з тіла запиту
    const { name, mapId, instructorId } = req.body;

    // 2. Валідація: перевіряємо, чи надіслали нам ключові дані
    if (!name || !mapId || !instructorId) {
        res.status(400);
        throw new Error(
            'Будь ласка, надайте "name", "mapId" та "instructorId" для сесії'
        );
    }

    // 3. Special handling for OSM
    let finalMapId = mapId;
    if (mapId === 'osm') {
        finalMapId = null;
    } else {
        // Check if map exists only if it's not OSM
        const mapExists = await Map.findById(mapId);
        if (!mapExists) {
            res.status(404);
            throw new Error('Карту з таким ID не знайдено');
        }
    }

    const instructorExists = await User.findById(instructorId);

    if (!instructorExists) {
        res.status(404);
        throw new Error('Інструктора (користувача) з таким ID не знайдено');
    }

    // 4. Якщо все добре - створюємо нову сесію
    const session = await Session.create({
        name,
        map: finalMapId, // Will be null for OSM or ObjectId for custom map
        instructor: instructorId,
        participants: [instructorId], // Інструктор автоматично стає учасником
    });

    // 5. Якщо сесію успішно створено
    if (session) {
        res.status(201).json(session); // 201 - Created
    } else {
        res.status(400);
        throw new Error('Не вдалося створити сесію. Некоректні дані.');
    }
});

// @desc    Отримати всі сесії
// @route   GET /api/sessions
// @access  Public
const getAllSessions = asyncHandler(async (req, res) => {
    // Знаходимо ВСІ сесії
    // .populate() - це магія Mongoose!
    // Він автоматично замінить ID-шники на реальні об'єкти з їхніх колекцій
    const sessions = await Session.find({})
        .populate('map', 'name url') // Взяти з 'map' тільки 'name' і 'url'
        .populate('instructor', 'username role'); // Взяти з 'instructor' тільки 'username' і 'role'

    res.status(200).json(sessions); // 200 - 'OK'
});

// @desc    Отримати одну сесію за ID
// @route   GET /api/sessions/:id
// @access  Public
const getSessionById = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id)
        .populate('map', 'name url')
        .populate('instructor', 'username role');

    if (session) {
        res.json(session);
    } else {
        res.status(404);
        throw new Error('Сесію не знайдено');
    }
});

export { createSession, getAllSessions, getSessionById };
