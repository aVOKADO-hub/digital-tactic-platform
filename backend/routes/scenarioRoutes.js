import express from 'express';
const router = express.Router();
// 1. ІМПОРТУЄМО НОВІ ФУНКЦІЇ
import {
    saveScenario,
    getScenarios,
    getScenarioById
} from '../controllers/scenarioController.js';

// 2. ОНОВЛЮЄМО МАРШРУТИ
router.route('/')
    .post(saveScenario) // POST /api/scenarios
    .get(getScenarios);  // GET /api/scenarios

router.route('/:id')
    .get(getScenarioById); // GET /api/scenarios/:id

export default router;