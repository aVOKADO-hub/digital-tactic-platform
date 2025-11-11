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

    // 3. (Опціонально, але бажано) Перевіряємо, чи існують в базі карта та інструктор
    const mapExists = await Map.findById(mapId);
    const instructorExists = await User.findById(instructorId);

    if (!mapExists) {
        res.status(404); // 404 - Not Found
        throw new Error('Карту з таким ID не знайдено');
    }
    if (!instructorExists) {
        res.status(404);
        throw new Error('Інструктора (користувача) з таким ID не знайдено');
    }

    // 4. Якщо все добре - створюємо нову сесію
    const session = await Session.create({
        name,
        map: mapId,
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

export { createSession, getAllSessions };
