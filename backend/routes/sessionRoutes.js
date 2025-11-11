import express from 'express';
const router = express.Router();
import {
    createSession,
    getAllSessions,
} from '../controllers/sessionController.js';

// /api/sessions
router.route('/').post(createSession).get(getAllSessions);

export default router;
