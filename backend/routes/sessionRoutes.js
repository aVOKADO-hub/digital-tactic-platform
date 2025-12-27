import express from 'express';
const router = express.Router();
import {
    createSession,
    getAllSessions,
    getSessionById,
} from '../controllers/sessionController.js';

// /api/sessions
router.route('/').post(createSession).get(getAllSessions);

// /api/sessions/:id
router.route('/:id').get(getSessionById);

export default router;
