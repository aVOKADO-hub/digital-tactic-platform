import asyncHandler from 'express-async-handler';
import Scenario from '../models/scenarioModel.js';

// @desc    Зберегти новий сценарій
// @route   POST /api/scenarios
// @access  Public
const saveScenario = asyncHandler(async (req, res) => {
    // --- НАШ ДЕБАГ ---
    console.log('---!!! УСПІХ! Ми потрапили у saveScenario !!!---');
    // -------------------

    const { name, objects, drawings } = req.body;

    if (!name || !objects || !drawings) {
        res.status(400);
        throw new Error('Будь ласка, надайте name, objects та drawings');
    }

    const scenario = await Scenario.create({
        name,
        objects,
        drawings,
    });

    if (scenario) {
        res.status(201).json(scenario);
    } else {
        res.status(400);
        throw new Error('Не вдалося зберегти сценарій');
    }
});

// --- 1. НОВА ФУНКЦІЯ: Отримати список всіх сценаріїв ---
// @desc    Отримати всі сценарії
// @route   GET /api/scenarios
// @access  Public
const getScenarios = asyncHandler(async (req, res) => {
    // Знаходимо всі, але повертаємо тільки ID, ім'я та час створення
    const scenarios = await Scenario.find({}).select('_id name createdAt');
    res.json(scenarios);
});

// --- 2. НОВА ФУНКЦІЯ: Отримати один сценарій за ID ---
// @desc    Отримати сценарій за ID
// @route   GET /api/scenarios/:id
// @access  Public
const getScenarioById = asyncHandler(async (req, res) => {
    const scenario = await Scenario.findById(req.params.id);

    if (scenario) {
        res.json(scenario);
    } else {
        res.status(404);
        throw new Error('Сценарій не знайдено');
    }
});


// 3. ОНОВЛЮЄМО ЕКСПОРТ
export { saveScenario, getScenarios, getScenarioById };