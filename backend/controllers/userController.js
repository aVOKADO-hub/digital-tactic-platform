import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js'; // Імпортуємо нашу модель User

// @desc    Створити нового користувача (зареєструвати)
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    // 1. Отримуємо дані з тіла запиту (з фронт-енду)
    const { username, role } = req.body;

    // 2. Валідація: перевіряємо, чи надіслав нам користувач ім'я
    if (!username) {
        res.status(400); // 400 - це "Bad Request" (Поганий запит)
        throw new Error('Будь ласка, додайте "username"');
    }

    // 3. Перевіряємо, чи користувач з таким 'username' вже існує в базі
    const userExists = await User.findOne({ username });

    if (userExists) {
        res.status(400);
        throw new Error('Користувач з таким "username" вже існує');
    }

    // 4. Якщо все добре - створюємо нового користувача в базі
    const user = await User.create({
        username,
        role, // 'role' автоматично стане 'Observer', якщо її не передати (завдяки 'default' у моделі)
    });

    // 5. Якщо користувача успішно створено
    if (user) {
        res.status(201).json({ // 201 - це "Created" (Створено)
            _id: user._id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
        });
    } else {
        res.status(400);
        throw new Error('Не вдалося створити користувача. Некоректні дані.');
    }
});

// @desc    Отримати всіх користувачів
// @route   GET /api/users
// @access  Public
const getAllUsers = asyncHandler(async (req, res) => {
    // Просто знаходимо ВСІ документи в колекції 'User'
    const users = await User.find({});
    res.status(200).json(users); // 200 - 'OK'
});

// Експортуємо наші функції, щоб їх могли використовувати "дороги" (Routes)
export { registerUser, getAllUsers };
