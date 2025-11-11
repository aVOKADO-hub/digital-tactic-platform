import asyncHandler from 'express-async-handler';
import Map from '../models/mapModel.js';
import User from '../models/userModel.js'; // Для перевірки

// @desc    Завантажити нову карту
// @route   POST /api/maps
// @access  Public (пізніше Private)
const uploadMap = asyncHandler(async (req, res) => {
    // 1. Отримуємо текстові дані з `req.body`
    const { name, uploadedBy } = req.body;

    // 2. Отримуємо файл з `req.file` (сюди його покладе 'multer')
    if (!req.file) {
        res.status(400);
        throw new Error('Файл карти не завантажено. Оберіть файл.');
    }

    // 3. Валідація: перевіряємо, чи є ім'я та ID користувача
    if (!name || !uploadedBy) {
        res.status(400);
        throw new Error('Потрібно вказати "name" та "uploadedBy"');
    }

    // 4. Перевіряємо, чи існує такий користувач
    const userExists = await User.findById(uploadedBy);
    if (!userExists) {
        res.status(404);
        throw new Error('Користувача (uploadedBy) не знайдено');
    }

    // 5. Створюємо новий документ карти в базі даних
    const map = await Map.create({
        name,
        uploadedBy,
        url: `/${req.file.path.replace(/\\/g, '/')}`, // Зберігаємо шлях до файлу (нормалізуємо слеші)
        // "backend/uploads/map-123.png" -> "/backend/uploads/map-123.png"
    });

    if (map) {
        res.status(201).json(map);
    } else {
        res.status(400);
        throw new Error('Не вдалося зберегти карту. Некоректні дані.');
    }
});

// @desc    Отримати всі карти
// @route   GET /api/maps
// @access  Public
const getAllMaps = asyncHandler(async (req, res) => {
    // .populate() візьме ID з 'uploadedBy' і додасть 'username' користувача
    const maps = await Map.find({}).populate('uploadedBy', 'username');
    res.status(200).json(maps);
});

export { uploadMap, getAllMaps };
